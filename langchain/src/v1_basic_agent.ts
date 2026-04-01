#!/usr/bin/env tsx
/**
 * v1: Model as Agent — TypeScript 版本（模块化重构）
 *
 * 核心思想：模型即代理 —— 给模型一套工具，让它自己决定何时使用。
 *
 * 运行方式:
 *   npm run v1
 */

import { client, MODEL, WORK_DIR } from './clients/model';
import { bash, BASH_TOOL } from './tools/bash';
import { readFile, READ_FILE_TOOL } from './tools/read-file';
import { writeFile, WRITE_FILE_TOOL } from './tools/write-file';
import { editFile, EDIT_FILE_TOOL } from './tools/edit-file';
import OpenAI from 'openai';

// ============================================================================
// 工具定义
// ============================================================================

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  BASH_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL
];

// ============================================================================
// 工具执行
// ============================================================================

async function executeTool(name: string, args: any): Promise<string> {
  if (name === 'bash') return bash(args);
  if (name === 'read_file') return readFile(args);
  if (name === 'write_file') return writeFile(args);
  if (name === 'edit_file') return editFile(args);
  return `未知工具: ${name}`;
}

// ============================================================================
// 代理循环
// ============================================================================

async function agentLoop(task: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt || `你是一个能干的 AI 助手，有完整的文件系统和终端访问权限。

工作目录: ${WORK_DIR}

规则：
1. 先了解情况（用 ls、read_file 等），再动手修改
2. edit_file 的 old_str 必须精确匹配（包括空格、换行、缩进）
3. 不确定时，可以先读取文件看看
4. 破坏性操作（如 rm、git push）要先向用户确认`
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

      const displayResult = result.length > 1000
        ? result.substring(0, 1000) + '\n... (输出已截断)'
        : result;
      console.log(`[结果]\n${displayResult}`);

      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result
      });
    }
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方式: npm run v1 -- "你的任务描述"');
    console.log('\n示例:');
    console.log('  npm run v1 -- "查看当前目录结构"');
    console.log('  npm run v1 -- "创建一个 TypeScript 项目"');
    return;
  }

  const task = args.join(' ');
  console.log(`任务: ${task}\n`);

  const result = await agentLoop(task);
  console.log(`\n最终结果: ${result}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { agentLoop, executeTool, TOOLS };
