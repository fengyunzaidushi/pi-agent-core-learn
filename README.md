# Pi Agent Core 课程

这是一套基于 `@earendil-works/pi-agent-core` 源码的中文授课教程。

课程最终目标是：从一个最小的 Agent 开始，逐步实现一个适合网页版小说写作的 Agent Runtime，理解模型请求、工具调用、事件流、上下文、会话、恢复和 Web 集成之间的关系。

## 课程定位

本教程不是 API 目录，也不是只复制 README 示例。每一章固定回答五个问题：

1. 这一层解决什么问题？
2. Pi 的类型和源码如何表达这个问题？
3. 一次调用实际经过哪些函数和事件？
4. 学员如何用一个可运行实验验证结论？
5. 这项能力放进小说写作产品时应该如何建模？

课程中的结论按以下证据顺序组织：当前 Pi 源码、当前公开类型、可运行实验、设计文档、明确标注的推断。设计文档和当前代码冲突时，以代码为准。

## 学习路线

### 第一阶段：基础 Agent

1. [课程说明与实验方法](00-course-contract.md)
2. [Agent 的心智模型](lessons/01-agent-mental-model.md)
3. [创建第一个 Agent](lessons/02-first-agent.md)
4. [事件流与消息转录](lessons/03-events-and-transcript.md)

### 第二阶段：工具和上下文

5. AgentTool 的类型、参数校验和执行边界
6. `convertToLlm` 与 `transformContext`
7. 多工具调用、并行执行、steering 和 follow-up
8. 错误、取消、重试和 `finishTurn`

### 第三阶段：持久化小说 Agent

9. Session、Branch、Lane 与章节工作流
10. 值、列表、角色卡和世界观存储
11. 工具结果和助手部分输出的持久化
12. 压缩、恢复、断线重连和版本分支

### 第四阶段：Web 应用架构

13. 浏览器、后端和模型代理
14. SSE/WebSocket 事件桥接
15. 多用户会话和权限边界
16. Telemetry、插件和 RPC

## 当前进度

- 已建立课程骨架。
- 已完成第一章和第二章的初稿。
- 已加入离线 faux provider 示例，暂不需要真实 API Key。
- 后续章节会在完成源码追踪和实验后再加入。

## 运行第一份示例

在本目录执行：

```bash
npm install
npm run lesson:01
```

示例使用 `@earendil-works/pi-ai` 的 faux provider 返回确定性文本，因此不会产生真实模型请求或费用。

## 源码对应关系

教程分析的源代码位于另一个 checkout：

```text
F:/code/github/05/pi/packages/agent/src/agent.ts
F:/code/github/05/pi/packages/agent/src/agent-loop.ts
F:/code/github/05/pi/packages/agent/src/types.ts
```

当前课程优先讲 `Agent` 和低层 Agent Loop。`AgentHarness`、Pico、持久化和跨进程设计会在基础概念稳定后再进入课程。
