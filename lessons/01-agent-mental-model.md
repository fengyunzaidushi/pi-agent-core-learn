# 第一章：Agent 的心智模型

## 本章目标

学完本章后，学员应该能回答：

1. Agent 和一次模型调用有什么区别？
2. Agent 为什么需要自己的消息状态？
3. 工具调用为什么会让一次用户请求包含多个模型回合？
4. `streamFn` 在运行时中负责什么？
5. 为什么小说 Agent 不能只保存最后一段文本？

## 1. Agent 不是一次请求

一次普通模型请求可以抽象为：

```text
输入消息 -> 模型 -> 输出消息
```

Agent 要管理的是一个持续过程：

```text
输入消息
  -> 请求模型
  -> 得到助手文本或工具调用
  -> 执行工具
  -> 把工具结果写回消息状态
  -> 再次请求模型
  -> 直到本次运行结束
```

因此 `Agent` 同时拥有三类责任：

- 保存当前消息转录；
- 驱动模型和工具之间的循环；
- 对外发布可观察的生命周期事件。

源码中的 `Agent` 类位于 `packages/agent/src/agent.ts`。它的注释直接说明：`Agent` 持有当前 transcript，发出生命周期事件，执行工具，并提供 steering/follow-up 队列。

## 2. 三个容易混淆的对象

### AgentMessage

这是 Agent 内部使用的消息类型。它可以包含标准的 `user`、`assistant`、`toolResult`，也可以包含应用自定义消息。

小说应用可以在这里加入只供 UI 或业务层使用的消息，例如：

```text
character_card_updated
outline_changed
chapter_draft_saved
continuity_warning
```

这些消息不一定要直接发送给模型。

### LLM Message

模型通常只理解标准的 system、user、assistant 和 tool result 消息。Pi 通过 `convertToLlm` 把内部消息转换成模型可接受的消息。

### TranscriptContext

这是交给 `streamFn` 的请求上下文。当前 Pi 的约定是：系统提示词和工具声明也会以 transcript 中的系统消息形式携带，而不是依赖一个单独的 `context.tools` 字段。

## 3. Agent Loop 的两个循环

Agent Loop 可以用两个嵌套循环理解：

### 内层：工具循环

助手返回工具调用时，Agent 会：

1. 校验工具参数；
2. 执行 `beforeToolCall`；
3. 执行工具；
4. 执行 `afterToolCall`；
5. 生成 tool result 消息；
6. 再请求模型。

### 外层：后续输入循环

当前运行本来要结束时，Agent 还会检查：

- steering 队列：用户想改变当前方向；
- follow-up 队列：用户想在当前任务后继续追加工作。

这就是为什么网页端不能只等待一个 HTTP 响应。前端需要观察事件流，并允许用户在 Agent 运行期间发送取消或 steering 消息。

## 4. 和小说产品的对应关系

以“写第三章”为例：

```text
用户：根据大纲写第三章
  -> Agent 请求模型
  -> 模型调用 get_character("林岚")
  -> 工具返回角色当前状态
  -> Agent 将角色状态追加为 toolResult
  -> 模型继续写作
  -> 模型调用 check_continuity
  -> 工具返回时间线冲突
  -> 模型修正草稿
```

如果产品只保存最终章节文本，就无法解释中途使用了哪个角色版本、哪个工具发现了什么冲突，也无法在中断后继续执行。因此 Agent 的消息和事件状态是产品数据的一部分，而不是临时日志。

## 5. 本章练习

1. 画出“写章节”流程中至少两个模型回合和两个工具结果。
2. 为 `character_card_updated` 设计一个内部消息结构，并说明它为什么不应直接发送给模型。
3. 解释 steering 和 follow-up 的差异：前者改变当前工作，后者排队等待当前工作结束。

## 下一章

下一章会使用 faux provider 创建第一个可运行的 `Agent`，观察事件流而不需要真实 API Key。
