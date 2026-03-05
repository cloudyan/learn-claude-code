#!/usr/bin/env tsx
/**
 * v4: 知识外化 — TypeScript 版本
 *
 * 核心思想：SKILL.md 按需加载领域知识，不在 prompt 里堆金子。
 *
 * 在 v3 基础上增加：
 * 1. SkillsLoader: 解析 SKILL.md 文件（YAML frontmatter + Markdown）
 * 2. SkillsCache: 技能描述缓存，避免重复解析
 * 3. load_skill 工具：按需加载技能
 *
 * 运行方式:
 *   npm run v4
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { TodoManager } from './v2_todo_agent';
import { AGENT_TYPES } from './v3_subagent';

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
// Skills 加载器
// ============================================================================

interface Skill {
  name: string;
  description: string;
  content: string;
}

class SkillsLoader {
  private cache: Map<string, Skill> = new Map();
  private skillsDir: string;

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
  }

  parseSkill(filePath: string): Skill | null {
    if (this.cache.has(filePath)) {
      return this.cache.get(filePath)!;
    }

    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf8');

    // 解析 YAML frontmatter
    // 简单实现：找 --- 分隔符
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    let name = path.basename(filePath, '.md');
    let description = '';
    let body = content;

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      body = frontmatterMatch[2];

      // 简单解析 YAML（不依赖第三方库）
      const nameMatch = frontmatter.match(/name:\s*(.+)/);
      const descMatch = frontmatter.match(/description:\s*(.+)/);

      if (nameMatch) name = nameMatch[1];
      if (descMatch) description = descMatch[1];
    }

    const skill: Skill = { name, description, content: body };
    this.cache.set(filePath, skill);
    return skill;
  }

  listAvailableSkills(): string {
    if (!existsSync(this.skillsDir)) {
      return '（skills 目录不存在）';
    }

    // 简单的目录列表（不依赖 glob）
    try {
      const result = execSync(`ls -1 "${this.skillsDir}"/*.md 2>/dev/null || true`, { encoding: 'utf8' });
      const files = result.trim().split('\n').filter(Boolean);

      if (files.length === 0) {
        return '（没有找到 .md 技能文件）';
      }

      const skills: string[] = [];
      for (const file of files) {
        const skill = this.parseSkill(file);
        if (skill) {
          skills.push(`- ${skill.name}: ${skill.description}`);
        }
      }

      return `可用技能 (${skills.length}):\n${skills.join('\n')}`;
    } catch {
      return '（无法读取 skills 目录）';
    }
  }
}

// ============================================================================
// 工具定义（添加 skills 相关）
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
      description: '创建子代理',
      parameters: {
        type: 'object',
        properties: {
          agent_type: { type: 'string', enum: Object.keys(AGENT_TYPES) },
          task: { type: 'string' },
          context: { type: 'string' }
        },
        required: ['agent_type', 'task']
      }
    }
  },
  load_skill: {
    type: 'function',
    function: {
      name: 'load_skill',
      description: '加载技能文件（按需加载领域知识）',
      parameters: {
        type: 'object',
        properties: {
          skill_name_or_path: {
            type: 'string',
            description: '技能名称或 SKILL.md 文件路径'
          }
        },
        required: ['skill_name_or_path']
      }
    }
  },
  list_skills: {
    type: 'function',
    function: {
      name: 'list_skills',
      description: '列出所有可用的技能',
      parameters: { type: 'object', properties: {} }
    }
  }
};

// ============================================================================
// 工具执行
// ============================================================================

async function executeTool(
  name: string,
  args: Record<string, any>,
  todoManager: TodoManager,
  skillsLoader: SkillsLoader
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
      'general',
      undefined,
      skillsLoader
    );
    console.log('=== 子代理结束 ===\n');
    return result;
  }
  if (name === 'load_skill') {
    let skillPath = args.skill_name_or_path;
    if (!skillPath.endsWith('.md')) {
      skillPath = path.join(skillsLoader['skillsDir'], `${skillPath}.md`);
    }
    const skill = skillsLoader.parseSkill(skillPath);
    if (!skill) return `错误: 找不到技能 ${args.skill_name_or_path}`;
    return `已加载技能: ${skill.name}\n\n${skill.content}`;
  }
  if (name === 'list_skills') {
    return skillsLoader.listAvailableSkills();
  }
  return `未知工具: ${name}`;
}

// ============================================================================
// 代理循环
// ============================================================================

async function agentLoop(
  task: string,
  agentType: string = 'general',
  parentTodoManager?: TodoManager,
  parentSkillsLoader?: SkillsLoader
): Promise<string> {
  const agent = AGENT_TYPES[agentType];
  const todoManager = parentTodoManager || new TodoManager();
  const skillsLoader = parentSkillsLoader || new SkillsLoader(path.join(WORK_DIR, 'skills'));

  const availableTools = agentType === 'general'
    ? [...agent.tools, 'add_todo', 'update_todo', 'get_todo_list', 'task', 'load_skill', 'list_skills']
    : agent.tools;

  const tools = availableTools.map(name => ALL_TOOLS[name]);

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `${agent.systemPrompt}

工作目录: ${WORK_DIR}

工具 vs 技能：
- 工具: 你能做什么（bash, read_file 等）
- 技能: 你知道什么（特定领域的知识）

当需要特定领域知识时，先用 list_skills 看看有什么，再用 load_skill 加载。`
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
      const result = await executeTool(toolCall.function.name, args, todoManager, skillsLoader);
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
    console.log('使用方式: npm run v4 -- "你的任务描述"');
    return;
  }
  const result = await agentLoop(args.join(' '));
  console.log('\n最终结果:', result);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { agentLoop, SkillsLoader };
