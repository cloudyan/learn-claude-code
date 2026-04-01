import { createDeepAgent } from "deepagents";
import { createChatModel } from "../providers/model.ts";
import { CODING_AGENT_PROMPT } from "../prompts/coding-agent.ts";
import { deepAgentTools } from "../tools/index.ts";

export function createDeepCodingAgent() {
  return createDeepAgent({
    model: createChatModel(),
    tools: deepAgentTools,
    systemPrompt: CODING_AGENT_PROMPT,
  });
}
