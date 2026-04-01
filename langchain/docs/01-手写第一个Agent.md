# 第1章：手写第一个 Agent —— v1 模型即代理

**~300 行代码，4 个工具。这是所有编程 Agent 的本质。**

---

## 先理解：Agent 到底是什么？

在开始手写之前，先建立一个认知框架。

### 你每天都在用的聊天机器人

```
你: "今天天气怎么样？"
AI: "今天晴天，25度。"
```

这是传统的对话模式：一问一答。

### Agent 不一样

```
你: "帮我重构一下这个项目的认证模块。"
AI: "好的，我先看看代码结构。"
    [调用工具: ls -la]
    "找到了，认证在 src/auth/。让我读取一下。"
    [调用工具: read_file src/auth/login.ts]
    "理解了，我来重构。"
    [调用工具: edit_file src/auth/login.ts]
    "完成了！我改了这些地方..."
```

**关键区别**：模型会**反复**调用工具，直到任务完成。

---

## 核心洞察：模型是决策者，代码只是循环

传统软件：
```
代码是决策者 → 调用工具 → 完成任务
```

Agent 系统：
```
模型是决策者 → 调用工具 → 观察结果 → 再决策...
代码只是提供工具，并跑这个循环。
```

这就是"模型即代理"的含义。

---

## 四个核心工具

你不需要 20 个工具，4 个就覆盖 90% 场景：

| 工具 | 用途 | 示例 |
|------|------|------|
| `bash` | 运行命令 | `npm install`, `git status` |
| `read_file` | 读取内容 | 查看 `src/index.ts` |
| `write_file` | 创建/覆盖 | 创建 `README.md` |
| `edit_file` | 精确修改 | 替换一个函数 |

有了这 4 个工具，模型可以：
- 探索代码库（`bash: find, grep, ls`）
- 理解代码（`read_file`）
- 做出修改（`write_file`, `edit_file`）
- 运行任何东西（`bash: node, npm, make`）

---

## 现在，手写 v1

### 准备工作

1. 环境
2. 项目结构
3. 调试

先安装依赖：

```bash
cd agent-1/typescript
npm install
```

创建 `.env` 文件：

```bash
# OpenAI / 国内兼容模型
OPENAI_API_KEY=你的key
OPENAI_BASE_URL=https://api.openai.com/v1

# 国内模型示例：
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# OPENAI_BASE_URL=https://api.siliconflow.cn/v1
# OPENAI_BASE_URL=https://api.baichuan-ai.com/v1

# 模型名称
MODEL_NAME=gpt-4o  # 或 claude-3-5-sonnet-20241022, deepseek-chat 等
```

### 项目结构

良好的项目结构，能提高开发效率，便于维护

```bash
typescript/src/
├── clients/
│   └── model.ts          # OpenAI 客户端初始化
├── tools/
│   ├── bash.ts           # 独立工具
│   ├── read-file.ts
│   ├── write-file.ts
│   ├── edit-file.ts
│   └── todo-write.ts     # 只包含工具定义，不含 TodoManager
├── utils/
│   ├── safePath.ts       # 路径安全
│   └── todoManager.ts    # TodoManager 独立
├── v0_bash_agent.ts      # 主程序保持简洁
├── v1_basic_agent.ts
├── v2_todo_agent.ts
└── ...
```

---

### 空文件开始，逐行手写

创建 `src/v1_basic_agent.ts`，我们一行一行来。

**第 1-25 行：导入库和配置**

```typescript
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 配置 OpenAI 客户端（兼容国内模型）
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const MODEL = process.env.MODEL_NAME || 'gpt-4o';
const WORK_DIR = process.cwd();
```

**第 26-35 行：safePath - 安全是第一位**

```typescript
function safePath(userPath: string): string {
  const resolved = path.resolve(userPath);
  if (!resolved.startsWith(WORK_DIR)) {
    throw new Error(`路径 ${userPath} 超出工作目录范围`);
  }
  return resolved;
}
```

为什么需要这个？防止模型不小心删掉系统文件。

**第 36-80 行：4 个工具**

先写 `bash` 工具：

```typescript
// 执行 shell 命令
function bash(command: string): string {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      timeout: 120000,
      cwd: WORK_DIR,
      stdio: 'pipe'
    });
    return output.trim() || '(无输出)';
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}
```

然后是 `read_file`：

```typescript
function read_file(file_path: string, offset = 1, limit = 200): string {
  try {
    const filePath = safePath(file_path);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const start = Math.max(0, (offset || 1) - 1);
    const end = start + (limit || 200);
    const selectedLines = lines.slice(start, end);

    // 给每行加上行号，方便定位
    return selectedLines
      .map((line, i) => `${start + i + 1}: ${line}`)
      .join('\n');
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}
```

`write_file`：

```typescript
function write_file(file_path: string, content: string): string {
  try {
    const filePath = safePath(file_path);
    writeFileSync(filePath, content, 'utf8');
    return '写入成功';
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}
```

`edit_file`（最巧妙的一个）：

```typescript
function edit_file(file_path: string, old_str: string, new_str: string): string {
  try {
    const filePath = safePath(file_path);
    const content = readFileSync(filePath, 'utf8');

    if (!content.includes(old_str)) {
      return '错误: 找不到要替换的内容，请确保 old_str 精确匹配';
    }

    const newContent = content.replace(old_str, new_str);
    writeFileSync(filePath, newContent, 'utf8');
    return '编辑成功';
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}
```

为什么是精确字符串替换？因为模型知道它想改什么，这样最安全。

**第 81-180 行：工具定义（给模型看的）**

模型需要知道每个工具是干什么的，以及怎么调用：

```typescript
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description: '执行任意 bash 命令（如 git, npm, ls, grep, find 等）',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: '要执行的 bash 命令'
          },
          timeout: {
            type: 'integer',
            description: '超时时间（毫秒），默认 120000',
            default: 120000
          }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: '要读取的文件路径'
          },
          offset: {
            type: 'integer',
            description: '起始行号（从 1 开始）',
            default: 1
          },
          limit: {
            type: 'integer',
            description: '读取行数，默认 200',
            default: 200
          }
        },
        required: ['file_path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: '创建或覆写文件（会覆盖已有文件！）',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: '要写入的文件路径'
          },
          content: {
            type: 'string',
            description: '文件内容'
          }
        },
        required: ['file_path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_file',
      description: '编辑文件：用新内容替换旧内容（精确字符串匹配）',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: '要编辑的文件路径'
          },
          old_str: {
            type: 'string',
            description: '要替换的旧内容（必须精确匹配！）'
          },
          new_str: {
            type: 'string',
            description: '替换后的新内容'
          }
        },
        required: ['file_path', 'old_str', 'new_str']
      }
    }
  }
];
```

这就是给模型看的"说明书"。

**第 181-200 行：工具执行**

```typescript
async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  if (name === 'bash') {
    return bash(args.command);
  }
  if (name === 'read_file') {
    return read_file(args.file_path, args.offset, args.limit);
  }
  if (name === 'write_file') {
    return write_file(args.file_path, args.content);
  }
  if (name === 'edit_file') {
    return edit_file(args.file_path, args.old_str, args.new_str);
  }
  return `未知工具: ${name}`;
}
```

**第 201-280 行：核心循环（最重要的部分）**

```typescript
async function agentLoop(task: string, systemPrompt?: string): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt || `你是一个能干的 AI 助手，有完整的文件系统和终端访问权限。

工作目录: ${WORK_DIR}

规则：
1. 先了解情况（用 ls、read_file 等），再动手修改
2. edit_file 的 old_str 必须精确匹配（包括空格、换行、缩进）
3. 不确定时，可以先读取文件看看
4. 破坏性操作（如 rm、git push）要先向用户确认`
    },
    { role: 'user', content: task }
  ];

  while (true) {
    // 调用模型
    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: 'auto'
    });

    const message = response.choices[0].message;
    messages.push(message);

    // 如果没有工具调用，说明任务完成了
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content || '(无内容)';
    }

    // 执行工具调用
    for (const toolCall of message.tool_calls) {
      console.log(`\n[工具调用] ${toolCall.function.name}`);
      console.log(`[参数] ${toolCall.function.arguments}`);

      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);

      // 显示结果（截断太长的输出）
      const displayResult = result.length > 1000
        ? result.substring(0, 1000) + '\n... (输出已截断)'
        : result;
      console.log(`[结果]\n${displayResult}`);

      // 把工具结果加回消息列表
      messages.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        content: result
      });
    }
  }
}
```

这就是整个 Agent。**核心就是这个 while 循环。**

**第 281-300 行：主函数**

```typescript
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方式: npm run v1 -- "你的任务描述"');
    console.log('\n示例:');
    console.log('  npm run v1 -- "查看当前目录结构"');
    console.log('  npm run v1 -- "创建一个 TypeScript 项目"');
    return;
  }

  const task = args.join(' ');
  console.log(`任务: ${task}\n`);

  const result = await agentLoop(task);
  console.log(`\n最终结果: ${result}`);
}

// 直接运行时执行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
```

---

## 运行它！

```bash
cd agent-1/typescript
npm run v1 -- "查看当前目录结构"
```

试试这个：

```bash
npm run v1 -- "列一下当前目录"
```

看看会发生什么。

---

## 为什么这个设计有效？

| 特性 | 说明 |
|------|------|
| **简单** | 没有状态机，没有规划模块，没有框架 |
| **模型负责思考** | 模型决定用哪些工具、什么顺序、何时停止 |
| **透明** | 每个工具调用可见，每个结果在对话中 |
| **可扩展** | 添加工具 = 一个函数 + 一个 JSON schema |

---

## 核心洞察（记住这句话）

> **模型是决策者，代码只提供工具并运行循环。**

这就是"模型即代理"的全部秘密。

---

## 国内模型配置示例

`.env` 文件配置：

```bash
# DeepSeek
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
MODEL_NAME=deepseek-chat

# 硅基流动
# OPENAI_API_KEY=sk-xxx
# OPENAI_BASE_URL=https://api.siliconflow.cn/v1
# MODEL_NAME=Qwen/Qwen2.5-72B-Instruct

# 百川
# OPENAI_API_KEY=sk-xxx
# OPENAI_BASE_URL=https://api.baichuan-ai.com/v1
# MODEL_NAME=Baichuan4
```

---

**下一章，我们给它加个 Todo 工具，让它不再胡作非为。**
