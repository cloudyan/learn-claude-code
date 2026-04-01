#!/usr/bin/env tsx
/**
 * v3: 分而治之 — TypeScript 版本
 *
 * 核心思想：Task 工具隔离上下文，用子代理处理子任务。
 *
 * 在 v2 基础上增加：
 * 1. AGENT_TYPES: 子代理类型注册表
 * 2. Task 工具：启动子代理处理子任务
 * 3. 工具过滤：根据任务类型给不同代理不同工具
 *
 * 运行方式:
 *   npm run v3
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { TodoManager } from './v2_todo_agent';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.MODEL_NAME || 'gpt-4o';
const WORK_DIR = process.cwd();

function safePath(userPath: string): string {
  const resolved = path.resolve(userPath);
  if (!resolved.startsWith(WORK_DIR)) throw new Error(`路径 ${userPath} 超出范围`);
  return resolved;
}

// ============================================================================
// 子代理类型注册表
// ============================================================================

interface AgentType {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
}

const AGENT_TYPES: Record<string, AgentType> = {
  'general': {
    name: '通用助手',
    description: '什么都能做一点的通用代理',
    systemPrompt: '你是一个能干的通用 AI 助手。',
    tools: ['bash', 'read_file', 'write_file', 'edit_file']
  },
  'coder': {
    name: '程序员',
    description: '专注于写代码的代理',
    systemPrompt: '你是一个专业的程序员，擅长编写高质量代码。先理解需求，再写代码，最后验证。',
    tools: ['bash', 'read_file', 'write_file', 'edit_file']
  },
  'researcher': {
    name: '研究员',
    description: '只看不改的探索型代理',
    systemPrompt: '你是一个细心的研究员。你的任务是探索和理解代码库，不要修改任何文件。',
    tools: ['read_file', 'bash']
  },
  'writer': {
    name: '文档写手',
    description: '专注于写文档的代理',
    systemPrompt: '你是一个专业的技术文档写手，擅长用清晰简洁的语言解释复杂概念。',
    tools: ['read_file', 'write_file', 'edit_file']
  }
};

// ============================================================================
// 工具定义
// ============================================================================

const ALL_TOOLS: Record<string, OpenAI.Chat.ChatCompletionTool> = {
  bash: {
    type: 'function',
    function: {
      name: 'bash',
      description: '执行 bash 命令',
      parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] }
    }
  },
  read_file: {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取文件',
      parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] }
    }
  },
  write_file: {
    type: 'function',
    function: {
      name: 'write_file',
      description: '写入文件',
      parameters: { type: 'object', properties: { file_path: { type: 'string' }, content: { type: 'string' } }, required: ['file_path', 'content'] }
    }
  },
  edit_file: {
    type: 'function',
    function: {
      name: 'edit_file',
      description: '编辑文件',
      parameters: { type: 'object', properties: { file_path: { type: 'string' }, old_str: { type: 'string' }, new_str: { type: 'string' } }, required: ['file_path', 'old_str', 'new_str'] }
    }
  },
  add_todo: {
    type: 'function',
    function: {
      name: 'add_todo',
      description: '添加任务',
      parameters: { type: 'object', properties: { content: { type: 'string' }, priority: { type: 'string', enum: ['high', 'medium', 'low'] } }, required: ['content'] }
    }
  },
  update_todo: {
    type: 'function',
    function: {
      name: 'update_todo',
      description: '更新任务',
      parameters: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string' } }, required: ['id', 'status'] }
    }
  },
  get_todo_list: {
    type: 'function',
    function: { name: 'get_todo_list', description: '获取任务列表', parameters: { type: 'object', properties: {} } }
  },
  task: {
    type: 'function',
    function: {
      name: 'task',
      description: '创建子代理处理子任务',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', description: '子代理类型', enum: Object.keys(AGENT_TYPES) },
          task: { type: 'string', description: '给子代理的任务描述' },
          context: { type: 'string', description: '额外上下文信息' }
        },
        required: ['agent_type', 'task']
      }
    }
  }
};

// ============================================================================
// 工具执行（支持子代理）
// ============================================================================

async function executeTool(
  name: string,
  args: Record<string, any>,
  todoManager: TodoManager
): Promise<string> {
  if (name === 'bash') {
    try {
      return execSync(args.command, { encoding: 'utf8', timeout: 120000, cwd: WORK_DIR }).trim() || '(无输出)';
    } catch (e: any) { return `错误: ${e.message}`; }
  }
  if (name === 'read_file') {
    try {
      const lines = readFileSync(safePath(args.file_path), 'utf8').split('\n');
      return lines.map((line, i) => `${i + 1}: ${line}`).join('\n');
    } catch (e: any) { return `错误: ${e.message}`; }
  }
  if (name === 'write_file') { writeFileSync(safePath(args.file_path), args.content, 'utf8'); return '写入成功'; }
  if (name === 'edit_file') {
    const filePath = safePath(args.file_path);
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(args.old_str)) return '错误: 找不到内容';
    writeFileSync(filePath, content.replace(args.old_str, args.new_str), 'utf8');
    return '编辑成功';
  }
  if (name === 'add_todo') { return `添加成功，ID: ${todoManager.addTodo(args.content, args.priority)}`; }
  if (name === 'update_todo') { return todoManager.updateTodo(args.id, args.status); }
  if (name === 'get_todo_list') { return todoManager.getTodoList(); }
  if (name === 'task') {
    console.log(`\n=== 启动子代理: ${AGENT_TYPES[args.agent_type].name} ===`);
    const result = await agentLoop(
      args.task + (args.context ? `\n\n额外上下文:\n${args.context}` : ''),
      args.agent_type
    );
    console.log('=== 子代理结束 ===\n');
    return result;
  }
  return `未知工具: ${name}`;
}

// ============================================================================
// 代理循环
// ============================================================================

async function agentLoop(
  task: string,
  agentType: string = 'general',
  parentTodoManager?: TodoManager
): Promise<string> {
  const agent = AGENT_TYPES[agentType];
  const todoManager = parentTodoManager || new TodoManager();

  // 主代理有 task 工具，子代理没有
  const availableTools = agentType === 'general'
    ? [...agent.tools, 'add_todo', 'update_todo', 'get_todo_list', 'task']
    : agent.tools;

  const tools = availableTools.map(name => ALL_TOOLS[name]);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${agent.systemPrompt}

工作目录: ${WORK_DIR}

可用的代理类型:
${Object.entries(AGENT_TYPES).map(([k, v]) => `- ${k}: ${v.description}`).join('\n')}

当遇到复杂任务时，可以用 task 工具创建专门的子代理来处理。`
    },
    { role: 'user', content: task }
  ];

  while (true) {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: 'auto'
    });

    const message = response.choices[0].message;
    messages.push(message);

    if (!message.tool_calls?.length) {
      if (!parentTodoManager) {
        console.log('\n=== 最终任务列表 ===');
        console.log(todoManager.getTodoList());
      }
      return message.content || '(无内容)';
    }

    for (const toolCall of message.tool_calls) {
      console.log(`\n[工具] ${toolCall.function.name}`);
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args, todoManager);
      console.log(`[结果] ${result.substring(0, 500)}${result.length > 500 ? '...' : ''}`);
      messages.push({ tool_call_id: toolCall.id, role: 'tool', content: result });
    }
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('使用方式: npm run v3 -- "你的任务描述"');
    return;
  }
  const result = await agentLoop(args.join(' '));
  console.log('\n最终结果:', result);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { agentLoop, AGENT_TYPES };
