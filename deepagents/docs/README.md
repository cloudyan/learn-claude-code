# Docs Layout

这个目录用于承载整套教程文档本身。

当前推荐的阅读顺序是：

1. 先读 [README.md](/deepagents/docs/README.md) 了解结构
2. 再看 [tutorial-outline.md](/deepagents/docs/tutorial-outline.md) 把握全局
3. 再参考 [ROADMAP.md](/deepagents/docs/ROADMAP.md) 了解推进策略
4. 最后按章节顺序阅读 `01-17`

## 术语约定

为了避免整套教程风格漂移，文档默认使用下面这些核心表述：

- `LangChain v1`：基础 agent 构造层
- `Deep Agents`：coding agent 主线层
- `LangGraph`：进阶 orchestration 层
- `coding agent`：默认作为通用正文写法；标题中可写作 `Coding Agent`
- `filesystem context`：默认指“把代码库作为外部记忆来读取和定位上下文”的工作方式
- `subagents`：默认指面向上下文隔离和任务边界拆分的子代理机制

## 文档写作约定

每章尽量遵循同一套结构：

1. 这一章解决什么问题
2. 为什么上一章还不够
3. 本章引入什么新机制
4. 和示例或源码如何对应
5. 这一章故意不解决什么
6. 下一章为什么自然出现

这样做的目的，是让整套教程更像一条连续主线，而不是一组互相独立的文章。

## 配套文件

- [tutorial-outline.md](/deepagents/docs/tutorial-outline.md)：全书总纲
- [ROADMAP.md](/deepagents/docs/ROADMAP.md)：章节推进策略
- [writing-template.md](/deepagents/docs/writing-template.md)：章节写作模板
- [_sidebar.md](/deepagents/docs/_sidebar.md)：文档站侧边栏
- [_navbar.md](/deepagents/docs/_navbar.md)：文档站导航栏

## 与代码的关系

这套教程不是纯文档项目，它和代码目录是配套推进的：

- `docs/`：负责教程叙事
- `examples/`：负责教学示例
- `src/`：负责沉淀可复用实现

## 章节与示例映射

当前改为“每章至少一个示例入口”的策略。

这意味着：

- `01-17` 每章在 `examples/` 下都有一个对应目录
- 其中一部分是独立可运行示例
- 另一部分是复用型或案例型示例入口

这样做的目的是：

- 保持章节和示例一一对应
- 让读者阅读时始终有落点
- 同时避免过早堆出 17 个重型可运行项目

推荐命名方式：

- 章节编号和文件名一一对应
- 示例编号尽量和章节编号或主题保持接近
- 正文里优先引用 `examples/` 和 `src/`，避免把关键实现细节埋在长篇解释里

```text
docs/
  01-what-is-a-coding-agent.md
  02-how-to-choose-the-stack.md
  03-first-agent.md
  ...
```
