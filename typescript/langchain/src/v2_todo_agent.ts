#!/usr/bin/env tsx
/**
 * v2_todo_agent.ts - Mini Claude Code: 结构化规划
 * 
 * 核心理念："让计划可见"
 * =====================================
 * v2 添加了一个根本性改变代理工作方式的新工具：TodoWrite。
 * 现在你和模型都能看到计划。
 */

import { model } from "./client";
import { HumanMessage, ToolMessage, SystemMessage, BaseMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as sp from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const WORKDIR = process.cwd();
// =============================================================================
// TodoManager - 任务管理器
// =============================================================================

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

class TodoManager {
  private items: TodoItem[] = [];

  update(items: TodoItem[]): string {
    let inProgressCount = 0;
    for (const item of items) {
      if (item.status === "in_progress") inProgressCount++;
    }
    if (items.length > 20) throw new Error("最多允许 20 个待办事项");
    if (inProgressCount > 1) throw new Error("同一时间只能有一个任务处于 'in_progress' 状态");

    this.items = items;
    return this.render();
  }

  render(): string {
    if (this.items.length === 0) return "无待办事项。";
    const lines = this.items.map(item => {
      const icon = item.status === "completed" ? "[x]" : item.status === "in_progress" ? "[>]" : "[ ]";
      const suffix = item.status === "in_progress" ? ` <- ${item.activeForm}` : "";
      return `${icon} ${item.content}${suffix}`;
    });
    const completed = this.items.filter(t => t.status === "completed").length;
    lines.push(`\n(${completed}/${this.items.length} 已完成)`);
    return lines.join("\n");
  }
}

const TODO = new TodoManager();

// =============================================================================
// Tools - 工具集
// =============================================================================

function safePath(p: string): string {
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) throw new Error(`路径逃逸工作区: ${p}`);
  return resolved;
}

const bashTool = tool(
  async ({ command }) => {
    const dangerous = ["rm -rf /", "sudo", "shutdown", "reboot"];
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
    description: "运行 shell 命令。",
    schema: z.object({ command: z.string() }),
  }
);

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
    description: "读取文件内容。",
    schema: z.object({ path: z.string(), limit: z.number().nullable() }),
  }
);

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
    description: "将内容写入文件。",
    schema: z.object({ path: z.string(), content: z.string() }),
  }
);

const editFileTool = tool(
  async ({ path: filePath, old_text, new_text }) => {
    console.log(`\n> edit_file: ${filePath}`);
    try {
      const fullPath = safePath(filePath);
      const content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes(old_text)) return `错误：文本未找到`;
      const newContent = content.replace(old_text, new_text);
      fs.writeFileSync(fullPath, newContent);
      return `已编辑 ${filePath}`;
    } catch (e: any) {
      return `错误：${e.message}`;
    }
  },
  {
    name: "edit_file",
    description: "替换文件中的确切文本。",
    schema: z.object({ path: z.string(), old_text: z.string(), new_text: z.string() }),
  }
);

const todoWriteTool = tool(
  async ({ items }) => {
    console.log(`\n> TodoWrite`);
    try {
      return TODO.update(items as TodoItem[]);
    } catch (e: any) {
      return `错误：${e.message}`;
    }
  },
  {
    name: "TodoWrite",
    description: "更新任务列表。用于规划和跟踪进度。",
    schema: z.object({
      items: z.array(z.object({
        content: z.string().describe("任务描述"),
        status: z.enum(["pending", "in_progress", "completed"]).describe("任务状态"),
        activeForm: z.string().describe("现在时态的动作，例如 '正在读取文件...'")
      }))
    }),
  }
);

const tools = [bashTool, readFileTool, writeFileTool, editFileTool, todoWriteTool];
const modelWithTools = model.bindTools(tools);

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。
循环：规划 -> 使用工具行动 -> 更新待办事项 -> 报告。
规则：
- 使用 TodoWrite 跟踪多步骤任务
- 开始前标记任务为 in_progress，完成后标记为 completed
- 优先使用工具而不是文字。行动，不要只是解释。
- 完成后，总结更改了什么。
- 使用中文进行会话和思考。`;

const INITIAL_REMINDER = "<reminder>请使用 TodoWrite 来规划多步骤任务。</reminder>";
const NAG_REMINDER = "<reminder>您已经很多轮没有更新待办事项了。请更新待办事项以保持进度透明。</reminder>";

let roundsWithoutTodo = 0;

async function agentLoop(history: BaseMessage[]) {
  try {
    while (true) {
      const res = await modelWithTools.invoke([new SystemMessage(SYSTEM), ...history]);
      if (res.content) {
        process.stdout.write(res.content as string);
      }
      history.push(res);

      if (!res.tool_calls?.length) return;

      let usedTodo = false;
      for (const tc of res.tool_calls) {
        const selectedTool = tools.find(t => t.name === tc.name);
        if (selectedTool) {
          if (tc.name === "TodoWrite") usedTodo = true;
          const output = await selectedTool.invoke(tc.args);
          const preview = output.length > 100 ? output.substring(0, 100) + "..." : output;
          console.log(`\n  结果预览: ${preview}`);
          history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
        }
      }
      roundsWithoutTodo = usedTodo ? 0 : roundsWithoutTodo + 1;
    }
  } catch (e: any) {
    console.error(`\n错误：API 调用失败。请检查您的 API Key 和配置。\n详情：${e.message || e}`);
  }
}

async function main() {
  console.log(`Mini Claude Code v2 (LangChain TS) - ${WORKDIR}`);
  console.log("输入 'exit' 退出。\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const history: BaseMessage[] = [];
  let firstMessage = true;

  const ask = () => rl.question("You: ", async (q) => {
    if (["exit", "quit", "q"].includes(q.toLowerCase()) || !q) return rl.close();
    
    let content = q;
    if (firstMessage) {
      content = `${INITIAL_REMINDER}\n${q}`;
      firstMessage = false;
    } else if (roundsWithoutTodo > 10) {
      content = `${NAG_REMINDER}\n${q}`;
    }

    history.push(new HumanMessage(content));
    await agentLoop(history);
    console.log("\n");
    ask();
  });
  ask();
}

if (require.main === module) main().catch(console.error);
