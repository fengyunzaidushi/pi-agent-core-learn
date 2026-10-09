# 第四章：AgentTool 与工具调用

## 本章目标

学完本章后，学员应该能：

- 定义一个带 TypeBox 参数 Schema 的 `AgentTool`；
- 解释模型为什么先产生 tool call，而不是直接执行 TypeScript 函数；
- 说明参数校验、`execute()`、tool result 和下一轮模型请求的顺序；
- 使用 `beforeToolCall` 和 `afterToolCall` 做策略控制；
- 为小说 Agent 设计一个不会把数据库细节暴露给模型的工具边界。

## 1. 工具的本质

工具不是“把一个函数塞给模型”。工具有两部分：

1. **声明**：名称、描述和参数 Schema，会被转换成模型能理解的 tool declaration；
2. **执行**：真正运行的 TypeScript 函数，只由 Agent Loop 在模型请求工具时调用。

模型只能提出：

```json
{
  "name": "get_story_facts",
  "arguments": { "topic": "林岚" }
}
```

它不能直接访问你的数据库。运行时先根据名称找到 `AgentTool`，验证参数，再调用 `execute()`。

## 2. `AgentTool` 的结构

当前核心类型包含这些重要字段：

```ts
interface AgentTool<TParameters, TDetails> {
  name: string;
  label: string;
  description: string;
  parameters: TSchema;
  execute: (
    toolCallId: string,
    params: Static<TParameters>,
    signal?: AbortSignal,
    onUpdate?: AgentToolUpdateCallback<TDetails>,
  ) => Promise<AgentToolResult<TDetails>>;
}
```

在小说应用中，`parameters` 是模型的输入协议，`details` 是给应用 UI 和日志使用的结构化结果。给模型看的 `content` 和给程序看的 `details` 应该有意识地分开。

## 3. 一个角色查询工具

```ts
const parameters = Type.Object({
  topic: Type.String({ description: "角色名或世界观主题" }),
});

const getStoryFacts: AgentTool<typeof parameters> = {
  name: "get_story_facts",
  label: "查询故事设定",
  description: "查询角色或世界观设定，返回当前创作所需的事实。",
  parameters,
  execute: async (_toolCallId, params) => {
    const facts = params.topic === "林岚" ? "林岚害怕水，曾在北港生活。" : "没有找到相关设定。";
    return {
      content: [{ type: "text", text: facts }],
      details: { topic: params.topic, source: "memory" },
    };
  },
};
```

工具应该返回事实，不应该返回一段要求模型照抄的隐藏提示词。模型仍然负责决定如何把事实放进章节。

## 4. 一次工具调用的完整链路

运行 [examples/02-tool-call.ts](../examples/02-tool-call.ts) 可以观察：

```text
第一个模型回合
  -> assistant message 包含 toolCall
  -> tool_execution_start
  -> 参数校验
  -> execute()
  -> tool_execution_end
  -> toolResult message

第二个模型回合
  -> 模型读取 toolResult 后给出最终回答
```

有工具调用时，`prompt()` 仍然代表一次完整 Agent run，而不是只代表第一个 provider request。

## 5. 失败应该如何处理

工具失败时应该 `throw`，不要把错误伪装成正常文本：

```ts
execute: async (_id, params) => {
  const record = await repository.find(params.topic);
  if (!record) throw new Error(`Unknown story topic: ${params.topic}`);
  return {
    content: [{ type: "text", text: record.summary }],
    details: { id: record.id },
  };
}
```

Agent Core 会把异常转换为带错误标记的 tool result，让模型决定是否改用其他方法。对于 Web 应用，前端可以通过 `tool_execution_end.isError` 显示失败，但不应只依赖 UI 文本判断失败。

## 6. `beforeToolCall` 与 `afterToolCall`

### beforeToolCall

它在参数已经验证后、工具执行前调用，适合做权限和业务策略：

```ts
beforeToolCall: async ({ toolCall, args }) => {
  if (toolCall.name === "save_chapter" && !args.chapterId) {
    return { block: true, reason: "保存章节必须提供 chapterId" };
  }
},
```

阻止工具执行会产生错误 tool result。它不是浏览器授权弹窗的替代品；真正的用户权限仍应由后端身份和数据库策略保证。

### afterToolCall

它在工具执行完成后、事件和 tool result 发布前调用，适合补充审计字段、过滤内容或决定是否终止当前工具批次：

```ts
afterToolCall: async ({ result }) => ({
  details: { ...result.details, audited: true },
}),
```

`content`、`details` 等字段是整体替换，不是深度合并。教程示例会专门验证这一点。

## 7. 并行和顺序

Agent 默认使用 `parallel` 工具执行模式：

- 工具调用预检按顺序进行；
- 可并行工具可以同时执行；
- `tool_execution_end` 按完成顺序产生；
- tool result 消息仍按助手原始调用顺序写入上下文。

涉及写文件、更新章节版本或修改同一角色状态的工具，应明确设置 `executionMode: "sequential"`，或者在产品层设计事务和版本冲突检查。

## 8. 小说产品映射

| 工具 | 读取/写入 | 推荐执行策略 |
|---|---|---|
| `get_character` | 读取 | parallel |
| `search_world` | 读取 | parallel |
| `check_continuity` | 读取多个资料 | parallel |
| `save_chapter_draft` | 写入章节 | sequential |
| `publish_chapter` | 写入发布状态 | sequential |
| `rewrite_scene` | 写入草稿版本 | sequential |

并行不是性能开关这么简单，它会改变多个工具对共享小说状态的观察时间。写工具必须先定义冲突和重试语义。

## 9. 课堂练习

1. 把 `get_story_facts` 改成读取一个内存 `Map`。
2. 增加 `save_chapter_draft`，并阻止没有 `chapterId` 的调用。
3. 为工具事件设计前端状态：`queued`、`running`、`succeeded`、`failed`。
4. 把两个只读工具设置为并行，把两个写工具设置为顺序，并解释原因。

## 下一章

下一章讲 `AgentMessage`、`convertToLlm` 和 `transformContext`，解决“应用内部消息如何进入模型上下文”的问题。
