import { runChapterExample } from "../../../src/shared/run-chapter-example.ts";

runChapterExample({
  chapter: "14",
  title: "验证闭环",
  mode: "coding",
  summary: "围绕 typecheck、lint、test 建立完成标准。",
  defaultTask:
    "请结合当前仓库，给出一个适合 coding agent 的验证顺序，至少包含 typecheck、lint 或 test 中的两种，不修改文件。",
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
