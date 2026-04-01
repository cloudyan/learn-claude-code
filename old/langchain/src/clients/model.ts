import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * OpenAI 客户端配置
 *
 * 支持国内模型兼容（DeepSeek、智谱、百川等）
 */
export const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

export const MODEL = process.env.MODEL_NAME || 'gpt-4o';
export const WORK_DIR = process.cwd();
