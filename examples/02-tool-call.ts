import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import { createModels, fauxAssistantMessage, fauxProvider, fauxToolCall } from "@earendil-works/pi-ai";
import { Type } from "typebox";

const parameters = Type.Object({
	topic: Type.String(),
});

const getStoryFacts: AgentTool<typeof parameters> = {
	name: "get_story_facts",
	label: "查询故事设定",
	description: "查询角色或世界观设定。",
	parameters,
	execute: async (_toolCallId, params, _signal, onUpdate) => {
		onUpdate?.({
			content: [{ type: "text", text: `正在查询：${params.topic}` }],
			details: { stage: "lookup" },
		});

		return {
			content: [{ type: "text", text: "林岚害怕水，曾在北港生活。" }],
			details: { topic: params.topic, source: "memory" },
		};
	},
};

const faux = fauxProvider();
faux.setResponses([
	// 第一轮：模型决定查询角色设定。
	fauxAssistantMessage(fauxToolCall("get_story_facts", { topic: "林岚" }, { id: "call-facts-1" }), {
		stopReason: "toolUse",
	}),
	// 第二轮：模型读取 toolResult 后给出最终回答。
	fauxAssistantMessage("林岚害怕水，因此这一章可以把北港的暴雨写成她的心理触发点。"),
]);

const models = createModels();
models.setProvider(faux.provider);

const agent = new Agent({
	initialState: {
		systemPrompt: "你是一个小说写作助手。需要事实时先查询故事设定。",
		model: faux.getModel(),
		tools: [getStoryFacts],
	},
	streamFn: models.streamSimple.bind(models),
	beforeToolCall: async ({ toolCall, args }) => {
		console.log("beforeToolCall", toolCall.name, args);
	},
	afterToolCall: async ({ result }) => ({
		details: { ...result.details, audited: true },
	}),
});

agent.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
		return;
	}

	if (event.type === "tool_execution_start" || event.type === "tool_execution_end") {
		console.log(`\n[event] ${event.type} ${event.toolName}`);
	}
});

await agent.prompt("请根据林岚的设定，给第三章设计一个冲突。 ");

console.log("\n--- transcript roles ---");
console.log(agent.state.messages.map((message) => message.role).join(" -> "));
