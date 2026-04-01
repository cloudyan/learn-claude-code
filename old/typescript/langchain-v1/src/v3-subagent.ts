#!/usr/bin/env tsx
/**
 * Mini Claude Code v3 - 子代理机制
 *
 * 核心理念："分而治之，上下文隔离"
 * =============================================================
 * 通过生成子任务，我们得到：
 *   - 为父代理提供干净的上下文
 *   - 自然的任务分解
 *   - 相同的代理循环，不同的上下文
 */

import { createModelClient } from "./clients/model";
import { HumanMessage, ToolMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { bash } from "./tools/bash";
import { readFile } from "./tools/read-file";
import { writeFile } from "./tools/write-file";
import { editFile } from "./tools/edit-file";
import { todoWrite } from "./tools/todo-write";
import { createTaskTool, type AgentConfig } from "./tools/task";
import * as readline from "readline";

const WORKDIR = process.cwd();

const AGENT_TYPES: Record<string, AgentConfig> = {
  explore: {
    description: "用于探索代码、查找文件、搜索的只读代理",
    tools: ["bash", "read_file"],
    prompt: "您是一个探索代理。搜索和分析，但绝不修改文件。返回一个简洁的摘要。",
  },
  code: {
    description: "用于实现功能和修复错误的全功能代理",
    tools: ["bash", "read_file", "write_file", "edit_file", "todo_write"],
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

const baseTools = [bash, readFile, writeFile, editFile, todoWrite];

const taskTool = createTaskTool({
  tools: baseTools,
  createModel: () => createModelClient({ temperature: 0.1 }),
  workdir: WORKDIR,
  agentTypes: AGENT_TYPES
});

const allTools = [...baseTools, taskTool];
const modelWithTools = createModelClient({ temperature: 0.1 }).bindTools(allTools);

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。
循环：规划 -> 使用工具行动 -> 报告结果。
您可以为复杂子任务生成子代理：
${getAgentDescriptions()}
规则：
- 对于需要集中探索或实现的子任务，使用 task 工具
- 使用 todo_write 跟踪多步工作
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
        const selectedTool = allTools.find(t => t.name === tc.name);
        if (selectedTool) {
          if (tc.name === "task") {
            console.log(`\n> task: ${(tc.args as any).description}`);
          } else {
            console.log(`\n> ${tc.name}`);
          }
          const output = await selectedTool.invoke(tc.args);
          if (tc.name !== "task") {
            const preview = output.length > 100 ? output.substring(0, 100) + "..." : output;
            console.log(`  结果预览: ${preview}`);
          }
          history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
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
    if (["exit", "quit", "q"].includes(q.toLowerCase()) || !q) {
      return rl.close();
    }
    history.push(new HumanMessage(q));
    await agentLoop(history);
    console.log("\n");
    ask();
  });
  ask();
}

// 测试： 复杂任务,调研查询并规划设计实现快排算法
main().catch(console.error);
