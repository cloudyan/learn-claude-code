import { createDeepAgent } from "deepagents";
import { createChatModel } from "../providers/model.ts";
import { REVIEWER_AGENT_PROMPT } from "../prompts/reviewer-agent.ts";
import { deepAgentTools } from "../tools/index.ts";

export function createReviewerSubagent() {
  return createDeepAgent({
    model: createChatModel(),
    tools: deepAgentTools,
    systemPrompt: REVIEWER_AGENT_PROMPT,
  });
}
