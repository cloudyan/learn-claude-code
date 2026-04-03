# 07 Project Structure

这是第 7 章配套示例。

这一章的重点不是引入新的 agent 能力，而是借助一次可执行任务去解释：

- 为什么 `docs/`、`examples/`、`src/` 要分层
- 为什么示例目录和共享源码要分开
- 为什么从这一章开始需要更稳定的工程组织

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:07
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:07 -- "总结 deepagents 目录里 docs、examples、src 三层分工"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
阅读 deepagents/src/README.md 和 deepagents/examples/README.md，总结 docs、examples、src 三层分工，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `coding agent` 模式
- 重点让 agent 读取当前工程说明并解释项目分层

建议结合这些内容一起看：

- [06-minimum-capabilities](/deepagents/examples/06-minimum-capabilities/README.md)
- [src/README.md](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/README.md)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [07-project-structure.md](/deepagents/docs/07-project-structure.md)
