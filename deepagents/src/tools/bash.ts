import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tool } from "langchain";
import { z } from "zod";
import { getWorkspaceRoot } from "../shared/workspace.ts";
import { truncateText } from "../shared/truncate.ts";

const execFileAsync = promisify(execFile);

export const bashTool = tool(
  async ({ command }: { command: string }) => {
    try {
      const { stdout, stderr } = await execFileAsync("/bin/zsh", ["-lc", command], {
        cwd: getWorkspaceRoot(),
        maxBuffer: 1024 * 1024,
      });

      const combined = [stdout, stderr].filter(Boolean).join("\n").trim();
      return truncateText(combined || "(no output)", 20_000);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `Command failed: ${message}`;
    }
  },
  {
    name: "bash",
    description: "Run a shell command inside the current workspace.",
    schema: z.object({
      command: z.string().describe("Shell command to run."),
    }),
  },
);
