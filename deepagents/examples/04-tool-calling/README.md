# 04 Tool Calling

这是第 4 章配套示例。

这一章继续使用基础 agent，但重点已经从“agent 是什么”转向：

- 工具描述是否清晰
- 工具边界是否足够明确
- 模型如何决定先调用哪个工具

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:04
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:04 -- "请先调用 get_time，再使用 echo 原样返回“tool calling 需要清晰 schema”"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请先调用 get_time，再使用 echo 原样返回“tool calling 依赖清晰的工具边界”。
```

## 当前实现

- 复用统一章节运行器
- 使用 `basic agent` 模式
- 任务会引导模型连续调用 `get_time` 与 `echo`

最适合和下面这些内容一起对照看：

- [03-first-agent](/deepagents/examples/03-first-agent/README.md)
- [src/tools/index.ts](/deepagents/src/tools/index.ts)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [04-tool-calling.md](/deepagents/docs/04-tool-calling.md)
