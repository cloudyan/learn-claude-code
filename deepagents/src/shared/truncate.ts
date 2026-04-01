export function truncateText(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, maxLength)}\n\n... [truncated ${input.length - maxLength} chars]`;
}
