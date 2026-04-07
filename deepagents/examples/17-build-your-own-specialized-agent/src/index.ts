import { createBasicAgent } from "../../../src/agents/create-basic-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "请基于这套教程，设计一个适合小团队使用的垂直 coding agent，并说明它的任务边界、工具和验证方式。"
  );
}

async function main() {
  const task = getTask();
  const agent = createBasicAgent();

  console.log(
    JSON.stringify(
      {
        chapter: "17",
        title: "Build Your Own Specialized Agent",
        mode: "basic",
        summary: "独立演示如何把教程内容收束成一个结构化的垂直 agent 蓝图。",
        task,
      },
      null,
      2,
    ),
  );

  const blueprintResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `${task}

请输出一份结构化蓝图，至少包含：
- agent 名称
- 目标任务
- 明确不做什么
- 需要的工具
- 需要的项目知识
- 验证方式
- 风险与控制方式
- 为什么这个方向适合先落地`,
      },
    ],
  });

  console.log("\n=== Blueprint Result ===");
  console.log(JSON.stringify(blueprintResult, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
