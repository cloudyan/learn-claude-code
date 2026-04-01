import { execSync } from 'child_process';
import { WORK_DIR } from '../clients/model';

/**
 * Bash 工具：执行任意命令
 */
export interface BashArgs {
  command: string;
  timeout?: number;
}

export function bash(args: BashArgs): string {
  try {
    const output = execSync(args.command, {
      encoding: 'utf8',
      timeout: args.timeout || 120000,
      cwd: WORK_DIR,
      stdio: 'pipe'
    });
    return output.trim() || '(无输出)';
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}

export const BASH_TOOL = {
  type: 'function' as const,
  function: {
    name: 'bash',
    description: '执行任意 bash 命令（如 git, npm, ls, grep, find 等）',
    parameters: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: '要执行的 bash 命令' },
        timeout: { type: 'integer', description: '超时时间（毫秒），默认 120000', default: 120000 }
      },
      required: ['command']
    }
  }
};
