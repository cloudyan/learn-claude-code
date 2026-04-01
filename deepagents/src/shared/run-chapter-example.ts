import { createBasicAgent } from "../agents/create-basic-agent.ts";
import { createCodingAgent } from "../agents/create-coding-agent.ts";
import { createDeepCodingAgent } from "../deep-agents/create-deep-coding-agent.ts";
import { loadRootEnv } from "./load-root-env.ts";

type ExampleMode = "basic" | "coding" | "deep";

interface RunChapterExampleOptions {
  chapter: string;
  title: string;
  mode: ExampleMode;
  defaultTask: string;
  summary: string;
}

function getTask(defaultTask: string) {
  return process.argv.slice(2).join(" ").trim() || defaultTask;
}

export async function runChapterExample(options: RunChapterExampleOptions) {
  loadRootEnv();

  const task = getTask(options.defaultTask);

  console.log(
    JSON.stringify(
      {
        chapter: options.chapter,
        title: options.title,
        mode: options.mode,
        summary: options.summary,
        task,
      },
      null,
      2,
    ),
  );

  let agent;

  if (options.mode === "basic") {
    agent = createBasicAgent();
  } else if (options.mode === "coding") {
    agent = createCodingAgent();
  } else {
    agent = createDeepCodingAgent();
  }

  const result = await agent.invoke({
    messages: [{ role: "user", content: task }],
  });

  console.log(JSON.stringify(result, null, 2));
}
