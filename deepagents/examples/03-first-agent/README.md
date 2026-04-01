# 03 First Agent

这是第 3 章配套示例：一个最小可运行的 `LangChain v1` agent。

## 功能

- 使用 `createAgent`
- 提供两个最小工具：`echo` 和 `get_time`
- 演示最基础的 tool calling

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:03 -- "告诉我现在时间，并把这句话原样返回"
```

也可以单独进入示例目录运行：

```bash
cd deepagents/examples/03-first-agent
cp .env.example .env
pnpm install
pnpm dev "告诉我现在时间，并把这句话原样返回"
```

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 说明

这个示例故意不引入文件系统、shell、planning，只负责把最小 agent 闭环讲清楚。
