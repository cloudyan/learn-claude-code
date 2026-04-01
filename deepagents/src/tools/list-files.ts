import { readdirSync } from "node:fs";
import { tool } from "langchain";
import { z } from "zod";
import { resolveWorkspacePath } from "../shared/workspace.ts";

export const listFilesTool = tool(
  async ({ path }: { path: string }) => {
    const resolvedPath = resolveWorkspacePath(path);
    const entries = readdirSync(resolvedPath, { withFileTypes: true });
    return entries
      .map((entry) => `${entry.isDirectory() ? "[dir]" : "[file]"} ${entry.name}`)
      .join("\n");
  },
  {
    name: "list_files",
    description: "List files and directories inside a workspace directory.",
    schema: z.object({
      path: z.string().default(".").describe("Directory path inside the workspace."),
    }),
  },
);
