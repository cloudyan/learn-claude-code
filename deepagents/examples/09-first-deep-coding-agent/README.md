# 09 First Deep Coding Agent

这是第 9 章配套示例：第一个 `Deep Agents` coding agent。

## 功能

- 使用共享的 `createDeepCodingAgent`
- 接入文件、搜索、编辑、命令和计划工具
- 演示一个最小代码任务闭环

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:09 -- "读取当前仓库的 README，并给出一份不改文件的总结"
```

也可以单独进入示例目录运行：

```bash
cd deepagents/examples/09-first-deep-coding-agent
cp .env.example .env
pnpm install
pnpm dev "读取当前仓库的 README，并给出一份不改文件的总结"
```

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY` / `OPENAI_BASE_URL`
- `MODEL_NAME`

## 说明

这个示例是主线起点。它比最小 agent 更接近真实 coding task，但仍然刻意控制复杂度。
