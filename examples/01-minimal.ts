import { Agent } from "@earendil-works/pi-agent-core";
import { createModels, fauxAssistantMessage, fauxProvider } from "@earendil-works/pi-ai";

const faux = fauxProvider();
faux.setResponses([fauxAssistantMessage("这是一个确定性的小说开场白：雨停在城门关闭之前。")]);

const models = createModels();
models.setProvider(faux.provider);

const agent = new Agent({
	initialState: {
		systemPrompt: "你是一个小说写作助手。",
		model: faux.getModel(),
	},
	streamFn: models.streamSimple.bind(models),
});

agent.subscribe((event) => {
	console.log(`[event] ${event.type}`);

	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

await agent.prompt("请写一句小说开场白。");

console.log("\n--- transcript ---");
for (const message of agent.state.messages) {
	console.log(message.role, JSON.stringify(message));
}
