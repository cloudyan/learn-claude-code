import { readFileSync, writeFileSync } from "node:fs";
import { tool } from "langchain";
import { z } from "zod";
import { resolveWorkspacePath } from "../shared/workspace.ts";

export const editFileTool = tool(
  async ({ path, oldText, newText }: { path: string; oldText: string; newText: string }) => {
    const resolvedPath = resolveWorkspacePath(path);
    const current = readFileSync(resolvedPath, "utf8");

    if (!current.includes(oldText)) {
      return `Original text not found in ${path}`;
    }

    const updated = current.replace(oldText, newText);
    writeFileSync(resolvedPath, updated, "utf8");
    return `Edited file: ${path}`;
  },
  {
    name: "edit_file",
    description: "Replace a specific text fragment inside a UTF-8 text file.",
    schema: z.object({
      path: z.string().describe("Path to edit inside the workspace."),
      oldText: z.string().describe("Exact text to replace."),
      newText: z.string().describe("Replacement text."),
    }),
  },
);
