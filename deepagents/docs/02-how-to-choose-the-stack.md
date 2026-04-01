# 02. LangChain v1、Deep Agents、LangGraph 如何分工

## 这一章解决什么问题

进入 LangChain 体系时，很多人最先遇到的问题不是“怎么写代码”，而是“应该选哪一个”。

这一章要回答三个问题：

- `LangChain v1` 适合做什么
- `Deep Agents` 适合做什么
- `LangGraph` 适合做什么

这三个名字如果不先讲清楚，后面整套教程会很容易显得：

- 名词很多
- 抽象很多
- 但读者不知道为什么要按这个顺序学

所以这一章的任务不是讲 API，而是讲分层。

## 为什么需要先讲分工

如果不先讲清楚三者的边界，教程很容易陷入两个常见误区：

- 一上来用最复杂的抽象，结果还没理解 agent 就先被 orchestration 绕晕
- 只停留在最浅层的 agent API，结果做不出真正能工作的 coding agent

所以这一章其实承担的是“选路线”的作用。

它的价值在于帮助读者建立一个稳定判断：

- 什么应该先学
- 什么应该放后面
- 什么才是 coding agent 主线最合适的承载层

## 先记住一句话

**这三者不是互斥关系，而是不同层级的分工。**

这是整章最重要的一句话。

如果把它们误解成“三选一”，你后面会很容易掉进错误比较：

- 哪个更高级
- 哪个更新潮
- 哪个功能更多

但真正该问的问题是：

- 当前问题属于哪个层级

## 核心概念

### 1. LangChain v1 是基础 agent 构造层

`LangChain v1` 更适合用来讲：

- agent 的基本构成
- tool calling
- schema 设计
- 消息推进
- 最小 agent 循环

它适合做教程前半段，因为它足够清晰，足够透明。

换句话说，它特别适合回答：

- agent 最小闭环是什么
- 工具是怎么进入模型决策的
- `createAgent` 到底帮你做了什么

所以这套教程里：

- 第 3 章用它来讲最小 agent
- 第 6 章继续用它来讲最小 coding agent 能力

### 2. Deep Agents 是 coding agent 主线层

当任务进入代码修改、规划、子任务拆解、长上下文治理这些问题时，教程主线就应该切到 `Deep Agents`。

它更贴近真实 coding agent 的能力形态，比如：

- planning
- filesystem context
- subagents
- 更复杂任务的推进

它的价值不只是“封装更多”，而是：

- 更接近真实 coding agent 的工作方式

也正因为如此，这套教程在第 9 章才正式切到 `Deep Agents` 主线，而不是一开始就用它讲基础概念。

### 3. LangGraph 是 orchestration 层

`LangGraph` 不是为了“显得更高级”，而是为了解决更强的控制问题，比如：

- durable execution
- 明确状态机
- 多阶段 workflow
- human-in-the-loop
- 长时间运行与恢复

也就是说，`LangGraph` 更像是你在复杂系统阶段才真正需要的下层能力。

它解决的不是：

- “agent 能不能工作”

而是：

- “系统如何以更明确的流程和状态稳定工作”

## 为什么这套教程不从 LangGraph 开始

很多人看到 `LangGraph` 会本能觉得：

- 更底层
- 更灵活
- 更专业

这些都没错。

但如果放在教程入口，它会马上带来一个问题：

读者会把注意力放在：

- 图怎么拆
- 状态怎么流转
- 节点怎么编排

而忽略真正更应该先理解的东西：

- agent 为什么需要工具
- coding task 为什么需要 planning
- 为什么文件系统是上下文的一部分
- 为什么验证闭环会改变任务结构

所以这套教程故意不把 `LangGraph` 放在最前面。

不是因为它不重要，而是因为它解决的是“控制复杂性”的问题，而不是“理解 agent 本质”的问题。

## 推荐学习顺序

这套教程采用下面的顺序：

1. 用 `LangChain v1` 讲清 agent 基础
2. 用 `Deep Agents` 做 coding agent 主线
3. 用 `LangGraph` 讨论何时需要更强编排

这样安排的原因很简单：

- 先把 agent 本质讲明白
- 再把 coding agent 做出来
- 最后才讨论复杂调度

这其实也是一条“问题驱动”的路线：

- 先解决理解问题
- 再解决实现问题
- 再解决 orchestration 问题

## 一个简单的判断标准

如果你在做的是下面这些事情，优先从 `LangChain v1` 开始：

- 第一个 tool-calling agent
- 学习 agent 的基本心智模型
- 理解 schema、tool、message 的关系

如果你在做的是下面这些事情，优先进入 `Deep Agents`：

- 修 bug
- 重构小模块
- 补测试
- 让 agent 在代码库里持续推进任务

如果你在做的是下面这些事情，才考虑 `LangGraph`：

- 任务需要中断恢复
- 有明确审批节点
- 有多阶段持久工作流
- 需要稳定的状态机编排

这套判断标准几乎就是后面整套教程的路线图。

## 这一章和后续章节的关系

这一章很重要，因为它决定了后面章节的阅读心态。

读者如果先建立了正确分工，后面就更容易理解：

- 为什么第 3 章和第 6 章还在讲 `LangChain v1`
- 为什么第 9 章才切到 `Deep Agents`
- 为什么 `LangGraph` 被放到后面才讲

如果没有这一章，后面很多主线选择都会看起来像“作者随便安排的”。

## 本章最重要的设计取舍

这一章的取舍其实就是整套教程的取舍：

- 如果目标是“理解 agent 原理”，基础 `LangChain v1` 已经足够
- 如果目标是“做出一个可用的 coding agent”，教程主线应该切到 `Deep Agents`
- 如果目标是“控制更复杂的系统流程”，再进入 `LangGraph`

所以这套教程不是在比较：

- 谁更强

而是在设计：

- 谁该先出现

## 本章真正要让读者学会什么

读完这一章，读者应该真正理解：

- `LangChain v1`、`Deep Agents`、`LangGraph` 不是互斥关系，而是不同层级的分工
- `LangChain v1` 最适合做认知入口
- `Deep Agents` 最适合做 coding agent 主线
- `LangGraph` 最适合处理更复杂的 orchestration 需求

## 本章结论

- `LangChain v1` 是基础层，适合讲清 agent 的构成。
- `Deep Agents` 是 coding agent 主线层，适合承载真实代码任务。
- `LangGraph` 是进阶 orchestration 层，适合解决更复杂的系统控制问题。

## 下一章预告

下一章我们先不用复杂任务，直接用 `LangChain v1` 写一个最小 agent，把模型、工具和消息推进这三件事彻底讲清楚。
