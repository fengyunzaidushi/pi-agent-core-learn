# 第三章：事件流与消息转录

## 本章目标

学完本章后，学员应该能区分：

- Agent 事件和消息内容；
- 增量事件和最终消息；
- 一个 turn 和一次完整 agent run；
- `agent_end` 和真正的应用层 settled 状态；
- UI 状态和模型上下文。

## 1. 一次无工具请求的事件顺序

一次简单的 `prompt()` 通常可以观察到：

```text
agent_start
turn_start
message_start      user
message_end        user
message_start      assistant
message_update     text_delta ...
message_update     text_delta ...
message_end        assistant
turn_end
agent_end
```

事件是观察运行的协议，消息是进入上下文的状态。两者有关，但不能互相替代。

## 2. 有工具调用时发生什么

```text
assistant message with toolCall
  -> tool_execution_start
  -> tool_execution_update ...
  -> tool_execution_end
  -> toolResult message_start/end
  -> next turn_start
  -> next assistant response
```

因此“用户发送一次消息”不等于“只发生一次模型请求”。在小说应用里，一次章节生成可能包含检索角色、读取大纲、检查时间线和最终写作多个回合。

## 3. 转录为什么要保留工具结果

模型下一轮请求需要知道工具做了什么。Agent Loop 会把工具结果追加到当前上下文，再让模型继续判断。

如果工具结果只显示在 UI 而没有进入转录，模型下一轮就无法依据角色查询或连续性检查的结果继续工作。

## 4. `message_update` 的正确用法

`message_update` 适合做实时显示：

```ts
if (event.type === "message_update") {
  // 读取 assistantMessageEvent.delta，更新当前显示缓冲区
}
```

它不适合直接作为最终章节保存依据。保存正式章节时，应使用已经完成的 assistant message，或者由应用层在 `agent_end` 后读取完整状态并执行明确的保存事务。

## 5. 面向 Web 的事件映射

可以把核心事件转换为自己的前端协议：

| Pi 事件 | Web 事件 | 前端用途 |
|---|---|---|
| `agent_start` | `run_started` | 显示运行状态 |
| `message_update/text_delta` | `assistant_delta` | 追加文本 |
| `tool_execution_start` | `tool_started` | 显示工具名称 |
| `tool_execution_update` | `tool_progress` | 显示工具进度 |
| `tool_execution_end` | `tool_finished` | 更新工具状态 |
| `agent_end` | `run_finished` | 关闭运行状态 |

这层转换很重要：浏览器不应该直接依赖所有内部事件字段，应用需要定义自己的稳定协议。

## 6. 课堂练习

1. 为“章节生成”设计一份前端状态：`idle`、`running`、`waiting_tool`、`aborting`、`completed`、`failed`。
2. 说明为什么 `message_update` 只能追加到当前草稿缓冲区，不能覆盖数据库中的正式章节。
3. 在 `examples/01-minimal.ts` 中同时记录事件类型和 `agent.state.messages.length`，观察事件发生时状态长度的变化。

## 下一章

下一章会进入 `AgentTool`：从参数 Schema、工具执行到工具结果如何重新进入模型上下文。
