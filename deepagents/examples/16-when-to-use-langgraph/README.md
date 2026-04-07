# 16 When To Use LangGraph

这是第 16 章配套示例。

这一章现在已经升级成一个更强的独立 demo。

它不再只是“让 agent 抽象讲一遍边界”，而是会对多个典型场景逐个做判断：

- 什么场景继续用 `Deep Agents`
- 什么场景应该升级到 `LangGraph`
- 这些判断背后的标准是什么

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

- 直接创建 `basic agent`
- 提供多个典型场景作为决策样本
- 让 agent 对每个场景分别做边界判断
- 最后收束成一套升级标准

这比只回答“什么时候用 LangGraph”更像真实架构决策。

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [16-when-to-use-langgraph.md](/deepagents/docs/16-when-to-use-langgraph.md)
