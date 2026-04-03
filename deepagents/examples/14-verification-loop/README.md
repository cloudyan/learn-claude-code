# 14 Verification Loop

这是第 14 章配套示例。

这一章的重点是建立一个清晰的完成标准：

- 改完不算完成
- 验证通过才算完成
- `typecheck`、`lint`、`test`、`build` 各自承担不同层级的验证职责

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:14
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:14 -- "请给出一个适合 TypeScript 项目的验证顺序，并说明每一步为什么重要"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请结合当前仓库，给出一个适合 coding agent 的验证顺序，至少包含 typecheck、lint 或 test 中的两种，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `coding agent` 模式
- 重点让 agent 解释验证闭环，而不是直接做代码修改

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [14-verification-loop.md](/deepagents/docs/14-verification-loop.md)
