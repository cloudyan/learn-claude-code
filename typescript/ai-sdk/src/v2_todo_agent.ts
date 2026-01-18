#!/usr/bin/env tsx
/**
 * v2_todo_agent.ts - Mini Claude Code: 结构化规划 (~300 行)
 *
 * 核心理念："让计划可见"
 * =====================================
 * v1 对于简单任务效果很好。但如果你让它 "重构认证模块，添加测试，更新文档"，
 * 观察会发生什么。没有显式规划，模型会：
 *   - 在任务间随机跳转
 *   - 忘记已完成的步骤
 *   - 在中途失去焦点
 *
 * 问题 - "上下文淡出":
 * ----------------------------
 * 在 v1 中，计划只存在于模型的"头脑"中：
 *
 *     v1: "我先做 A，然后 B，然后 C"  (不可见)
 *         经过 10 次工具调用后："等等，我在做什么？"
 *
 * 解决方案 - TodoWrite 工具:
 * -----------------------------
 * v2 添加了一个根本性改变代理工作方式的新工具：
 *
 *     v2:
 *       [ ] 重构认证模块
 *       [>] 添加单元测试         <- 当前正在处理此任务
 *       [ ] 更新文档
 *
 * 现在你和模型都能看到计划。模型可以：
 *   - 在工作时更新状态
 *   - 看到已完成和待完成的任务
 *   - 一次专注于一个任务
 *
 * 关键约束（不是任意的 - 这些是防护栏）:
 * ------------------------------------------------------
 *     | 规则              | 原因                              |
 *     |-------------------|----------------------------------|
 *     | 最多 20 项        | 防止无限任务列表                 |
 *     | 只能有一个进行中  | 强制专注一件事情                 |
 *     | 必填字段          | 确保结构化输出                   |
 *
 * 深层洞察:
 * ----------------
 * > "结构既约束又赋能。"
 *
 * Todo 约束（最多项目数，一个进行中）赋能（可见计划，进度跟踪）。
 *
 * 这种模式在代理设计中无处不在：
 *   - max_tokens 约束 -> 赋能可管理的响应
 *   - 工具模式约束 -> 赋能结构化调用
 *   - Todo 约束 -> 赋能复杂任务完成
 *
 * 好的约束不是限制，而是脚手架。
 *
 * 用法:
 *     tsx v2_todo_agent.ts
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
// TodoManager - The core addition in v2
// =============================================================================

interface TodoItem {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

class TodoManager {
  /**
   * 管理具有强制约束的结构化任务列表。
   *
   * 关键设计决策:
   * --------------------
   * 1. 最多 20 项: 防止模型创建无限列表
   * 2. 只能有一个进行中: 强制专注 - 一次只能处理一件事情
   * 3. 必填字段: 每个项目都需要 content、status 和 activeForm
   *
   * activeForm 字段需要特别说明:
   * - 它是正在发生事情的现在时态形式
   * - 当状态为 "in_progress" 时显示
   * - 示例: content="添加测试", activeForm="正在添加单元测试..."
   *
   * 这提供了对代理当前正在做什么的实时可见性。
   */
  private items: TodoItem[] = [];

  update(items: TodoItem[]): string {
    /**
     * 验证并更新待办事项列表。
     *
     * 模型每次都会发送一个完整的列表。我们验证它，
     * 存储它，并返回模型将看到的渲染视图。
     *
     * 验证规则:
     * - 每个项目必须包含: content、status、activeForm
     * - 状态必须是: pending | in_progress | completed
     * - 同一时间只能有一个项目处于 in_progress 状态
     * - 最多允许 20 个项目
     *
     * 返回值:
     *     待办事项列表的渲染文本视图
     */
    const validated: TodoItem[] = [];
    let inProgressCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Extract and validate fields
      const content = (item?.content || "").toString().trim();
      const status = (item?.status || "pending").toLowerCase() as 'pending' | 'in_progress' | 'completed';
      const activeForm = (item?.activeForm || "").toString().trim();

      // Validation checks
      if (!content) {
        throw new Error(`Item ${i}: content required`);
      }
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        throw new Error(`Item ${i}: invalid status '${status}'`);
      }
      if (!activeForm) {
        throw new Error(`Item ${i}: activeForm required`);
      }

      if (status === "in_progress") {
        inProgressCount += 1;
      }

      validated.push({
        content,
        status,
        activeForm
      });
    }

    // Enforce constraints
    if (validated.length > 20) {
      throw new Error("Max 20 todos allowed");
    }
    if (inProgressCount > 1) {
      throw new Error("Only one task can be in_progress at a time");
    }

    this.items = validated;
    return this.render();
  }

  render(): string {
    /**
     * 将待办事项列表渲染为人类可读的文本。
     *
     * 格式:
     *     [x] 已完成的任务
     *     [>] 进行中的任务 <- 正在做某事...
     *     [ ] 待处理的任务
     *
     *     (2/3 已完成)
     *
     * 这个渲染文本是模型作为工具结果看到的内容。
     * 它可以根据当前状态更新列表。
     */
    if (this.items.length === 0) {
      return "No todos.";
    }

    const lines: string[] = [];
    for (const item of this.items) {
      if (item.status === "completed") {
        lines.push(`[x] ${item.content}`);
      } else if (item.status === "in_progress") {
        lines.push(`[>] ${item.content} <- ${item.activeForm}`);
      } else {
        lines.push(`[ ] ${item.content}`);
      }
    }

    const completed = this.items.filter(t => t.status === "completed").length;
    lines.push(`\n(${completed}/${this.items.length} completed)`);

    return lines.join('\n');
  }
}

// Global todo manager instance
const TODO = new TodoManager();

// =============================================================================
// System Prompt - Updated for v2
// =============================================================================

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。

循环：规划 -> 使用工具行动 -> 更新待办事项 -> 报告结果。

规则：
- 使用 TodoWrite 工具跟踪多步骤任务
- 开始前标记任务为 in_progress，完成后标记为 completed
- 优先使用工具而不是文字。行动，不要只是解释。
- 完成后，总结更改了什么。

注意：
- 会话和思考步骤都使用中文`;

// =============================================================================
// System Reminders - Soft prompts to encourage todo usage
// =============================================================================

// Shown at the start of conversation
const INITIAL_REMINDER = "<reminder>Use TodoWrite for multi-step tasks.</reminder>";

// Shown if model hasn't updated todos in a while
const NAG_REMINDER = "<reminder>10+ turns without todo update. Please update todos.</reminder>";

// =============================================================================
// Tool Definitions (v1 tools + TodoWrite)
// =============================================================================

// Tool 1: Bash - The gateway to everything
const bashTool = tool({
  description: "运行 shell 命令。用于：ls、find、grep、git、npm、python 等。",
  inputSchema: z.object({
    command: z.string().min(1).describe('要执行的 shell 命令')
  }),
});

// Tool 2: Read File
const readFileTool = tool({
  description: "读取文件内容。返回 UTF-8 文本。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    limit: z.number().optional().describe('最大读取行数（默认：全部）')
  }),
});

// Tool 3: Write File
const writeFileTool = tool({
  description: "将内容写入文件。需要时创建父目录。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    content: z.string().describe('要写入的内容')
  }),
});

// Tool 4: Edit File
const editFileTool = tool({
  description: "替换文件中的确切文本。用于精确编辑。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    old_text: z.string().min(1).describe('要查找的确切文本（必须完全匹配）'),
    new_text: z.string().describe('替换文本')
  }),
});

// NEW in v2: TodoWrite
const todoWriteTool = tool({
  description: "更新任务列表。用于规划和跟踪进度。",
  inputSchema: z.object({
    items: z.array(
      z.object({
        content: z.string().min(1).describe('任务描述'),
        status: z.enum(['pending', 'in_progress', 'completed']).describe('任务状态'),
        activeForm: z.string().min(1).describe('现在时态的动作，例如 "Reading files"')
      })
    ).describe('完整的任务列表（替换现有列表）')
  }),
});

// =============================================================================
// Tool Implementations (v1 + TodoWrite)
// =============================================================================

function safePath(p: string): string {
  /** 确保路径保持在工作区内。 */
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) {
    throw new Error(`Path escapes workspace: ${p}`);
  }
  return resolved;
}

function runBash(cmd: string): string {
  /** 执行 shell 命令并进行安全检查。 */
  const dangerous = ["rm -rf /", "sudo", "shutdown", "reboot"];
  if (dangerous.some(d => cmd.includes(d))) {
    return "Error: Dangerous command blocked";
  }
  try {
    const result = execSync(cmd, {
      cwd: WORKDIR,
      timeout: 60000, // 60 seconds
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const output = result;
    return (output && output.trim().length > 0) ? output.substring(0, 50000) : "(no output)";
  } catch (e: any) {
    if (e.signal === 'SIGTERM' || e.killed) {
      return "Error: Timeout";
    }
    return `Error: ${e.message || e}`;
  }
}

function runRead(filePath: string, limit?: number): string {
  /** 读取文件内容。 */
  try {
    const resolvedPath = safePath(filePath);
    const text = fs.readFileSync(resolvedPath, 'utf-8');
    let lines = text.split('\n');

    if (limit != null && limit < lines.length) {
      lines = lines.slice(0, limit);
      lines.push(`... (${text.split('\n').length - limit} more)`);
    }
    return lines.join('\n').substring(0, 50000);
  } catch (e: any) {
    return `Error: ${e.message || e}`;
  }
}

function runWrite(filePath: string, content: string): string {
  /** 将内容写入文件。 */
  try {
    const resolvedPath = safePath(filePath);
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolvedPath, content);
    return `Wrote ${content.length} bytes to ${filePath}`;
  } catch (e: any) {
    return `Error: ${e.message || e}`;
  }
}

function runEdit(filePath: string, oldText: string, newText: string): string {
  /** 替换文件中的确切文本。 */
  try {
    const resolvedPath = safePath(filePath);
    const text = fs.readFileSync(resolvedPath, 'utf-8');
    if (!text.includes(oldText)) {
      return `Error: Text not found in ${filePath}`;
    }
    fs.writeFileSync(resolvedPath, text.replace(oldText, newText, 1));
    return `Edited ${filePath}`;
  } catch (e: any) {
    return `Error: ${e.message || e}`;
  }
}

function runTodo(items: TodoItem[]): string {
  /**
   * 更新待办事项列表。
   *
   * 模型发送一个完整的列表（不是差异）。
   * 我们验证它并返回渲染视图。
   */
  try {
    return TODO.update(items);
  } catch (e: any) {
    return `Error: ${e.message || e}`;
  }
}

// =============================================================================
// Agent Loop (with todo tracking)
// =============================================================================

// Track how many rounds since last todo update
let roundsWithoutTodo = 0;

async function agentLoop(messages: any[]): Promise<any[]> {
  /**
   * 带待办事项使用跟踪的代理循环。
   *
   * 与 v1 相同的核心循环，但现在我们跟踪模型
   * 是否在使用待办事项。如果长时间没有更新，
   * 我们将在 main() 函数中注入提醒。
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
    },
    maxOutputTokens: 8000,
  });

  // Get the tool calls and text result
  const { textStream, toolCalls } = result;

  // Process the text stream
  let fullText = '';
  for await (const textPart of textStream) {
    fullText += textPart;
    process.stdout.write(textPart);
  }
  console.log('\n'); // Add newline after text output

  // Process tool calls if any
  const resolvedToolCalls = await toolCalls;
  if (resolvedToolCalls.length > 0) {
    const results: any[] = [];
    let usedTodo = false;

    for (const toolCall of resolvedToolCalls) {
      console.log(`\n> ${toolCall.toolName}`);

       // Execute the appropriate tool
      let output = '';
      switch (toolCall.toolName) {
        case 'bash':
          const bashInput = toolCall.input as {command: string};
          output = runBash(bashInput.command);
          break;
        case 'read_file':
          const readInput = toolCall.input as {path: string, limit?: number};
          output = runRead(readInput.path, readInput.limit);
          break;
        case 'write_file':
          const writeInput = toolCall.input as {path: string, content: string};
          output = runWrite(writeInput.path, writeInput.content);
          break;
        case 'edit_file':
          const editInput = toolCall.input as {path: string, old_text: string, new_text: string};
          output = runEdit(editInput.path, editInput.old_text, editInput.new_text);
          break;
        case 'TodoWrite':
          const todoInput = toolCall.input as {items: TodoItem[]};
          output = runTodo(todoInput.items);
          usedTodo = true;
          break;
        default:
          output = `Unknown tool: ${toolCall.toolName}`;
      }

      const preview = output.length > 300 ? output.substring(0, 300) + "..." : output;
      console.log(`  ${preview}`);

      results.push({
        toolCallId: toolCall.toolCallId,
        result: output
      });
    }

    // Update counter: reset if used todo, increment otherwise
    if (usedTodo) {
      roundsWithoutTodo = 0;
    } else {
      roundsWithoutTodo += 1;
    }

    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: [
        { type: 'text', text: fullText },
        ...resolvedToolCalls.map(tc => ({
          type: 'tool-call' as const,
          toolName: tc.toolName,
          input: tc.input as Record<string, unknown>,
          toolCallId: tc.toolCallId
        }))
      ]
    });

    // Add user message with tool results
    messages.push({
      role: 'user',
      content: results.map(r => ({
        type: 'tool-result' as const,
        toolCallId: r.toolCallId,
        result: r.result
      }))
    });

    // Continue the loop as there were tool calls
    return agentLoop(messages);
  } else {
    // No more tool calls, return the final messages
    messages.push({
      role: 'assistant',
      content: [{ type: 'text', text: fullText }]
    });
    return messages;
  }
}

// =============================================================================
// Main REPL
// =============================================================================

async function main() {
  /**
   * 带提醒注入的 REPL。
   *
   * v2 的关键添加: 我们注入"提醒"消息来鼓励
   * 使用待办事项，而不强制它。这是一种软约束。
   *
   * 提醒作为用户消息的一部分注入，而不是
   * 单独的系统提示。模型能看到它们但不会
   * 直接响应它们。
   */
  console.log(`Mini Claude Code v2 (with Todos) - ${WORKDIR}`);
  console.log("Type 'exit' to quit.\n");

  const history: any[] = [];
  let firstMessage = true;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  for await (const line of rl) {
    const userInput = line.trim();

    if (!userInput || ["exit", "quit", "q"].includes(userInput.toLowerCase())) {
      break;
    }

    // Build user message content
    // May include reminders as context hints
    const contentItems: any[] = [];

    if (firstMessage) {
      // Gentle reminder at start
      contentItems.push({ type: "text", text: INITIAL_REMINDER });
      firstMessage = false;
    } else if (roundsWithoutTodo > 10) {
      // Nag if model hasn't used todos in a while
      contentItems.push({ type: "text", text: NAG_REMINDER });
    }

    contentItems.push({ type: "text", text: userInput });
    history.push({ role: "user", content: contentItems });

    try {
      await agentLoop(history);
    } catch (e: any) {
      console.log(`Error: ${e.message || e}`);
    }

    console.log(); // Blank line between turns
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { agentLoop, SYSTEM };
