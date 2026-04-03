# 14 Verification Loop

这是第 14 章配套示例。

这一章的重点是建立一个清晰的完成标准：

- 改完不算完成
- 验证通过才算完成
- `typecheck`、`lint`、`test`、`build` 各自承担不同层级的验证职责

这一章现在已经升级成一个更强的独立 demo。

它不再只是“让 agent 解释验证顺序”，而是会真正执行一轮：

- 先由 agent 生成验证策略
- 再扫描 `deepagents/package.json` 中可用的验证脚本
- 再实际执行这些脚本
- 最后输出验证闭环总结

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

- 直接创建 `coding agent`
- 先产出验证顺序和失败处理策略
- 再实际执行当前项目里可用的验证脚本
- 最后输出协调层总结

这比单纯“解释验证闭环”更能体现本章的核心机制。

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [14-verification-loop.md](/deepagents/docs/14-verification-loop.md)
