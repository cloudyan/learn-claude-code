# TypeScript Coding Agent Tutorial

这是一套全新规划的教程根目录，技术栈固定为：

- TypeScript
- LangChain v1.x
- Deep Agents
- LangGraph

教程主线采用三层结构：

1. 用 `LangChain v1.x` 讲清 agent 基础
2. 用 `Deep Agents` 构建 coding agent 主线
3. 用 `LangGraph` 讲复杂 orchestration 的升级边界

## 教程目标

这套教程不以“快速调出一个 demo”为目标，而是帮助读者从 0 到 1 理解并实现一个真正能在代码库中工作的 coding agent。

核心问题包括：

- coding agent 和普通聊天 agent 有什么不同
- 为什么 tool calling 还不足以支撑真实 coding task
- 为什么 planning、filesystem、subagents、verification 很重要
- 为什么 `Deep Agents` 更适合作为 coding agent 主线
- 什么情况下才值得进入 `LangGraph`

## 目录结构

```text
deepagents/
  README.md
  TODO.md
  .env.example
  package.json
  pnpm-workspace.yaml
  docs/
    README.md
    tutorial-outline.md
    writing-template.md
  examples/
    README.md
  src/
    README.md
```

## 写作路线

教程推荐顺序：

1. `docs/tutorial-outline.md`
2. 按章节在 `docs/` 下展开正文
3. 在 `examples/` 下提供可运行示例
4. 在 `src/` 下沉淀共享工具、provider、prompt 和 agent 封装
5. 在 `TODO.md` 中记录后续进阶设计和演进事项

## 当前示例策略

当前示例策略已经调整为：

- `01-17` 每章至少有一个示例入口目录
- 主线关键节点保持独立可运行
- 其他章节先用复用型或案例型示例承接

当前可运行的主线示例仍然是：

- `examples/03-first-agent`
- `examples/06-minimum-capabilities`
- `examples/09-first-deep-coding-agent`

而章节级示例入口已经扩展到 `examples/01-17`，用于保证每章都有明确的示例落点。

## 推荐章节

1. Coding Agent 是什么
2. LangChain v1、Deep Agents、LangGraph 如何分工
3. 用 LangChain v1 写第一个最小 Agent
4. Tool Calling 的本质
5. 为什么普通 Agent 做不好 Coding Task
6. Coding Agent 的最小能力集
7. TypeScript 工程化组织
8. 为什么进入 Deep Agents
9. 第一个 Deep Agents Coding Agent
10. Planning
11. Filesystem Context
12. Subagents
13. 项目知识接入
14. 验证闭环
15. 可控性与可观测性
16. 什么时候升级到 LangGraph
17. 做你自己的垂直 Coding Agent

## 依赖建议

```bash
pnpm add langchain @langchain/core @langchain/openai @langchain/langgraph deepagents zod dotenv
```

## 环境变量约定

教程代码统一使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY` / `OPENAI_BASE_URL`
- `MODEL_NAME`

如果底层服务是 OpenAI 兼容接口，只需要把它的地址写入 `OPENAI_BASE_URL` 即可。

官方参考：

- https://docs.langchain.com/oss/javascript/langchain/overview
- https://docs.langchain.com/oss/javascript/releases/langchain-v1
- https://docs.langchain.com/oss/javascript/deepagents/overview
- https://docs.langchain.com/oss/javascript/langgraph
