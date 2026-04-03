# 13 Project Knowledge

这是第 13 章配套示例。

这一章的重点是说明为什么 agent 不能只靠通用能力工作，而必须理解：

- 当前项目的约定
- 仓库结构
- 团队规范
- 任务特定上下文

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:13
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:13 -- "请解释为什么项目知识不应该全部直接塞进 system prompt"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
阅读 deepagents/docs/13-project-knowledge.md 和相关 README，总结项目知识为什么不能只塞进 prompt，不修改文件。
```

## 当前实现

- 复用统一章节运行器
- 使用 `deep agent` 模式
- 重点让 agent 解释项目知识接入和上下文外化

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [13-project-knowledge.md](/deepagents/docs/13-project-knowledge.md)
