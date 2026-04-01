#!/usr/bin/env tsx
/**
 * v0: Bash is All You Need — TypeScript 版本
 *
 * 核心思想：子代理就是递归调用自己，只是 SYSTEM_PROMPT 不同。
 *
 * 这个版本展示了极简代理设计的本质：
 * 1. 没有复杂的类定义
 * 2. 没有任务系统
 * 3. 只有两个工具：bash（执行命令）和 subagent（递归调用自己）
 *
 * 运行方式:
 *   npm run v0
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 配置 OpenAI 客户端（兼容国内模型）
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.MODEL_NAME || 'gpt-4o';

// 路径安全检查：防止路径逃逸出工作目录
const WORK_DIR = process.cwd();

function safePath(userPath: string): string {
  const resolved = path.resolve(userPath);
  if (!resolved.startsWith(WORK_DIR)) {
    throw new Error(`Path ${userPath} is outside working directory`);
  }
  return resolved;
}

// 工具定义 (类型安全)
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'bash',
      description: '执行任意 bash 命令（如 git, npm, ls, grep, find 等）',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: '要执行的 bash 命令'
          },
          timeout: {
            type: 'integer',
            description: '超时时间（毫秒），默认 120000',
            default: 120000
          }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'subagent',
      description: '创建一个子代理处理子任务（递归调用自己，只是提示词不同）',
      parameters: {
        type: 'object',
        properties: {
          task: {
            type: 'string',
            description: '给子代理的完整任务描述'
          }
        },
        required: ['task']
      }
    }
  }
];

// 工具执行
async function executeTool(
  name: string,
  args: Record<string, any>
): Promise<string> {
  if (name === 'bash') {
    try {
      const output = execSync(args.command, {
        encoding: 'utf8',
        timeout: args.timeout || 120000,
        cwd: WORK_DIR,
        stdio: 'pipe'
      });
      return output.trim() || '(无输出)';
    } catch (e: any) {
      return `错误: ${e.message}`;
    }
  }

  if (name === 'subagent') {
    console.log('\n=== 子代理启动 ===');
    const result = await agentLoop(args.task);
    console.log('=== 子代理结束 ===\n');
    return result;
  }

  return `未知工具: ${name}`;
}

// 代理循环
async function agentLoop(task: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt || `你是一个能干的 AI 助手，可以执行 bash 命令。

工作目录: ${WORK_DIR}

小心行事，破坏性命令（如 rm、git push）要先确认。`
    },
    { role: 'user', content: task }
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: 'auto'
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || '(无内容)';
    }

    for (const toolCall of message.tool_calls) {
      console.log(`\n[工具调用] ${toolCall.function.name}`);
      console.log(`[参数] ${toolCall.function.arguments}`);

      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);

      console.log(`[结果] ${result.substring(0, 500)}${result.length > 500 ? '...' : ''}`);

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result
      });
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方式: npm run v0 -- "你的任务描述"');
    console.log('\n示例:');
    console.log('  npm run v0 -- "查看当前目录结构"');
    console.log('  npm run v0 -- "在当前目录初始化一个项目"');
    return;
  }

  const task = args.join(' ');
  console.log(`任务: ${task}\n`);

  const result = await agentLoop(task);
  console.log(`\n最终结果: ${result}`);
}

// 直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// 导出供其他模块使用
export { agentLoop, executeTool, TOOLS };
