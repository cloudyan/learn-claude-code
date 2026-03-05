# 手写 Claude Code - 初学者入门

> 一杯奶茶钱，从 0 到 1 手写一个 AI Agent

---

## 目录

| 章节 | 标题 | 状态 |
|------|------|------|
| 00 | [前言：你也能手写一个 AI Agent](./00-前言.md) | ✅ |
| 01 | [手写第一个 Agent —— v1 模型即代理](./01-手写第一个Agent.md) | ✅ |
| 02 | [让 Agent 有计划 —— v2 结构化规划](./02-让Agent有计划.md) | ✅ |
| 03 | [分而治之 —— v3 子代理机制](./03-分而治之.md) | ✅ |
| 04 | [知识外化 —— v4 Skills 机制](./04-知识外化.md) | ✅ |
| 05 | [终极简化 —— v0 Bash 就是一切](./05-终极简化.md) | ✅ |
| 06 | [总结与下一步](./06-总结与下一步.md) | ✅ |

---

## 核心思想（记住这几点）

1. **Agent = 模型 + 工具 + 循环** —— 这是本质
2. **模型是决策者** —— 代码只提供工具和循环
3. **显式化 = 可控** —— Todo 让计划可见
4. **隔离 = 聚焦** —— 子代理隔离上下文
5. **知识外化** —— Skills 是可编辑的文档
6. **只追加，不修改** —— 缓存友好的设计
7. **Bash 就是一切** —— 终极简化证明了核心

---

## 配套代码

提供 **TypeScript**（主版本）和 **Python**（备用）两个版本：

### TypeScript 版本（主版本，推荐）
完整可运行代码在 `typescript/` 目录：
```bash
cd agent-1/typescript
npm install
npm run v1   # 基础版（推荐入门）
npm run v2   # Todo 版
npm run v3   # 子代理版
npm run v4   # Skills 版
npm run v0   # 终极简化版
```

### Python 版本（备用）
在 `python/` 目录，包含原始 Python 实现和文档：
- `python/v1_basic_agent.py` - 基础版
- `python/v2_todo_agent.py` - Todo 版
- `python/v3_subagent.py` - 子代理版
- `python/v4_skills_agent.py` - Skills 版
- `python/v0_bash_agent.py` - 终极简化版

### TypeScript 版本（前端开发者）
在 `typescript/` 目录：
```bash
cd agent-1/typescript
npm install
npm run v0   # 终极简化版
npm run v1   # 基础版
npm run v2   # Todo 版
npm run v3   # 子代理版
npm run v4   # Skills 版
```

直接使用 OpenAI SDK（不是 ai-sdk），保持和 Python 版本完全相同的架构和教学风格。
---

**工具让模型能做事，技能让模型知道怎么做。**


---

## 重构与核对记录

### 仅做的两个改动
1. **Anthropic SDK → OpenAI SDK 兼容**
   - 支持国内模型（DeepSeek、智谱、百川等）
   - `baseURL` 可配置

2. **结构变更（更清晰）+ TypeScript 语言**
   - `clients/model.ts` - 统一配置
   - `tools/bash.ts` 等 - 每个工具独立文件
   - `utils/` - 工具函数

### 功能 100% 对齐 Python 根目录版本

| 项                     | 状态 |
| ---------------------- | ---- |
| 工具参数名对齐        | ✅   |
| - `read_file(path, limit)` | ✅   |
| - `write_file(path, content)` | ✅ |
| - `edit_file(path, old_text, new_text)` | ✅ |
| v2 TodoManager 验证    | ✅   |
| INITIAL/NAG REMINDER   | ✅   |

### 根目录 Python 保持不变
根目录的原始 Python 代码（Anthropic SDK）保持原样，不做任何改动。
