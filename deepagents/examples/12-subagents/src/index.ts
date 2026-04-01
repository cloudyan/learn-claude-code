import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "12",
  title: "Subagents",
  mode: "deep",
  summary: "通过源码阅读理解 research / review 子代理的职责边界。",
  defaultTask:
    "阅读 deepagents/src/deep-agents 目录下和 subagent 相关的实现，总结 research 和 reviewer 两类子代理分别适合做什么，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
