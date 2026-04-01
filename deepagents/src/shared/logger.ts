export function logStep(title: string, detail?: string) {
  const suffix = detail ? `: ${detail}` : "";
  console.log(`[agent] ${title}${suffix}`);
}
