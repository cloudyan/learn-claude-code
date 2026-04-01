import { tool } from "langchain";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { resolveWorkspacePath } from "../shared/workspace.ts";
import { truncateText } from "../shared/truncate.ts";

export const readFileTool = tool(
  async ({ path }: { path: string }) => {
    const resolvedPath = resolveWorkspacePath(path);
    const content = readFileSync(resolvedPath, "utf8");
    return truncateText(content, 20_000);
  },
  {
    name: "read_file",
    description: "Read a UTF-8 text file from the current workspace.",
    schema: z.object({
      path: z.string().describe("Path to a text file inside the workspace."),
    }),
  },
);
