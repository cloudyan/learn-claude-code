import { readFile } from "node:fs/promises";
import path from "node:path";
import { createDeepCodingAgent } from "../../../src/deep-agents/create-deep-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "请为这套教程项目设计一个新的章节示例入口，并说明它应该放在哪个目录、遵循什么命名约定、如何与 docs 和 src 对齐。"
  );
}

async function loadProjectKnowledge() {
  const knowledgePath = path.resolve(
    process.cwd(),
    "deepagents/examples/13-project-knowledge/project-knowledge.md",
  );

  return readFile(knowledgePath, "utf8");
}

async function main() {
  const task = getTask();
  const projectKnowledge = await loadProjectKnowledge();
  const agent = createDeepCodingAgent();

  console.log(
    JSON.stringify(
      {
        chapter: "13",
        title: "Project Knowledge",
        mode: "deep",
        summary: "独立演示不带项目知识与带项目知识两轮输出的差异。",
        task,
      },
      null,
      2,
    ),
  );

  const baselineResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `${task}

不要修改文件。请直接给出建议。`,
      },
    ],
  });

  const knowledgeInjectedResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `下面是当前项目的知识包，请在此基础上回答任务。

项目知识：
${projectKnowledge}

任务：
${task}

不要修改文件。请给出更贴近当前项目约定的建议。`,
      },
    ],
  });

  console.log("\n=== Baseline Result ===");
  console.log(JSON.stringify(baselineResult, null, 2));

  console.log("\n=== Project Knowledge ===");
  console.log(projectKnowledge);

  console.log("\n=== Knowledge-Injected Result ===");
  console.log(JSON.stringify(knowledgeInjectedResult, null, 2));

  console.log("\n=== Coordinator Summary ===");
  console.log(
    JSON.stringify(
      {
        takeaway: [
          "项目知识的价值不在于让 agent 变聪明，而在于让它更贴近当前仓库约定",
          "同一个任务在注入项目知识后，输出通常会更贴合目录、命名和实现边界",
          "项目知识更适合作为可维护资源，而不是无限膨胀的 system prompt",
        ],
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
