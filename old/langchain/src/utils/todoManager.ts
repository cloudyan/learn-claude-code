export interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

/**
 * TodoManager — v2 的核心
 *
 * 验证规则：
 * - 每个 Todo 必须有：content, status, activeForm
 * - status 必须是：pending | in_progress | completed
 * - 只能有一个 in_progress
 * - 最多 20 条
 */
export class TodoManager {
  private items: Todo[] = [];

  update(items: Todo[]): string {
    const validated: Todo[] = [];
    let inProgressCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const content = String(item.content || '').trim();
      const status = String(item.status || 'pending').toLowerCase() as any;
      const activeForm = String(item.activeForm || '').trim();

      // 验证检查
      if (!content) {
        throw new Error(`第 ${i} 条任务：content 必填`);
      }
      if (!['pending', 'in_progress', 'completed'].includes(status)) {
        throw new Error(`第 ${i} 条任务：无效的 status '${status}'`);
      }
      if (!activeForm) {
        throw new Error(`第 ${i} 条任务：activeForm 必填`);
      }

      if (status === 'in_progress') {
        inProgressCount++;
      }

      validated.push({ content, status, activeForm });
    }

    // 强制约束
    if (validated.length > 20) {
      throw new Error('最多允许 20 条任务');
    }
    if (inProgressCount > 1) {
      throw new Error('同一时间只能有一个进行中的任务');
    }

    this.items = validated;
    return this.render();
  }

  /**
   * 渲染 Todo 列表为可读文本
   */
  render(): string {
    if (this.items.length === 0) {
      return '（暂无任务）';
    }

    const lines: string[] = [];
    for (const item of this.items) {
      if (item.status === 'completed') {
        lines.push(`[x] ${item.content}`);
      } else if (item.status === 'in_progress') {
        lines.push(`[>] ${item.content} <- ${item.activeForm}`);
      } else {
        lines.push(`[ ] ${item.content}`);
      }
    }

    const completed = this.items.filter(t => t.status === 'completed').length;
    lines.push(`\n(${completed}/${this.items.length} 已完成)`);

    return lines.join('\n');
  }
}

// 系统提醒
export const INITIAL_REMINDER = '<reminder>多步骤任务请先用 TodoWrite 列计划。</reminder>';
export const NAG_REMINDER = '<reminder>已超过 10 轮没更新 Todo，请更新一下。</reminder>';
