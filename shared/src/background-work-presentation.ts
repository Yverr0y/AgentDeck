/** Cross-surface background work policy. Unknown is not zero; only an explicit
 * lower count can finish work. Kept separate from the child-agent census. */
export const BACKGROUND_PRESENTATION = {
  "maxCount": 4096,
  "maxDots": 3,
  "pixelRadiusFraction": 0.7,
  "pixelOrbitAspect": 0.45,
  "pixelMinRadius": 3,
  "orbitMs": 4800,
  "finishMs": 1500,
  "running": "background",
  "complete": "Background complete",
  "compact": "BG",
  "done": "BG DONE"
} as const;

export function backgroundCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= BACKGROUND_PRESENTATION.maxCount ? value : null;
}
export function backgroundLabel(value: unknown): string | null {
  const count = backgroundCount(value);
  return count === null ? null : count === 0 ? BACKGROUND_PRESENTATION.complete : `${count} ${BACKGROUND_PRESENTATION.running}`;
}
export function backgroundCompact(value: unknown): string | null {
  const count = backgroundCount(value);
  return count === null ? null : count === 0 ? BACKGROUND_PRESENTATION.done : `${BACKGROUND_PRESENTATION.compact} ${count}`;
}
