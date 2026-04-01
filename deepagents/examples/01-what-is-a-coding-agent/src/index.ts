import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "01",
  title: "Coding Agent 是什么",
  mode: "basic",
  summary: "用一个最小任务说明 coding agent 的工作闭环。",
  defaultTask:
    "请用简洁结构说明一个 coding agent 的最小闭环，包含任务理解、代码读取、修改、验证和汇报。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
