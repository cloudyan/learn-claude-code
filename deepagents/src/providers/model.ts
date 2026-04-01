import { ChatOpenAI } from "@langchain/openai";
import { getModelConfig } from "./config.ts";

export function createChatModel() {
  const config = getModelConfig();

  return new ChatOpenAI({
    apiKey: config.apiKey,
    model: config.model,
    configuration: config.baseURL ? { baseURL: config.baseURL } : undefined,
  });
}
