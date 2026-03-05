#!/usr/bin/env tsx
/**
 * v0-mini: Bash is All You Need — 极简 TypeScript 版本
 *
 * 核心思想：子代理就是递归调用自己，只是 SYSTEM_PROMPT 不同。
 *
 * 这个版本展示了极简代理设计的本质，去掉了所有非必要代码。
 *
 * 运行方式:
 *   npm run v0-mini
 */

import { execSync } from 'child_process';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.MODEL_NAME || 'gpt-4o';

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: '执行 bash 命令',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command']
      }
    }
  }
];

async function main(task: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: '你是一个能干的 AI 助手，可以执行 bash 命令。' },
    { role: 'user', content: task }
  ];

  while (true) {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools
    });

    const msg = resp.choices[0].message;
    messages.push(msg);

    if (!msg.tool_calls?.length) return msg.content || '';

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      const result = call.function.name === 'bash'
        ? execSync(args.command, { encoding: 'utf8' }).trim() || '(无输出)'
        : `未知工具: ${call.function.name}`;

      console.log(`[${call.function.name}] ${args.command}`);
      console.log(result);

      messages.push({ tool_call_id: call.id, role: 'tool', content: result });
    }
  }
}

const task = process.argv.slice(2).join(' ') || '查看当前目录';
console.log(`任务: ${task}\n`);
main(task).then(r => console.log('\n最终结果:', r)).catch(console.error);
