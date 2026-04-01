import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "16",
  title: "什么时候升级到 LangGraph",
  mode: "basic",
  summary: "通过架构判断问题解释什么时候该下沉到 LangGraph。",
  defaultTask:
    "请比较 Deep Agents 和 LangGraph 的职责边界，并说明什么时候一个 coding agent 系统应该升级到 LangGraph。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
