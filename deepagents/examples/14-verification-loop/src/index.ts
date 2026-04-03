import { readFile } from "node:fs/promises";
import path from "node:path";
import { createCodingAgent } from "../../../src/agents/create-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";
import { bashTool } from "../../../src/tools/bash.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "请结合当前仓库，给出一个适合 coding agent 的验证顺序，至少包含 typecheck、lint 或 test 中的两种，不修改文件。"
  );
}

async function loadVerificationScripts() {
  const packageJsonPath = path.resolve(process.cwd(), "deepagents/package.json");
  const raw = await readFile(packageJsonPath, "utf8");
  const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
  const scripts = parsed.scripts ?? {};

  return Object.keys(scripts).filter((name) =>
    ["typecheck", "lint", "test", "build"].some((keyword) => name.includes(keyword)),
  );
}

async function main() {
  const task = getTask();

  console.log(
    JSON.stringify(
      {
        chapter: "14",
        title: "Verification Loop",
        mode: "coding",
        summary: "独立演示先制定验证策略，再实际执行验证脚本。",
        task,
      },
      null,
      2,
    ),
  );

  const agent = createCodingAgent();
  const strategyResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `${task}

请输出：
- 推荐的验证顺序
- 每一步的目的
- 如果某一步失败，下一步应该如何处理

不要修改文件。`,
      },
    ],
  });

  const verificationScripts = await loadVerificationScripts();
  const selectedScripts = verificationScripts.length > 0 ? verificationScripts : ["typecheck"];

  const executionResults: Array<{ script: string; output: string }> = [];

  for (const script of selectedScripts) {
    const output = await bashTool.invoke({
      command: `npm --prefix deepagents run ${script}`,
    });

    executionResults.push({
      script,
      output: typeof output === "string" ? output : JSON.stringify(output, null, 2),
    });
  }

  console.log("\n=== Verification Strategy ===");
  console.log(JSON.stringify(strategyResult, null, 2));

  console.log("\n=== Executed Verification Scripts ===");
  console.log(JSON.stringify(executionResults, null, 2));

  console.log("\n=== Coordinator Summary ===");
  console.log(
    JSON.stringify(
      {
        takeaway: [
          "验证闭环不只是解释顺序，还要真的跑验证命令",
          "先有验证计划，再执行验证，再根据结果决定是否收口",
          "typecheck、lint、test、build 应该根据项目脚本和改动范围决定组合",
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
