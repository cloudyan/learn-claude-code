# Examples Guide

这个目录存放整套教程的配套示例。

现在的目标很明确：

- `01-17` 每章都有一个示例目录
- `01-17` 每章都可以直接运行
- 主线关键章节保留更强的独立示例形态

也就是说，这里已经不是“少数 demo + 大量占位说明”，而是一套完整的章节示例入口。

## 快速开始

在仓库根目录执行：

```bash
cd deepagents
cp .env.example .env
npm install
```

然后按章节运行：

```bash
npm run dev:01
npm run dev:03
npm run dev:09
```

也可以传入自定义任务：

```bash
npm run dev:10 -- "请先给出计划，再说明你会如何阅读当前仓库的 README，不修改文件"
```

## 环境变量

所有示例统一使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

默认示例文件中的推荐值是：

```text
OPENAI_BASE_URL=https://opencode.ai/zen/v1
MODEL_NAME=gpt-5-nona
```

## 运行方式

每个章节目录都具备：

- `README.md`
- `package.json`
- `src/index.ts`
- `.env.example`
- `tsconfig.json`

因此有两种常用运行方式。

在根目录运行：

```bash
cd deepagents
npm run dev:07
```

在单章节目录运行：

```bash
cd deepagents/examples/07-project-structure
node src/index.ts
```

## 示例分层

虽然每章都能运行，但它们的复杂度并不完全相同。

| 类型 | 说明 |
|---|---|
| 主线示例 | 真正承载主战场的核心示例 |
| 机制型独立 demo | 单独突出某一章核心机制的可执行示例 |
| 对比型独立 demo | 用两轮或多轮对比直接体现差异 |
| 流程型独立 demo | 显式展示任务流转、门控或状态推进 |
| 决策型独立 demo | 用多个场景逐个判断边界和升级条件 |
| 蓝图型独立 demo | 输出结构化方案，作为落地起点 |
| 复用示例 | 复用现有 agent 能力来说明新的章节主题 |
| 轻量示例 | 更偏解释、比较、设计判断，但仍可执行 |

## 推荐阅读与运行顺序

如果你想按教程主线走，最推荐这条顺序：

1. `03-first-agent`
2. `06-minimum-capabilities`
3. `09-first-deep-coding-agent`
4. `10-planning`
5. `11-filesystem-context`
6. `12-subagents`

对应命令：

```bash
cd deepagents
npm run dev:03
npm run dev:06
npm run dev:09
npm run dev:10
npm run dev:11
npm run dev:12
```

## 主线示例

这 3 个是整套教程目前最重要的主线示例：

| 章节 | 目录 | 作用 |
|---|---|---|
| `03` | `03-first-agent/` | 最小 `LangChain v1` agent |
| `06` | `06-minimum-capabilities/` | 最小可用 coding agent |
| `09` | `09-first-deep-coding-agent/` | 第一个 `Deep Agents` coding agent |

## 机制型独立 Demo

下面这些章节已经从普通“可执行入口”升级成了更强的独立 demo：

| 章节 | 目录 | 机制重点 |
|---|---|---|
| `10` | `10-planning/` | 计划生成、读取计划、基于计划推进 |
| `11` | `11-filesystem-context/` | `list -> search -> read -> summarize` |
| `12` | `12-subagents/` | `researcher` 与 `reviewer` 子代理编排 |
| `13` | `13-project-knowledge/` | 不带项目知识与带项目知识两轮输出对比 |
| `14` | `14-verification-loop/` | 先制定验证策略，再实际执行验证脚本 |
| `15` | `15-observability-and-control/` | 任务 intake、审批门控与继续执行流程 |
| `16` | `16-when-to-use-langgraph/` | 多场景逐个判断是否升级到 `LangGraph` |
| `17` | `17-build-your-own-specialized-agent/` | 输出结构化垂直 agent 蓝图 |

如果你想看“章节核心机制被单独演示出来”的示例，优先跑这几个。

## 全部章节示例

| 章节 | 目录 | 类型 | 说明 |
|---|---|---|---|
| `01` | `01-what-is-a-coding-agent/` | 轻量示例 | coding agent 概念与最小闭环 |
| `02` | `02-how-to-choose-the-stack/` | 轻量示例 | 技术栈分工与选型判断 |
| `03` | `03-first-agent/` | 主线示例 | 最小 agent |
| `04` | `04-tool-calling/` | 复用示例 | 观察工具调用边界 |
| `05` | `05-why-general-agents-fail-at-coding/` | 复用示例 | 解释失败模式 |
| `06` | `06-minimum-capabilities/` | 主线示例 | 最小 coding agent 闭环 |
| `07` | `07-project-structure/` | 复用示例 | 工程分层说明 |
| `08` | `08-why-deepagents/` | 轻量示例 | 为什么主线切到 `Deep Agents` |
| `09` | `09-first-deep-coding-agent/` | 主线示例 | deep agent 主线起点 |
| `10` | `10-planning/` | 机制型独立 demo | planning 作为任务脚手架 |
| `11` | `11-filesystem-context/` | 机制型独立 demo | 搜索优先与局部读取 |
| `12` | `12-subagents/` | 机制型独立 demo | subagents 的职责边界 |
| `13` | `13-project-knowledge/` | 对比型独立 demo | 项目知识接入 |
| `14` | `14-verification-loop/` | 机制型独立 demo | 验证闭环与完成标准 |
| `15` | `15-observability-and-control/` | 流程型独立 demo | 可见性、审批与人类接管 |
| `16` | `16-when-to-use-langgraph/` | 决策型独立 demo | LangGraph 升级边界 |
| `17` | `17-build-your-own-specialized-agent/` | 蓝图型独立 demo | 垂直 agent 方案设计 |

## 和源码的关系

这些示例不是彼此孤立的。

它们主要复用三层共享实现：

- `src/agents/`
- `src/deep-agents/`
- `src/shared/`

如果你已经在读正文，推荐和下面这些入口一起对照：

- [src/README.md](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/src/README.md)
- [docs/README.md](/Users/cloudyan/.codex/worktrees/be22/learn-claude-code/deepagents/docs/README.md)

## 当前状态

当前已经完成：

- 每章一个示例目录
- 每章一个可执行入口
- 每章统一的 README 结构
- 后半段关键章节已经逐步升级成更贴近主题的独立 demo

后续更值得继续增强的方向是：

- 继续把更多复用示例升级成更强的独立 runnable demo
- 给主线示例补更贴近真实仓库任务的默认任务
- 继续提升示例与正文章节之间的双向链接
