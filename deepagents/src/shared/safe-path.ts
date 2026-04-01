import path from "node:path";

export function assertInsideRoot(root: string, userPath: string): string {
  const resolved = path.resolve(root, userPath);

  if (!resolved.startsWith(root)) {
    throw new Error(`Path escapes workspace: ${userPath}`);
  }

  return resolved;
}
