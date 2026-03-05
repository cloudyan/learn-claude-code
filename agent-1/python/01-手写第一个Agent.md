# 第1章：手写第一个 Agent —— v1 模型即代理

**~200 行代码，4 个工具。这是所有编程 Agent 的本质。**

---

## 先理解：Agent 到底是什么？

在开始手写之前，先建立一个认知框架。

### 你每天都在用的聊天机器人

```
你: "今天天气怎么样？"
AI: "今天晴天，25度。"
```

这是传统的对话模式：一问一答。

### Agent 不一样

```
你: "帮我重构一下这个项目的认证模块。"
AI: "好的，我先看看代码结构。"
    [调用工具: ls -la]
    "找到了，认证在 src/auth/。让我读取一下。"
    [调用工具: read_file src/auth/login.py]
    "理解了，我来重构。"
    [调用工具: edit_file src/auth/login.py]
    "完成了！我改了这些地方..."
```

**关键区别**：模型会**反复**调用工具，直到任务完成。

---

## 核心洞察：模型是决策者，代码只是循环

传统软件：
```
代码是决策者 → 调用工具 → 完成任务
```

Agent 系统：
```
模型是决策者 → 调用工具 → 观察结果 → 再决策...
代码只是提供工具，并跑这个循环。
```

这就是"模型即代理"的含义。

---

## 四个核心工具

你不需要 20 个工具，4 个就覆盖 90% 场景：

| 工具 | 用途 | 示例 |
|------|------|------|
| `bash` | 运行命令 | `npm install`, `git status` |
| `read_file` | 读取内容 | 查看 `src/index.ts` |
| `write_file` | 创建/覆盖 | 创建 `README.md` |
| `edit_file` | 精确修改 | 替换一个函数 |

有了这 4 个工具，模型可以：
- 探索代码库（`bash: find, grep, ls`）
- 理解代码（`read_file`）
- 做出修改（`write_file`, `edit_file`）
- 运行任何东西（`bash: python, npm, make`）

---

## 现在，手写 v1

### 准备工作

先安装依赖：

```bash
pip install openai python-dotenv
```

创建 `.env` 文件：

```bash
# OpenAI / 国内兼容模型
OPENAI_API_KEY=你的key
OPENAI_BASE_URL=https://api.openai.com/v1

# 国内模型示例：
# OPENAI_BASE_URL=https://api.deepseek.com/v1
# OPENAI_BASE_URL=https://api.siliconflow.cn/v1
# OPENAI_BASE_URL=https://api.baichuan-ai.com/v1

# 模型名称
MODEL=gpt-4o  # 或 claude-3-5-sonnet-20241022, deepseek-chat 等
```

---

### 空文件开始，逐行手写

创建 `v1_basic_agent.py`，我们一行一行来。

**第 1-10 行：导入库**

```python
from openai import OpenAI
from dotenv import load_dotenv
import os
import subprocess
import json

# 加载环境变量
load_dotenv()
WORKDIR = os.getcwd()
MODEL = os.getenv("MODEL", "gpt-4o")
```

**第 11-30 行：safe_path - 安全是第一位**

```python
def safe_path(path: str) -> str:
    """确保路径在工作目录内，防止目录遍历攻击"""
    target = os.path.abspath(os.path.join(WORKDIR, path))
    if not target.startswith(WORKDIR):
        raise ValueError(f"路径 {path} 不在工作目录内")
    return target
```

为什么需要这个？防止模型不小心删掉系统文件。

**第 31-60 行：4 个工具**

先写 `bash` 工具：

```python
def bash(command: str) -> str:
    """执行 shell 命令"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=300,
            cwd=WORKDIR
        )
        output = result.stdout + result.stderr
        return output.strip() or "(没有输出)"
    except subprocess.TimeoutExpired:
        return "错误：命令超时（5分钟）"
    except Exception as e:
        return f"错误：{e}"
```

然后是 `read_file`：

```python
def read_file(path: str) -> str:
    """读取文件内容"""
    try:
        with open(safe_path(path), "r", encoding="utf-8") as f:
            content = f.read()
        # 限制长度，防止上下文爆炸
        if len(content) > 10000:
            return content[:10000] + "\n\n(...文件太长，截断了...)"
        return content
    except FileNotFoundError:
        return f"错误：文件 {path} 不存在"
    except Exception as e:
        return f"错误：{e}"
```

`write_file`：

```python
def write_file(path: str, content: str) -> str:
    """写入文件（会覆盖）"""
    try:
        with open(safe_path(path), "w", encoding="utf-8") as f:
            f.write(content)
        return f"已写入 {path}"
    except Exception as e:
        return f"错误：{e}"
```

`edit_file`（最巧妙的一个）：

```python
def edit_file(path: str, old_str: str, new_str: str) -> str:
    """精确替换文件内容"""
    try:
        full_path = safe_path(path)
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        if old_str not in content:
            return f"错误：在 {path} 中找不到 '{old_str[:50]}...'"
        
        # 确保只替换一次
        if content.count(old_str) > 1:
            return f"错误：{path} 中有多个匹配，请更精确"
        
        content = content.replace(old_str, new_str)
        
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        return f"已修改 {path}"
    except Exception as e:
        return f"错误：{e}"
```

为什么是精确字符串替换？因为模型知道它想改什么，这样最安全。

**第 61-120 行：工具定义（给模型看的）**

模型需要知道每个工具是干什么的，以及怎么调用：

```python
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "bash",
            "description": f"执行 shell 命令。当前目录：{WORKDIR}",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {"type": "string", "description": "要执行的命令"}
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "读取文件内容",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"}
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "写入文件（会覆盖已存在的文件）",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"},
                    "content": {"type": "string", "description": "文件内容"}
                },
                "required": ["path", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_file",
            "description": "精确替换文件内容。old_str 必须完全匹配文件中的一段。",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "文件路径"},
                    "old_str": {"type": "string", "description": "要替换的旧内容"},
                    "new_str": {"type": "string", "description": "新内容"}
                },
                "required": ["path", "old_str", "new_str"]
            }
        }
    }
]
```

这就是给模型看的"说明书"。

**第 121-140 行：系统提示词**

```python
SYSTEM = f"""你是一个编程助手，工作目录是 {WORKDIR}。

工作流程：
1. 先理解任务
2. 使用工具探索和修改
3. 完成后总结

规则：
- 用工具，不要只说不做
- 不确定路径时，先用 ls/find 看看
- 最小修改，不要过度设计
- 完成后总结改了什么
"""
```

没有复杂逻辑，只有清晰的指令。

**第 141-220 行：核心循环（最重要的部分）**

```python
def agent_loop():
    """主 Agent 循环"""
    client = OpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL")
    )
    messages = [{"role": "system", "content": SYSTEM}]
    
    print("🤖 Agent 已启动！输入 'q' 退出。")
    
    while True:
        # 获取用户输入
        user_input = input(">> ").strip()
        if user_input in ("q", "quit", "exit"):
            print("再见！")
            break
        if not user_input:
            continue
        
        messages.append({"role": "user", "content": user_input})
        
        while True:
            # 1. 调用模型
            response = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOLS,
                max_tokens=4096
            )
            
            choice = response.choices[0]
            assistant_msg = choice.message
            
            # 2. 打印文本输出
            if assistant_msg.content:
                print(assistant_msg.content)
            
            # 3. 如果没有工具调用，本轮结束
            if not assistant_msg.tool_calls:
                messages.append({
                    "role": "assistant",
                    "content": assistant_msg.content
                })
                break
            
            # 4. 执行工具
            tool_results = []
            messages.append({
                "role": "assistant",
                "content": assistant_msg.content,
                "tool_calls": assistant_msg.tool_calls
            })
            
            for tool_call in assistant_msg.tool_calls:
                print(f"\n🔧 调用工具: {tool_call.function.name}")
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                
                if function_name == "bash":
                    output = bash(function_args["command"])
                elif function_name == "read_file":
                    output = read_file(function_args["path"])
                elif function_name == "write_file":
                    output = write_file(function_args["path"], function_args["content"])
                elif function_name == "edit_file":
                    output = edit_file(function_args["path"], function_args["old_str"], function_args["new_str"])
                else:
                    output = f"未知工具: {function_name}"
                
                print(f"   结果: {output[:100]}...")
                tool_results.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": output
                })
            
            # 5. 添加工具结果
            messages.extend(tool_results)

if __name__ == "__main__":
    agent_loop()
```

这就是整个 Agent。**核心就是这个 while True 循环。**

---

## 运行它！

```bash
python v1_basic_agent.py
```

试试这个：

```
>> 列一下当前目录
```

看看会发生什么。

---

## 为什么这个设计有效？

| 特性 | 说明 |
|------|------|
| **简单** | 没有状态机，没有规划模块，没有框架 |
| **模型负责思考** | 模型决定用哪些工具、什么顺序、何时停止 |
| **透明** | 每个工具调用可见，每个结果在对话中 |
| **可扩展** | 添加工具 = 一个函数 + 一个 JSON schema |

---

## 核心洞察（记住这句话）

> **模型是决策者，代码只提供工具并运行循环。**

这就是"模型即代理"的全部秘密。

---

## 国内模型配置示例

`.env` 文件配置：

```bash
# DeepSeek
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
MODEL=deepseek-chat

# 硅基流动
# OPENAI_API_KEY=sk-xxx
# OPENAI_BASE_URL=https://api.siliconflow.cn/v1
# MODEL=Qwen/Qwen2.5-72B-Instruct

# 百川
# OPENAI_API_KEY=sk-xxx
# OPENAI_BASE_URL=https://api.baichuan-ai.com/v1
# MODEL=Baichuan4
```

---

**下一章，我们给它加个 Todo 工具，让它不再胡作非为。**
