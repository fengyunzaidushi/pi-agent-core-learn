---
name: pi-course-context
description: Manage context for the pi-agent-core-learn Chinese teaching course. Use when continuing lessons, adding runnable examples, tracing Pi source for a chapter, updating the course roadmap, or resuming after a long pause; verify the current files and source before relying on prior notes.
---

# Pi 课程上下文管理

本 Skill 服务于 `F:/code/github/09/pi-agent-core-learn`。它帮助后续任务快速恢复课程目标、当前状态和证据边界，不替代实际源码核对。

## 进入任务

1. 读项目根目录的 `AGENTS.md`、`PROJECT_CONTEXT.md`、`README.md`。
2. 看 `git status --short` 和任务涉及的完整章节、示例。现有未提交改动可能属于其他任务，不根据上下文文件推定文件归属。
3. 明确本次是在续写、讲解、修订、验证，还是只更新课程进度。只读问题不必改文件。
4. 对照 `package.json` / `package-lock.json` 的已安装版本和 Pi 源码 checkout 的包版本；版本不同时把差异写清楚。

## 查证课程事实

1. 先确定目标符号和所属层：`pi-ai` 模型协议、`pi-agent-core` 的 `Agent`/Loop/Harness、`pi-coding-agent` 产品装配，或应用自己的 Web/小说层。
2. 在 Pi 源码项目中优先使用可用的 codebase-memory-mcp 图谱工具，并完成其要求的覆盖检查。图谱不可用时读取精确源码、类型、相关测试；不要把一次搜索未命中当作功能不存在。
3. 写出最短可验证路径，例如 `Agent.prompt()` -> `runAgentLoop()` -> `streamFn` -> 事件 -> tool result -> 下一轮。
4. 对每个关键结论标明其性质：源码事实、公共接口、实验观察、设计文档或推断。对 Harness/Pico 设计稿特别注明是否已在当前代码中实现。

## 续写与交接

1. 沿用“问题 -> 源码事实 -> 最小实验 -> 运行观察 -> 小说产品映射 -> 课堂练习”的章节结构；深度可以随主题增加，不机械压缩。
2. 优先构造 faux provider 的离线示例，使用稳定输入和可观察输出。新示例应能独立运行，并在章节中给出命令和预期观察。
3. TypeScript 示例改动后运行 `npm run typecheck` 与相关 `npm run lesson:NN`。文档变动检查相对链接、章节编号和 `git diff --check`。
4. 只有实际完成后才更新 `README.md` 的课程目录与 `PROJECT_CONTEXT.md` 的状态；记录验证结果和下一步。不要把临时实验、未跟踪文件或未验证设计记为正式课程成果。
5. 回复用户时用简短的中文交代本次交付、源码依据、运行验证和未完成部分。

## 上下文文件维护

`PROJECT_CONTEXT.md` 保持短小，只存目标、已确认边界、章节状态、下一步与未解决问题。详细原理放入章节；操作命令放入 README 或具体章节。过时记录要修正，不能累积相互冲突的历史结论。
