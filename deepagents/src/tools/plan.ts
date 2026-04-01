import { tool } from "langchain";
import { z } from "zod";
import { createInMemoryPlanStore } from "../shared/types.ts";

const planStore = createInMemoryPlanStore();

export const planTool = tool(
  async ({ steps }: { steps: string[] }) => {
    planStore.setSteps(steps);
    return planStore.format();
  },
  {
    name: "plan",
    description: "Create or replace the current task plan.",
    schema: z.object({
      steps: z.array(z.string()).min(1).describe("Ordered task steps."),
    }),
  },
);

export const readPlanTool = tool(
  async () => {
    return planStore.format();
  },
  {
    name: "read_plan",
    description: "Read the current task plan.",
    schema: z.object({}),
  },
);
