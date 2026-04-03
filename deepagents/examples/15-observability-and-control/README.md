# 15 Observability And Control

这是第 15 章配套示例。

这一章的重点是解释：

- 为什么 agent 的执行过程要尽量可见
- 哪些步骤适合展示给用户
- 哪些操作应该加入人工确认

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:15
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:15 -- "请说明一个 coding agent 在执行文件修改前后，哪些步骤应该对用户可见"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请说明一个 coding agent 在执行文件修改前后，哪些步骤应该对用户可见，哪些操作适合加入人工确认。
```

## 当前实现

- 复用统一章节运行器
- 使用 `deep agent` 模式
- 重点让 agent 解释日志、审批和人工接管的边界

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [15-observability-and-control.md](/deepagents/docs/15-observability-and-control.md)
