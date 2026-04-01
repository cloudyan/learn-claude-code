import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "08",
  title: "为什么进入 Deep Agents",
  mode: "basic",
  summary: "用阶段升级问题解释为什么主线切到 Deep Agents。",
  defaultTask:
    "请说明为什么在这套教程里，主线会从 LangChain v1 的最小 agent 升级到 Deep Agents。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
