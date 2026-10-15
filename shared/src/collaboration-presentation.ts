/** Live census is separate from task-scoped observations. Never sum potentially
 * overlapping subagent/worker counts or infer delegation from project presence. */
export const COLLABORATION_PRESENTATION = {
  heading: 'Collaboration',
  scope: 'Live session census',
  network: {
    historyWindowMs: 86_400_000,
    eventLimit: 2_000,
    refreshSeconds: 5,
    detailCharacters: 140,
    // Opposite-direction messages this close may cross in flight. Do not
    // claim one answered the other or start a reply timer for either.
    simultaneousWindowMs: 2_000,
  },
  aquarium: {
    // A quiet, bounded overlay; only genuinely visible endpoints can anchor it.
    linkLimit: 8,
    recentMessageMs: 30_000,
    bubbleTravelSeconds: 6,
    bubbleCount: 3,
  },
  metrics: [
    { field: 'childrenActive', label: 'Subagents active', symbol: 'circle.dotted', source: 'subagents' },
    { field: 'childrenCompleted', label: 'Done this wave', symbol: 'checkmark.circle', source: 'subagents' },
    { field: 'spawnedActive', label: 'Spawned running', symbol: 'arrow.up.right.circle', source: 'coordination' },
    { field: 'backgroundJobs', label: 'Jobs waited on', symbol: 'hourglass', source: 'coordination' },
  ],
} as const;
/** 0 input, 1 working, 2 waiting on work, 3 idle. Numeric form generates intact
 * into Swift and C++; absent census counts arrive as zero, never as fake nodes. */
export function collaborationPhase(attention: boolean, working: boolean, children: number, spawned: number, jobs: number): number {
  return attention ? 0 : working ? 1 : children > 0 || spawned > 0 || jobs > 0 ? 2 : 3;
}
