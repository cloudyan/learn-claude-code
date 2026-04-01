import * as dotenv from "dotenv";
import * as path from "path";
import { ChatOpenAI } from "@langchain/openai";

// 强制加载当前目录下的 .env 文件并覆盖已有的环境变量
dotenv.config({ 
  path: path.join(__dirname, "../.env"),
  override: true 
});

export const API_KEY = process.env.OPENAI_API_KEY || process.env.API_KEY || "";
export const BASE_URL = process.env.OPENAI_BASE_URL || process.env.API_BASE_URL || "https://api.openai.com/v1";
export const MODEL_NAME = process.env.MODEL_NAME || "gpt-4o";

/**
 * 默认模型实例
 */
export const model = new ChatOpenAI({
  apiKey: API_KEY,
  configuration: {
    baseURL: BASE_URL,
  },
  modelName: MODEL_NAME,
  temperature: 0,
});

/**
 * 创建自定义配置的模型实例
 */
export function createModel(options: { temperature?: number; modelName?: string } = {}) {
  return new ChatOpenAI({
    apiKey: API_KEY,
    configuration: {
      baseURL: BASE_URL,
    },
    modelName: options.modelName || MODEL_NAME,
    temperature: options.temperature ?? 0,
  });
}