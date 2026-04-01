import OpenAI from "openai";
import "dotenv/config";

async function test() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.API_BASE_URL;
  const modelName = process.env.MODEL_NAME || "gpt-4o";

  const openai = new OpenAI({
    apiKey,
    baseURL,
  });

  try {
    console.log(`Sending test message to ${baseURL} with model ${modelName}...`);
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: "user", content: "hi" }],
    });
    console.log("Response:", JSON.stringify(response, null, 2));
  } catch (e: any) {
    console.error("Error occurred:", e);
    if (e.response) {
      console.error("Response data:", e.response.data);
    }
  }
}

test();
