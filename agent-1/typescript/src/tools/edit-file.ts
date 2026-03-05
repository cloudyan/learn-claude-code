import { readFileSync, writeFileSync } from 'fs';
import { safePath } from '../utils/safePath';
import { WORK_DIR } from '../clients/model';

/**
 * Edit File 工具：精确字符串替换编辑
 *
 * 参数名对齐 Python 根目录：path, old_text, new_text
 */
export interface EditFileArgs {
  path: string;
  old_text: string;
  new_text: string;
}

export function editFile(args: EditFileArgs): string {
  try {
    const filePath = safePath(args.path, WORK_DIR);
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(args.old_text)) return '错误: 找不到要替换的内容';
    writeFileSync(filePath, content.replace(args.old_text, args.new_text), 'utf8');
    return '编辑成功';
  } catch (e: any) {
    return `错误: ${e.message}`;
  }
}

export const EDIT_FILE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'edit_file',
    description: 'Replace exact text in a file. Use for surgical edits.',
    parameters: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Relative path to the file' },
        old_text: { type: 'string', description: 'Exact text to find (must match precisely)' },
        new_text: { type: 'string', description: 'Replacement text' }
      },
      required: ['path', 'old_text', 'new_text']
    }
  }
};
