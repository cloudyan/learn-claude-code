import { createAgent } from "langchain";
import { createChatModel } from "../providers/model.ts";
import { CODING_AGENT_PROMPT } from "../prompts/coding-agent.ts";
import { codingTools } from "../tools/index.ts";

export function createCodingAgent() {
  return createAgent({
    model: createChatModel(),
    tools: codingTools,
    systemPrompt: CODING_AGENT_PROMPT,
  });
}
