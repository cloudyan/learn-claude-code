import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "11",
  title: "Filesystem Context",
  mode: "deep",
  summary: "在真实仓库中观察搜索优先和局部读取。",
  defaultTask:
    "请在当前仓库中先搜索 deepagents 目录下和 planning 相关的内容，再给出你定位到的关键文件，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
