import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import 'dotenv/config';

const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY || '';
const baseURL = process.env.OPENAI_BASE_URL || process.env.API_BASE_URL || 'https://api.openai.com/v1';
export const MODEL = process.env.MODEL_NAME || 'gpt-4-turbo';

// 创建兼容 OpenAI 的客户端，支持国内大模型服务
const client = createOpenAICompatible({
  name: 'iflow',
  baseURL,
  apiKey,
});

export { client };

export function createModelCreatorCompatible({
  modelName = MODEL,
  providerId = 'iflow',
}) {
  return createOpenAICompatible({
    name: providerId,
    baseURL,
    apiKey,
  });
}

export function createModelCreatorOpenAI() {
  return createOpenAI({
    baseURL,
    apiKey,
  });
}