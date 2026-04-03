# 08 Why Deep Agents

这是第 8 章配套示例。

这一章的重点是做“抽象升级判断”：

- 为什么前半段用 `LangChain v1`
- 为什么主线到这里要切到 `Deep Agents`
- 这种切换解决的到底是什么问题

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:08
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:08 -- "请说明为什么 coding agent 教程主线会从最小能力闭环切到 Deep Agents"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请说明为什么在这套教程里，主线会从 LangChain v1 的最小 agent 升级到 Deep Agents。
```

## 当前实现

- 复用统一章节运行器
- 使用 `basic agent` 模式
- 重点是让模型进行抽象比较与升级判断

建议对照：

- [06-minimum-capabilities](/deepagents/examples/06-minimum-capabilities/README.md)
- [09-first-deep-coding-agent](/deepagents/examples/09-first-deep-coding-agent/README.md)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [08-why-deepagents.md](/deepagents/docs/08-why-deepagents.md)
