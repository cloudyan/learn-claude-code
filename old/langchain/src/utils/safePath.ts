import path from 'path';

/**
 * 安全路径检查：防止路径逃逸出工作目录
 */
export function safePath(userPath: string, workDir: string = process.cwd()): string {
  const resolved = path.resolve(userPath);
  if (!resolved.startsWith(workDir)) {
    throw new Error(`路径 ${userPath} 超出工作目录范围`);
  }
  return resolved;
}
