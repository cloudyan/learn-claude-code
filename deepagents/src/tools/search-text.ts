import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tool } from "langchain";
import { z } from "zod";
import { getWorkspaceRoot } from "../shared/workspace.ts";
import { truncateText } from "../shared/truncate.ts";

const execFileAsync = promisify(execFile);

export const searchTextTool = tool(
  async ({ query }: { query: string }) => {
    try {
      const { stdout } = await execFileAsync("rg", ["-n", query, "."], {
        cwd: getWorkspaceRoot(),
        maxBuffer: 1024 * 1024,
      });

      return truncateText(stdout || "(no matches)", 20_000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `Search failed: ${message}`;
    }
  },
  {
    name: "search_text",
    description: "Search text in the current workspace using ripgrep.",
    schema: z.object({
      query: z.string().describe("Text or regex pattern to search for."),
    }),
  },
);
