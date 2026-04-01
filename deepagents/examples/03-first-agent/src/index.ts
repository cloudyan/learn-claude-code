import { tool, createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { loadRootEnv } from "../../../src/shared/load-root-env.ts";

loadRootEnv();

const apiKey = process.env.OPENAI_API_KEY;
const baseURL = process.env.OPENAI_BASE_URL;

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}

const model = new ChatOpenAI({
  apiKey,
  model: process.env.MODEL_NAME ?? "gpt-5-nano",
  configuration: baseURL
    ? { baseURL }
    : undefined,
});

const echoTool = tool(
  async ({ text }) => text,
  {
    name: "echo",
    description: "原样返回输入文本。",
    schema: z.object({
      text: z.string().describe("需要原样返回的文本。"),
    }),
  },
);

const getTimeTool = tool(
  async () => new Date().toISOString(),
  {
    name: "get_time",
    description: "获取当前 ISO 时间。",
    schema: z.object({}),
  },
);

const agent = createAgent({
  model,
  tools: [echoTool, getTimeTool],
  systemPrompt: `
你是一个最小 TypeScript agent。

要求：
- 在需要时使用工具。
- 回答简洁。
- 如果用户同时要求“查询时间”和“原样返回文本”，要完成这两件事。
`,
});

async function main() {
  const task =
    process.argv.slice(2).join(" ").trim() ||
    "告诉我现在时间，并把这句话原样返回";

  const result = await agent.invoke({
    messages: [{ role: "user", content: task }],
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
