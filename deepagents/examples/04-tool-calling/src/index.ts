import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "04",
  title: "Tool Calling 的本质",
  mode: "basic",
  summary: "复用基础 agent，观察工具描述和工具选择。",
  defaultTask:
    "请先调用 get_time，再使用 echo 原样返回“tool calling 依赖清晰的工具边界”。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
