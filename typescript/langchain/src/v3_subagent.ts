#!/usr/bin/env tsx
/**
 * v3_subagent.ts - Mini Claude Code: 子代理机制
 * 
 * 核心理念："分而治之，上下文隔离"
 * =============================================================
 * 通过生成子任务，我们得到：
 *   - 为父代理提供干净的上下文
 *   - 自然的任务分解
 *   - 相同的代理循环，不同的上下文
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
// Agent Types - 代理类型
// =============================================================================

const AGENT_TYPES: Record<string, { description: string; tools: string[]; prompt: string }> = {
  explore: {
    description: "用于探索代码、查找文件、搜索的只读代理",
    tools: ["bash", "read_file"],
    prompt: "您是一个探索代理。搜索和分析，但绝不修改文件。返回一个简洁的摘要。",
  },
  code: {
    description: "用于实现功能和修复错误的全功能代理",
    tools: ["bash", "read_file", "write_file", "edit_file", "TodoWrite"],
    prompt: "您是一个编码代理。高效地实现请求的更改。",
  },
  plan: {
    description: "用于设计实现策略的规划代理",
    tools: ["bash", "read_file"],
    prompt: "您是一个规划代理。分析代码库并输出一个编号的实现计划。不要做更改。",
  },
};

function getAgentDescriptions(): string {
  return Object.entries(AGENT_TYPES)
    .map(([name, cfg]) => `- ${name}: ${cfg.description}`)
    .join("\n");
}

// =============================================================================
// TodoManager
// =============================================================================

interface TodoItem {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;
}

class TodoManager {
  private items: TodoItem[] = [];
  update(items: TodoItem[]): string {
    this.items = items;
    return this.render();
  }
  render(): string {
    if (this.items.length === 0) return "无待办事项。";
    const lines = this.items.map(item => {
      const icon = item.status === "completed" ? "[x]" : item.status === "in_progress" ? "[>]" : "[ ]";
      return `${icon} ${item.content}`;
    });
    const completed = this.items.filter(t => t.status === "completed").length;
    return lines.join("\n") + `\n(${completed}/${this.items.length} 已完成)
`;
  }
}
const TODO = new TodoManager();

// =============================================================================
// Tools
// =============================================================================

function safePath(p: string): string {
  const resolved = path.resolve(WORKDIR, p);
  if (!resolved.startsWith(WORKDIR)) throw new Error(`路径逃逸工作区: ${p}`);
  return resolved;
}

const bashTool = tool(
  async ({ command }) => {
    try {
      const stdout = sp.execSync(command, { encoding: "utf8", timeout: 60000, cwd: WORKDIR });
      return (stdout || "(无输出)").substring(0, 50000);
    } catch (e: any) {
      return ((e.stdout || "") + (e.stderr || "") + (e.message || "")).substring(0, 50000);
    }
  },
  { name: "bash", description: "运行 shell 命令。", schema: z.object({ command: z.string() }) }
);

const readFileTool = tool(
  async ({ path: filePath, limit }) => {
    try {
      const text = fs.readFileSync(safePath(filePath), "utf8");
      const lines = text.split("\n");
      if (limit && limit < lines.length) return lines.slice(0, limit).join("\n") + "\n...";
      return text.substring(0, 50000);
    } catch (e: any) { return `错误：${e.message}`; }
  },
  { name: "read_file", description: "读取文件内容。", schema: z.object({ path: z.string(), limit: z.number().nullable() }) }
);

const writeFileTool = tool(
  async ({ path: filePath, content }) => {
    try {
      const fullPath = safePath(filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content);
      return `已写入 ${content.length} 字节到 ${filePath}`;
    } catch (e: any) { return `错误：${e.message}`; }
  },
  { name: "write_file", description: "写入文件。", schema: z.object({ path: z.string(), content: z.string() }) }
);

const editFileTool = tool(
  async ({ path: filePath, old_text, new_text }) => {
    try {
      const fullPath = safePath(filePath);
      const content = fs.readFileSync(fullPath, "utf8");
      if (!content.includes(old_text)) return `错误：文本未找到`;
      fs.writeFileSync(fullPath, content.replace(old_text, new_text));
      return `已编辑 ${filePath}`;
    } catch (e: any) { return `错误：${e.message}`; }
  },
  { name: "edit_file", description: "替换文件中的文本。", schema: z.object({ path: z.string(), old_text: z.string(), new_text: z.string() }) }
);

const todoWriteTool = tool(
  async ({ items }) => { return TODO.update(items as TodoItem[]); },
  {
    name: "TodoWrite",
    description: "更新任务列表。",
    schema: z.object({
      items: z.array(z.object({
        content: z.string(),
        status: z.enum(["pending", "in_progress", "completed"]),
        activeForm: z.string()
      }))
    })
  }
);

const baseTools = [bashTool, readFileTool, writeFileTool, editFileTool, todoWriteTool];

async function runTask(description: string, prompt: string, agent_type: string): Promise<string> {
  const config = AGENT_TYPES[agent_type];
  if (!config) return `错误：未知代理类型 ${agent_type}`;
  
  console.log(`  [${agent_type}] ${description}`);
  const subTools = baseTools.filter(t => config.tools.includes(t.name));
  const subModel = model.bindTools(subTools);
  const history: BaseMessage[] = [new HumanMessage(prompt)];
  const system = `您是在 ${WORKDIR} 的 ${agent_type} 子代理。\n\n${config.prompt}\n\n完成任务并返回一个清晰、简洁的摘要。`;

  let toolCount = 0;
  const start = Date.now();

  while (true) {
    const res = await subModel.invoke([new SystemMessage(system), ...history]);
    history.push(res);
    if (!res.tool_calls?.length) {
      console.log(`\n  [${agent_type}] ${description} - 完成 (${toolCount} 个工具, ${((Date.now() - start)/1000).toFixed(1)}s)`);
      return res.content as string;
    }

    for (const tc of res.tool_calls) {
      toolCount++;
      const selectedTool = subTools.find(t => t.name === tc.name);
      if (selectedTool) {
        const output = await selectedTool.invoke(tc.args);
        history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
      }
      process.stdout.write(`\r  [${agent_type}] ${description} ... ${toolCount} 个工具, ${((Date.now() - start)/1000).toFixed(1)}s`);
    }
  }
}

const taskTool = tool(
  async ({ description, prompt, agent_type }) => {
    return await runTask(description, prompt, agent_type);
  },
  {
    name: "Task",
    description: `生成一个子代理来处理集中的子任务。\n代理类型：\n${getAgentDescriptions()}`,
    schema: z.object({
      description: z.string().describe("任务的简短描述"),
      prompt: z.string().describe("子代理的详细指令"),
      agent_type: z.enum(["explore", "code", "plan"]).describe("代理类型")
    })
  }
);

const allTools = [...baseTools, taskTool];
const modelWithTools = model.bindTools(allTools);

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。
循环：规划 -> 使用工具行动 -> 报告结果。
您可以为复杂子任务生成子代理：
${getAgentDescriptions()}
规则：
- 对于需要集中探索或实现的子任务，使用 Task 工具
- 使用 TodoWrite 跟踪多步工作
- 优先使用工具而不是文字。行动，不要只是解释。
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
        if (tc.name === "Task") {
          console.log(`\n> Task: ${(tc.args as any).description}`);
          const output = await runTask((tc.args as any).description, (tc.args as any).prompt, (tc.args as any).agent_type);
          history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
        } else {
          const selectedTool = allTools.find(t => t.name === tc.name);
          if (selectedTool) {
            console.log(`\n> ${tc.name}`);
            const output = await selectedTool.invoke(tc.args);
            const preview = output.length > 100 ? output.substring(0, 100) + "..." : output;
            console.log(`  结果预览: ${preview}`);
            history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
          }
        }
      }
    }
  } catch (e: any) {
    console.error(`\n错误：API 调用失败。请检查您的 API Key 和配置。\n详情：${e.message || e}`);
  }
}

async function main() {
  console.log(`Mini Claude Code v3 (LangChain TS) - ${WORKDIR}`);
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