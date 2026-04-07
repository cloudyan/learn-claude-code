# 17 Build Your Own Specialized Agent

这是第 17 章配套示例。

这一章现在已经升级成一个更强的独立 demo。

它不再只是“让 agent 给点方向建议”，而是会生成一份更结构化的垂直 agent 蓝图，包含：

- 名称
- 目标任务
- 工具集合
- 项目知识
- 验证方式
- 风险控制
- 为什么适合先做

这一章的重点是把前面学到的能力收束成一个边界更清晰的垂直 agent 方案。

常见方向包括：

- 前端页面 agent
- 测试修复 agent
- 文档维护 agent
- code review agent

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:17
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:17 -- "请设计一个适合小团队使用的测试修复 agent"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
请基于这套教程，设计一个适合小团队使用的垂直 coding agent，并说明它的任务边界、工具和验证方式。
```

## 当前实现

- 直接创建 `basic agent`
- 要求输出结构化蓝图而不是零散建议
- 让垂直 agent 的任务边界、工具和验证方式都显式化

这比普通“给一些方向建议”更适合作为全书收尾。

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [17-build-your-own-specialized-agent.md](/deepagents/docs/17-build-your-own-specialized-agent.md)
