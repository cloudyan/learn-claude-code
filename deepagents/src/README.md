# Source Layout

这个目录用于承载教程中会复用的共享实现，而不是章节正文。

建议结构：

```text
src/
  providers/
  tools/
  prompts/
  agents/
  deep-agents/
  shared/
```

建议分工：

- `providers/`：模型和 provider 初始化
- `tools/`：文件、命令、计划等工具
- `prompts/`：系统提示和任务模板
- `agents/`：基于 LangChain v1 的基础 agent 封装
- `deep-agents/`：基于 Deep Agents 的主线 agent 封装
- `shared/`：safe path、日志、输出裁剪等公共能力

## 当前已落地的骨架

```text
src/
  providers/
    config.ts
    model.ts
  tools/
    bash.ts
    edit-file.ts
    index.ts
    list-files.ts
    plan.ts
    read-file.ts
    search-text.ts
    write-file.ts
  prompts/
    base-agent.ts
    coding-agent.ts
    researcher-agent.ts
    reviewer-agent.ts
  agents/
    create-basic-agent.ts
    create-coding-agent.ts
  deep-agents/
    create-deep-coding-agent.ts
    create-research-subagent.ts
    create-reviewer-subagent.ts
  shared/
    constants.ts
    load-root-env.ts
    logger.ts
    safe-path.ts
    truncate.ts
    types.ts
    workspace.ts
```

## 设计原则

- `providers/` 只负责模型配置和初始化
- `tools/` 保持原子化，一个工具一个文件
- `prompts/` 单独管理，不散落在示例脚本里，默认直接使用中文字符串
- `agents/` 放基础 LangChain v1 封装
- `deep-agents/` 放 Deep Agents 主线封装
- `shared/` 放跨层复用能力

其中 `shared/load-root-env.ts` 负责统一加载教程环境变量。

当前约定只读取一个固定位置：

- `deepagents/.env`

这样规则更简单，也更适合作为教程工程的默认方案。
## Prompt 约定

- 默认使用中文 prompt，和教程正文语言保持一致
- 默认直接使用字符串常量，不先引入 `PromptTemplate`
- 只有在 prompt 明显需要变量插槽、可组合片段或多版本复用时，再考虑引入 `PromptTemplate`

## Deep Agents 工具命名约定

当我们走 `Deep Agents` 主线时，必须注意它自带一批内置工具。

在当前本地验证的 `deepagents@1.8.8` 中，至少要把下面这些名字视为保留名，避免自定义工具撞车：

- `ls`
- `read_file`
- `write_file`
- `edit_file`
- `glob`
- `grep`
- `execute`
- `task`
- `write_todos`

这也是为什么当前代码里：

- `LangChain v1` 路线仍然可以使用我们自己的文件工具
- `Deep Agents` 路线则改为优先复用它的内置文件工具

如果后续升级 `deepagents` 版本，这份名单应重新以本地安装版本为准再检查一次。

## 下一步建议

- 在 `examples/03-first-agent/` 接入 `createBasicAgent`
- 在 `examples/06-minimum-capabilities/` 接入 `createCodingAgent`
- 在 `examples/09-first-deep-coding-agent/` 接入 `createDeepCodingAgent`
- 后续再根据官方最新 API 细节调整 `createAgent` / `createDeepAgent` 的调用参数
