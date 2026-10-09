# 第五章：AgentMessage 如何进入模型上下文

## 本章目标

学完本章后，学员应该能：

- 区分 Agent 内部的 `AgentMessage[]` 和 provider 接收的 `TranscriptContext`；
- 解释 `transformContext` 与 `convertToLlm` 的顺序和职责；
- 把小说记忆作为一次请求的上下文注入，而不是误写进运行时转录；
- 说明系统提示词和工具声明为什么仍然通过转录中的 system message 传递。

## 1. 问题：应用消息不等于模型消息

小说应用会保存很多模型不需要直接理解的消息：界面通知、检索命中来源、章节版本标记和审计字段。这些内容适合留在 Agent 的内部转录或应用数据库，但 provider 通常只接受 system、user、assistant 和 tool result 消息。

如果把应用对象原样交给模型，会出现两个问题：provider 无法识别消息角色，或者把 UI/审计内容误当成写作指令。运行时需要一个明确的边界，把“应用内部消息”整理成“模型可理解的消息”。

## 2. 源码事实：两步转换

当前权威 checkout 的 `packages/agent/src/agent-loop.ts` 在 `streamAssistantResponse()` 中固定按下面顺序工作：

```text
AgentMessage[]
  -> transformContext（可选，仍是 AgentMessage[]）
  -> convertToLlm（变成 Message[]）
  -> normalizeContext（变成 TranscriptContext）
  -> streamFn(model, context, options)
```

`transformContext` 适合做仍然需要理解应用消息结构的操作，例如裁剪旧消息或注入外部小说记忆。它返回的数组只服务于这一次请求；除非应用另外写入 `agent.state.messages` 或 Session，它不会自动成为持久化记录。

`convertToLlm` 是最后一道适配器。当前 `Agent` 的默认实现只保留 `system`、`user`、`assistant` 和 `toolResult` 四种角色；自定义角色必须在这里转换或过滤。公开类型还要求转换函数不要抛异常，而应返回安全的后备消息列表。

`normalizeContext()` 把 system prompt 和工具声明折叠进 transcript 的 system message，并产生 provider 专用的 `TranscriptContext`。因此 `streamFn` 接收的对象只有 `messages`；它不是带有独立 `systemPrompt` 或 `tools` 字段的原始应用上下文。

源码中的 `Agent` 会在初始化时把 `initialState.systemPrompt` 和工具声明写成领先的 system message。工具集合发生变化时，Agent Loop 会在下一次请求前记录 `toolsAdded` 或 `toolsRemoved`，模型看到的是转录中的声明，运行时执行的仍是 `context.tools`。

这些结论同时由 `packages/agent/test/agent-loop.test.ts` 中的测试覆盖：provider context 只含 `messages`，自定义消息必须经过 `convertToLlm`，并且 `transformContext` 一定先于 `convertToLlm`。

## 3. 最小实验：只在本次请求注入小说资料

示例文件：[examples/03-context-boundary.ts](../examples/03-context-boundary.ts)

运行：

```bash
npm run lesson:03
```

示例使用 `createCustomMessage()` 构造一条 `story-memory` 消息。`transformContext` 把它追加到本次请求，`convertToLlm` 再把它转换成 user 消息，provider wrapper 最后记录收到的角色和文本。

核心边界是：

```ts
transformContext: async (messages) => [...messages, storyMemory]

convertToLlm: (messages) => messages.flatMap((message) => {
  if (message.role === "custom") return [toUserMessage(message)];
  return isLlmMessage(message) ? [message] : [];
})
```

这里没有把 `storyMemory` 直接追加到 `agent.state.messages`。这样可以让外部检索结果只影响当前模型请求，同时保留“这条资料是否应该进入正式会话”的应用层决定权。

## 4. 运行观察

示例会打印四组角色：

```text
transformContext roles: system -> user
convertToLlm roles: system -> user -> custom
provider roles: system -> user -> user
persisted transcript roles: system -> user -> assistant
```

具体文本可能随依赖版本的时间戳格式略有差异，但顺序应保持一致。这个顺序说明：

1. `transformContext` 看见的是 Agent 内部消息，并能处理 `custom`；
2. `convertToLlm` 把 `custom` 映射成 provider 能接受的 `user`；
3. provider 只收到规范化后的 `TranscriptContext`；
4. 外部注入消息没有因为参与请求而自动写回 Agent 转录。

faux provider 的回答是预先固定的，所以实验只验证调用边界和输入形状，不验证真实模型是否会正确利用资料。

## 5. 小说产品映射

把资料分成三个层次：

| 层次 | 示例 | 是否默认发给模型 |
|---|---|---|
| 应用记录 | 检索来源、权限、审计事件 | 否 |
| 请求上下文 | 当前章节需要的角色卡、时间线片段 | 经过 `transformContext`/`convertToLlm` 后发送 |
| 正式转录 | 用户要求、助手草稿、工具结果 | 是，按消息类型转换 |

例如生成第三章时，后端可以从数据库读取“林岚害怕水”和“北港涨潮时间”，在 `transformContext` 中按章节权限筛选，再在 `convertToLlm` 中变成短 user 消息。检索来源和数据库主键可以放在 `details` 或应用日志里，不必暴露给模型。

上下文裁剪也应放在这里：先以 `AgentMessage` 为单位保留完整的工具结果和自定义消息，再转换成模型消息。若先把消息拼成字符串，应用会失去对角色、时间戳和工具调用的结构化控制。

## 6. 版本边界

本课程项目当前安装 `@earendil-works/pi-agent-core@0.87.1`，本示例按该版本运行。权威源码 checkout 的 `packages/agent/package.json` 当前为 `1.1.0`。本章使用的 `AgentMessage`、`transformContext`、`convertToLlm`、`normalizeContext` 和 provider transcript 契约在两边都存在；更高版本新增的 Harness 或 Session 行为不在本章结论内。

## 7. 课堂练习

1. 把 `storyMemory` 改成 UI 通知，并验证它不会出现在 provider 消息中。
2. 在 `transformContext` 中只保留最近一轮 user/assistant 消息，记录裁剪前后的角色列表。
3. 为 `story-memory` 增加 `chapterId` 检查：章节不匹配时返回原消息，不把资料发送给模型。
4. 解释为什么 `agent.state.messages` 仍然只有 `system -> user -> assistant`，以及什么时候应用应该显式保存注入资料。

## 下一章

下一章会把上下文边界和多工具调用结合起来，观察并行工具、steering 与 follow-up 如何改变下一次请求的消息集合。
