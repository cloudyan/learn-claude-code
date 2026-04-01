#!/usr/bin/env tsx
/**
 * v1_basic_agent.ts - Mini Claude Code: Model as Agent (~200 lines) - 中文版
 *
 * 核心理念："模型即代理"
 * =========================================
 * Claude Code、Cursor Agent、Codex CLI 的秘密？没有秘密。
 *
 * 剥去 CLI 修饰、进度条、权限系统。剩下的令人惊讶地简单：
 * 让模型调用工具直到完成的循环。
 *
 * 传统助手:
 *     用户 -> 模型 -> 文本响应
 *
 * 代理系统:
 *     用户 -> 模型 -> [工具 -> 结果]* -> 响应
 *                           ^________|
 *
 * 星号 (*) 很重要！模型重复调用工具直到它决定
 * 任务完成。这将聊天机器人转变为自主代理。
 *
 * 关键见解：模型是决策者。代码只是提供工具并
 * 运行循环。模型决定：
 *   - 调用哪些工具
 *   - 以什么顺序
 *   - 何时停止
 *
 * 四个基本工具：
 * ------------------------
 * Claude Code 有 ~20 个工具。但这四个覆盖 90% 的用例：
 *
 *     | 工具       | 目的              | 示例                    |
 *     |------------|------------------|-------------------------|
 *     | bash       | 运行任何命令      | npm install, git status |
 *     | read_file  | 读取文件内容     | 查看 src/index.ts       |
 *     | write_file | 创建/覆盖       | 创建 README.md          |
 *     | edit_file  | 精确更改         | 替换一个函数            |
 *
 * 仅用这四个工具，模型可以：
 *   - 探索代码库 (bash: find, grep, ls)
 *   - 理解代码 (read_file)
 *   - 做更改 (write_file, edit_file)
 *   - 运行任何东西 (bash: python, npm, make)
 *
 * 用法:
 *     tsx src/v1_basic_agent.ts
 */

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import 'dotenv/config';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 初始化客户端 - 处理直接 OpenAI 和兼容的 API
const client = createOpenAICompatible({
  name: 'iflow',
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || process.env.API_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.MODEL_NAME || 'gpt-4-turbo';
const WORKDIR = process.cwd();

// =============================================================================
// 系统提示 - 唯一的"配置"模型需要
// =============================================================================

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。

循环：简要思考 -> 使用工具 -> 报告结果。

规则：
- 优先使用工具而不是文字。行动，不要只是解释。
- 永远不要虚构文件路径。如果不确定，先使用 bash ls/find。
- 做最小更改。不要过度工程化。
- 完成后，总结更改了什么。

注意：
- 会话和思考步骤都使用中文`;

// =============================================================================
// 工具定义 - 4 个工具覆盖 90% 的编码任务
// =============================================================================

// 工具 1: Bash - 万物之门
// 可以运行任何命令：git、npm、python、curl 等
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
      const { stdout, stderr } = await execAsync(command, {
        cwd: WORKDIR,
        timeout: 60000, // 60 秒
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        encoding: 'utf8'
      });

      const output = stdout + stderr;
      return output.length > 0 ? output.substring(0, 50000) : "(无输出)";
    } catch (e: any) {
      if (e.signal === 'SIGTERM' || e.killed) {
        return "错误：命令超时 (60s)";
      }
      return `错误：${e.message || e}`;
    }
  }
});

// 工具 2: 读取文件 - 用于理解现有代码
// 返回文件内容，大文件可选行限制
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

// 工具 3: 写入文件 - 用于创建新文件或完全重写
// 自动创建父目录
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

// 工具 4: 编辑文件 - 用于对现有代码进行精确更改
// 使用精确字符串匹配进行精确编辑
const editFileTool = tool({
  description: "替换文件中的确切文本。用于精确编辑。",
  inputSchema: z.object({
    path: z.string().min(1).describe('文件的相对路径'),
    old_text: z.string().min(1).describe('要查找的确切文本（必须完全匹配）'),
    new_text: z.string().describe('替换文本')
  }),
  execute: async ({ path: filePath, old_text, new_text }) => {
    try {
      const resolvedPath = safePath(filePath);
      const content = fs.readFileSync(resolvedPath, 'utf-8');

      if (!content.includes(old_text)) {
        return `错误：在 ${filePath} 中找不到文本`;
      }

      // 仅替换第一个出现的，确保安全
      const newContent = content.replace(old_text, new_text);
      fs.writeFileSync(resolvedPath, newContent);
      return `编辑了 ${filePath}`;
    } catch (e: any) {
      return `错误：${e.message || e}`;
    }
  }
});

// =============================================================================
// 工具实现
// =============================================================================

function safePath(p: string): string {
  /**
   * 确保路径在工作区内部（安全措施）。
   *
   * 防止模型访问项目目录外的文件。
   * 解析相对路径并检查它们不会通过 '../' 逃逸。
   */
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) {
    throw new Error(`路径逃逸工作区: ${p}`);
  }
  return resolved;
}

// =============================================================================
// 代理循环 - 这是 EVERYTHING 的核心
// =============================================================================

async function agentLoop(messages: any[]): Promise<any[]> {
  /**
   * 一个函数中的完整代理。
   *
   * 这是 ALL 编码代理共享的模式：
   *
   *     while True:
   *         response = model(messages, tools)
   *         if no tool calls: return
   *         execute tools, append results, continue
   *
   * 模型控制循环：
   *   - 持续调用工具直到 stop_reason != "tool_use"
   *   - 结果成为上下文（作为"用户"消息反馈）
   *   - 记忆是自动的（消息列表在回合间累积历史）
   *
   * 为什么这有效：
   *   1. 模型决定哪些工具、以什么顺序、何时停止
   *   2. 工具结果为下一次决策提供反馈
   *   3. 对话历史在回合间维持上下文
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
    },
    maxOutputTokens: 8000,
    stopWhen: stepCountIs(10)
  });

  let fullText = '';
  for await (const textPart of result.textStream) {
    fullText += textPart;
    process.stdout.write(textPart);
  }
  console.log('\n'); // 添加换行符 after text output

  // 获取完整的响应并更新历史记录
  const response = await result.response;
  messages.push(...response.messages);

  // 检查是否有工具错误
  const steps = await result.steps;
  const toolErrors = steps.flatMap(step =>
    step.content.filter(part => part.type === 'tool-error')
  );

  if (toolErrors.length > 0) {
    console.log('\n\x1b[31m检测到工具执行错误:\x1b[0m');
    toolErrors.forEach(error => {
      console.log(`- 工具: ${error.toolName}, 错误: ${error.error}`);
    });
  }

  // 检查是否还有工具调用需要继续循环
  const hasToolCalls = steps.some(step =>
    step.content.some(part => part.type === 'tool-call')
  );

  if (hasToolCalls) {
    // 继续循环，因为有工具调用
    return agentLoop(messages);
  }

  return messages;
}

// =============================================================================
// 主 REPL
// =============================================================================

async function main() {
  /**
   * 用于交互使用的简单读取-求值-打印循环。
   *
   * 历史列表在回合间维持对话上下文，
   * 允许多回合对话并记忆。
   */
  console.log(`Mini Claude Code v1 (TypeScript) - ${WORKDIR}`);
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

    // 将用户消息添加到历史记录
    history.push({ role: "user", content: userInput });

    try {
      // 运行代理循环
      await agentLoop(history);
    } catch (e: any) {
      console.log(`错误：${e.message || e}`);
    }

    console.log(); // 回合间的空行
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { agentLoop, SYSTEM };
