# Docs Guide

这个目录存放整套教程的正文文档。

现在它的角色已经不只是“放 Markdown 文件”，而是承担整套教程的主叙事：

- `docs/` 负责讲清思路
- `examples/` 负责给出可执行入口
- `src/` 负责沉淀共享实现

如果你是第一次进入这个项目，建议先从这里开始读。

## 推荐阅读顺序

最推荐的阅读顺序是：

1. [README.md](/deepagents/docs/README.md)
2. [tutorial-outline.md](/deepagents/docs/tutorial-outline.md)
3. [ROADMAP.md](/deepagents/docs/ROADMAP.md)
4. 再按章节顺序阅读 `01-17`

如果你想直接跟主线跑，最推荐这条顺序：

1. [03-first-agent.md](/deepagents/docs/03-first-agent.md)
2. [06-minimum-capabilities.md](/deepagents/docs/06-minimum-capabilities.md)
3. [09-first-deep-coding-agent.md](/deepagents/docs/09-first-deep-coding-agent.md)
4. [10-planning.md](/deepagents/docs/10-planning.md)
5. [11-filesystem-context.md](/deepagents/docs/11-filesystem-context.md)
6. [12-subagents.md](/deepagents/docs/12-subagents.md)

## 这套教程怎么分层

当前整套教程可以按三层来理解。

### 1. 前置认知层

负责把问题空间和技术栈边界讲清楚：

- `01` 什么是 coding agent
- `02` 技术栈如何分工
- `04` tool calling 的本质
- `05` 为什么普通 agent 不够
- `08` 为什么进入 `Deep Agents`

### 2. 主线实战层

负责承载真正的主战场：

- `03` 第一个最小 agent
- `06` 最小 coding agent 能力闭环
- `09` 第一个 deep coding agent
- `10` planning
- `11` filesystem context
- `12` subagents

### 3. 工程化与落地层

负责从“能跑”走向“更可用”：

- `07` 项目结构
- `13` 项目知识接入
- `14` 验证闭环
- `15` 可控性
- `16` 什么时候升级到 `LangGraph`
- `17` 做你自己的垂直 agent

## 术语约定

为了避免整套教程风格漂移，正文默认使用下面这些核心表述：

- `LangChain v1`：基础 agent 构造层
- `Deep Agents`：coding agent 主线层
- `LangGraph`：进阶 orchestration 层
- `coding agent`：正文默认写法；标题中可写作 `Coding Agent`
- `filesystem context`：把代码库视作外部记忆的工作方式
- `subagents`：以职责和上下文隔离为中心的子代理机制

## 文档写作约定

每章尽量遵循同一套结构：

1. 这一章解决什么问题
2. 为什么上一章还不够
3. 本章引入什么新机制
4. 和示例或源码如何对应
5. 这一章故意不解决什么
6. 下一章为什么自然出现

这样做的目的，是让整套教程更像一条连续主线，而不是 17 篇独立文章。

## 和示例的关系

现在这套教程已经改成：

- `01-17` 每章都在 `examples/` 下有一个对应目录
- `01-17` 每章都可以直接运行
- 主线章节仍然保留更强的独立示例形态

如果你想从正文直接跳到示例入口，可以看：

- [examples/README.md](/deepagents/examples/README.md)

## 和源码的关系

正文不是孤立存在的，它和代码目录是配套推进的：

- `docs/`：负责教程叙事
- `examples/`：负责教学示例
- `src/`：负责沉淀共享实现

如果你准备对照源码阅读，推荐同时打开：

- [src/README.md](/deepagents/src/README.md)

## 配套文件

- [tutorial-outline.md](/deepagents/docs/tutorial-outline.md)：全书总纲
- [ROADMAP.md](/deepagents/docs/ROADMAP.md)：章节推进策略
- [writing-template.md](/deepagents/docs/writing-template.md)：章节写作模板
- [_sidebar.md](/deepagents/docs/_sidebar.md)：文档站侧边栏
- [_navbar.md](/deepagents/docs/_navbar.md)：文档站导航栏

## 当前状态

目前这套文档已经完成了：

- 主线章节的首轮系统扩写
- 文档术语和章节承接的一轮统一
- 文档与示例之间的基础映射

接下来更值得继续增强的是：

- 继续打磨工程化章节的案例密度
- 让正文和示例之间的双向链接更明显
- 继续优化文档站入口体验
