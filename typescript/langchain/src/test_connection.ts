import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import "dotenv/config";

async function test() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.API_BASE_URL;
  console.log(`Using BaseURL: ${baseURL}`);
  console.log(`API Key present: ${!!apiKey}`);

  const model = new ChatOpenAI({
    apiKey,
    configuration: {
      baseURL,
    },
    modelName: process.env.MODEL_NAME || "gpt-4o",
    verbose: true,
  });

  try {
    console.log("Sending test message...");
    const res = await model.invoke([new HumanMessage("hi")]);
    console.log("Response received:", res.content);
  } catch (e: any) {
    console.error("Error occurred:", e);
  }
}

test();
