# 13 Project Knowledge

这是第 13 章配套示例。

这一章现在已经升级成一个更强的独立 demo。

它会真实执行两轮对比：

- 第一轮：不注入项目知识，直接回答任务
- 第二轮：读取项目知识包，再回答同一个任务

这样你可以直接观察：

- 没有项目知识时，输出更通用
- 注入项目知识后，输出更贴近当前仓库约定

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

- 直接创建 `deep agent`
- 先生成一版不带项目知识的建议
- 再读取项目知识包并生成第二版建议
- 最后输出对比后的收束结论

这比只让 agent 解释“为什么需要项目知识”更贴近本章真正关心的问题。

当前示例里的项目知识包在这里：

- [project-knowledge.md](/deepagents/examples/13-project-knowledge/project-knowledge.md)

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [13-project-knowledge.md](/deepagents/docs/13-project-knowledge.md)
