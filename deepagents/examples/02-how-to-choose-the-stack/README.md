# 02 How To Choose The Stack

这是第 2 章配套示例。

这一章的重点是技术选型判断，所以示例任务偏分析型：

- 比较 `LangChain v1`
- 比较 `Deep Agents`
- 比较 `LangGraph`

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:02
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:02 -- "请说明为什么这套教程不从 LangGraph 开始"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请比较 LangChain v1、Deep Agents、LangGraph 在 coding agent 教程中的分工，并给出适用场景。
```

## 当前实现

- 复用统一章节运行器
- 使用 `basic agent` 模式
- 重点观察模型如何组织技术栈比较，而不是仓库操作

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [02-how-to-choose-the-stack.md](/deepagents/docs/02-how-to-choose-the-stack.md)
