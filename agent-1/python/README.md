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

提供 **Python** 和 **TypeScript** 两个版本，选择你熟悉的语言：

### Python 版本（推荐入门）
完整可运行代码在项目根目录：
- `v1_basic_agent.py` - 基础版
- `v2_todo_agent.py` - Todo 版
- `v3_subagent.py` - 子代理版
- `v4_skills_agent.py` - Skills 版
- `v0_bash_agent.py` - 终极简化版

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
