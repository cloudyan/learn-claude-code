# 09. 用 Deep Agents 做第一个 Coding Agent

## 这一章解决什么问题

从这一章开始，教程正式进入 coding agent 主线实现。

如果说第 6 章解决的是：

- 一个最小 coding agent 需要哪些能力

那么这一章开始解决的是：

- 如何用一个更贴近真实工作的抽象，把这些能力组织起来

我们的目标很明确：

**用 `Deep Agents` 构造第一个真正面向代码任务的 agent。**

## 为什么主线从这里切到 Deep Agents

到第 6 章为止，我们已经知道：

- coding agent 至少需要读、改、验证、计划、收尾
- 这些能力组合起来会比最小 agent 明显复杂
- 继续完全靠“教程式手写拼装”当然可以，但会越来越被样板代码淹没

也就是说，从这里开始，问题已经不再是：

- “我知不知道还要再加几个工具”

而是：

- “我应该用什么样的抽象承载这些能力”

这就是主线切到 `Deep Agents` 的原因。

它的价值不只是“功能更多”，而是：

- 更接近真实 coding agent 的工作形态
- 更自然地承载文件系统、任务推进、子任务和复杂上下文
- 让教程重点重新回到“agent 如何工作”，而不是“我们如何手搓所有基础设施”

## 这一章的目标

这一章不追求功能完美，而追求“闭环可用”。

读者应该在本章结束后得到一个原型，它至少能够：

- 接收一个明确的代码任务
- 读取相关文件
- 调用合适的工具
- 执行一个最小验证动作
- 给出结果总结

换句话说，这一章的重点不是“把所有高级能力一次性做满”，而是：

**让 Deep Agents 主线第一次真正站起来。**

## 推荐最小任务

建议选择足够小但真实的任务，比如：

- 给一个函数补类型
- 修一个 lint 报错
- 为一个 util 增加最小测试

这些任务有几个共同点：

- 已经属于真实 coding task
- 会涉及文件、搜索、执行验证
- 但又不会复杂到让读者被业务细节淹没

本章配套示例目录：

- [examples/09-first-deep-coding-agent](/deepagents/examples/09-first-deep-coding-agent/README.md)

## 本章建议代码组织

```text
examples/09-first-deep-coding-agent/
  package.json
  tsconfig.json
  .env.example
  src/
    index.ts
```

配套共享实现建议放在：

```text
src/
  providers/
  tools/
  deep-agents/
  shared/
```

在当前实现里，这一章的示例入口非常薄：

- 示例入口在 [examples/09-first-deep-coding-agent/src/index.ts](/deepagents/examples/09-first-deep-coding-agent/src/index.ts)
- 真正的 agent 封装在 [create-deep-coding-agent.ts](/deepagents/src/deep-agents/create-deep-coding-agent.ts)

这是一个刻意的设计。

因为从第 9 章开始，教程关注点已经不再是“如何把所有代码塞进一个文件”，而是：

- Deep Agents 主线应该怎么接入
- 共享工具和 prompt 应该如何复用
- coding task 主流程如何落地

## 配套代码应该怎么读

这一章建议读者同时对照下面几个文件一起看：

- [examples/09-first-deep-coding-agent/src/index.ts](/deepagents/examples/09-first-deep-coding-agent/src/index.ts)
- [create-deep-coding-agent.ts](/deepagents/src/deep-agents/create-deep-coding-agent.ts)
- [coding-agent.ts](/deepagents/src/prompts/coding-agent.ts)
- [tools/index.ts](/deepagents/src/tools/index.ts)

这一组文件分别代表：

- 示例入口
- Deep Agents 封装层
- coding agent 行为约束
- 最小工具集

和第 3 章、第 6 章相比，这一章的重点不再是“看单个文件里的主流程”，而是：

**看主线封装如何把共享能力组织起来。**

## 和第 6 章的关系

第 6 章解决的是：

- 一个最小 coding agent 需要哪些能力

第 9 章开始解决的是：

- 如何用更适合复杂任务的抽象来承载这些能力

所以这两章不是替代关系，而是升级关系：

- 第 6 章定义最小能力闭环
- 第 9 章把主线切换到更贴近真实工作的 `Deep Agents`

这是整套教程里一个非常关键的过渡点。

如果没有这个过渡，教程会显得像是：

- 前面一直在讲基础
- 后面突然跳到复杂框架

而这一章的作用，就是把这种跳跃变成自然升级。

## 一个很重要的真实工程变化

当教程主线切到 `Deep Agents` 后，前面一些理所当然的设计选择会发生变化。

最明显的例子就是工具命名。

在前面的 `LangChain v1` 示例里，我们可以自己定义文件工具，比如：

- `read_file`
- `write_file`
- `edit_file`

但到了 `Deep Agents` 主线，这样的名字就不应该再随便沿用。

因为 `Deep Agents` 自带内置工具和中间件能力。在当前本地验证的 `deepagents@1.8.8` 中，以下名字至少应视为保留名：

- `ls`
- `read_file`
- `write_file`
- `edit_file`
- `glob`
- `grep`
- `execute`
- `task`
- `write_todos`

这意味着：

- 前面 `LangChain v1` 路线里自定义的文件工具，不应原样带入 `Deep Agents`
- 对于文件读写、搜索、执行这类基础能力，应优先复用 `Deep Agents` 的内置工具
- 我们只补充那些没有命名冲突、且确实有额外价值的自定义工具

这一点很值得读者注意，因为它体现了一个真实工程信号：

**进入更高层抽象后，不只是 API 变了，工具边界和命名约束也会一起变化。**

## 核心概念

### 1. 第一个版本先追求可用，不追求完美

不要一开始就同时引入：

- 复杂 planning
- 多个 subagent
- 知识库接入
- 审批系统

第一版最重要的是建立“完成真实代码任务”的信心。

### 2. 最小 coding task 也必须有验证

即使只是修一个 lint 报错，也不应该把“修改文件”当成结束。

至少要有一个最小验证步骤。

这也是 Deep Agents 主线和“会改代码的脚本”之间最重要的分界点之一。

### 3. 输出总结是交付的一部分

agent 最终应该告诉用户：

- 改了什么
- 为什么改
- 跑了什么验证
- 是否还有残余风险

换句话说，agent 不只是“执行者”，它还必须是一个能交接结果的合作者。

## 推荐运行方式

如果你已经在 `deepagents/.env` 中配置好：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

那么可以直接运行：

```bash
cd deepagents
npm run dev:09
```

默认任务是：

```text
读取当前仓库的 README，并给出一份不改文件的总结
```

第一轮建议先跑只读任务，而不是一上来就让它改文件。

这样更容易让读者先观察：

- `Deep Agents` 的入口长什么样
- 共享工具如何被接入
- 它和第 6 章的最小 coding agent 有什么区别

## 为什么第一轮先跑只读任务

这一点和第 6 章的教学策略是连贯的。

虽然第 9 章已经切到 `Deep Agents`，但一开始仍然不建议马上使用高风险任务。

原因是：

- 读者此时最需要先看懂主线切换后的结构变化
- 而不是立刻面对文件修改、验证失败和重试循环的全部复杂度

所以本章第一轮推荐任务是：

- 只读
- repo-aware
- 已经使用 Deep Agents 主线

当这个入口先跑顺之后，再进入真正的修改任务会更稳。

## 一个真实任务应该长什么样

比如：

> “修复 `src/math.ts` 里 `sum` 函数的类型错误，并运行 typecheck。”

这是一个非常好的起点，因为它包含：

- 定位问题
- 阅读文件
- 修改代码
- 运行命令
- 汇报结果

你会发现，和第 6 章相比，这里的变化不是“多了一个能力”，而是：

**我们开始让这些能力在更贴近真实工作的抽象里运行。**

## 本章最重要的设计取舍

本章最大取舍是控制复杂度。

如果任务选得太大，读者会把注意力放在业务细节上。

如果任务选得太小，又看不出 coding agent 与普通 agent 的区别。

所以第一章 Deep Agents 实战应该选“够真实、但可控”的小任务。

另一个重要取舍是：

- 示例入口保持简单
- 共享能力下沉到 `src/`

这样后续当我们继续加入 planning、subagents、verification 时，就不需要反复推倒示例结构。

还有一个取舍是：

- 在 `Deep Agents` 主线里，优先复用内置工具
- 不再重复手搓已有的基础设施

这一步不只是为了“少写代码”，更是为了让读者看到：

**更高层抽象真正带来的工程收益是什么。**

## 本章真正要让读者学会什么

读完并跑完这一章，读者应该真正理解：

- `Deep Agents` 不是另一个“花哨框架”，而是更适合承载复杂 coding task 的主线抽象
- 从第 6 章切到第 9 章，不是推翻前面的能力模型，而是把它升级到更真实的执行形态
- 在 `Deep Agents` 里，工具命名和工具边界会受到内置能力约束
- 一个好的第一版 Deep Agent，不追求功能齐全，而追求主线闭环可用

## 本章结论

- `Deep Agents` 主线从这里正式开始。
- 第一个版本的重点是建立最小可用闭环，而不是追求功能齐全。
- coding agent 一旦进入真实任务，就必须把验证纳入默认流程。
- 进入更高层抽象后，工具边界、命名约束和工程组织方式都会随之变化。

## 下一章预告

下一章我们会进一步强化一个关键能力：planning。

也就是让 agent 先拆任务，再动手。
