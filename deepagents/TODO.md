# TODO

这份待办用于记录这套 TypeScript + LangChain v1.x + Deep Agents 教程的后续演进事项。

当前原则：

- 先保持教程主线简单、可讲、可实现
- 不过早引入复杂抽象
- 只有在真实业务场景出现后，再推进更细的分层设计
- 这里记录的不只是 Prompt 设计，还包括所有“初始教程先不展开，但后续真实项目中可能需要”的复杂度来源

## 当前不急着做

### Prompt 分层升级

暂不引入更复杂的 prompt 架构，比如：

- `system/`
- `roles/`
- `partials/`
- `PromptTemplate`
- prompt composer

原因：

- 当前教程阶段以静态 prompt 为主
- 直接用中文字符串常量更清晰、更适合教学
- 过早抽象会增加理解成本

### 复杂 harness 设计

暂不引入更复杂的 harness 机制，比如：

- 长生命周期任务系统
- 更细粒度权限控制
- 多工作区隔离
- 后台任务与通知系统
- 复杂的人类审批流

原因：

- 初始教程先聚焦最小可用 coding agent
- 如果过早把 harness 做厚，主线会被基础设施淹没
- 这些能力更适合放在进阶和真实项目阶段展开

## 后续进阶可考虑

### 1. Prompt 分层设计

适用信号：

- prompt 开始出现大量变量插槽
- 不同 agent 角色之间存在明显复用
- 需要复用通用规则和局部片段

可考虑方向：

- 把 prompt 拆成 `system/`、`roles/`、`partials/`
- 引入 `PromptTemplate` 管理动态变量
- 为不同任务类型提供 prompt composer

### 2. 面向业务场景的 agent 分层

适用信号：

- 教程进入具体业务场景
- 需要支持前端、后端、测试、review 等不同 agent
- 工具、prompt、验证策略开始明显分化

可考虑方向：

- 按业务域拆 agent 模块
- 按任务类型拆 prompt 与 verification policy
- 把通用 coding agent 和垂直 agent 分开组织

### 3. 更复杂的上下文注入机制

适用信号：

- 项目知识来源变多
- 需要按任务动态注入 repo context
- 需要更细粒度的知识加载

可考虑方向：

- prompt 输入参数化
- repo summary / task brief / constraints 分层注入
- 项目知识资源的加载器和选择器

### 4. Harness 分层设计

适用信号：

- agent 不再只是单次运行脚本
- 开始需要更稳定的任务推进与环境治理
- 工具、权限、知识、状态管理逐渐变厚

可考虑方向：

- 把 model、tools、memory、task runtime、approval、workspace boundary 分层
- 明确 agent core 和 harness 的边界
- 将“模型决策逻辑”和“系统控制逻辑”彻底拆开

### 5. 任务系统与状态持久化

适用信号：

- 一个任务会跨多轮、多次运行继续推进
- 需要中断后恢复
- 需要明确记录任务状态和子任务状态

可考虑方向：

- todo / task board 持久化
- agent run state 存储
- step history / result history 持久化
- 任务 claim / release 机制

### 6. Memory 分层

适用信号：

- 除了当前对话，还需要跨任务保留经验
- 需要区分短期工作记忆和长期知识

可考虑方向：

- short-term memory
- task memory
- repo memory
- long-term memory
- memory compaction / summarization

### 7. Tool 权限与安全策略

适用信号：

- 工具开始涉及更高风险动作
- 项目开始面向团队或真实生产环境

可考虑方向：

- destructive action gating
- tool allowlist / denylist
- 路径级权限控制
- shell 命令风险分级
- approval policy

### 8. Workspace 与隔离策略

适用信号：

- 一个 agent 需要同时处理多个仓库
- 需要并行实验或分支隔离
- 需要避免互相污染

可考虑方向：

- worktree / branch isolation
- ephemeral workspace
- sandbox workspace
- read-only researcher workspace

### 9. Subagents 与多角色协作协议

适用信号：

- 子代理不再只是偶发使用
- 需要更稳定的角色边界和协作约定

可考虑方向：

- researcher / coder / reviewer 协议
- task handoff format
- subagent result contract
- reviewer veto / retry policy

### 10. 验证策略分层

适用信号：

- 不同任务需要不同验证标准
- 验证开销开始变大，需要策略化选择

可考虑方向：

- lint / typecheck / unit test / integration test 分层
- task-specific verification policy
- fast verify vs full verify
- verification retry policy

### 11. 观测与评估体系

适用信号：

- 开始比较不同 agent 配置的效果
- 需要知道系统到底哪里出问题

可考虑方向：

- tracing
- step-level logging
- tool usage metrics
- success / failure taxonomy
- benchmark tasks
- regression evals

### 12. 失败恢复与降级策略

适用信号：

- 工具经常失败
- 模型返回不稳定
- 长任务需要更稳健的错误处理

可考虑方向：

- retry policy
- fallback model / fallback tool
- safe stop
- partial completion reporting
- escalation to human

### 13. 人类协作与审批流

适用信号：

- 高风险任务增多
- 团队成员希望在关键节点介入

可考虑方向：

- plan approval
- edit approval
- release approval
- human correction loop
- interrupt / resume / redirect

### 14. 成本与性能优化

适用信号：

- token 消耗明显上升
- 工具调用和验证耗时太长

可考虑方向：

- context trimming
- prompt compaction
- selective file loading
- caching
- model routing
- cheap model for research, strong model for final execution

### 15. LangGraph 级别的 orchestration

适用信号：

- 任务需要 durable execution
- 需要人工审批节点
- 需要明确状态机与恢复机制

可考虑方向：

- 规划阶段和执行阶段拆节点
- 验证失败进入显式恢复流
- 审批与人工接管进入 graph 层

## 近期优先事项

### P1

- 补 `examples/03-first-agent`
- 补 `examples/09-first-deep-coding-agent`
- 让文档和示例形成最小闭环

### P2

- 补 `examples/06-minimum-capabilities`
- 明确工具与 prompt 的章节对应关系
- 为后续代码示例补 `.env.example` 和运行说明

### P3

- 根据真实示例复杂度，再决定是否升级 prompt 分层
- 根据业务任务复杂度，再决定是否进入 LangGraph

## 分类视图

下面把这些进阶复杂度再分成两类：

- 一类适合作为“教程后续进阶主题”
- 一类更适合作为“真实项目工程化主题”

这样可以避免后续写作时把教程主线和产品化演进混在一起。

### A. 适合后续教程进阶主题

这些主题仍然适合放在教程体系中继续展开，因为它们和“理解 agent / coding agent 能力”关系更直接：

- Prompt 分层设计
- 面向业务场景的 agent 分层
- 更复杂的上下文注入机制
- Harness 分层设计
- Subagents 与多角色协作协议
- 验证策略分层
- 失败恢复与降级策略
- LangGraph 级别的 orchestration

适合的写法：

- 新增进阶章节
- 作为“从基础教程到复杂任务”的第二阶段内容
- 配合中等规模示例仓库讲清设计取舍

### B. 更适合真实项目工程化主题

这些主题通常在真正做团队工具、内部平台或生产级 agent 系统时价值更高：

- 任务系统与状态持久化
- Memory 分层
- Tool 权限与安全策略
- Workspace 与隔离策略
- 观测与评估体系
- 人类协作与审批流
- 成本与性能优化

适合的写法：

- 单独的工程化文档
- 架构设计文档
- 产品化演进路线
- 团队内部最佳实践

### C. 会跨越教程与工程化边界的主题

有些主题两边都会遇到，只是切入深度不同：

- Harness 分层设计
- 验证策略分层
- Subagents 与多角色协作协议
- LangGraph orchestration

建议处理方式：

- 教程里先讲“为什么需要”
- 工程化阶段再讲“如何规模化落地”

## 执行视图

下面把主要复杂度主题进一步整理成更可执行的形式：

- 优先级：`P1 / P2 / P3`
- 进入条件：什么时候值得开始做
- 典型触发场景：什么任务会逼着我们处理它
- 是否值得单独成章：判断它更适合教程章节还是附录/工程文档

### 1. Prompt 分层设计

- 优先级：`P3`
- 进入条件：
  - prompt 中开始出现大量动态变量
  - 不同 agent 角色之间有明显重复片段
  - 需要对不同任务类型复用相同规则块
- 典型触发场景：
  - 同时支持 coder / researcher / reviewer / planner
  - 需要注入 task brief、repo summary、constraints
  - 需要维护多个 prompt 版本
- 是否值得单独成章：可以，但更适合放在进阶章节而不是主线前半段

### 2. 面向业务场景的 agent 分层

- 优先级：`P2`
- 进入条件：
  - 开始做前端 agent、测试 agent、review agent 等垂直 agent
  - 不同任务的工具、prompt、验证逻辑明显分化
- 典型触发场景：
  - 一个通用 agent 已经难以兼顾所有任务
  - 团队希望按业务域拆分不同 agent
- 是否值得单独成章：值得，适合做“从通用 agent 到垂直 agent”的章节

### 3. 更复杂的上下文注入机制

- 优先级：`P2`
- 进入条件：
  - repo knowledge 明显变多
  - 任务越来越依赖动态上下文选择
  - 仅靠静态 prompt 已经不够
- 典型触发场景：
  - 需要按任务类型注入不同项目约定
  - 需要同时处理 task brief、repo summary、constraints、prior decisions
- 是否值得单独成章：值得，适合做进阶章节

### 4. Harness 分层设计

- 优先级：`P2`
- 进入条件：
  - agent 不再只是单文件 demo
  - tools、workspace、approval、state 等模块逐渐变厚
  - 开始出现“哪些属于 agent，哪些属于系统”的边界困惑
- 典型触发场景：
  - 代码里到处混着 prompt、tool、状态和控制逻辑
  - 需要解释 agent core 与 harness 的关系
- 是否值得单独成章：非常值得，适合做进阶理论与架构章节

### 5. 任务系统与状态持久化

- 优先级：`P2`
- 进入条件：
  - 任务需要跨多轮、多次运行继续推进
  - 需要中断恢复
  - 需要任务状态可追踪
- 典型触发场景：
  - 一个 bug 修复任务要跨几次执行
  - 需要长期维护 task board
- 是否值得单独成章：更适合工程化专题，也可以作为高级教程附加章节

### 6. Memory 分层

- 优先级：`P3`
- 进入条件：
  - 需要跨任务保留经验
  - 不同记忆类型开始混在一起
- 典型触发场景：
  - agent 需要记住仓库历史结论
  - agent 需要在不同任务间复用先前总结
- 是否值得单独成章：可以，但更适合教程后期或工程化文档

### 7. Tool 权限与安全策略

- 优先级：`P1`
- 进入条件：
  - 工具开始涉及更高风险动作
  - 系统开始面向团队或真实生产环境
- 典型触发场景：
  - shell 可执行危险命令
  - agent 可以大范围改文件
  - 用户希望加入审批或限制
- 是否值得单独成章：非常值得，哪怕在基础教程后半段也应专门讲

### 8. Workspace 与隔离策略

- 优先级：`P2`
- 进入条件：
  - 需要同时处理多个仓库或多个分支
  - 需要避免不同任务互相污染
- 典型触发场景：
  - 并行修复不同问题
  - reviewer 和 coder 需要不同工作区权限
- 是否值得单独成章：适合进阶章节，也适合工程设计文档

### 9. Subagents 与多角色协作协议

- 优先级：`P2`
- 进入条件：
  - subagent 使用从偶发变成常态
  - 结果交接开始变得混乱
- 典型触发场景：
  - researcher 输出风格不稳定，coder 难以消费
  - reviewer 反馈和执行环节缺少约定
- 是否值得单独成章：值得，适合教程进阶章节

### 10. 验证策略分层

- 优先级：`P1`
- 进入条件：
  - 不同任务需要不同验证标准
  - 验证成本显著上升
- 典型触发场景：
  - 小改动只想跑快速验证
  - 大改动需要完整验证
  - 前端/后端/测试任务的验证方式不同
- 是否值得单独成章：非常值得，适合主线后半段章节

### 11. 观测与评估体系

- 优先级：`P2`
- 进入条件：
  - 开始比较不同 agent 配置或 prompt 的效果
  - 需要定位失败原因
- 典型触发场景：
  - 不知道 agent 为什么经常失败
  - 需要 benchmark 或 regression eval
- 是否值得单独成章：值得，适合进阶和工程化之间的桥接章节

### 12. 失败恢复与降级策略

- 优先级：`P2`
- 进入条件：
  - 工具失败频繁
  - 模型输出不稳定
  - 长任务需要更稳健的终止逻辑
- 典型触发场景：
  - shell 命令失败
  - 文件编辑失败
  - 验证反复失败但不应无限循环
- 是否值得单独成章：值得，适合进阶章节

### 13. 人类协作与审批流

- 优先级：`P1`
- 进入条件：
  - 高风险任务增多
  - 团队成员希望在关键节点介入
- 典型触发场景：
  - 大范围重构前先审计划
  - 执行发布前要求人工确认
  - agent 偏航后需要人工纠正
- 是否值得单独成章：非常值得，适合主线后半段或工程化专题

### 14. 成本与性能优化

- 优先级：`P2`
- 进入条件：
  - token 消耗明显变高
  - 响应时间过长
  - 验证和上下文加载太重
- 典型触发场景：
  - 大仓库任务很慢
  - 多轮规划成本过高
  - research 阶段和 execution 阶段需要不同模型
- 是否值得单独成章：适合进阶章节，也适合工程化专题

### 15. LangGraph 级别的 orchestration

- 优先级：`P3`
- 进入条件：
  - durable execution 成为刚需
  - 任务阶段和审批节点需要显式建模
  - agent 自主循环已经不够描述系统流程
- 典型触发场景：
  - 任务需要暂停、恢复、回滚
  - 不同阶段必须由不同节点负责
  - 人工审批成为正式流程的一部分
- 是否值得单独成章：非常值得，但应放在教程后期或单独专题
