#!/usr/bin/env tsx
/**
 * v4_skills_agent.ts - Mini Claude Code: Skills Mechanism (~550 lines)
 * 
 * 核心哲学: "知识外化"
 * ============================================
 * v3 给了我们任务分解的子代理。但是有一个更深层的问题：
 * 
 *     模型如何知道如何处理特定领域的任务？
 * 
 * - 处理 PDF？它需要知道 pdftotext 与 PyMuPDF 的区别
 * - 构建 MCP 服务器？它需要协议规范和最佳实践
 * - 代码审查？它需要系统化检查清单
 * 
 * 这种知识不是工具 - 它是专业知识。技能通过让模型按需加载领域知识来解决这个问题。
 * 
 * 范式转换：知识外化
 * --------------------------------------------
 * 传统 AI：知识锁定在模型参数中
 *   - 教授新技能：收集数据 -> 训练 -> 部署
 *   - 成本：$10K-$1M+，时间线：数周
 *   - 需要 ML 专业知识，GPU 集群
 * 
 * 技能：存储在可编辑文件中的知识
 *   - 教授新技能：写一个 SKILL.md 文件
 *   - 成本：免费，时间线：数分钟
 *   - 任何人都可以做
 * 
 * 这就像插入一个热插拔 LoRA 适配器而无需任何训练！
 * 
 * 工具 vs 技能：
 * ---------------
 *     | 概念   | 是什么              | 示例                    |
 *     |-----------|-------------------------|---------------------------|
 *     | **工具**  | 模型能做的事       | bash, read_file, write    |
 *     | **技能** | 模型知道如何做   | PDF 处理, MCP 开发   |
 * 
 * 工具是能力。技能是知识。
 * 
 * 渐进式披露：
 * ----------------------
 *     第 1 层：元数据（始终加载）      ~100 tokens/skill
 *              name + description 仅
 * 
 *     第 2 层：SKILL.md 内容（触发时）    ~2000 tokens
 *              详细说明
 * 
 *     第 3 层：资源（按需）         无限
 *              scripts/, references/, assets/
 * 
 * 这保持上下文精简，同时允许任意深度。
 * 
 * SKILL.md 标准：
 * -----------------
 *     skills/
 *     |-- pdf/
 *     |   |-- SKILL.md          # 必需：YAML frontmatter + Markdown body
 *     |-- mcp-builder/
 *     |   |-- SKILL.md
 *     |   |-- references/       # 可选：文档，规范
 *     |-- code-review/
 *         |-- SKILL.md
 *         |-- scripts/          # 可选：辅助脚本
 * 
 * 缓存保护注入：
 * --------------------------
 * 关键见解：技能内容进入 tool_result（用户消息），
 * 不是系统提示。这保留了提示缓存！
 * 
 *     错误：编辑系统提示（缓存失效，20-50x 成本）
 *     正确：作为工具结果附加（前缀不变，缓存命中）
 * 
 * 这就是生产 Claude Code 的工作方式 - 以及为什么它成本效率高。
 * 
 * 用法:
 *     tsx v4_skills_agent.ts
 */

import { streamText, tool } from 'ai';
import { client, MODEL } from './client';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const WORKDIR = process.cwd();
const SKILLS_DIR = path.join(WORKDIR, 'skills');

// =============================================================================
// SkillLoader - v4 的核心添加
// =============================================================================

interface Skill {
  name: string;
  description: string;
  body: string;
  path: string;
  dir: string;
}

class SkillLoader {
  /**
   * 从 SKILL.md 文件加载和管理技能。
   * 
   * 技能是包含以下内容的文件夹：
   * - SKILL.md（必需）：YAML frontmatter + markdown 指令
   * - scripts/（可选）：模型可以运行的辅助脚本
   * - references/（可选）：附加文档
   * - assets/（可选）：模板，用于输出的文件
   * 
   * SKILL.md 格式：
   * ----------------
   *     ---
   *     name: pdf
   *     description: 处理 PDF 文件。在读取、创建或合并 PDF 时使用。
   *     ---
   * 
   *     # PDF 处理技能
   * 
   *     ## 读取 PDF
   * 
   *     使用 pdftotext 进行快速提取：
   *     ```bash
   *     pdftotext input.pdf -
   *     ```
   *     ...
   * 
   * YAML frontmatter 提供元数据（名称，描述）。
   * markdown body 提供详细指令。
   */

  private skills: Record<string, Skill> = {};

  constructor(private skillsDir: string) {
    this.loadSkills();
  }

  private parseSkillMd(skillPath: string): Skill | null {
    /**
     * 将 SKILL.md 文件解析为元数据和内容。
     * 
     * 返回 { name, description, body, path, dir } 的对象
     * 如果文件不匹配格式则返回 null。
     */
    try {
      const content = fs.readFileSync(skillPath, 'utf-8');

      // 匹配 --- 标记之间的 YAML frontmatter
      const match = content.match(/^---\s*\n(.*?)\n---\s*\n(.*)$/s);
      if (!match) {
        return null;
      }

      const [, frontmatter, body] = match;
      if (!frontmatter || !body) {
        return null;
      }

      // 解析 YAML 类似 frontmatter（简单的 key: value）
      const metadata: Record<string, string> = {};
      for (const line of frontmatter.trim().split('\n')) {
        if (line.includes(':')) {
          const colonIndex = line.indexOf(':');
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
          metadata[key] = value;
        }
      }

      // 要求 name 和 description
      const name = metadata['name'];
      const description = metadata['description'];
      if (!name || !description) {
        return null;
      }

      return {
        name: name,
        description: description,
        body: body.trim(),
        path: skillPath,
        dir: path.dirname(skillPath),
      };
    } catch (e) {
      return null;
    }
  }

  private loadSkills() {
    /**
     * 扫描技能目录并加载所有有效的 SKILL.md 文件。
     * 
     * 启动时只加载元数据 - 内容按需加载。
     * 这使初始上下文保持精简。
     */
    if (!fs.existsSync(this.skillsDir)) {
      return;
    }

    const skillDirs = fs.readdirSync(this.skillsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const skillDir of skillDirs) {
      const skillPath = path.join(this.skillsDir, skillDir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
        continue;
      }

      const skill = this.parseSkillMd(skillPath);
      if (skill) {
        this.skills[skill.name] = skill;
      }
    }
  }

  getDescriptions(): string {
    /**
     * 为系统提示生成技能描述。
     * 
     * 这是第 1 层 - 只有名称和描述，每个技能约 100 个 token。
     * 完整内容（第 2 层）仅在调用 Skill 工具时加载。
     */
    if (Object.keys(this.skills).length === 0) {
      return "(无可用技能)";
    }

    return Object.entries(this.skills)
      .map(([name, skill]) => `- ${name}: ${skill.description}`)
      .join('\n');
  }

  getSkillContent(name: string): string | null {
    /**
     * 获取用于注入的完整技能内容。
     * 
     * 这是第 2 层 - 完整的 SKILL.md body，加上任何可用资源（第 3 层提示）。
     * 
     * 如果技能未找到则返回 null。
     */
    if (!(name in this.skills)) {
      return null;
    }

    const skill = this.skills[name];
    let content = `# 技能: ${skill.name}\n\n${skill.body}`;

    // 列出可用资源（第 3 层提示）
    const resources: string[] = [];
    const folders = [
      { folder: "scripts", label: "脚本" },
      { folder: "references", label: "参考资料" },
      { folder: "assets", label: "资源" }
    ];

    for (const { folder, label } of folders) {
      const folderPath = path.join(skill.dir, folder);
      if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        if (files.length > 0) {
          resources.push(`${label}: ${files.join(', ')}`);
        }
      }
    }

    if (resources.length > 0) {
      content += `\n\n**${skill.dir} 中可用的资源:**\n`;
      content += resources.map(r => `- ${r}`).join('\n');
    }

    return content;
  }

  listSkills(): string[] {
    /** 返回可用技能名称列表。 */
    return Object.keys(this.skills);
  }
}

// 全局技能加载器实例
const SKILLS = new SkillLoader(SKILLS_DIR);

// =============================================================================
// 代理类型注册表（来自 v3）
// =============================================================================

interface AgentType {
  description: string;
  tools: string[] | '*';
  prompt: string;
}

const AGENT_TYPES: Record<string, AgentType> = {
  "explore": {
    description: "用于探索代码、查找文件、搜索的只读代理",
    tools: ["bash", "read_file"],
    prompt: "您是一个探索代理。搜索和分析，但绝不要修改文件。返回一个简洁的摘要。",
  },
  "code": {
    description: "用于实现功能和修复错误的全功能代理",
    tools: "*", // 所有工具
    prompt: "您是一个编码代理。高效地实现请求的更改。",
  },
  "plan": {
    description: "用于设计实现策略的规划代理",
    tools: ["bash", "read_file"],
    prompt: "您是一个规划代理。分析代码库并输出编号的实现计划。不要做更改。",
  },
};

function getAgentDescriptions(): string {
  /** 为系统提示生成代理类型描述。 */
  return Object.entries(AGENT_TYPES)
    .map(([name, cfg]) => `- ${name}: ${cfg.description}`)
    .join('\n');
}

// =============================================================================
// TodoManager (来自 v2)
// =============================================================================

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

class TodoManager {
  /** 任务列表管理器，带约束。详情见 v2。 */

  private items: TodoItem[] = [];

  update(items: TodoItem[]): string {
    const validated: TodoItem[] = [];
    let inProgress = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const content = (item?.content || "").toString().trim();
      const status = (item?.status || "pending").toLowerCase() as 'pending' | 'in_progress' | 'completed';
      const active = (item?.activeForm || "").toString().trim();

      if (!content || !active) {
        throw new Error(`项目 ${i}: 需要内容和 activeForm`);
      }
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        throw new Error(`项目 ${i}: 无效状态`);
      }
      if (status === "in_progress") {
        inProgress += 1;
      }

      validated.push({
        content,
        status,
        activeForm: active
      });
    }

    if (inProgress > 1) {
      throw new Error("只能有一个任务在进行中");
    }

    this.items = validated.slice(0, 20); // 最多 20 个项目
    return this.render();
  }

  render(): string {
    if (this.items.length === 0) {
      return "无待办事项。";
    }
    const lines: string[] = [];
    for (const t of this.items) {
      const mark = t.status === "completed" ? "[x]" : 
                 t.status === "in_progress" ? "[>]" : "[ ]";
      lines.push(`${mark} ${t.content}`);
    }
    const done = this.items.filter(t => t.status === "completed").length;
    return lines.join('\n') + `\n(${done}/${this.items.length} 已完成)`;
  }
}

const TODO = new TodoManager();

// =============================================================================
// 系统提示 - v4 更新
// =============================================================================

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。

循环: 计划 -> 用工具行动 -> 报告。

**可用技能**（在任务匹配时立即调用技能工具）:
${SKILLS.getDescriptions()}

**可用子代理**（为集中子任务调用任务工具）:
${getAgentDescriptions()}

规则:
- 在任务匹配技能描述时立即使用技能工具
- 对于需要集中探索或实现的子任务使用任务工具
- 使用 TodoWrite 跟踪多步工作
- 优先使用工具而不是文本。行动，不要只是解释。
- 完成后，总结更改了什么。

注意：
- 会话和思考步骤都使用中文`;

// =============================================================================
// 基础工具定义
// =============================================================================

// Tool 1: Bash
const bashTool = tool({
  description: "运行 shell 命令。",
  parameters: {
    type: 'object',
    properties: {
      command: { type: 'string' }
    },
    required: ['command']
  } as const,
});

// Tool 2: Read File
const readFileTool = tool({
  description: "读取文件内容。",
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      limit: { type: 'number' }
    },
    required: ['path']
  } as const,
});

// Tool 3: Write File
const writeFileTool = tool({
  description: "写入文件。",
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      content: { type: 'string' }
    },
    required: ['path', 'content']
  } as const,
});

// Tool 4: Edit File
const editFileTool = tool({
  description: "替换文件中的文本。",
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      old_text: { type: 'string' },
      new_text: { type: 'string' },
    },
    required: ['path', 'old_text', 'new_text'],
  } as const,
});

// Tool 5: TodoWrite
const todoWriteTool = tool({
  description: "更新任务列表。",
  parameters: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed']
            },
            activeForm: { type: 'string' },
          },
          required: ['content', 'status', 'activeForm'],
        },
      }
    },
    required: ['items'],
  } as const,
});

// Task 工具（来自 v3）
const taskTool = tool({
  description: `为集中子任务生成子代理。\n\n代理类型:\n${getAgentDescriptions()}`,
  parameters: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: '任务的简短描述（3-5 个词）'
      },
      prompt: {
        type: 'string',
        description: '子代理的详细说明'
      },
      agent_type: {
        type: 'string',
        enum: Object.keys(AGENT_TYPES)
      },
    },
    required: ['description', 'prompt', 'agent_type'],
  } as const,
});

// v4 新增：技能工具
const skillTool = tool({
  description: `加载技能以获得特定任务的专业知识。
  
可用技能:
${SKILLS.getDescriptions()}

何时使用:
- 用户任务匹配技能描述时立即使用
- 尝试特定领域工作（PDF，MCP 等）之前

技能内容将被注入到对话中，为您提供
详细指令和资源访问权限。`,
  parameters: {
    type: 'object',
    properties: {
      skill: {
        type: 'string',
        description: '要加载的技能名称'
      }
    },
    required: ['skill'],
  } as const,
});

// =============================================================================
// 工具实现
// =============================================================================

function safePath(p: string): string {
  /** 确保路径在工作区内部。 */
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) {
    throw new Error(`路径超出工作区: ${p}`);
  }
  return resolved;
}

function runBash(cmd: string): string {
  /** 执行 shell 命令。 */
  if (["rm -rf /", "sudo", "shutdown"].some(d => cmd.includes(d))) {
    return "错误: 危险命令";
  }
  try {
    const result = execSync(cmd, {
      cwd: WORKDIR,
      timeout: 60000, // 60 秒
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const output = result;
    return (output && output.trim().length > 0) ? output.substring(0, 50000) : "(无输出)";
  } catch (e: any) {
    return `错误: ${e.message || e}`;
  }
}

function runRead(filePath: string, limit?: number): string {
  /** 读取文件内容。 */
  try {
    const resolvedPath = safePath(filePath);
    const text = fs.readFileSync(resolvedPath, 'utf-8');
    let lines = text.split('\n');
    if (limit != null) {
      lines = lines.slice(0, limit);
    }
    return lines.join('\n').substring(0, 50000);
  } catch (e: any) {
    return `错误: ${e.message || e}`;
  }
}

function runWrite(filePath: string, content: string): string {
  /** 将内容写入文件。 */
  try {
    const resolvedPath = safePath(filePath);
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolvedPath, content);
    return `写入 ${content.length} 字节到 ${filePath}`;
  } catch (e: any) {
    return `错误: ${e.message || e}`;
  }
}

function runEdit(filePath: string, oldText: string, newText: string): string {
  /** 替换文件中的确切文本。 */
  try {
    const resolvedPath = safePath(filePath);
    const text = fs.readFileSync(resolvedPath, 'utf-8');
    if (!text.includes(oldText)) {
      return `错误: 在 ${filePath} 中找不到文本`;
    }
    fs.writeFileSync(resolvedPath, text.replace(oldText, newText, 1));
    return `编辑了 ${filePath}`;
  } catch (e: any) {
    return `错误: ${e.message || e}`;
  }
}

function runTodo(items: TodoItem[]): string {
  /** 更新待办列表。 */
  try {
    return TODO.update(items);
  } catch (e: any) {
    return `错误: ${e.message || e}`;
  }
}

function runSkill(skillName: string): string {
  /**
   * 加载技能并将内容注入到对话中。
   * 
   * 这是子代理机制的核心：
   * 1. 获取技能内容（SKILL.md body + 资源提示）
   * 2. 以 <skill-loaded> 标签返回
   * 3. 模型将此作为工具结果接收（用户消息）
   * 4. 模型现在"知道"如何完成用户的任务
   * 
   * 为什么使用工具结果而不是系统提示？
   * - 系统提示的更改会失效缓存（20-50x 成本增加）
   * - 工具结果附加到末尾（前缀不变，缓存命中）
   * 
   * 这就是生产系统保持成本效率的方式。
   */
  const content = SKILLS.getSkillContent(skillName);

  if (!content) {
    const available = SKILLS.listSkills().join(', ') || "无";
    return `错误: 未知技能 '${skillName}'。可用: ${available}`;
  }

  // 用标签包装，这样模型知道这是技能内容
  return `<skill-loaded name="${skillName}">
${content}
</skill-loaded>

按照上面技能中的指令完成用户的任务。`;
}

// =============================================================================
// 子代理执行（来自 v3）
// =============================================================================

async function runTask(description: string, prompt: string, agentType: string): Promise<string> {
  /** 执行子代理任务（来自 v3）。详情见 v3。 */
  if (!(agentType in AGENT_TYPES)) {
    return `错误: 未知代理类型 '${agentType}'`;
  }

  const config = AGENT_TYPES[agentType];
  const subSystem = `您是在 ${WORKDIR} 的 ${agentType} 子代理。

${config.prompt}

完成任务并返回一个清晰、简洁的摘要。`;

  // 此代理类型的过滤工具
  const enabledTools: Record<string, any> = {};
  const allowed = config.tools;
  
  if (allowed === "*") {
    // 启用所有基础工具，但不包括 Task 和 Skill（防止递归）
    enabledTools['bash'] = bashTool;
    enabledTools['read_file'] = readFileTool;
    enabledTools['write_file'] = writeFileTool;
    enabledTools['edit_file'] = editFileTool;
    enabledTools['TodoWrite'] = todoWriteTool;
  } else {
    // 根据白名单启用工具
    if (allowed.includes("bash")) enabledTools['bash'] = bashTool;
    if (allowed.includes("read_file")) enabledTools['read_file'] = readFileTool;
    if (allowed.includes("write_file")) enabledTools['write_file'] = writeFileTool;
    if (allowed.includes("edit_file")) enabledTools['edit_file'] = editFileTool;
    if (allowed.includes("TodoWrite")) enabledTools['TodoWrite'] = todoWriteTool;
  }

  // 隔离的消息历史记录
  const subMessages: any[] = [{ role: "user", content: prompt }];

  console.log(`  [${agentType}] ${description}`);
  const start = Date.now();
  let toolCount = 0;

  try {
    while (true) {
      const result = await streamText({
        model: client(MODEL),
        system: subSystem,
        messages: subMessages,
        tools: enabledTools,
        maxTokens: 8000,
      });

      const { textStream, toolCalls } = result;
      
      if (toolCalls.length > 0) {
        const results: any[] = [];
        
        for (const toolCall of toolCalls) {
          toolCount += 1;
          
          // 执行适当的工具
          let output = '';
          switch (toolCall.toolName) {
            case 'bash':
              output = runBash(toolCall.args.command);
              break;
            case 'read_file':
              output = runRead(toolCall.args.path, toolCall.args.limit);
              break;
            case 'write_file':
              output = runWrite(toolCall.args.path, toolCall.args.content);
              break;
            case 'edit_file':
              output = runEdit(toolCall.args.path, toolCall.args.old_text, toolCall.args.new_text);
              break;
            case 'TodoWrite':
              output = runTodo(toolCall.args.items);
              break;
            default:
              output = `未知工具: ${toolCall.toolName}`;
          }

          results.push({
            toolCallId: toolCall.toolCallId,
            result: output
          });

          const elapsed = (Date.now() - start) / 1000;
          process.stdout.write(
            `\r  [${agentType}] ${description} ... ${toolCount} 工具, ${elapsed.toFixed(1)}s`
          );
        }

        // 添加助手消息和用户消息（工具结果）
        subMessages.push({
          role: 'assistant',
          content: [
            ...toolCalls.map(tc => ({
              type: 'tool-call' as const,
              toolName: tc.toolName,
              args: tc.args,
              toolCallId: tc.toolCallId
            }))
          ]
        });

        subMessages.push({
          role: 'user',
          content: results.map(r => ({
            type: 'tool-result' as const,
            toolCallId: r.toolCallId,
            result: r.result
          }))
        });
      } else {
        // 没有更多工具调用，收集文本结果
        let fullText = '';
        for await (const textPart of textStream) {
          fullText += textPart;
        }
        
        const elapsed = (Date.now() - start) / 1000;
        process.stdout.write(
          `\r  [${agentType}] ${description} - 完成 (${toolCount} 工具, ${elapsed.toFixed(1)}s)\n`
        );
        
        return fullText || "(子代理未返回文本)";
      }
    }
  } catch (error) {
    const elapsed = (Date.now() - start) / 1000;
    process.stdout.write(
      `\r  [${agentType}] ${description} - 错误 (${elapsed.toFixed(1)}s)\n`
    );
    return `错误: ${(error as Error).message}`;
  }
}

// =============================================================================
// 主代理循环
// =============================================================================

async function agentLoop(messages: any[]): Promise<any[]> {
  /**
   * 带技能支持的主代理循环。
   * 
   * 与 v3 相同的模式，但现在包含技能工具。
   * 当模型加载技能时，它接收领域知识。
   */
  const result = await streamText({
    model: client(MODEL),
    system: SYSTEM,
    messages: messages,
    tools: {
      bash: bashTool,
      read_file: readFileTool,
      write_file: writeFileTool,
      edit_file: editFileTool,
      TodoWrite: todoWriteTool,
      Task: taskTool,
      Skill: skillTool,
    },
    maxTokens: 8000,
  });

  // 获取工具调用和文本结果
  const { textStream, toolCalls } = result;
  
  // 处理文本流
  let fullText = '';
  for await (const textPart of textStream) {
    fullText += textPart;
    process.stdout.write(textPart);
  }
  console.log('\n'); // 文本输出后添加换行符

  // 如果有工具调用，则处理它们
  if (toolCalls.length > 0) {
    const results: any[] = [];
    
    for (const toolCall of toolCalls) {
      // 不同工具类型有不同的特殊显示
      if (toolCall.toolName === "Task") {
        console.log(`\n> 任务: ${toolCall.args.description || '子任务'}`);
        const taskResult = await runTask(
          toolCall.args.description as string,
          toolCall.args.prompt as string,
          toolCall.args.agent_type as string
        );
        results.push({
          toolCallId: toolCall.toolCallId,
          result: taskResult
        });
      } else if (toolCall.toolName === "Skill") {
        console.log(`\n> 加载技能: ${toolCall.args.skill || '?'}`);
        const skillResult = runSkill(toolCall.args.skill as string);
        console.log(`  技能已加载 (${skillResult.length} 个字符)`);
        results.push({
          toolCallId: toolCall.toolCallId,
          result: skillResult
        });
      } else {
        console.log(`\n> ${toolCall.toolName}`);
        
        // 执行适当的工具
        let output = '';
        switch (toolCall.toolName) {
          case 'bash':
            output = runBash(toolCall.args.command);
            break;
          case 'read_file':
            output = runRead(toolCall.args.path, toolCall.args.limit);
            break;
          case 'write_file':
            output = runWrite(toolCall.args.path, toolCall.args.content);
            break;
          case 'edit_file':
            output = runEdit(toolCall.args.path, toolCall.args.old_text, toolCall.args.new_text);
            break;
          case 'TodoWrite':
            output = runTodo(toolCall.args.items);
            break;
          default:
            output = `未知工具: ${toolCall.toolName}`;
        }
        
        const preview = output.length > 200 ? output.substring(0, 200) + "..." : output;
        console.log(`  ${preview}`);
        
        results.push({
          toolCallId: toolCall.toolCallId,
          result: output
        });
      }
    }

    // 添加助手消息（含工具调用）
    messages.push({
      role: 'assistant',
      content: [
        { type: 'text', text: fullText },
        ...toolCalls.map(tc => ({
          type: 'tool-call' as const,
          toolName: tc.toolName,
          args: tc.args,
          toolCallId: tc.toolCallId
        }))
      ]
    });

    // 添加用户消息（含工具结果）
    messages.push({
      role: 'user',
      content: results.map(r => ({
        type: 'tool-result' as const,
        toolCallId: r.toolCallId,
        result: r.result
      }))
    });

    // 由于有工具调用，继续循环
    return agentLoop(messages);
  } else {
    // 没有更多工具调用，返回最终消息
    messages.push({
      role: 'assistant',
      content: [{ type: 'text', text: fullText }]
    });
    return messages;
  }
}

// =============================================================================
// 主 REPL
// =============================================================================

async function main() {
  console.log(`Mini Claude Code v4 (TypeScript) (带技能) - ${WORKDIR}`);
  console.log(`技能: ${SKILLS.listSkills().join(', ') || '无'}`);
  console.log(`代理类型: ${Object.keys(AGENT_TYPES).join(', ')}`);
  console.log("输入 'exit' 退出。\n");

  const history: any[] = [];

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  for await (const line of rl) {
    const userInput = line.trim();

    if (!userInput || ["exit", "quit", "q"].includes(userInput.toLowerCase())) {
      break;
    }

    history.push({ role: "user", content: userInput });

    try {
      await agentLoop(history);
    } catch (e: any) {
      console.log(`错误: ${e.message || e}`);
    }

    console.log(); // 轮次之间的空行
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { agentLoop, SYSTEM };