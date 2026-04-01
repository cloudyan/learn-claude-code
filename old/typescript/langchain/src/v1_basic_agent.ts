#!/usr/bin/env tsx
/**
 * v1_basic_agent.ts - Mini Claude Code: 模型即代理 (~200 行)
 *
 * 核心理念："模型即代理"
 * =========================================
 * 让模型调用工具直到完成的循环。这将聊天机器人转变为自主代理。
 *
 * 关键见解：模型是决策者。代码只是提供工具并运行循环。
 */

import { model } from "./client";
import { HumanMessage, ToolMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as sp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const WORKDIR = process.cwd();
function safePath(p: string): string {
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) throw new Error(`路径逃逸工作区: ${p}`);
  return resolved;
}

// 工具 1: Bash - 执行 shell 命令
const bashTool = tool(
  async ({ command }) => {
    const dangerous = ["rm -rf /", "sudo", "shutdown", "reboot", "> /dev/"];
    if (dangerous.some(d => command.includes(d))) return "错误：危险命令被阻止";
    console.log(`\n> bash: ${command}`);
    try {
      const stdout = sp.execSync(command, { encoding: "utf8", timeout: 60000, cwd: WORKDIR });
      return (stdout || "(无输出)").substring(0, 50000);
    } catch (e: any) {
      return ((e.stdout || "") + (e.stderr || "") + (e.message || "")).substring(0, 50000);
    }
  },
  {
    name: "bash",
    description: "运行 shell 命令。用于：ls、find、grep、git、npm、python 等。",
    schema: z.object({ command: z.string().describe("要执行的 shell 命令") }),
  }
);

// 工具 2: 读取文件
const readFileTool = tool(
  async ({ path: filePath, limit }) => {
    console.log(`\n> read_file: ${filePath}`);
    try {
      const text = fs.readFileSync(safePath(filePath), "utf8");
      const lines = text.split("\n");
      if (limit && limit < lines.length) {
        return lines.slice(0, limit).join("\n") + `\n... (还有 ${lines.length - limit} 行)`;
      }
      return text.substring(0, 50000);
    } catch (e: any) {
      return `错误：${e.message}`;
    }
  },
  {
    name: "read_file",
    description: "读取文件内容。返回 UTF-8 文本。",
    schema: z.object({
      path: z.string().describe("文件的相对路径"),
      limit: z.number().nullable().describe("最大读取行数 (可选)"),
    }),
  }
);

// 工具 3: 写入文件
const writeFileTool = tool(
  async ({ path: filePath, content }) => {
    console.log(`\n> write_file: ${filePath}`);
    try {
      const fullPath = safePath(filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
      return `已写入 ${content.length} 字节到 ${filePath}`;
    } catch (e: any) {
      return `错误：${e.message}`;
    }
  },
  {
    name: "write_file",
    description: "将内容写入文件。需要时自动创建父目录。",
    schema: z.object({
      path: z.string().describe("文件的相对路径"),
      content: z.string().describe("要写入的内容"),
    }),
  }
);

// 工具 4: 编辑文件
const editFileTool = tool(
  async ({ path: filePath, old_text, new_text }) => {
    console.log(`\n> edit_file: ${filePath}`);
    try {
      const fullPath = safePath(filePath);
      const content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes(old_text)) return `错误：在 ${filePath} 中找不到指定的文本`;
      const newContent = content.replace(old_text, new_text);
      fs.writeFileSync(fullPath, newContent);
      return `已编辑 ${filePath}`;
    } catch (e: any) {
      return `错误：${e.message}`;
    }
  },
  {
    name: "edit_file",
    description: "替换文件中的确切文本。用于精确编辑。",
    schema: z.object({
      path: z.string().describe("文件的相对路径"),
      old_text: z.string().describe("要查找的确切文本"),
      new_text: z.string().describe("替换后的文本"),
    }),
  }
);

const tools = [bashTool, readFileTool, writeFileTool, editFileTool];
const modelWithTools = model.bindTools(tools);

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。
循环：简要思考 -> 使用工具 -> 报告结果。
规则：
- 优先使用工具而不是文字。行动，不要只是解释。
- 永远不要虚构文件路径。如果不确定，先使用 bash ls/find。
- 做最小更改。不要过度工程化。
- 完成后，总结更改了什么。
- 使用中文进行会话和思考。`;

async function agentLoop(history: BaseMessage[]) {
  try {
    while (true) {
      const res = await modelWithTools.invoke([new SystemMessage(SYSTEM), ...history]);
      if (res.content) {
        process.stdout.write(res.content as string);
      }
      history.push(res);

      if (!res.tool_calls?.length) return;

      for (const tc of res.tool_calls) {
        const selectedTool = tools.find(t => t.name === tc.name);
        if (selectedTool) {
          const output = await selectedTool.invoke(tc.args);
          const preview = output.length > 100 ? output.substring(0, 100) + "..." : output;
          console.log(`\n  结果预览: ${preview}`);
          history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
        }
      }
    }
  } catch (e: any) {
    console.error(`\n错误：API 调用失败。请检查您的 API Key 和配置。\n详情：${e.message || e}`);
  }
}

async function main() {
  console.log(`Mini Claude Code v1 (LangChain TS) - ${WORKDIR}`);
  console.log("输入 'exit' 退出。\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const history: BaseMessage[] = [];

  const ask = () => rl.question("You: ", async (q) => {
    if (["exit", "quit", "q"].includes(q.toLowerCase()) || !q) return rl.close();
    history.push(new HumanMessage(q));
    await agentLoop(history);
    console.log("\n");
    ask();
  });
  ask();
}

if (require.main === module) main().catch(console.error);
