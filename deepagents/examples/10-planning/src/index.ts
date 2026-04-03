import { createDeepCodingAgent } from "../../../src/deep-agents/create-deep-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";
import { readPlanTool } from "../../../src/tools/plan.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "阅读当前仓库的 deepagents/README.md，并先给出清晰计划，再总结你会如何推进，不修改文件。"
  );
}

async function main() {
  const task = getTask();

  console.log(
    JSON.stringify(
      {
        chapter: "10",
        title: "Planning",
        mode: "deep",
        summary: "独立演示计划生成、计划读取和基于计划推进任务。",
        task,
      },
      null,
      2,
    ),
  );

  const agent = createDeepCodingAgent();

  const planningResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `${task}

请先显式创建一个 3-5 步的计划，再基于这个计划说明你会如何推进。
不要修改文件。`,
      },
    ],
  });

  const initialPlan = await readPlanTool.invoke({});

  const executionResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `基于当前已有计划，只执行前两步需要做的探索或阅读工作，并给出阶段性进展总结。
不要修改文件。`,
      },
    ],
  });

  const currentPlan = await readPlanTool.invoke({});

  console.log("\n=== Planning Result ===");
  console.log(JSON.stringify(planningResult, null, 2));

  console.log("\n=== Initial Plan Snapshot ===");
  console.log(JSON.stringify(initialPlan, null, 2));

  console.log("\n=== Execution Progress ===");
  console.log(JSON.stringify(executionResult, null, 2));

  console.log("\n=== Current Plan Snapshot ===");
  console.log(JSON.stringify(currentPlan, null, 2));

  console.log("\n=== Coordinator Summary ===");
  console.log(
    JSON.stringify(
      {
        takeaway: [
          "planning 的价值不只是展示步骤，而是把任务主线外化出来",
          "read_plan 可以帮助我们观察当前计划是否真的被建立",
          "基于计划继续推进任务，比一次性把全部动作塞进单轮回答更稳定",
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
