# Deepagents Tutorial Project Knowledge

这个文件模拟一个“项目知识包”，专门提供给 agent 在执行仓库任务时按需读取。

## 目录分工

- `docs/`：负责教程叙事和章节正文
- `examples/`：负责每章可运行示例
- `src/`：负责共享实现和可复用能力

## 写作与实现约定

- prompt 默认使用中文
- 环境变量统一使用 `OPENAI_API_KEY`、`OPENAI_BASE_URL`、`MODEL_NAME`
- 教程主线强调：
  - `LangChain v1` 讲基础
  - `Deep Agents` 讲主线
  - `LangGraph` 讲升级边界

## 示例策略

- `01-17` 每章都应有示例入口
- 少数章节可升级成机制型独立 demo
- 主线示例优先服务 `03 -> 06 -> 09 -> 10 -> 11 -> 12`

## 工程风格

- 示例说明文档优先解释“为什么这样设计”
- 代码修改应尽量小而聚焦
- 验证闭环优先于“看起来聪明”的生成结果
