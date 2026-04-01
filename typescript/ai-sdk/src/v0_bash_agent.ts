#!/usr/bin/env tsx
/**
 * v0_bash_agent.ts - Mini Claude Code: Bash is All You Need (~50 lines core)
 *
 * 核心理念："Bash 就是一切"
 * ======================================
 * 这是编码代理的终极简化。在构建了 v1-v3 之后，
 * 我们问：代理的本质是什么？
 *
 * 答案：一个工具（bash）+ 一个循环 = 完整的代理能力。
 *
 * 为什么 Bash 就足够了：
 * ------------------
 * Unix 哲学说一切都是文件，一切都可管道化。
 * Bash 是通往这个世界网关：
 *
 *     | 你需要      | Bash 命令                             |
 *     |-------------|--------------------------------------|
 *     | 读取文件     | cat, head, tail, grep                |
 *     | 写入文件     | echo '...' > file, cat << 'EOF' > file |
 *     | 搜索        | find, grep, rg, ls                   |
 *     | 执行        | python, npm, make, any command       |
 *     | **子代理**   | tsx v0_bash_agent.ts "task"          |
 *
 * 最后一行是关键见解：通过 bash 调用自身实现子代理！
 * 没有 Task 工具，没有代理注册表 - 只是通过进程生成进行递归。
 *
 * 子代理如何工作：
 * ------------------
 *     主代理
 *       |-- bash: tsx v0_bash_agent.ts "分析架构"
 *            |-- 子代理（隔离进程，新的历史记录）
 *                 |-- bash: find . -name "*.ts"
 *                 |-- bash: cat src/main.ts
 *                 |-- 通过 stdout 返回摘要
 *
 * 进程隔离 = 上下文隔离：
 * - 子进程有自己 history=[]
 * - 父进程将 stdout 捕获为工具结果
 * - 递归调用实现无限嵌套
 *
 * 用法：
 *     # 交互模式
 *     tsx v0_bash_agent.ts
 *
 *     # 子代理模式（由父代理调用或直接调用）
 *     tsx v0_bash_agent.ts "explore src/ and summarize"
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';

const execAsync = promisify(exec);

const openai = createOpenAICompatible({
  name: 'iflow',
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || process.env.API_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.MODEL_NAME || 'gpt-4-turbo';

// 危险命令检查列表
const DANGEROUS_PATTERNS = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf *',
  'sudo rm',
  'shutdown',
  'reboot',
  'halt',
  'poweroff',
  ':(){ :|:& };:',
  'mv / /dev/null',
  'dd if=/dev/zero',
  'mkfs',
  'fdisk',
  'parted',
  'wipefs',
  'cryptsetup',
  '> /dev/sda',
  'cat /dev/urandom'
];

const bashTool = tool({
  description: `执行 Shell 命令。常见模式：
- 读取：cat/head/tail, grep/find/rg/ls, wc -l
- 写入：echo 'content' > file, sed -i 's/old/new/g' file
- 子代理：tsx v0_bash_agent.ts 'task description' (生成隔离代理，返回摘要)`,
  inputSchema: z.object({
    command: z.string().min(1).describe('要执行的 Shell 命令')
  }),
  execute: async ({ command }) => {
    console.log(`\x1b[33m$ ${command}\x1b[0m`);

    // 安全检查：阻止危险命令
    const lowerCommand = command.toLowerCase();
    for (const dangerousPattern of DANGEROUS_PATTERNS) {
      if (lowerCommand.includes(dangerousPattern)) {
        const errorMsg = `错误：检测到危险命令 '${dangerousPattern}'，已阻止执行以确保安全`;
        console.log(`\x1b[31m${errorMsg}\x1b[0m`);
        return errorMsg;
      }
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 300000, // 5分钟超时
        maxBuffer: 100 * 1024 * 1024, // 100MB buffer
        encoding: 'utf8'
      });

      const output = stdout + stderr;
      if (output.trim()) {
        console.log(output);
      } else {
        console.log("(空)");
      }

      return output.substring(0, 50000);
    } catch (error: any) {
      let errorMsg = "(命令失败)";
      if (error.signal === 'SIGTERM' || error.killed) {
        errorMsg = "错误：命令超时（超过5分钟）";
      } else if (error.code === 'ENOENT') {
        errorMsg = `错误：命令未找到 - ${error.message}`;
      } else if (error.code === 'EACCES') {
        errorMsg = `错误：权限不足 - ${error.message}`;
      } else if (error.stderr) {
        errorMsg = error.stderr;
      } else if (error.message) {
        errorMsg = `错误：${error.message}`;
      }

      console.log(`\x1b[31m${errorMsg}\x1b[0m`);
      return errorMsg;
    }
  }
});

const SYSTEM = `您是在 ${process.cwd()} 的 CLI 代理。使用 bash 命令解决问题。

规则：
- 优先使用工具而不是文字。先行动，后简要说明。
- 读取文件：cat, grep, find, rg, ls, head, tail
- 写入文件：echo '...' > file, sed -i, or cat << 'EOF' > file
- 子代理：对于复杂子任务，生成子代理以保持上下文清洁：
  tsx v0_bash_agent.ts "探索 src/ 并总结架构"

何时使用子代理：
- 任务需要读取多个文件（隔离探索）
- 任务独立且自包含
- 您想避免用中间细节污染当前对话

子代理在隔离中运行，只返回最终摘要。

注意：
- 会话和思考步骤都使用中文`;

async function chat(prompt: string, history: any[] = []): Promise<string> {
  /**
   * The complete agent loop in ONE function.
   *
   * This is the core pattern that ALL coding agents share:
   *     while not done:
   *         response = model(messages, tools)
   *         if no tool calls: return
   *         execute tools, append results
   *
   * Args:
   *     prompt: User's request
   *     history: Conversation history (mutable, shared across calls in interactive mode)
   *
   * Returns:
   *     Final text response from the model
   */

  history.push({ role: "user", content: prompt });

  const result = await streamText({
    model: openai(MODEL),
    system: SYSTEM,
    messages: history,
    tools: {
      bash: bashTool
    },
    maxOutputTokens: 8000,
    stopWhen: stepCountIs(10)
  });

  let fullText = '';
  const textStream = result.textStream;
  for await (const textPart of textStream) {
    fullText += textPart;
    process.stdout.write(textPart);
  }

  // 获取完整的响应并更新历史记录
  const response = await result.response;
  history.push(...response.messages);

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

  return fullText;
}

// Create readline interface for interactive mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  if (process.argv.length > 2) {
    // Subagent mode: execute task and print result
    // This is how parent agents spawn children via bash
    const result = await chat(process.argv.slice(2).join(' '));
    console.log(result);
  } else {
    // Interactive REPL mode
    const history: any[] = [];

    console.log("\x1b[36mMini Claude Code v0 (TypeScript) - Bash is All You Need\x1b[0m");
    console.log("Type 'exit' or 'q' to quit.\n");

    for await (const line of rl) {
      const query = line.trim();
      if (query === "q" || query === "exit" || query === "") {
        rl.close();
        break;
      }
      try {
        console.log(await chat(query, history));
        console.log(); // Add blank line between turns
      } catch (error) {
        console.error('\x1b[31mError:', error instanceof Error ? error.message : String(error), '\x1b[0m');
        console.log();
      }
    }
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { chat, SYSTEM, bashTool };
