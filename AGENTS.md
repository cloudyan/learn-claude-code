# AGENTS.md

本文件为在此代码库中工作的代理(Agent)提供开发指南。

## 环境配置

### Python 依赖
```bash
pip install anthropic python-dotenv
```

**注意**: requirements.txt 文件不完整,需要手动安装上述依赖。

### TypeScript 依赖
```bash
cd typescript/ai-sdk
pnpm install  # 或 npm install
```

### 环境变量
复制 `.env.example` 到 `.env` 并配置:
```bash
cp .env.example .env
# 编辑 .env 设置 ANTHROPIC_API_KEY 和其他配置
```

## 运行命令

### Python 代理版本
```bash
python v0_bash_agent.py      # 最小化版本 (~50 行)
python v1_basic_agent.py     # 4 工具完整代理 (~200 行)
python v2_todo_agent.py      # 带任务规划 (~300 行)
python v3_subagent.py        # 带子代理机制 (~450 行)
python v4_skills_agent.py    # 带技能系统 (~550 行)
```

### TypeScript 代理版本
```bash
cd typescript/ai-sdk

# 运行各版本
npm run v0       # 最小化版本
npm run v1       # 基础代理
npm run v2       # 带任务规划
npm run v3       # 带子代理
npm run v4       # 带技能系统

# 类型检查
npm run type-check
```

### 技能脚手架
```bash
python skills/agent-builder/scripts/init_agent.py my-agent
python skills/agent-builder/scripts/init_agent.py my-agent --level 0
```

## 代码风格规范

### Python
- **命名**: 使用 snake_case (函数/变量), PascalCase (类)
- **类型提示**: 在复杂函数中使用类型提示 `def func(arg: str) -> bool:`
- **导入顺序**: 标准库 → 第三方库 → 本地导入,空行分隔
- **注释**: 使用中文注释和详细文档字符串说明设计思路
- **错误处理**: 使用 try-except,返回描述性错误字符串
- **安全**: 包含路径验证防止目录遍历

### TypeScript
- **类型**: 严格类型检查 (tsconfig.json 中 strict: true)
- **验证**: 使用 zod 进行工具输入验证
- **异步**: 工具函数使用 async/await
- **注释**: 使用中文注释说明功能

### 技能文件 (SKILL.md)
- **格式**: YAML frontmatter + Markdown 正文
- **必需字段**: name, description
- **描述**: 包含使用场景和关键词

## 核心架构模式

### 代理循环 (所有版本通用)
```python
while True:
    response = model(messages, tools)
    if response.stop_reason != "tool_use":
        return response.text
    results = execute(response.tool_calls)
    messages.append(results)
```

### 四个核心工具
- **bash**: 执行任意命令 (git, npm, python, find, grep 等)
- **read_file**: 读取文件内容
- **write_file**: 创建/覆写文件
- **edit_file**: 精确字符串替换编辑

### 渐进式复杂度
- **v0**: Bash 就是一切 - 通过递归调用自身实现子代理
- **v1**: 模型即代理 - 完整 4 工具代理循环
- **v2**: 结构化规划 - Todo 工具显式化计划
- **v3**: 子代理机制 - Task 工具隔离上下文
- **v4**: Skills 机制 - SKILL.md 按需提供领域知识

## 测试

**注意**: 本项目当前没有配置测试框架。如需添加测试:

```bash
# Python (建议)
pip install pytest
pytest  # 发现并运行 tests/ 目录中的测试

# 运行单个测试
pytest tests/test_v1_basic_agent.py::test_function_name
```

## 常见模式

### 安全检查
- Python: 使用 `safe_path()` 函数验证路径不逃逸工作目录
- Bash: 阻止危险命令模式 (如 `rm -rf /`, `sudo`)

### 错误处理
```python
try:
    result = subprocess.run(...)
    return (result.stdout + result.stderr).strip() or "(no output)"
except subprocess.TimeoutExpired:
    return "Error: Command timed out"
except Exception as e:
    return f"Error: {e}"
```

### 工具定义标准格式
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

## 项目特性

- **中文化**: 文档和注释主要使用中文
- **教育性质**: 5 个渐进版本展示代理设计演进
- **最小化**: v0 仅 16 行压缩版本证明核心极简
- **生产就绪**: TypeScript 版本使用 ai-sdk 和严格类型检查
