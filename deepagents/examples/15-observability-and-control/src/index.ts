import { createDeepCodingAgent } from "../../../src/deep-agents/create-deep-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv
      .slice(2)
      .filter((arg) => arg !== "--auto-approve")
      .join(" ")
      .trim() ||
    "请说明一个 coding agent 在执行文件修改前后，哪些步骤应该对用户可见，哪些操作适合加入人工确认。"
  );
}

function shouldAutoApprove() {
  return process.argv.includes("--auto-approve");
}

async function main() {
  const task = getTask();
  const autoApprove = shouldAutoApprove();
  const agent = createDeepCodingAgent();

  console.log(
    JSON.stringify(
      {
        chapter: "15",
        title: "Observability And Control",
        mode: "deep",
        summary: "独立演示步骤可见性、风险识别和审批门控。",
        task,
        autoApprove,
      },
      null,
      2,
    ),
  );

  console.log("\n=== Visible Step 1: Task Intake ===");
  console.log(task);

  const planningResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `${task}

请给出：
- 一个简洁计划
- 哪些步骤应该对用户可见
- 哪些动作应视为高风险并需要审批
- 不要修改文件`,
      },
    ],
  });

  console.log("\n=== Visible Step 2: Planned Actions ===");
  console.log(JSON.stringify(planningResult, null, 2));

  const approvalGate = {
    riskyActions: [
      "大范围批量修改",
      "删除文件或目录",
      "执行破坏性命令",
      "发布、提交或推送",
    ],
    approvalRequired: true,
    approved: autoApprove,
  };

  console.log("\n=== Visible Step 3: Approval Gate ===");
  console.log(JSON.stringify(approvalGate, null, 2));

  let executionSummary;

  if (!autoApprove) {
    executionSummary = {
      status: "paused_for_approval",
      reason: "检测到高风险动作需要人工确认，当前示例默认停在审批点。",
    };
  } else {
    executionSummary = await agent.invoke({
      messages: [
        {
          role: "user",
          content: `现在视为用户已经批准继续执行。

请给出：
- 继续执行后的可观测步骤
- 用户在执行过程中应该看到什么
- 人类在什么时点可以中断或接管
- 不要修改文件`,
        },
      ],
    });
  }

  console.log("\n=== Visible Step 4: Execution / Handoff ===");
  console.log(JSON.stringify(executionSummary, null, 2));

  console.log("\n=== Coordinator Summary ===");
  console.log(
    JSON.stringify(
      {
        takeaway: [
          "可观测性要求用户能看到任务 intake、计划、风险判断和执行状态",
          "高风险动作应经过审批门控，而不是默认自动执行",
          "人类接管不是失败，而是协作机制的一部分",
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
