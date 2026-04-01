import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "15",
  title: "可观测性与可控性",
  mode: "deep",
  summary: "用一次任务说明日志、审批和人类接管为什么重要。",
  defaultTask:
    "请说明一个 coding agent 在执行文件修改前后，哪些步骤应该对用户可见，哪些操作适合加入人工确认。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
