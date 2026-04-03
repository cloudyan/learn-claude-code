# 10 Planning

这是第 10 章配套示例。

这一章的重点不是再造一个新 agent，而是观察同一个 deep agent 在进入多步任务时：

- 会不会先形成计划
- 会不会把计划当成执行脚手架
- 会不会在执行过程中持续回到主线

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:10
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:10 -- "请先给出计划，再说明你会如何阅读当前仓库的 deepagents/README.md，不修改文件"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
阅读当前仓库的 deepagents/README.md，并先给出清晰计划，再总结你会如何推进，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `deep agent` 模式
- 重点观察计划如何帮助任务持续对齐目标

建议对照：

- [09-first-deep-coding-agent](/deepagents/examples/09-first-deep-coding-agent/README.md)
- [src/tools/plan.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/tools/plan.ts)
- [src/tools/read-plan.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/tools/read-plan.ts)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [10-planning.md](/deepagents/docs/10-planning.md)
