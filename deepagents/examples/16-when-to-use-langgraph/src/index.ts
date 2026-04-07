import { createBasicAgent } from "../../../src/agents/create-basic-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "请比较 Deep Agents 和 LangGraph 的职责边界，并说明什么时候一个 coding agent 系统应该升级到 LangGraph。"
  );
}

const scenarios = [
  {
    name: "单次仓库修复任务",
    description: "一次性读取仓库、做小范围修改、跑 typecheck、输出总结。",
  },
  {
    name: "带审批点的多阶段任务",
    description: "先分析、再出计划、等待人工确认、再执行修改、最后跑验证。",
  },
  {
    name: "可恢复的长时任务",
    description: "任务会执行很久，中断后还需要恢复到明确阶段继续运行。",
  },
];

async function main() {
  const task = getTask();
  const agent = createBasicAgent();

  console.log(
    JSON.stringify(
      {
        chapter: "16",
        title: "When To Use LangGraph",
        mode: "basic",
        summary: "独立演示用多个典型场景判断是否该从 Deep Agents 升级到 LangGraph。",
        task,
      },
      null,
      2,
    ),
  );

  const decisionResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `${task}

请逐个判断下面这些场景更适合：
- 继续用 Deep Agents
- 升级到 LangGraph

场景：
${JSON.stringify(scenarios, null, 2)}

输出要求：
- 每个场景给出判断
- 说明理由
- 最后总结一套升级判断标准`,
      },
    ],
  });

  console.log("\n=== Decision Scenarios ===");
  console.log(JSON.stringify(scenarios, null, 2));

  console.log("\n=== Decision Result ===");
  console.log(JSON.stringify(decisionResult, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
