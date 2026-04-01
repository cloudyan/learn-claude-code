import { createAgent } from "langchain";
import { createChatModel } from "../providers/model.ts";
import { BASE_AGENT_PROMPT } from "../prompts/base-agent.ts";
import { basicTools } from "../tools/index.ts";

export function createBasicAgent() {
  return createAgent({
    model: createChatModel(),
    tools: basicTools,
    systemPrompt: BASE_AGENT_PROMPT,
  });
}
