import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "02",
  title: "LangChain v1、Deep Agents、LangGraph 如何分工",
  mode: "basic",
  summary: "用一个选型问题比较三层分工。",
  defaultTask:
    "请比较 LangChain v1、Deep Agents、LangGraph 在 coding agent 教程中的分工，并给出适用场景。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
