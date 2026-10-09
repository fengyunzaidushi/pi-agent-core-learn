// 从 pi-agent-core 导入负责驱动智能体循环的 Agent 类。
import { Agent } from "@earendil-works/pi-agent-core";
// 从 pi-ai 导入模型集合、伪造助手消息和伪造模型提供者工厂。
import { createModels, fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";

// 创建一个不会访问真实模型服务的确定性伪造提供者。
const faux = fauxProvider();
// 预先配置模型收到提示词后要返回的助手消息。
faux.setResponses([fauxAssistantMessage("这是一个确定性的小说开场白：雨停在城门关闭之前。")]);

// 创建用于管理模型提供者和流式调用的模型集合。
const models = createModels();
// 把伪造提供者注册到模型集合中，后续请求都会走这个本地响应。
models.setProvider(faux.provider);

// 创建一个新的 Agent，并传入它启动时需要的状态和模型调用函数。
const agent = new Agent({
	// 配置智能体的初始状态。
	initialState: {
		// 设置智能体在对话中使用的系统提示词。
		systemPrompt: "你是一个小说写作助手。",
		// 取得伪造提供者对应的模型，作为当前智能体模型。
		model: faux.getModel(),
	// 结束初始状态对象。
	},
	// 绑定模型集合的流式方法，并固定它调用时的 this 对象。
	streamFn: models.streamSimple.bind(models),
// 结束 Agent 配置对象。
});

// 订阅智能体事件，以便观察执行过程并输出生成内容。
agent.subscribe((event) => {
	// 打印每个事件的类型，便于观察事件流转顺序。
	console.log(`[event00] ${event.type}`);

	// 只处理消息更新中的文本增量事件，过滤掉其他事件类型。
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		// 把本次增量文本直接写入标准输出，实现流式显示。
		process.stdout.write(event.assistantMessageEvent.delta);
	// 结束文本增量条件分支。
	}
// 结束事件订阅回调。
});

// 向智能体发送用户请求，并等待它完成这次生成。
await agent.prompt("请写一句小说开场白。");

// 输出一个标题，把接下来的内容与实时事件日志区分开。
console.log("\n--- transcript ---");
// 遍历智能体当前状态中按顺序保存的全部对话消息。
for (const message of agent.state.messages) {
	// 输出消息角色以及序列化后的完整消息对象。
	console.log(message.role, JSON.stringify(message));
// 结束对话消息遍历。
}
