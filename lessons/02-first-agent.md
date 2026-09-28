# 第二章：创建第一个 Agent

## 本章目标

完成一个不访问真实模型的最小程序，学会：

- 创建 faux provider；
- 创建 `Agent`；
- 提供 `streamFn`；
- 订阅文本增量事件；
- 等待 `prompt()` 完成；
- 检查最终状态。

## 1. 最小组成

一个 `Agent` 至少需要：

```text
initialState.model
initialState.systemPrompt（可选）
streamFn
```

`streamFn` 是运行时和具体模型服务之间的边界。Agent Core 不自己选择供应商，也不自己保存 API Key。它把模型、转录和请求选项交给 `streamFn`，再消费返回的助手事件流。

## 2. 运行示例

示例文件：[examples/01-minimal.ts](../examples/01-minimal.ts)

```bash
npm run lesson:01
```

示例使用 `fauxProvider()` 预先配置一条确定性响应。它的价值不是模拟完整供应商，而是让我们把注意力放在 Agent Core 的状态和事件上。

核心代码如下：

```ts
const faux = fauxProvider();
faux.setResponses([fauxAssistantMessage("这是一个确定性的回答。")]);

const models = createModels();
models.setProvider(faux.provider);

const agent = new Agent({
  initialState: {
    systemPrompt: "你是一个小说写作助手。",
    model: faux.getModel(),
  },
  streamFn: models.streamSimple.bind(models),
});
```

这里有三个边界：

1. `fauxProvider` 决定模型会返回什么；
2. `models.streamSimple` 把模型请求转换成 `StreamFn`；
3. `Agent` 只负责运行消息和事件循环。

## 3. 观察文本增量

```ts
agent.subscribe((event) => {
  if (event.type !== "message_update") return;
  if (event.assistantMessageEvent.type !== "text_delta") return;
  process.stdout.write(event.assistantMessageEvent.delta);
});
```

`message_update` 不是一条完整的助手消息。它携带的是助手消息正在生成时的增量事件。完整消息会在 `message_end` 中出现，整个运行结束时还会收到 `agent_end`。

## 4. `prompt()` 完成意味着什么

```ts
await agent.prompt("请写一句开场白。");
```

`prompt()` 等待当前 Agent 运行完成。它不是只等待第一个模型响应：如果响应中包含工具调用，工具结果和后续模型回合也会包含在这次运行中。

示例结束后可以读取：

```ts
const lastMessage = agent.state.messages.at(-1);
console.log(lastMessage);
```

`agent.state.messages` 是当前转录快照。它不是数据库，也不自动替你完成跨进程持久化；持久化是更高层的 Session/Harness 责任。

## 5. 课堂实验

### 实验 A：改变系统提示词

把系统提示词改成“你是一个只写悬疑小说的助手”，观察 faux provider 的固定回答为什么不会改变。由此说明：faux provider 已经固定了响应，不能用它验证提示词对模型生成内容的影响。

### 实验 B：记录完整事件序列

把订阅函数改成：

```ts
agent.subscribe((event) => {
  console.log(event.type);
});
```

记录事件顺序，并和下一章的事件表对照。

### 实验 C：第二次 prompt

在第一次 `prompt()` 之后再调用一次。观察 `agent.state.messages` 是如何累积的，并说明为什么第二次请求需要把第一轮转录放入上下文。

## 6. 常见误区

### 把 Agent 当成模型客户端

模型客户端只负责一次请求。Agent 还负责转录、工具、队列、取消和事件。

### 只监听最终文本

Web UI 如果只等待最终文本，无法展示实时生成、工具进度和取消状态。

### 以为 `state.messages` 自动持久化

当前 `Agent` 保存的是内存状态。小说项目需要单独设计 Session、章节版本和数据库写入边界。

## 下一章

下一章会逐一解释事件序列，并使用它设计网页端的状态机。
