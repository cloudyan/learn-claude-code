# 15 Observability And Control

这是第 15 章配套示例。

这一章现在已经升级成一个更强的独立 demo。

它不再只是“让 agent 解释可观测性和可控性”，而是会真实演示一条流程：

- 任务进入
- 计划生成
- 风险动作识别
- 审批门控
- 继续执行或停在人工确认点

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

如果你想模拟“审批已通过”的后续阶段，可以这样跑：

```bash
cd deepagents
pnpm dev:15 -- --auto-approve "请说明一个 coding agent 在执行文件修改前后，哪些步骤应该对用户可见"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请说明一个 coding agent 在执行文件修改前后，哪些步骤应该对用户可见，哪些操作适合加入人工确认。
```

## 当前实现

- 直接创建 `deep agent`
- 显式输出任务 intake、计划、审批门控和执行阶段
- 默认在高风险动作处停下来，模拟“等待人工确认”
- 也支持用 `--auto-approve` 模拟继续执行

这比单纯解释“哪些步骤应该可见”更能体现本章的核心机制。

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [15-observability-and-control.md](/deepagents/docs/15-observability-and-control.md)
