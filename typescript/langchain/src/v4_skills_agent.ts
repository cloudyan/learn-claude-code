#!/usr/bin/env tsx
/**
 * v4_skills_agent.ts - Mini Claude Code: Skills Mechanism
 * 
 * 核心理念："知识外化"
 * ============================================
 * 技能是通过 SKILL.md 文件存储的知识。
 * 它们允许模型按需加载领域知识（如 PDF 处理、MCP 开发等）。
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
const SKILLS_DIR = path.join(WORKDIR, "skills");
// =============================================================================
// SkillLoader - 技能加载器
// =============================================================================

interface Skill {
  name: string;
  description: string;
  body: string;
  dir: string;
}

class SkillLoader {
  private skills: Record<string, Skill> = {};

  constructor(private skillsDir: string) {
    this.loadSkills();
  }

  private loadSkills() {
    if (!fs.existsSync(this.skillsDir)) return;
    const dirs = fs.readdirSync(this.skillsDir, { withFileTypes: true }).filter(d => d.isDirectory());
    for (const d of dirs) {
      const skillMd = path.join(this.skillsDir, d.name, "SKILL.md");
      if (!fs.existsSync(skillMd)) continue;
      const content = fs.readFileSync(skillMd, "utf8");
      const match = content.match(/^---\s*\n(.*?)\n---\s*\n(.*)$/s);
      if (match) {
        const [, frontmatter, body] = match;
        const metadata: any = {};
        frontmatter.split("\n").forEach(line => {
          const [k, ...v] = line.split(":");
          if (k && v.length) metadata[k.trim()] = v.join(":").trim().replace(/^["']|["']$/g, "");
        });
        if (metadata.name && metadata.description) {
          this.skills[metadata.name] = { name: metadata.name, description: metadata.description, body: body.trim(), dir: path.dirname(skillMd) };
        }
      }
    }
  }

  getDescriptions(): string {
    return Object.entries(this.skills).map(([n, s]) => `- ${n}: ${s.description}`).join("\n") || "(无可用技能)";
  }

  getSkillContent(name: string): string | null {
    const s = this.skills[name];
    if (!s) return null;
    let res = `# 技能: ${s.name}\n\n${s.body}`;
    const folders = [
      { folder: "scripts", label: "脚本" },
      { folder: "references", label: "参考资料" },
      { folder: "assets", label: "资源" }
    ];
    folders.forEach(({ folder, label }) => {
      const fp = path.join(s.dir, folder);
      if (fs.existsSync(fp)) {
        const files = fs.readdirSync(fp);
        if (files.length) res += `\n\n**${s.dir} 中可用的${label}**:\n- ${files.join(", ")}`;
      }
    });
    return res;
  }

  listSkills(): string[] { return Object.keys(this.skills); }
}

const SKILLS = new SkillLoader(SKILLS_DIR);

// =============================================================================
// Agent Types & TodoManager (来自 v3)
// =============================================================================

const AGENT_TYPES: Record<string, any> = {
  explore: { description: "只读探索代理", tools: ["bash", "read_file"], prompt: "搜索和分析，不要修改文件。" },
  code: { description: "全功能实现代理", tools: ["bash", "read_file", "write_file", "edit_file", "TodoWrite"], prompt: "高效地实现请求的更改。" },
  plan: { description: "规划和设计代理", tools: ["bash", "read_file"], prompt: "分析代码库并输出实现计划。" },
};

function getAgentDescriptions() { return Object.entries(AGENT_TYPES).map(([n, c]: any) => `- ${n}: ${c.description}`).join("\n"); }

class TodoManager {
  private items: any[] = [];
  update(items: any[]) { this.items = items; return this.render(); }
  render() { return this.items.map(i => `${i.status === "completed" ? "[x]" : i.status === "in_progress" ? "[>]" : "[ ]"} ${i.content}`).join("\n") + `\n(${this.items.filter(t => t.status === "completed").length}/${this.items.length} 已完成)`; }
}
const TODO = new TodoManager();

// =============================================================================
// Tools - 工具集
// =============================================================================

function safePath(p: string) { const r = path.resolve(WORKDIR, p); if (!r.startsWith(WORKDIR)) throw new Error("路径超出工作区"); return r; }

const bashTool = tool(async ({ command }) => { try { return sp.execSync(command, { encoding: "utf8", timeout: 60000, cwd: WORKDIR }).substring(0, 50000); } catch (e: any) { return ((e.stdout || "") + (e.stderr || "") + (e.message || "")).substring(0, 50000); } }, { name: "bash", description: "运行 shell 命令。", schema: z.object({ command: z.string() }) });
const readFileTool = tool(async ({ path: p, limit: l }) => { try { const t = fs.readFileSync(safePath(p), "utf8"); const lines = t.split("\n"); return l ? lines.slice(0, l).join("\n") : t.substring(0, 50000); } catch (e: any) { return e.message; } }, { name: "read_file", description: "读取文件内容。", schema: z.object({ path: z.string(), limit: z.number().nullable() }) });
const writeFileTool = tool(async ({ path: p, content: c }) => { try { const fp = safePath(p); fs.mkdirSync(path.dirname(fp), { recursive: true }); fs.writeFileSync(fp, c); return `已写入 ${c.length} 字节`; } catch (e: any) { return e.message; } }, { name: "write_file", description: "写入文件。", schema: z.object({ path: z.string(), content: z.string() }) });
const editFileTool = tool(async ({ path: p, old_text: o, new_text: n }) => { try { const fp = safePath(p); const c = fs.readFileSync(fp, "utf8"); if (!c.includes(o)) return "文本未找到"; fs.writeFileSync(fp, c.replace(o, n)); return `已编辑 ${p}`; } catch (e: any) { return e.message; } }, { name: "edit_file", description: "替换文件中的文本。", schema: z.object({ path: z.string(), old_text: z.string(), new_text: z.string() }) });
const todoWriteTool = tool(async ({ items: i }) => TODO.update(i as any[]), { name: "TodoWrite", description: "更新任务列表。", schema: z.object({ items: z.array(z.object({ content: z.string(), status: z.enum(["pending", "in_progress", "completed"]), activeForm: z.string() })) }) });

async function runTask(description: string, prompt: string, agent_type: string): Promise<string> {
  const config = AGENT_TYPES[agent_type];
  console.log(`  [${agent_type}] ${description}`);
  const subTools = [bashTool, readFileTool, writeFileTool, editFileTool, todoWriteTool].filter(t => config.tools.includes(t.name));
  const subModel = model.bindTools(subTools);
  const history: BaseMessage[] = [new HumanMessage(prompt)];
  const system = `您是在 ${WORKDIR} 的 ${agent_type} 子代理。\n\n${config.prompt}\n\n完成任务并返回摘要。`;
  while (true) {
    const res = await subModel.invoke([new SystemMessage(system), ...history]);
    history.push(res);
    if (!res.tool_calls?.length) return res.content as string;
    for (const tc of res.tool_calls) {
      const t = subTools.find(st => st.name === tc.name);
      if (t) history.push(new ToolMessage({ tool_call_id: tc.id!, content: await t.invoke(tc.args) }));
    }
  }
}

const taskTool = tool(async ({ description: d, prompt: p, agent_type: a }) => await runTask(d, p, a), { name: "Task", description: "生成子代理。", schema: z.object({ description: z.string(), prompt: z.string(), agent_type: z.enum(["explore", "code", "plan"]) }) });

const skillTool = tool(
  async ({ skill: s }) => {
    const c = SKILLS.getSkillContent(s);
    if (!c) return "错误：未找到技能";
    return `<skill-loaded name="${s}">
${c}
</skill-loaded>

请按照上述技能指令完成任务。`;
  },
  { name: "Skill", description: `加载特定领域的专业知识。\n可用技能：\n${SKILLS.getDescriptions()}`, schema: z.object({ skill: z.string() }) }
);

const allTools = [bashTool, readFileTool, writeFileTool, editFileTool, todoWriteTool, taskTool, skillTool];
const modelWithTools = model.bindTools(allTools);

const SYSTEM = `您是在 ${WORKDIR} 的编码代理。
可用技能：
${SKILLS.getDescriptions()}
可用子代理：
${getAgentDescriptions()}
规则：
- 当任务匹配技能描述时，立即使用 Skill 工具加载技能
- 对于需要独立探索或实现的子任务，使用 Task 工具
- 使用 TodoWrite 跟踪多步工作
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
        const t = allTools.find(at => at.name === tc.name);
        if (t) {
          if (tc.name === "Task") {
            console.log(`\n> Task: ${(tc.args as any).description}`);
          } else if (tc.name === "Skill") {
            console.log(`\n> Loading skill: ${(tc.args as any).skill}`);
          } else {
            console.log(`\n> ${tc.name}`);
          }
          const out = await t.invoke(tc.args);
          if (tc.name !== "Task") {
            const preview = out.length > 100 ? out.substring(0, 100) + "..." : out;
            console.log(`  结果预览: ${preview}`);
          }
          history.push(new ToolMessage({ tool_call_id: tc.id!, content: out }));
        }
      }
    }
  } catch (e: any) {
    console.error(`\n错误：API 调用失败。请检查您的 API Key 和配置。\n详情：${e.message || e}`);
  }
}

async function main() {
  console.log(`Mini Claude Code v4 (LangChain TS) - ${WORKDIR}`);
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