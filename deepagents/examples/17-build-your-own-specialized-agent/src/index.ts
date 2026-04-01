import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "17",
  title: "做你自己的垂直 Coding Agent",
  mode: "basic",
  summary: "把前面的能力收束到一个边界清晰的垂直 agent。",
  defaultTask:
    "请基于这套教程，设计一个适合小团队使用的垂直 coding agent，并说明它的任务边界、工具和验证方式。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
