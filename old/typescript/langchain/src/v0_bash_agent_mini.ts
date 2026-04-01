#!/usr/bin/env tsx
import { HumanMessage, AIMessage, ToolMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as sp from "child_process";
import * as readline from "readline";
import { model } from "./client";

const bashTool = tool(
  async ({ command }) => {
    console.log(`\x1b[33m$ ${command}\x1b[0m`);
    try {
      const out = sp.execSync(command, { encoding: "utf8", timeout: 300000 });
      console.log(out || "(empty)");
      return out.substring(0, 50000);
    } catch (e: any) {
      const err = e.stdout + e.stderr;
      console.log(err || "(empty)");
      return err.substring(0, 50000);
    }
  },
  {
    name: "bash",
    description: "Shell cmd. Read:cat/grep/find/rg/ls. Write:echo>/sed. Subagent(for complex subtask): tsx src/v0_bash_agent_mini.ts 'task'",
    schema: z.object({ command: z.string() }),
  }
);

const system = `CLI agent at ${process.cwd()}. Use bash to solve problems. Spawn subagent for complex subtasks: tsx src/v0_bash_agent_mini.ts 'task'. Subagent isolates context and returns summary. Be concise.`;

async function chat(prompt: string, history: BaseMessage[] = []) {
  history.push(new HumanMessage(prompt));
  const modelWithTools = model.bindTools([bashTool]);

  while (true) {
    const res = await modelWithTools.invoke([new SystemMessage(system), ...history]);
    history.push(res);
    if (!res.tool_calls?.length) return res.content;

    for (const tc of res.tool_calls) {
      const output = await bashTool.invoke(tc.args);
      history.push(new ToolMessage({ tool_call_id: tc.id!, content: output }));
    }
  }
}

(async () => {
  if (process.argv[2]) console.log(await chat(process.argv[2]));
  else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const h: BaseMessage[] = [];
    const ask = () => rl.question("\x1b[36m>> \x1b[0m", async (q) => {
      if (["q", "exit", ""].includes(q)) process.exit();
      console.log(await chat(q, h));
      ask();
    });
    ask();
  }
})();
