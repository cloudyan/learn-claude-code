# 第2章：让 Agent 有计划 —— v2 结构化规划

**~300 行代码，+1 个工具，显式任务追踪。**

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

问题在哪里？**计划只存在于模型的"脑子里"，不可见，容易丢。**

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

```typescript
interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
}

class TodoManager {
  private todos: Todo[] = [];
  private nextId = 1;

  addTodo(content: string, priority: string = 'medium'): string {
    const id = `${this.nextId++}`;
    this.todos.push({
      id,
      content,
      status: 'pending',
      priority: (priority as any) || 'medium'
    });
    return id;
  }

  updateTodo(id: string, status: string): string {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return '错误: 找不到该任务';
    todo.status = status as any;
    return '更新成功';
  }

  getTodoList(): string {
    if (this.todos.length === 0) return '（暂无任务）';

    const stats: Record<string, number> = {};
    this.todos.forEach(t => {
      stats[t.status] = (stats[t.status] || 0) + 1;
    });

    const summary = Object.entries(stats)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const lines = this.todos.map(t =>
      `- [${t.id}] [${t.status}] [${t.priority}] ${t.content}`
    );

    return `任务列表 (${summary}):\n${lines.join('\n')}`;
  }
}
```

---

## Todo 工具定义

给模型看的"说明书"：

```typescript
const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  // ... v1 的 4 个工具 ...
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: '添加任务到任务列表',
      parameters: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '任务内容' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'], default: 'medium' }
        },
        required: ['content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_todo',
      description: '更新任务状态',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '任务 ID' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] }
        },
        required: ['id', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_todo_list',
      description: '获取当前任务列表',
      parameters: { type: 'object', properties: {} }
    }
  }
];
```

---

## 软约束：Reminder（可选）

不是命令，是"温柔的唠叨"，可以在 system prompt 里加：

```typescript
const SYSTEM_PROMPT = `你是一个能干的 AI 助手。

工作方式：
1. 先理解任务，用 add_todo 制定计划
2. 然后逐个完成，每完成一个用 update_todo 标记
3. 可以随时用 get_todo_list 查看当前进度

重要提示：
- 先规划，再执行
- 不确定时，先了解情况
`;
```

---

## 集成到 v1

在 v1 基础上添加：

```typescript
async function agentLoop(task: string, systemPrompt?: string): Promise<string> {
  const todoManager = new TodoManager();  // 新增

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt || `你是一个能干的 AI 助手。

工作方式：
1. 先理解任务，用 add_todo 制定计划
2. 然后逐个完成，每完成一个用 update_todo 标记
3. 可以随时用 get_todo_list 查看当前进度`,
    },
    { role: 'user', content: task }
  ];

  while (true) {
    // ... 同 v1 ...

    // 执行工具调用时传入 todoManager
    for (const toolCall of message.tool_calls) {
      // ...
      const result = await executeTool(toolCall.function.name, args, todoManager);
      // ...
    }
  }
}
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

```bash
npm run v2 -- "帮我：1. 探索项目结构 2. 给代码加注释 3. 更新 README"
```

看看 v2 会不会先列 Todo。

---

**下一章，我们用子代理把大任务拆成小任务。**
