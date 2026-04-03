import { createDeepCodingAgent } from "../../../src/deep-agents/create-deep-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";
import { listFilesTool } from "../../../src/tools/list-files.ts";
import { readFileTool } from "../../../src/tools/read-file.ts";
import { searchTextTool } from "../../../src/tools/search-text.ts";

loadRootEnv();

function getTask() {
  return (
    process.argv.slice(2).join(" ").trim() ||
    "请在当前仓库中先搜索 deepagents 目录下和 planning 相关的内容，再给出你定位到的关键文件，不修改文件。"
  );
}

function extractCandidatePaths(searchOutput: string) {
  return searchOutput
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(":")[0])
    .filter((value, index, array) => Boolean(value) && array.indexOf(value) === index)
    .slice(0, 3);
}

async function main() {
  const task = getTask();

  console.log(
    JSON.stringify(
      {
        chapter: "11",
        title: "Filesystem Context",
        mode: "deep",
        summary: "独立演示 list -> search -> read -> summarize 的文件系统上下文链路。",
        task,
      },
      null,
      2,
    ),
  );

  const directoryListing = await listFilesTool.invoke({ path: "deepagents" });
  const searchResult = await searchTextTool.invoke({ query: "planning" });
  const candidatePaths = extractCandidatePaths(
    typeof searchResult === "string" ? searchResult : JSON.stringify(searchResult),
  );

  const fileSnapshots: Array<{ path: string; content: string }> = [];

  for (const candidatePath of candidatePaths) {
    const content = await readFileTool.invoke({ path: candidatePath });
    fileSnapshots.push({
      path: candidatePath,
      content: typeof content === "string" ? content : JSON.stringify(content, null, 2),
    });
  }

  const agent = createDeepCodingAgent();
  const summaryResult = await agent.invoke({
    messages: [
      {
        role: "user",
        content: `下面是一次文件系统上下文采集过程，请总结它体现了什么工作方式。

任务：
${task}

目录列表：
${typeof directoryListing === "string" ? directoryListing : JSON.stringify(directoryListing, null, 2)}

搜索结果：
${typeof searchResult === "string" ? searchResult : JSON.stringify(searchResult, null, 2)}

读取到的文件片段：
${JSON.stringify(fileSnapshots, null, 2)}

请说明：
- 为什么先 list 再 search 再 read 更合理
- 这体现了怎样的 filesystem context 工作方式
- 这种方式相比一次性塞入大量上下文有什么优势
不要修改文件。`,
      },
    ],
  });

  console.log("\n=== Directory Listing ===");
  console.log(JSON.stringify(directoryListing, null, 2));

  console.log("\n=== Search Result ===");
  console.log(JSON.stringify(searchResult, null, 2));

  console.log("\n=== File Snapshots ===");
  console.log(JSON.stringify(fileSnapshots, null, 2));

  console.log("\n=== Summary Result ===");
  console.log(JSON.stringify(summaryResult, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
