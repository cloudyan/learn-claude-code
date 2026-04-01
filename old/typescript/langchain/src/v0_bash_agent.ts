#!/usr/bin/env tsx
/**
 * v0_bash_agent.ts - Mini Claude Code: Bash is All You Need (~100 lines)
 * 
 * 核心理念："Bash 是一切"
 * ======================================
 * 这是编码代理的终极简化。
 * 
 * 答案：一个工具 (bash) + 一个循环 = 完整的代理能力。
 */

import { HumanMessage, AIMessage, ToolMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as sp from "child_process";
import * as readline from "readline";
import { model } from "./client";

// 唯一的工具：执行 bash 命令
const bashTool = tool(
  async ({ command }) => {
    console.log(`\x1b[33m$ ${command}\x1b[0m`);
    try {
      // 执行命令，捕获输出
      const stdout = sp.execSync(command, { encoding: "utf8", timeout: 300000 });
      console.log(stdout || "(empty)");
      return stdout.substring(0, 50000); // 截断过长输出
    } catch (e: any) {
      // 出错时捕获 stdout 和 stderr
      const err = (e.stdout || "") + (e.stderr || "") + (e.message || "");
      console.log(err || "(empty)");
      return err.substring(0, 50000);
    }
  },
  {
    name: "bash",
    description: `执行 shell 命令。常见模式：
- 读取：cat/head/tail, grep/find/rg/ls, wc -l
- 写入：echo 'content' > file, sed -i 's/old/new/g' file
- 子代理：tsx src/v0_bash_agent.ts '任务描述' (启动独立代理，返回总结)`,
    schema: z.object({ command: z.string().describe("要执行的命令") }),
  }
);

const SYSTEM_PROMPT = `您是在 ${process.cwd()} 的 CLI 代理。使用 bash 命令解决问题。

规则：
- 优先使用工具而不是文字。先行动，后简要解释。
- 读取文件：cat, grep, find, rg, ls, head, tail
- 写入文件：echo '...' > file, sed -i, 或使用重定向
- 子代理：对于复杂的子任务，启动子代理以保持上下文整洁：
  tsx src/v0_bash_agent.ts "探索 src/ 并总结架构"

何时使用子代理：
- 任务需要读取许多文件（隔离探索过程）
- 任务是独立且自包含的
- 您希望避免当前对话被中间细节污染

子代理独立运行，只返回其最终总结。`;

/**
 * 核心代理循环
 */
async function chat(prompt: string, history: BaseMessage[] = []) {
  history.push(new HumanMessage(prompt));
  const modelWithTools = model.bindTools([bashTool]);

  while (true) {
    // 1. 调用模型
    const res = await modelWithTools.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      ...history
    ]);
    
    // 2. 将助手响应加入历史
    history.push(res);

    // 3. 如果模型没有调用工具，完成
    if (!res.tool_calls || res.tool_calls.length === 0) {
      return res.content;
    }

    // 4. 执行所有工具调用
    for (const tc of res.tool_calls) {
      if (tc.name === "bash") {
        const output = await bashTool.invoke(tc.args);
        history.push(new ToolMessage({
          tool_call_id: tc.id!,
          content: output,
        }));
      }
    }
    // 继续循环
  }
}

async function main() {
  if (process.argv.length > 2) {
    // 子代理模式
    const task = process.argv.slice(2).join(" ");
    const result = await chat(task);
    console.log(result);
  } else {
    // 交互模式
    console.log(`Mini Claude Code v0 (LangChain TS) - ${process.cwd()}`);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const history: BaseMessage[] = [];
    
    const ask = () => {
      rl.question("\x1b[36m>> \x1b[0m", async (q) => {
        if (q.toLowerCase() === "exit" || q.toLowerCase() === "q" || !q) {
          rl.close();
          return;
        }
        const response = await chat(q, history);
        console.log(response);
        ask();
      });
    };
    
    ask();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
