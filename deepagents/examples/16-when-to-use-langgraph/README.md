# 16 When To Use LangGraph

这是第 16 章配套示例。

这一章的重点不是再多引入一个框架，而是学会判断：

- 什么问题 `Deep Agents` 已经够了
- 什么问题开始需要更强的 orchestration
- 什么情况下才值得下沉到 `LangGraph`

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:16
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:16 -- "请说明什么时候一个 coding agent 系统应该升级到 LangGraph"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请比较 Deep Agents 和 LangGraph 的职责边界，并说明什么时候一个 coding agent 系统应该升级到 LangGraph。
```

## 当前实现

- 复用统一章节运行器
- 使用 `basic agent` 模式
- 重点是做架构边界判断，而不是直接跑复杂工作流

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [16-when-to-use-langgraph.md](/deepagents/docs/16-when-to-use-langgraph.md)
