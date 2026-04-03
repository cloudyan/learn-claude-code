# 11 Filesystem Context

这是第 11 章配套示例。

这一章的重点是观察 deep agent 如何进入真实仓库：

- 是否先搜索再读取
- 是否按局部逐步聚焦
- 是否有明确的 workspace 边界

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:11
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:11 -- "请先搜索 deepagents 目录下和 subagent 相关的内容，再给出你定位到的关键文件，不修改文件"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请在当前仓库中先搜索 deepagents 目录下和 planning 相关的内容，再给出你定位到的关键文件，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `deep agent` 模式
- 重点观察搜索优先、局部读取和路径边界

建议对照：

- [09-first-deep-coding-agent](/deepagents/examples/09-first-deep-coding-agent/README.md)
- [src/tools/list-files.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/tools/list-files.ts)
- [src/tools/search-text.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/tools/search-text.ts)
- [src/shared/workspace.ts](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/shared/workspace.ts)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [11-filesystem-context.md](/deepagents/docs/11-filesystem-context.md)
