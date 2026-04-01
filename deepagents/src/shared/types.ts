export interface PlanStore {
  setSteps(steps: string[]): void;
  getSteps(): string[];
  format(): string;
}

export function createInMemoryPlanStore(): PlanStore {
  let steps: string[] = [];

  return {
    setSteps(nextSteps) {
      steps = [...nextSteps];
    },
    getSteps() {
      return [...steps];
    },
    format() {
      if (steps.length === 0) {
        return "(no plan)";
      }

      return steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
    },
  };
}
