import { loadRootEnv } from "../shared/load-root-env.ts";

export interface ModelConfig {
  apiKey: string;
  baseURL?: string;
  model: string;
}

export function getModelConfig(): ModelConfig {
  loadRootEnv();

  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const baseURL = process.env.OPENAI_BASE_URL;
  const model = process.env.MODEL_NAME ?? "gpt-5-nano";

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return {
    apiKey,
    baseURL,
    model,
  };
}
