import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "13",
  title: "项目知识接入",
  mode: "deep",
  summary: "让 agent 总结项目约定和仓库知识接入方式。",
  defaultTask:
    "阅读 deepagents/docs/13-project-knowledge.md 和相关 README，总结项目知识为什么不能只塞进 prompt，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
