# Examples Layout

这个目录存放教程配套的示例。

从现在开始，示例策略调整为：

- 每个章节至少有一个示例入口
- 不是每个章节都必须立刻拥有完整可运行项目
- 但每个章节都必须有一个明确的“示例落点”

也就是说，`examples/` 会分成两层：

- `chapter-*` 风格的章节入口目录：保证每章都有示例
- 少量真正独立可运行的项目目录：承载主线关键节点

## 当前目录约定

```text
examples/
  01-what-is-a-coding-agent/
  02-how-to-choose-the-stack/
  03-first-agent/
  04-tool-calling/
  05-why-general-agents-fail-at-coding/
  06-minimum-capabilities/
  07-project-structure/
  08-why-deepagents/
  09-first-deep-coding-agent/
  10-planning/
  11-filesystem-context/
  12-subagents/
  13-project-knowledge/
  14-verification-loop/
  15-observability-and-control/
  16-when-to-use-langgraph/
  17-build-your-own-specialized-agent/

  03-first-agent/
  06-minimum-capabilities/
  09-first-deep-coding-agent/
```

## 示例类型

每章的示例入口现在都应该是可执行的。

不过可执行不等于复杂度完全相同：

| 类型 | 说明 |
|---|---|
| 运行型示例 | 直接调用某一类 agent 完成章节任务 |
| 复用型示例 | 章节入口复用已有主线能力，但仍可直接运行 |
| 轻量型示例 | 任务更轻，偏说明或分析，但仍然可执行 |

## 当前主线示例

- `03-first-agent/`
  - 最小 `LangChain v1` agent
- `06-minimum-capabilities/`
  - 最小可用 coding agent
- `09-first-deep-coding-agent/`
  - 第一个 `Deep Agents` coding agent

## 章节示例映射

| 章节目录 | 当前类型 | 对应实现 |
|---|---|---|
| `01-what-is-a-coding-agent/` | 轻量型示例 | `basic agent` 概念说明任务 |
| `02-how-to-choose-the-stack/` | 轻量型示例 | `basic agent` 选型对比任务 |
| `03-first-agent/` | 运行型示例 | 本章独立示例 |
| `04-tool-calling/` | 复用型示例 | 复用 `basic agent` 观察工具调用 |
| `05-why-general-agents-fail-at-coding/` | 运行型示例 | `coding agent` 失败模式分析任务 |
| `06-minimum-capabilities/` | 运行型示例 | 本章独立示例 |
| `07-project-structure/` | 运行型示例 | `coding agent` 工程分层说明任务 |
| `08-why-deepagents/` | 轻量型示例 | `basic agent` 抽象升级解释任务 |
| `09-first-deep-coding-agent/` | 运行型示例 | 本章独立示例 |
| `10-planning/` | 运行型示例 | `deep agent` planning 任务 |
| `11-filesystem-context/` | 运行型示例 | `deep agent` 仓库搜索任务 |
| `12-subagents/` | 运行型示例 | `deep agent` 子代理源码阅读任务 |
| `13-project-knowledge/` | 运行型示例 | `deep agent` 项目知识接入任务 |
| `14-verification-loop/` | 运行型示例 | `coding agent` 验证策略任务 |
| `15-observability-and-control/` | 运行型示例 | `deep agent` 可控性说明任务 |
| `16-when-to-use-langgraph/` | 轻量型示例 | `basic agent` 架构边界判断任务 |
| `17-build-your-own-specialized-agent/` | 轻量型示例 | `basic agent` 垂直 agent 设计任务 |

## 当前目标

当前已经确保：

- `01-17` 每章都有示例入口目录
- `01-17` 每章都可以直接运行
- 主线关键章节仍然保持更强的独立示例形态
