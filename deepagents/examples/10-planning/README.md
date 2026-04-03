# 10 Planning

这是第 10 章配套示例。

这一章现在已经升级成一个更强的独立 demo。

它不再只是“让 deep agent 讲一讲自己会先计划”，而是会真实执行一轮：

- 先由 agent 创建显式计划
- 再读取当前计划快照
- 再基于该计划执行前两步
- 最后再次读取计划并输出阶段性总结

所以这一章更适合用来观察 planning 到底是不是“任务脚手架”，而不只是回答里的一个漂亮列表。

这一章的重点是观察同一个 deep agent 在进入多步任务时：

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

- 直接创建 `deep agent`
- 先让 agent 显式生成计划
- 再通过 `read_plan` 读取计划快照
- 再基于计划执行一段阶段性任务

这比单纯“回答一个计划”更能体现本章的核心机制。

建议对照：

- [09-first-deep-coding-agent](/deepagents/examples/09-first-deep-coding-agent/README.md)
- [src/tools/plan.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/tools/plan.ts)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [10-planning.md](/deepagents/docs/10-planning.md)
