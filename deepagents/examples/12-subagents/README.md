# 12 Subagents

这是第 12 章配套示例。

这一章的重点是理解 subagents 的职责边界，而不是做“多代理炫技”。

运行这个示例时，最适合观察的问题是：

- 为什么要拆子代理
- research 和 reviewer 的边界分别是什么
- subagent 的价值为什么首先是上下文隔离

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:12
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:12 -- "请总结 deepagents/src/deep-agents 里 research 和 reviewer 两类子代理分别适合做什么"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
阅读 deepagents/src/deep-agents 目录下和 subagent 相关的实现，总结 research 和 reviewer 两类子代理分别适合做什么，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `deep agent` 模式
- 重点让 agent 阅读当前项目里的 subagent 实现并做角色边界总结

建议对照：

- [src/deep-agents/create-research-subagent.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/deep-agents/create-research-subagent.ts)
- [src/deep-agents/create-reviewer-subagent.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/deep-agents/create-reviewer-subagent.ts)
- [src/deep-agents/create-deep-coding-agent.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/deep-agents/create-deep-coding-agent.ts)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [12-subagents.md](/deepagents/docs/12-subagents.md)
