# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个渐进式教程项目,展示如何构建类似 Claude Code、Cursor Agent 和 Kode CLI 的 AI 编程代理。包含 5 个版本的实现,从最小化的 bash 代理(~50 行)到完整的支持 Skills 的代理(~550 行)。

**核心理念**: "模型即代理" (Model as Agent) - 模型已经知道如何成为代理,代码只需提供工具并运行循环。

## 项目结构

```
learn-claude-code/
├── v0_bash_agent.py         # ~50 行: 单个 bash 工具,递归子代理
├── v0_bash_agent_mini.py    # ~16 行: 极简压缩版本
├── v1_basic_agent.py        # ~200 行: 4 个核心工具,完整代理循环
├── v2_todo_agent.py         # ~300 行: 添加 Todo 规划管理
├── v3_subagent.py           # ~450 行: 添加 Task 工具和子代理注册
├── v4_skills_agent.py       # ~550 行: 添加 Skill 工具和技能加载器
├── skills/                  # 示例技能目录
│   ├── agent-builder/       # 元技能: 教代理如何构建代理
│   ├── code-review/         # 代码审查技能
│   ├── mcp-builder/         # MCP 服务器构建技能
│   └── pdf/                 # PDF 处理技能
├── docs/                    # 详细文档(中英文)
├── articles/                # 技术文章(中文)
└── typescript/              # TypeScript 相关实验(开发中)
```

## 开发命令

### 运行代理

```bash
# 运行任意版本的代理
python v0_bash_agent.py      # 最小化版本
python v1_basic_agent.py     # 核心代理循环
python v2_todo_agent.py      # 带任务规划
python v3_subagent.py        # 带子代理机制
python v4_skills_agent.py    # 带技能系统

# 环境配置
cp .env.example .env         # 复制环境变量模板
# 编辑 .env 文件设置 API key
```

### 依赖管理

```bash
# Python 依赖
pip install anthropic python-dotenv

# TypeScript 依赖(如果有)
pnpm install
```

### 技能脚手架

```bash
# 使用 agent-builder 技能创建新代理项目
python skills/agent-builder/scripts/init_agent.py my-agent
python skills/agent-builder/scripts/init_agent.py my-agent --level 0  # 最小化
python skills/agent-builder/scripts/init_agent.py my-agent --level 1  # 4工具版本
```

## 核心架构

### 代理循环模式

所有版本都遵循相同的核心模式:

```python
while True:
    response = model(messages, tools)
    if response.stop_reason != "tool_use":
        return response.text
    results = execute(response.tool_calls)
    messages.append(results)
```

### 四个核心工具

- `bash`: 执行任意命令 (npm install, git status, find, grep)
- `read_file`: 读取文件内容
- `write_file`: 创建/覆写文件
- `edit_file`: 精确的文件编辑

### 渐进式复杂度

每个版本在前一版本基础上只添加一个核心概念:

- **v0**: Bash 就是一切 - 证明核心极简
- **v1**: 模型即代理 - 4 工具完整代理循环
- **v2**: 结构化规划 - Todo 工具显式化计划
- **v3**: 子代理机制 - Task 工具隔离上下文
- **v4**: Skills 机制 - SKILL.md 按需提供领域知识

## 技能系统规范

### 技能文件结构

```
skills/{skill-name}/
├── SKILL.md                 # 技能规范文件(必需)
├── scripts/                 # 可执行脚本
├── references/              # 参考实现
└── docs/                    # 技能文档
```

### SKILL.md 格式

```markdown
---
name: skill-name
description: |
  技能描述,包括使用场景和关键词
---

# 技能标题

技能的具体实现指导...
```

## 配置要求

### 环境变量 (.env)

```bash
# Anthropic API 配置
ANTHROPIC_API_KEY=your_api_key_here
# 可选: 自定义 API 端点
ANTHROPIC_BASE_URL=https://custom-endpoint.com
# 可选: 模型名称
MODEL_NAME=claude-sonnet-4-20250514
```

## 扩展开发

### 添加新工具

在对应版本文件中的 `TOOLS` 列表添加工具定义:

```python
{
    "name": "tool_name",
    "description": "工具功能描述",
    "input_schema": {
        "type": "object",
        "properties": {...},
        "required": [...]
    }
}
```

### 添加新技能

1. 在 `skills/` 目录创建新技能文件夹
2. 编写 `SKILL.md` 规范文件
3. 添加必要的脚本和参考实现
4. 在 v4_skills_agent.py 中可自动发现

## 相关项目

- [Kode CLI](https://github.com/shareAI-lab/Kode) - 生产级开源代理 CLI
- [shareAI-skills](https://github.com/shareAI-lab/shareAI-skills) - 生产级技能集合
- [Agent Skills Spec](https://github.com/anthropics/agent-skills) - 官方技能规范

## 注意事项

- 所有 Python 代理实现都使用 Anthropic API
- 支持兼容 Anthropic API 的自定义端点(通过 BASE_URL)
- 工作目录默认为当前目录(WORKDIR = Path.cwd())
- TypeScript 目录目前主要用于实验,暂无生产代码
