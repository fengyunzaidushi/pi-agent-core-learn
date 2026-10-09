import {
	Agent,
	createCustomMessage,
	type AgentMessage,
} from "@earendil-works/pi-agent-core";
import {
	createModels,
	fauxAssistantMessage,
	fauxProvider,
	type Message,
} from "@earendil-works/pi-ai";

const faux = fauxProvider();
faux.setResponses([
	fauxAssistantMessage("已读取本章资料：林岚会避开北港的涨潮时间。"),
]);

const models = createModels();
models.setProvider(faux.provider);

const transformedRoles: string[][] = [];
const convertedRoles: string[][] = [];
let providerRoles: string[] = [];
let providerUserText = "";

const storyMemory = createCustomMessage(
	"story-memory",
	"林岚害怕水；北港涨潮通常发生在傍晚。",
	false,
	{ source: "chapter-memory", chapterId: 3 },
	1,
);

const convertToLlm = (messages: AgentMessage[]): Message[] => {
	convertedRoles.push(messages.map((message) => message.role));

	return messages.flatMap((message): Message[] => {
		if (message.role === "custom") {
			const text = typeof message.content === "string"
				? message.content
				: message.content
						.filter((part) => part.type === "text")
						.map((part) => part.text)
						.join("\n");
			return [{
				role: "user",
				content: `小说资料（来自 ${message.customType}）：${text}`,
				timestamp: message.timestamp,
			}];
		}

		if (
			message.role === "system" ||
			message.role === "user" ||
			message.role === "assistant" ||
			message.role === "toolResult"
		) {
			return [message];
		}

		return [];
	});
};

const agent = new Agent({
	initialState: {
		systemPrompt: "你是小说写作助手。只能依据当前上下文中的资料回答。",
		model: faux.getModel(),
	},
	transformContext: async (messages) => {
		transformedRoles.push(messages.map((message) => message.role));
		// 外部记忆只在本次模型请求中注入，不自动写入 Agent 转录。
		return [...messages, storyMemory];
	},
	convertToLlm,
	streamFn: (model, context, options) => {
		providerRoles = context.messages.map((message) => message.role);
		providerUserText = context.messages
			.filter((message) => message.role === "user")
			.map((message) => typeof message.content === "string"
				? message.content
				: message.content
						.map((part) => part.type === "text" ? part.text : "[非文本]")
						.join(""))
			.join(" | ");
		return models.streamSimple(model, context, options);
	},
});

await agent.prompt("为第三章设计一个与涨潮有关的冲突。\n");

console.log("response:");
console.log(agent.state.messages.at(-1));
console.log("transformContext roles:", transformedRoles[0]?.join(" -> "));
console.log("convertToLlm roles:", convertedRoles[0]?.join(" -> "));
console.log("provider roles:", providerRoles.join(" -> "));
console.log("provider user messages:", providerUserText);
console.log("persisted transcript roles:", agent.state.messages.map((message) => message.role).join(" -> "));
