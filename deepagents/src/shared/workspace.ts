import path from "node:path";
import { assertInsideRoot } from "./safe-path.ts";

export function getWorkspaceRoot(): string {
  return process.cwd();
}

export function resolveWorkspacePath(userPath: string): string {
  const root = path.resolve(getWorkspaceRoot());
  return assertInsideRoot(root, userPath);
}
