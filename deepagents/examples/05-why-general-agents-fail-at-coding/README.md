# 05 Why General Agents Fail At Coding

这是第 5 章配套示例。

这一章开始让 agent 面对更像真实工程任务的问题，用来观察：

- 为什么普通 agent 很容易漂移
- 为什么没有显式计划和验证会出问题
- 为什么仓库上下文策略会影响结果质量

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:05
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:05 -- "请解释一个普通 agent 在仓库任务中为什么容易漏掉验证步骤"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
阅读当前仓库的 deepagents/README.md，并说明如果没有显式计划、验证和仓库上下文策略，这类任务为什么容易失败，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `coding agent` 模式
- 重点不是修改文件，而是通过仓库任务暴露失败模式

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [05-why-general-agents-fail-at-coding.md](/deepagents/docs/05-why-general-agents-fail-at-coding.md)
