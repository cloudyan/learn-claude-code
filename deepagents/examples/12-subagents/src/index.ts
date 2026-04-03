import { createResearchSubagent } from "../../../src/deep-agents/create-research-subagent.ts";
import { createReviewerSubagent } from "../../../src/deep-agents/create-reviewer-subagent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "请分析 deepagents/src/deep-agents 和 prompts 中与 subagent 相关的实现，说明 researcher 与 reviewer 的职责边界，以及这种拆分可能带来的收益和风险。"
  );
}

async function main() {
  const task = getTask();

  console.log(
    JSON.stringify(
      {
        chapter: "12",
        title: "Subagents",
        mode: "deep",
        summary: "独立演示主代理如何编排 researcher 与 reviewer 两个子代理。",
        task,
      },
      null,
      2,
    ),
  );

  const researcher = createResearchSubagent();
  const reviewer = createReviewerSubagent();

  const researchPrompt = `
你是研究型子代理，请围绕下面这个任务做探索。

任务：
${task}

输出要求：
- 给出你观察到的关键文件
- 总结 researcher 与 reviewer 这两类子代理的职责边界
- 说明为什么这里值得拆成子代理
- 不要修改文件
`;

  const researchResult = await researcher.invoke({
    messages: [{ role: "user", content: researchPrompt }],
  });

  const reviewPrompt = `
你是 review 型子代理。下面是研究型子代理给出的结论，请你从风险、遗漏和边界设计角度继续审查。

原始任务：
${task}

研究结论：
${JSON.stringify(researchResult, null, 2)}

输出要求：
- 指出这份职责划分是否清晰
- 指出可能的风险和遗漏
- 说明 subagent 设计里最值得警惕的问题
- 不要修改文件
`;

  const reviewResult = await reviewer.invoke({
    messages: [{ role: "user", content: reviewPrompt }],
  });

  console.log("\n=== Research Result ===");
  console.log(JSON.stringify(researchResult, null, 2));

  console.log("\n=== Review Result ===");
  console.log(JSON.stringify(reviewResult, null, 2));

  console.log("\n=== Coordinator Summary ===");
  console.log(
    JSON.stringify(
      {
        takeaway: [
          "researcher 负责探索、阅读、搜索和局部总结",
          "reviewer 负责检查风险、遗漏验证和角色边界",
          "subagents 的价值首先是上下文隔离，而不是并行炫技",
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
