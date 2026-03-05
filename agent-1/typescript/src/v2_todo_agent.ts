#!/usr/bin/env tsx
/**
 * v2: 让 Agent 有计划 —— TypeScript 版本（模块化重构）
 *
 * 核心思想：先规划，再执行 —— 显式任务追踪，让行为可预测。
 *
 * 运行方式:
 *   npm run v2
 */

import { client, MODEL, WORK_DIR } from './clients/model';
import { bash, BASH_TOOL } from './tools/bash';
import { readFile, READ_FILE_TOOL } from './tools/read-file';
import { writeFile, WRITE_FILE_TOOL } from './tools/write-file';
import { editFile, EDIT_FILE_TOOL } from './tools/edit-file';
import { TODO_WRITE_TOOL } from './tools/todo-write';
import { TodoManager, Todo, INITIAL_REMINDER, NAG_REMINDER } from './utils/todoManager';
import OpenAI from 'openai';

// 全局 TodoManager 实例
const todoManager = new TodoManager();

// ============================================================================
// 工具定义
// ============================================================================

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  BASH_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  TODO_WRITE_TOOL
];

// ============================================================================
// 工具执行
// ============================================================================

async function executeTool(name: string, args: any): Promise<string> {
  if (name === 'bash') return bash(args);
  if (name === 'read_file') return readFile(args);
  if (name === 'write_file') return writeFile(args);
  if (name === 'edit_file') return editFile(args);
  if (name === 'TodoWrite') {
    try {
      return todoManager.update(args.items);
    } catch (e: any) {
      return `错误: ${e.message}`;
    }
  }
  return `未知工具: ${name}`;
}

// ============================================================================
// 代理循环（带 Todo 追踪）
// ============================================================================

// 追踪多少轮没更新 Todo 了
let roundsWithoutTodo = 0;

async function agentLoop(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
): Promise<OpenAI.Chat.ChatCompletionMessageParam[]> {
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
      return messages;
    }

    let usedTodo = false;
    const results: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const toolCall of message.tool_calls) {
      console.log(`\n> ${toolCall.function.name}`);
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);
      const preview = result.length > 300 ? result.substring(0, 300) + '...' : result;
      console.log(`  ${preview}`);

      results.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result
      });

      // 追踪是否使用了 TodoWrite
      if (toolCall.function.name === 'TodoWrite') {
        usedTodo = true;
      }
    }

    // 更新计数器：使用了 Todo 就重置，否则+1
    if (usedTodo) {
      roundsWithoutTodo = 0;
    } else {
      roundsWithoutTodo++;
    }

    messages.push(...results);
  }
}

// ============================================================================
// 主函数（带提醒注入）
// ============================================================================

async function main() {
  console.log(`Agent v2 (with Todos) - ${WORK_DIR}`);
  console.log('输入任务开始，或输入 "exit" 退出。\n');

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  let isFirstMessage = true;

  // 简单的交互式 REPL
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (query: string): Promise<string> => {
    return new Promise(resolve => readline.question(query, resolve));
  };

  try {
    while (true) {
      const userInput = await askQuestion('You: ');

      if (!userInput || userInput.toLowerCase() === 'exit') {
        break;
      }

      // 构建用户消息内容（可能包含提醒）
      const contentParts: string[] = [];

      if (isFirstMessage) {
        // 第一次对话时温柔提醒
        contentParts.push(INITIAL_REMINDER);
        isFirstMessage = false;
      } else if (roundsWithoutTodo > 10) {
        // 超过 10 轮没更新 Todo，唠叨一下
        contentParts.push(NAG_REMINDER);
      }

      contentParts.push(userInput);
      const fullContent = contentParts.join('\n');

      messages.push({ role: 'user', content: fullContent });

      try {
        await agentLoop(messages);
      } catch (e: any) {
        console.log(`错误: ${e.message}`);
      }

      console.log();
    }
  } finally {
    readline.close();
  }
}

// 直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { agentLoop, TodoManager, todoManager };
