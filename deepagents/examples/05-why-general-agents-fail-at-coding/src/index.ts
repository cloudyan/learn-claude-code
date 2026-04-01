import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "05",
  title: "为什么普通 Agent 做不好 Coding Task",
  mode: "coding",
  summary: "用仓库任务说明普通 agent 与 coding agent 的差距。",
  defaultTask:
    "阅读当前仓库的 deepagents/README.md，并说明如果没有显式计划、验证和仓库上下文策略，这类任务为什么容易失败，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
