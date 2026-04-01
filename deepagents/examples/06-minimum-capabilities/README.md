# 06 Minimum Capabilities

这是第 6 章配套示例：一个最小可用的 coding agent。

## 功能

- 使用共享的 `createCodingAgent`
- 接入最小 coding agent 工具集
- 演示读文件、搜索、计划和命令执行

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:06 -- "阅读当前仓库的 deepagents/README.md，并给出一份执行计划，不修改文件"
```

也可以单独进入示例目录运行：

```bash
cd deepagents/examples/06-minimum-capabilities
cp .env.example .env
pnpm install
pnpm dev "阅读当前仓库的 deepagents/README.md，并给出一份执行计划，不修改文件"
```

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY` / `OPENAI_BASE_URL`
- `MODEL_NAME`

## 说明

这个示例属于教程前半段，重点是建立最小 coding agent 闭环，而不是一开始就进入复杂 Deep Agents 工作流。
