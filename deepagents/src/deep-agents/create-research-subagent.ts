import { createDeepAgent } from "deepagents";
import { createChatModel } from "../providers/model.ts";
import { RESEARCHER_AGENT_PROMPT } from "../prompts/researcher-agent.ts";
import { deepAgentTools } from "../tools/index.ts";

export function createResearchSubagent() {
  return createDeepAgent({
    model: createChatModel(),
    tools: deepAgentTools,
    systemPrompt: RESEARCHER_AGENT_PROMPT,
  });
}
