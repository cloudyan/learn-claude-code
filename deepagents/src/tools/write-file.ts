import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { tool } from "langchain";
import { z } from "zod";
import { resolveWorkspacePath } from "../shared/workspace.ts";

export const writeFileTool = tool(
  async ({ path, content }: { path: string; content: string }) => {
    const resolvedPath = resolveWorkspacePath(path);
    mkdirSync(dirname(resolvedPath), { recursive: true });
    writeFileSync(resolvedPath, content, "utf8");
    return `Wrote file: ${path}`;
  },
  {
    name: "write_file",
    description: "Create or overwrite a UTF-8 text file inside the workspace.",
    schema: z.object({
      path: z.string().describe("Path to write inside the workspace."),
      content: z.string().describe("Complete UTF-8 text content to write."),
    }),
  },
);
