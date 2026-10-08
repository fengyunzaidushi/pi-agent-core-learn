# 项目上下文

本文件是课程续写的简短交接记录。稳定目标与目录在 `README.md`；具体论证在各章节；此处只记录跨任务需要保留的状态和边界。每次续写前先核对文件与 Git 状态，再更新本文件。

## 目标与范围

- 项目：面向授课的中文 `@earendil-works/pi-agent-core` 教程。
- 贯穿案例：网页版小说写作智能体。
- 课程路径：基础 `Agent` -> 消息与工具 -> 上下文和队列 -> Session/Harness -> Web 集成。
- Pi 源码权威目录：`F:/code/github/05/pi`；本项目使用 npm 安装的包运行示例。每次引用 API 时核对两边版本。

## 当前课程状态（2026-10-08 核对）

| 文件 | 状态 | 说明 |
|---|---|---|
| `lessons/01-agent-mental-model.md` | 初稿 | Agent、消息和模型循环 |
| `lessons/02-first-agent.md` | 初稿 | faux provider、`streamFn`、首个 Agent |
| `lessons/03-events-and-transcript.md` | 初稿 | 事件与转录、Web 事件映射 |
| `lessons/04-tools.md` | 初稿 | AgentTool、工具调用与执行策略 |
| `examples/01-minimal.ts` | 已有离线示例 | `npm run lesson:01` |
| `examples/02-tool-call.ts` | 已有离线示例 | `npm run lesson:02` |

“初稿”只表示文件存在，不表示已达到最终授课质量。`examples/demo.ts` 是当前工作树中的独立未跟踪文件；未确认归属前不要把它纳入课程目录或改写。

## 下一步

下一章讲 `AgentMessage`、`convertToLlm`、`transformContext` 与小说资料进入模型上下文的边界。写作前核对 `packages/agent/src/agent.ts`、`agent-loop.ts`、`types.ts` 及对应测试，加入可离线运行的第三个示例，并同步更新课程目录和命令。

## 已确认的教学边界

- `pi-agent-core` 是运行时层；`pi-coding-agent` 包含终端产品与更高层会话/资源装配。使用哪个 API 时注明所属包。
- `Agent` 内存转录与应用数据库持久化不同；不可把 `agent.state.messages` 当作自动持久化会话。
- faux provider 只验证确定性的控制流和事件，不验证真实模型会如何遵循提示词。
- `AgentHarness`、Pico、Facet 文档包含设计与交接内容；进入这些章节时必须重新核对当前实现与导出面。
- 用户已有的未提交改动保持原样。本文件的状态表只描述所见文件，不代表 Git 已提交。

## 更新规则

完成一章后，记录文件状态、实际运行的命令和仍未解决的问题。若只是回答问题、没有改变项目事实，不更新本文件。发现目录或版本与本记录不符时，先核对实际文件，再修正记录。
