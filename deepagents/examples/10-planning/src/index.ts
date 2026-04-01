import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "10",
  title: "Planning",
  mode: "deep",
  summary: "在 Deep Agents 主线上观察 planning 如何稳定任务推进。",
  defaultTask:
    "阅读当前仓库的 deepagents/README.md，并先给出清晰计划，再总结你会如何推进，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
