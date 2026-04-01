# 01 What Is A Coding Agent

这是第 1 章配套示例。

这一章仍然是概念入口，但现在已经可以直接运行，用一个轻量任务去观察：

- 什么是 coding agent 的最小闭环
- 为什么它不是普通聊天机器人
- 为什么它必须和任务、环境、验证绑定在一起

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:01
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:01 -- "请解释 coding agent 和普通 tool-calling agent 的差别"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请用简洁结构说明一个 coding agent 的最小闭环，包含任务理解、代码读取、修改、验证和汇报。
```

## 当前实现

- 复用统一章节运行器
- 使用 `basic agent` 模式
- 重点放在概念说明，而不是仓库操作

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [01-what-is-a-coding-agent.md](/deepagents/docs/01-what-is-a-coding-agent.md)
