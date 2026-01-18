#!/usr/bin/env tsx
/** v0_bash_agent_mini.ts - Mini Claude Code (Compact) - 中文版 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import 'dotenv/config';
import { execSync } from 'child_process';
import * as readline from 'readline';

// 初始化 API 客戶端
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || process.env.API_BASE_URL || 'https://api.openai.com/v1',
});
const MODEL = process.env.MODEL_NAME || 'gpt-4-turbo';

// 工具定義
const bashTool = tool({
  description: 'Shell 命令。讀取:cat/grep/find/rg/ls。寫入:echo>/sed。子代理(複雜子任務): tsx src/v0_bash_agent_mini.ts \'task\'',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: '要執行的命令'
      }
    },
    required: ['command']
  },
  execute: async ({ command }) => {
    console.log(`\x1b[33m$ ${command}\x1b[0m`);
    try {
      const output = execSync(command, {
        cwd: process.cwd(),
        timeout: 300000,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log(output || "(空)");
      return output.substring(0, 50000);
    } catch (error: any) {
      const errorMsg = error.stderr || error.message || "(命令失敗)";
      console.log(errorMsg);
      return errorMsg;
    }
  }
});

// 系統提示
const SYSTEM = `CLI 代理在 ${process.cwd()}。使用 bash 解決問題。生成子代理以處理複雜子任務: tsx v0_bash_agent_mini.ts 'task'。子代理隔離上下文並返回摘要。簡潔回答。`;

async function chat(prompt: string, history: any[] = []): Promise<string> {
  history.push({ role: 'user', content: prompt });
  
  const result = await streamText({
    model: openai(MODEL),
    system: SYSTEM,
    messages: history,
    tools: {
      bash: bashTool
    },
    maxTokens: 8000
  });

  const toolCalls = await result.toolCalls;
  let fullText = '';
  for await (const textPart of result.textStream) {
    fullText += textPart;
    process.stdout.write(textPart);
  }

  if (toolCalls.length > 0) {
    history.push({
      role: 'assistant',
      content: [
        { type: 'text', text: fullText },
        ...toolCalls.map(tc => ({
          type: 'tool-call' as const,
          toolName: tc.toolName,
          args: tc.args,
          toolCallId: tc.toolCallId
        }))
      ]
    });

    history.push({
      role: 'user',
      content: toolCalls.map(tc => ({
        type: 'tool-result' as const,
        toolCallId: tc.toolCallId,
        result: tc.result
      }))
    });

    return chat(prompt, history);
  }

  return fullText;
}

// Main execution
if (require.main === module) {
  if (process.argv.length > 2) {
    // Subagent mode
    chat(process.argv.slice(2).join(' ')).then(console.log).catch(console.error);
  } else {
    // Interactive mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    (async () => {
      const history: any[] = [];
      for await (const line of rl) {
        const query = line.trim();
        if (["q", "exit", ""].includes(query)) break;
        console.log(await chat(query, history));
      }
    })();
  }
}