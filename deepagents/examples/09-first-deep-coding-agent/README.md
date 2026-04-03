# 09 First Deep Coding Agent

这是第 9 章配套示例：第一个 `Deep Agents` coding agent。

这一章是真正切入 `Deep Agents` 主线的起点，重点是观察：

- deep agent 如何进入仓库
- 它和前面的最小 coding agent 有什么升级
- 为什么它更适合承接后续 planning、filesystem、subagents

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:09
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:09 -- "读取当前仓库的 README，并给出一份不改文件的总结"
```

也可以单独进入示例目录运行：

```bash
cd deepagents/examples/09-first-deep-coding-agent
cp .env.example .env
pnpm install
pnpm dev "读取当前仓库的 README，并给出一份不改文件的总结"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
读取当前仓库的 README，并给出一份不改文件的总结
```

## 当前实现

- 使用共享的 `createDeepCodingAgent`
- 接入 `Deep Agents` 路线下的工具组合
- 作为后续 `10-12` 章的重要基础示例

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [09-first-deep-coding-agent.md](/deepagents/docs/09-first-deep-coding-agent.md)
