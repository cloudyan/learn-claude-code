# 12 Subagents

这是第 12 章配套示例。

这一章现在已经升级成一个更强的独立 demo。

它不再只是“让一个 agent 去读源码并总结”，而是会真正执行一次：

- `researcher` 子代理先做探索和总结
- `reviewer` 子代理再对研究结论做风险审查
- 最后由主流程输出一份收束结论

也就是说，这个示例已经开始接近“主代理编排子代理”的形态，而不是单纯说明型入口。

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

- 直接创建 `researcher` 与 `reviewer` 两个子代理
- 先由 `researcher` 做仓库探索和职责总结
- 再由 `reviewer` 对职责划分、风险和遗漏做审查
- 最后输出协调层总结

这比普通“单 agent 总结”更适合体现本章主题。

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
