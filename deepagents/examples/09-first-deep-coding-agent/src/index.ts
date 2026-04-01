import { createDeepCodingAgent } from "../../../src/deep-agents/create-deep-coding-agent.ts";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

async function main() {
  const task =
    process.argv.slice(2).join(" ").trim() ||
    "读取当前仓库的 README，并给出一份不改文件的总结";

  const agent = createDeepCodingAgent();
  const result = await agent.invoke({
    messages: [{ role: "user", content: task }],
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
