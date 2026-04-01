import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "07",
  title: "TypeScript 工程化组织",
  mode: "coding",
  summary: "让 agent 解释 docs / examples / src 的分层意义。",
  defaultTask:
    "阅读 deepagents/src/README.md 和 deepagents/examples/README.md，总结 docs、examples、src 三层分工，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
