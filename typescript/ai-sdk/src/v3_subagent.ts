#!/usr/bin/env tsx
/**
 * v3_subagent.ts - Mini Claude Code: Subagent Mechanism (~450 lines)
 *
 * 核心哲学: "分而治之，上下文隔离"
 * =============================================================
 * v2 添加了规划。但是针对大型任务，如"探索代码库，然后重构认证模块"，单个代理会遇到问题：
 *
 * 问题 - 上下文污染：
 * -------------------------------
 *     单代理历史记录:
 *       [探索中...] cat file1.ts -> 500 行
 *       [探索中...] cat file2.ts -> 300 行
 *       ... 15 个更多文件 ...
 *       [现在重构...] "等等，file1 包含什么内容？"
 *
 * 模型的上下文被探索细节填满，为实际任务留下的空间很少。这就是"上下文污染"。
 *
 * 解决方案 - 具有隔离上下文的子代理：
 * ----------------------------------------------
 *     主代理历史记录:
 *       [任务: 探索代码库]
 *         -> 子代理探索 20 个文件（在自己的上下文中）
 *         -> 只返回: "认证在 src/auth/，数据库在 src/models/"
 *       [现在在干净的上下文中重构]
 *
 * 每个子代理都有：
 *   1. 它自己的新鲜消息历史记录
 *   2. 过滤后的工具（探索不能写入）
 *   3. 专门的系统提示
 *   4. 只将最终摘要返回给父级
 *
 * 关键见解：
 * ---------------
 *     进程隔离 = 上下文隔离
 *
 * 通过生成子任务，我们得到：
 *   - 为父代理提供干净的上下文
 *   - 可能的并行探索
 *   - 自然的任务分解
 *   - 相同的代理循环，不同的上下文
 *
 * 代理类型注册表：
 * -------------------
 *     | 类型    | 工具               | 目的                     |
 *     |---------|---------------------|---------------------------- |
 *     | explore | bash, read_file     | 只读探索       |
 *     | code    | 所有工具           | 完全实现访问  |
 *     | plan    | bash, read_file     | 无修改的设计    |
 *
 * 典型流程：
 * -------------
 *     用户: "重构认证以使用 JWT"
 *
 *     主代理:
 *       1. Task(explore): "查找所有认证相关文件"
 *          -> 子代理读取 10 个文件
 *          -> 返回: "认证在 src/auth/login.ts..."
 *
 *       2. Task(plan): "设计 JWT 迁移"
 *          -> 子代理分析结构
 *          -> 返回: "1. 添加 jwt 库 2. 创建工具..."
 *
 *       3. Task(code): "实现 JWT 令牌"
 *          -> 子代理写入代码
 *          -> 返回: "创建了 jwt_utils.ts，更新了 login.ts"
 *
 *       4. 向用户总结更改
 *
 * 用法:
 *     tsx v3_subagent.ts
 */

import { streamText, tool } from 'ai';
import { client, MODEL } from './client';
import { z } from 'zod';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const WORKDIR = process.cwd();

// =============================================================================
// 代理类型注册表 - 子代理机制的核心
// =============================================================================

interface AgentType {
  description: string;
  tools: string[] | '*';
  prompt: string;
}

const AGENT_TYPES: Record<string, AgentType> = {
  // Explore: 用于搜索和分析的只读代理
  // 不能修改文件 - 用于广泛探索的安全方法
  "explore": {
    description: "用于探索代码、查找文件、搜索的只读代理",
    tools: ["bash", "read_file"],  // 无写入权限
    prompt: "您是一个探索代理。搜索和分析，但绝不修改文件。返回一个简洁的摘要。",
  },

  // Code: 用于实现的全功能代理
  // 拥有所有工具 - 用于实际编码工作
  "code": {
    description: "用于实现功能和修复错误的全功能代理",
    tools: "*",  // 所有工具
    prompt: "您是一个编码代理。高效地实现请求的更改。",
  },

  // Plan: 用于设计工作的分析代理
  // 只读，专注于生成计划和策略
  "plan": {
    description: "用于设计实现策略的规划代理",
    tools: ["bash", "read_file"],  // 只读
    prompt: "您是一个规划代理。分析代码库并输出一个编号的实现计划。不要做更改。",
  },
};

function getAgentDescriptions(): string {
  /** 为 Task 工具生成代理类型描述。 */
  return Object.entries(AGENT_TYPES)
    .map(([name, cfg]) => `- ${name}: ${cfg.description}`)
    .join('\n');
}

// =============================================================================
// TodoManager (来自 v2，未更改)
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
// 系统提示
// =============================================================================

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。

循环: 计划 -> 用工具行动 -> 报告。

您可以为复杂子任务生成子代理：
${getAgentDescriptions()}

规则:
- 对于需要集中探索或实现的子任务，请使用 Task 工具
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
  description: "运行 shell 命令。用于：ls、find、grep、git、npm、python 等。",
  inputSchema: z.object({
    command: z.string().min(1).describe('要执行的 shell 命令')
  }),
  execute: async ({ command }) => {
    // 基本安全 - 阻止危险模式
    const dangerous = ["rm -rf /", "sudo", "shutdown", "reboot", "> /dev/"];
    if (dangerous.some(d => command.includes(d))) {
      return "错误：危险命令被阻止";
    }

    try {
      const result = execSync(command, {
        cwd: WORKDIR,
        timeout: 60000, // 60 秒
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      const output = result;
      return output.length > 0 ? output.substring(0, 50000) : "(无输出)";
    } catch (e: any) {
      if (e.signal === 'SIGTERM' || e.killed) {
        return "错误：命令超时 (60s)";
      }
      return `错误：${e.message || e}`;
    }
  }
});

// Tool 2: Read File
const readFileTool = tool({
  description: "读取文件内容。返回 UTF-8 文本。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    limit: z.number().optional().describe('最大读取行数（默认：全部）')
  }),
  execute: async ({ path: filePath, limit }) => {
    try {
      const resolvedPath = safePath(filePath);
      const text = fs.readFileSync(resolvedPath, 'utf-8');
      const lines = text.split('\n');

      if (limit != null && limit < lines.length) {
        const limitedLines = lines.slice(0, limit);
        limitedLines.push(`... (${lines.length - limit} more lines)`);
        return limitedLines.join('\n').substring(0, 50000);
      }

      return lines.join('\n').substring(0, 50000);
    } catch (e: any) {
      return `错误：${e.message || e}`;
    }
  }
});

// Tool 3: Write File
const writeFileTool = tool({
  description: "将内容写入文件。需要时创建父目录。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    content: z.string().describe('要写入的内容')
  }),
  execute: async ({ path: filePath, content }) => {
    try {
      const resolvedPath = safePath(filePath);
      const dir = path.dirname(resolvedPath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(resolvedPath, content);
      return `写入 ${content.length} 字节到 ${filePath}`;
    } catch (e: any) {
      return `错误：${e.message || e}`;
    }
  }
});

// Tool 4: Edit File
const editFileTool = tool({
  description: "替换文件中的文本。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    oldText: z.string().describe('要替换的文本'),
    newText: z.string().describe('替换的新文本'),
  }),
  execute: async ({ path: filePath, oldText, newText }) => {
    try {
      const resolvedPath = safePath(filePath);
      const text = fs.readFileSync(resolvedPath, 'utf-8');
      if (!text.includes(oldText)) {
        return `错误: 在 ${filePath} 中找不到文本`;
      }
      fs.writeFileSync(resolvedPath, text.replace(oldText, newText));
      return `编辑了 ${filePath}`;
    } catch (e: any) {
      return `错误: ${e.message || e}`;
    }
  }
});

// Tool 5: TodoWrite
const todoWriteTool = tool({
  description: "更新任务列表。",
  inputSchema: z.object({
    items: z.array(z.object({
      content: z.string().describe('任务内容'),
      status: z.enum(['pending', 'in_progress', 'completed']).describe('任务状态'),
      activeForm: z.string().describe('进行中的形式'),
    })).describe('任务项列表')
  }),
  execute: async ({ items }) => {
    try {
      return TODO.update(items);
    } catch (e: any) {
      return `错误: ${e.message || e}`;
    }
  }
});

// =============================================================================
// Task 工具 - v3 的核心添加
// =============================================================================

const taskTool = tool({
  description: `为集中子任务生成子代理。

子代理在隔离上下文中运行 - 它们看不到父级的历史记录。
使用此方法保持主对话干净。

代理类型:
${getAgentDescriptions()}

使用示例:
- Task(explore): "查找使用认证模块的所有文件"
- Task(plan): "设计数据库迁移策略"
- Task(code): "实现用户注册表单"
`,
  inputSchema: z.object({
    description: z.string().describe('任务的简短描述（3-5 个词）'),
    prompt: z.string().describe('子代理的详细说明'),
    agent_type: z.enum(Object.keys(AGENT_TYPES) as [string, ...string[]]).describe('要生成的代理类型'),
  }),
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
  /** 执行 shell 命令并进行安全检查。 */
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
    fs.writeFileSync(resolvedPath, text.replace(oldText, newText));
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

// =============================================================================
// 子代理执行 - v3 的核心
// =============================================================================

async function runTask(description: string, prompt: string, agentType: string): Promise<string> {
  /**
   * 使用隔离上下文执行子代理任务。
   *
   * 这是子代理机制的核心：
   *
   * 1. 创建隔离的消息历史记录（关键：无父上下文！）
   * 2. 使用代理特定的系统提示
   * 3. 根据代理类型过滤可用工具
   * 4. 运行与主代理相同的查询循环
   * 5. 仅返回最终文本（而不是中间详情）
   *
   * 父代理只看到摘要，保持其上下文干净。
   *
   * 进度显示：
   * ----------------
   * 运行时，我们显示：
   *   [explore] 查找认证文件 ... 5 个工具, 3.2s
   *
   * 这提供了可见性，而不会污染主对话。
   */
  const config = AGENT_TYPES[agentType];

  if (!config) {
    return `错误: 未知代理类型 '${agentType}'`;
  }

  // 代理特定的系统提示
  const subSystem = `您是在 ${WORKDIR} 的 ${agentType} 子代理。

${config.prompt}

完成任务并返回一个清晰、简洁的摘要。`;

  // 此代理类型的过滤工具
  const enabledTools: Record<string, any> = {};
  const allowed = config.tools;

  if (allowed === "*") {
    // 启用所有基础工具，但不包括 Task（防止递归）
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

  // 隔离的消息历史记录 - 这是关键！
  // 子代理从头开始，看不到父的对话
  const subMessages: any[] = [{ role: "user", content: prompt }];

  // 进度跟踪
  console.log(`  [${agentType}] ${description}`);
  const start = Date.now();
  let toolCount = 0;

  try {
    // 运行相同的代理循环（静默 - 不在主聊天中打印）
    while (true) {
      const result = await streamText({
        model: client(MODEL),
        system: subSystem,
        messages: subMessages,
        tools: enabledTools,
        maxOutputTokens: 8000,
      });

      const { textStream, toolCalls } = result;
      const awaitedToolCalls = await toolCalls;

      // 如果有工具调用，处理它们
      if (awaitedToolCalls.length > 0) {
        const results: any[] = [];

        for (const toolCall of awaitedToolCalls) {
          toolCount += 1;

          // 执行适当的工具
          let output = '';
          const input: any = toolCall.input || {};
          switch (toolCall.toolName) {
            case 'bash':
              output = runBash(input.command as string);
              break;
            case 'read_file':
              output = runRead(input.path as string, input.limit as number | undefined);
              break;
            case 'write_file':
              output = runWrite(input.path as string, input.content as string);
              break;
            case 'edit_file':
              output = runEdit(input.path as string, input.oldText as string, input.newText as string);
              break;
            case 'TodoWrite':
              output = runTodo(input.items as any[]);
              break;
            default:
              output = `未知工具: ${toolCall.toolName}`;
          }

          results.push({
            toolCallId: toolCall.toolCallId,
            result: output
          });

          // 更新进度行（就地）
          const elapsed = (Date.now() - start) / 1000;
          process.stdout.write(
            `\r  [${agentType}] ${description} ... ${toolCount} 工具, ${elapsed.toFixed(1)}s`
          );
        }

        // 添加助手消息和用户消息（工具结果）
        subMessages.push({
          role: 'assistant',
          content: [
            ...awaitedToolCalls.map(tc => ({
              type: 'tool-call' as const,
              toolName: tc.toolName,
              toolCallId: tc.toolCallId,
              args: tc.input || {}
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

        // 最终进度更新
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
   * 带子代理支持的主代理循环。
   *
   * 与 v1/v2 相同的模式，但现在包含 Task 工具。
   * 当模型调用 Task 时，它使用隔离上下文生成一个子代理。
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
    },
    maxOutputTokens: 8000,
  });

  // 获取工具调用和文本结果
  const { textStream, toolCalls } = result;
  const awaitedToolCalls = await toolCalls;

  // 处理文本流
  let fullText = '';
  for await (const textPart of textStream) {
    fullText += textPart;
    process.stdout.write(textPart);
  }
  console.log('\n'); // 文本输出后添加换行符

  // 如果有工具调用，则处理它们
  if (awaitedToolCalls.length > 0) {
    const results: any[] = [];

    for (const toolCall of awaitedToolCalls) {
       // Task 工具有特殊的显示处理
      if (toolCall.toolName === "Task") {
        const input: any = toolCall.input || {};
        console.log(`\n> 任务: ${input.description || '子任务'}`);
        // 异步执行 Task 工具
        const taskResult = await runTask(
          input.description as string,
          input.prompt as string,
          input.agent_type as string
        );
        results.push({
          toolCallId: toolCall.toolCallId,
          result: taskResult
        });
      } else {
        console.log(`\n> ${toolCall.toolName}`);

        // 执行适当的工具
        let output = '';
        const input: any = toolCall.input || {};
        switch (toolCall.toolName) {
          case 'bash':
            output = runBash(input.command as string);
            break;
          case 'read_file':
            output = runRead(input.path as string, input.limit as number | undefined);
            break;
          case 'write_file':
            output = runWrite(input.path as string, input.content as string);
            break;
          case 'edit_file':
            output = runEdit(input.path as string, input.oldText as string, input.newText as string);
            break;
          case 'TodoWrite':
            output = runTodo(input.items as any[]);
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
        ...awaitedToolCalls.map(tc => ({
          type: 'tool-call' as const,
          toolName: tc.toolName,
          toolCallId: tc.toolCallId,
          args: tc.input || {}
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
  console.log(`Mini Claude Code v3 (TypeScript) (带子代理) - ${WORKDIR}`);
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
