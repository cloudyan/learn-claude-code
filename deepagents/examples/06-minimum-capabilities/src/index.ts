import { createCodingAgent } from "../../../src/agents/create-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

async function main() {
  const task =
    process.argv.slice(2).join(" ").trim() ||
    "阅读当前仓库的 deepagents/README.md，并给出一份执行计划，不修改文件";

  const agent = createCodingAgent();
  const result = await agent.invoke({
    messages: [{ role: "user", content: task }],
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
