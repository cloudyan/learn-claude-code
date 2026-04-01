import { Todo } from '../utils/todoManager';

/**
 * TodoWrite 工具：更新任务列表
 */
export interface TodoWriteArgs {
  items: Todo[];
}

// 工具定义（执行函数在 v2 中，因为依赖 TodoManager 实例）
export const TODO_WRITE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'TodoWrite',
    description: '更新任务列表。用于规划和追踪进度。',
    parameters: {
      type: 'object' as const,
      properties: {
        items: {
          type: 'array' as const,
          description: '完整任务列表（替换现有列表）',
          items: {
            type: 'object' as const,
            properties: {
              content: { type: 'string', description: '任务描述' },
              status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], description: '任务状态' },
              activeForm: { type: 'string', description: '现在进行时描述，例如："正在读取文件..."' }
            },
            required: ['content', 'status', 'activeForm']
          }
        }
      },
      required: ['items']
    }
  }
};
