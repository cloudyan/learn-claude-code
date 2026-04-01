import { writeFileSync } from 'fs';
import { safePath } from '../utils/safePath';
import { WORK_DIR } from '../clients/model';

/**
 * Write File 工具：创建或覆写文件
 *
 * 参数名对齐 Python 根目录：path, content
 */
export interface WriteFileArgs {
  path: string;
  content: string;
}

export function writeFile(args: WriteFileArgs): string {
  try {
    const filePath = safePath(args.path, WORK_DIR);
    writeFileSync(filePath, args.content, 'utf8');
    return '写入成功';
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}

export const WRITE_FILE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'write_file',
    description: 'Write content to a file. Creates parent directories if needed.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Relative path for the file' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    }
  }
};
