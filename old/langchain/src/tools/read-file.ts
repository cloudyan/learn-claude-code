import { readFileSync } from 'fs';
import { safePath } from '../utils/safePath';
import { WORK_DIR } from '../clients/model';

/**
 * Read File 工具：读取文件内容
 *
 * 参数名对齐 Python 根目录：path, limit
 */
export interface ReadFileArgs {
  path: string;
  limit?: number;
}

export function readFile(args: ReadFileArgs): string {
  try {
    const filePath = safePath(args.path, WORK_DIR);
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    if (args.limit) {
      return lines.slice(0, args.limit).join('\n');
    }
    return content;
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

export const READ_FILE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'read_file',
    description: 'Read the contents of a file.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Relative path to the file' },
        limit: { type: 'integer', description: 'Max lines to read (default: all)' }
      },
      required: ['path']
    }
  }
};
