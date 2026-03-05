# 第2章：让 Agent 有计划 —— v2 结构化规划

**~300 行代码，+1 个工具，显式任务追踪。

---

## 痛点：v1 会"胡作非为"

你有没有试过让 v1 做复杂任务吗？

```
你: "帮我重构认证模块、加测试、更新文档。"
v1: "好的！"
    [读取一堆文件]
    [改了这个]
    [又改了那个]
    10 分钟后: "等等，我在干什么来着？"
```

问题在哪里？**计划只存在于模型的"脑子里"，不可见，容易丢。

---

## 解决方案：Todo 工具让计划显式化

想象一下：

```
v2:
  [ ] 重构认证模块
  [>] 添加单元测试         <- 当前在这
  [ ] 更新文档
```

现在你和模型都能看到计划。

---

## 核心洞察：结构既约束又赋能

约束不是限制，是脚手架。

| 规则 | 原因 |
|------|------|
| 最多 20 条 | 防止无限列表 |
| 只能一个进行中 | 强制聚焦 |
| 必填字段 | 结构化输出 |

---

## 手写 TodoManager

在 v1 基础上，我们加一个 `TodoManager` 类。

### TodoManager 类

```python
class TodoManager:
    def __init__(self):
        self.items = []  # 最多 20 条

    def update(self, items):
        """更新 Todo 列表"""
        # 验证规则
        if len(items) > 20:
            return "错误：最多 20 条 Todo"
        
        # 检查必填字段
        for item in items:
            if "content" not in item:
                return "错误：每条 Todo 需要 content"
            if "status" not in item:
                return "错误：每条 Todo 需要 status"
        
        # status 只能是 pending, in_progress, completed
        valid_status = {"pending", "in_progress", "completed"}
        for item in items:
            if item["status"] not in valid_status:
                return f"错误：status 必须是 {valid_status} 之一"
        
        # 只能有一个 in_progress
        in_progress_count = sum(1 for item in items if item["status"] == "in_progress")
        if in_progress_count > 1:
            return "错误：只能有一个进行中的 Todo"
        
        self.items = items
        return self.format()

    def format(self):
        """格式化显示"""
        lines = []
        completed = 0
        for i, item in enumerate(self.items):
            status_mark = {
                "pending": " [ ] ",
                "in_progress": " [>] ",
                "completed": " [x] "
            }[item["status"]]
            lines.append(f"{status_mark}{item['content']}")
            if item["status"] == "completed":
                completed += 1
        
        total = len(self.items)
        if total > 0:
            lines.append(f"\n({completed}/{total} 已完成)")
        
        return "\n".join(lines)
```

---

## TodoWrite 工具定义

给模型看的"说明书"：

```python
TODO_WRITE_TOOL = {
    "name": "TodoWrite",
    "description": "更新 Todo 列表。每条需要：content（任务描述）, status（pending/in_progress/completed）",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {
                "type": "array",
                "items": {
                    "type": "content": {"type": "string"},
                    "status": {"type": "string"}
                }
            }
        },
        "required": ["items"]
    }
}
```

---

## 软约束：Reminder

不是命令，是"温柔的唠叨"：

```python
INITIAL_REMINDER = "<reminder>多步骤任务请先用 TodoWrite 列计划。</reminder>"
NAG_REMINDER = "<reminder>已超过 10 轮没更新 Todo，请更新一下。</reminder>"
```

---

## 集成到 v1

在 v1 基础上添加：

```python
# 初始化
todo_manager = TodoManager()
rounds_without_todo = 0

# 在 agent_loop 里：

# 注入提醒
if len(messages) == 1:  # 第一轮
    system += "\n" + INITIAL_REMINDER

# 每 10 轮唠叨一次
rounds_without_todo += 1
if rounds_without_todo > 10:
    messages.append({"role": "user", "content": NAG_REMINDER})

# 处理 TodoWrite 工具
if tool_name == "TodoWrite":
    output = todo_manager.update(tool_input["items"])
    rounds_without_todo = 0
```

---

## 什么时候用 Todo？

| 适合 | 原因 |
|------|------|
| 多步骤工作 | 5+ 步需要追踪 |
| 长对话 | 20+ 次工具调用 |
| 复杂重构 | 多个文件 |
| 教学 | 可见的"思考过程" |

经验法则：**如果你会写清单，就用 Todo**。

---

## 试试看

```
>> 帮我：1. 探索项目结构 2. 给代码加注释 3. 更新 README
```

看看 v2 会不会先列 Todo。

---

**下一章，我们用子代理把大任务拆成小任务。
