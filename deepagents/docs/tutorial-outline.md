# TypeScript + LangChain v1.x Coding Agent 教程大纲

## 教程定位

这是一套面向工程实践的教程，目标不是做一个“看起来会调用工具”的 agent，而是做一个真正能在代码库里完成任务的 coding agent。

技术栈固定为：

- TypeScript
- LangChain v1.x
- Deep Agents
- LangGraph

技术路线固定为：

1. `LangChain v1.x`：建立 agent 基础认知
2. `Deep Agents`：作为 coding agent 主线实现
3. `LangGraph`：作为进阶 orchestration 专题

## 目标读者

- 熟悉 TypeScript 基础语法
- 对 agent 开发有兴趣
- 想做 coding agent，而不是普通聊天机器人
- 希望理解设计取舍，而不是只会调用 API

## 全书结构

### 01. Coding Agent 是什么

学习目标：

- 区分聊天机器人、普通 tool-calling agent、coding agent
- 建立 coding agent 的最小心智模型

关键内容：

- coding agent 的工作对象是代码库和工程环境
- coding task 往往是多步、带反馈、需要验证的任务
- 最小组成：模型、工具、工作区、计划、验证、边界

### 02. LangChain v1、Deep Agents、LangGraph 如何分工

学习目标：

- 看懂三层技术栈的角色
- 明白为什么主线不应直接从 LangGraph 开始

关键内容：

- `LangChain v1` 负责基础 agent 构造
- `Deep Agents` 负责复杂 agent harness
- `LangGraph` 负责 durable execution 和复杂 orchestration

### 03. 用 LangChain v1 写第一个最小 Agent

学习目标：

- 理解 `createAgent`
- 理解模型、工具、消息如何构成最小 agent

关键内容：

- provider 初始化
- `zod` 工具 schema
- 最小 tool calling 示例

示例建议：

- `echo`
- `get_time`
- `list_files`

### 04. Tool Calling 的本质

学习目标：

- 理解 agent 为什么不是魔法
- 理解工具设计如何影响 agent 稳定性

关键内容：

- 工具描述和 schema
- 原子工具优于大而全工具
- 输入输出要适合模型消费

### 05. 为什么普通 Agent 做不好 Coding Task

学习目标：

- 看懂普通 agent 在工程任务中的失效模式

关键内容：

- 任务漂移
- 上下文污染
- 不会验证
- 缺少 repo awareness
- 容易误伤代码库

### 06. Coding Agent 的最小能力集

学习目标：

- 明确一个最小 coding agent 必须具备什么能力

关键内容：

- `read_file`
- `write_file`
- `edit_file`
- `bash`
- `plan`
- `verify`

### 07. TypeScript 工程化组织

学习目标：

- 把 demo 代码变成可维护项目

关键内容：

- provider 封装
- tools 目录设计
- prompts 分层
- shared utilities
- 环境变量与配置管理

### 08. 为什么进入 Deep Agents

学习目标：

- 理解为什么 coding agent 主线要切到 Deep Agents

关键内容：

- 手写基础 agent 的局限
- Deep Agents 在 planning、filesystem、subagents、memory 上的价值

### 09. 用 Deep Agents 做第一个 Coding Agent

学习目标：

- 做出一个真实可用的 coding agent 原型

关键内容：

- `createDeepAgent`
- 基础工具接入
- 真实代码任务示例

示例建议：

- 修一个 lint 错误
- 给函数补类型
- 为一个模块补测试

### 10. Planning：让 Agent 先想清楚再动手

学习目标：

- 理解 planning 在 coding task 中的作用

关键内容：

- 哪些任务必须先 plan
- 计划粒度怎么控制
- 如何避免 endless planning

### 11. Filesystem Context：让 Agent 真正进入代码库

学习目标：

- 理解文件系统为什么是 coding agent 的核心上下文

关键内容：

- workspace root
- safe path
- 输出截断
- 大文件处理
- 代码库作为外部记忆

### 12. Subagents：上下文隔离，不是多代理炫技

学习目标：

- 正确理解 subagent 的价值

关键内容：

- researcher agent
- coder agent
- reviewer agent
- 什么时候拆，什么时候不拆

### 13. 把项目知识接入 Agent

学习目标：

- 让 agent 懂项目，而不是只懂通用编程

关键内容：

- 目录约定
- 代码风格
- 架构原则
- 测试规范
- 常见排错文档

### 14. 验证闭环：改完不算完，验证通过才算完

学习目标：

- 建立 coding agent 的交付闭环

关键内容：

- lint
- test
- typecheck
- build
- smoke test
- 失败后的修复循环

### 15. 可控性：日志、轨迹、审批、人类接管

学习目标：

- 让 agent 真正可用而不是不可控

关键内容：

- tracing
- step visibility
- dangerous action gating
- human approval
- interrupt / resume

### 16. 什么时候升级到 LangGraph

学习目标：

- 知道什么时候值得下沉到底层 orchestration

关键内容：

- durable execution
- 明确状态机
- 人工审批节点
- 多阶段 workflow
- 长时运行任务

### 17. 做你自己的垂直 Coding Agent

学习目标：

- 把教程内容迁移到自己的实际工作场景

方向建议：

- 前端修复 agent
- 测试修复 agent
- 文档维护 agent
- code review agent
- PR 辅助 agent

## 推荐目录

```text
deepagents/
  docs/
    01-what-is-a-coding-agent.md
    02-how-to-choose-the-stack.md
    03-first-agent.md
    04-tool-calling.md
    05-why-general-agents-fail-at-coding.md
    06-minimum-capabilities.md
    07-project-structure.md
    08-why-deepagents.md
    09-first-deep-coding-agent.md
    10-planning.md
    11-filesystem-context.md
    12-subagents.md
    13-project-knowledge.md
    14-verification-loop.md
    15-observability-and-control.md
    16-when-to-use-langgraph.md
    17-build-your-own-specialized-agent.md
```

## 推荐依赖

```bash
pnpm add langchain @langchain/core @langchain/openai @langchain/langgraph deepagents zod dotenv
```

## 一句话路线

`LangChain v1` 打基础，`Deep Agents` 做主线，`LangGraph` 讲升级边界。
