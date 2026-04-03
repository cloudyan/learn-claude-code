# 17 Build Your Own Specialized Agent

这是第 17 章配套示例。

这一章的重点是把前面学到的能力收束成一个边界更清晰的垂直 agent 方案。

常见方向包括：

- 前端页面 agent
- 测试修复 agent
- 文档维护 agent
- code review agent

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:17
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:17 -- "请设计一个适合小团队使用的测试修复 agent"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请基于这套教程，设计一个适合小团队使用的垂直 coding agent，并说明它的任务边界、工具和验证方式。
```

## 当前实现

- 复用统一章节运行器
- 使用 `basic agent` 模式
- 重点让 agent 输出一个边界清晰的垂直方案

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [17-build-your-own-specialized-agent.md](/deepagents/docs/17-build-your-own-specialized-agent.md)
