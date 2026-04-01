# LangChain TypeScript SDK 使用指南

本项目是 Claude Code 系列教程的 LangChain (TypeScript) 版本实现。它演示了如何使用 LangChain 构建从基础到高级（带规划、子代理和技能系统）的 AI 代理。

## 核心架构

### 1. 统一客户端配置 (`src/client.ts`)
所有代理共享同一个模型初始化逻辑。
- **环境变量加载**：使用 `dotenv` 显式加载当前目录下的 `.env` 文件，并开启 `override: true` 以确保配置生效。
- **模型实例**：预配置的 `ChatOpenAI` 实例，支持自定义 `baseURL`（兼容 OpenAI 格式的国内大模型服务）。

### 2. 工具定义 (Tooling)
使用 LangChain 的 `tool()` 函数定义工具：
```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const myTool = tool(
  async ({ param }) => { /* 实现逻辑 */ },
  {
    name: "tool_name",
    description: "描述",
    schema: z.object({ param: z.string() })
  }
);
```

## 注意事项与最佳实践

### 1. OpenAI 结构化输出兼容性
OpenAI 的工具调用接口对 JSON Schema 有严格要求：
- **禁止使用 `.optional()`**：在 Zod Schema 中，字段不能简单标记为可选。
- **使用 `.nullable()`**：如果字段是可选的，必须定义为必需但可为空，例如：`limit: z.number().nullable()`。
- **必需描述**：为每个字段提供 `.describe()` 有助于模型更准确地理解参数。

### 2. 消息流与历史记录
LangChain 使用对象数组管理对话历史：
- `SystemMessage`: 系统提示词。
- `HumanMessage`: 用户输入。
- `AIMessage`: 模型响应（可能包含 `tool_calls`）。
- `ToolMessage`: 工具执行结果，必须通过 `tool_call_id` 与 `AIMessage` 关联。

### 3. 环境隔离 (Context Isolation)
在 `v3_subagent` 中，子代理通过创建一个**全新的历史记录数组**来实现上下文隔离。这防止了主对话被复杂的探索细节污染，显著提升了处理大型任务时的准确性。

### 4. 健壮性处理
- **API 异常捕获**：`agentLoop` 中包裹了 `try-catch`。某些 API 服务商在 Key 无效时仍返回 HTTP 200，但响应格式非标准，会导致 SDK 解析崩溃。
- **输出截断**：工具返回结果（如 `read_file`）时，务必进行长度截断（如 `substring(0, 50000)`），防止超出模型的上下文窗口。

## 常见问题排查

- **环境变量不生效**：检查 `typescript/langchain/.env` 是否存在。由于项目是多层级结构，直接运行 `tsx` 可能找不到 root 目录的 `.env`，建议始终通过 `npm run` 命令运行。
- **Zod 警告**：如果看到 `uses .optional() without .nullable()` 警告，请按上述“注意事项”第 1 条修改工具 Schema。
- **TypeError: Cannot read properties of undefined (reading 'message')**：这通常意味着 API 响应不符合 OpenAI 标准（如请求频率限制、余额不足或 Key 错误）。查看控制台输出的“结果预览”以获取原始错误信息。

## 扩展建议
- **自定义工具**：可以在 `src/v1_basic_agent.ts` 的 `tools` 数组中添加新的工具。
- **更换模型**：在 `.env` 中修改 `MODEL_NAME`。对于 LangChain，确保该模型支持工具调用（Tool Calling）。
