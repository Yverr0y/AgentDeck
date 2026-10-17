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
  messageIntent: {
    // Never classify a clipped summary: a later sentence can waive a reply.
    maxCharacters: 16_000,
    whitespace: String.raw`[\u0009-\u000d\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]`,
    // A waiver can contain the positive phrase "reply is requested"; match it first.
    noReply: String.raw`\b(?:no (?:reply|response) (?:is )?(?:needed|required|necessary|requested|expected)|(?:reply|response) is not (?:needed|required|necessary|requested|expected)|(?:do not|don't) (?:reply|respond|send (?:a |any )?(?:reply|response))|no need to (?:reply|respond))\b|(?:답장|답변|응답|회신)\s*(?:[은는이가]\s*)?(?:불필요|필요\s*없|하지\s*마|안\s*해도)|세션\s*사이\s*알림`,
    request: String.raw`\b(?:please (?:reply|respond|confirm|report back)|(?:can|could|would) you (?:reply|respond|confirm)|(?:reply|response) (?:is )?(?:required|requested)|let me know|send me (?:the |your )?(?:results|findings|answer))\b|(?:^|[.!?\n;:])\s*report back\b|(?:답장|답변|응답|회신)(?:을|를)?\s*(?:부탁|요청|해\s*줘|해주|해\s*주|바랍|주세요)|(?:알려|보고해|공유해)\s*(?:줘|주세|주시|주면)`,
    response: String.raw`\b(?:in reply to|in response to|here (?:are|is) (?:the |your )?requested (?:results|findings|answer))\b|(?:답변|회신)(?:입니다|드립니다)|요청하신[^.!?\n]{0,50}(?:결과|답변|보고)`,
    notification: String.raw`\b(?:fyi|heads[ -]up|pong|for (?:your )?information|notification|status update)\b|(?:참고용|단순\s*알림|결과\s*보고|완료\s*보고)`,
  },
  metrics: [
    { field: 'childrenActive', label: 'Subagents active', symbol: 'circle.dotted', source: 'subagents' },
    { field: 'childrenCompleted', label: 'Done this wave', symbol: 'checkmark.circle', source: 'subagents' },
    { field: 'spawnedActive', label: 'Spawned running', symbol: 'arrow.up.right.circle', source: 'coordination' },
    { field: 'backgroundJobs', label: 'Jobs waited on', symbol: 'hourglass', source: 'coordination' },
  ],
} as const;

export type CommunicationIntent = 'request' | 'notification' | 'response' | 'unknown';
/** Conservative text evidence, not a harness receipt. Unknown never starts a
 * wait. Quoted/code examples are not instructions to the receiving session. */
export function communicationIntent(body: unknown): CommunicationIntent {
  const p = COLLABORATION_PRESENTATION.messageIntent;
  if (typeof body !== 'string' || Array.from(body).length > p.maxCharacters) return 'unknown';
  const text = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
    .replace(/"[^"\n]*"|“[^”\n]*”|‘[^’\n]*’/g, '')
    .split('\n').filter(line => !/^\s*>/.test(line)).join('\n')
    .replace(new RegExp(p.whitespace + '+', 'g'), ' ').trim();
  if (new RegExp(p.noReply, 'i').test(text)) return 'notification';
  if (new RegExp(p.request, 'i').test(text)) return 'request';
  if (new RegExp(p.response, 'i').test(text)) return 'response';
  if (new RegExp(p.notification, 'i').test(text)) return 'notification';
  return 'unknown';
}

/** Content identity for deduplicating the two hook observations, never peer identity. */
export function communicationFingerprint(body: unknown): string | null {
  if (typeof body !== 'string' || Array.from(body).length > COLLABORATION_PRESENTATION.messageIntent.maxCharacters) return null;
  let hash = 14695981039346656037n;
  for (const byte of new TextEncoder().encode(body.replace(new RegExp(COLLABORATION_PRESENTATION.messageIntent.whitespace + '+', 'g'), ' ').trim())) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1099511628211n);
  }
  return hash.toString(16);
}
/** 0 input, 1 working, 2 waiting on work, 3 idle. Numeric form generates intact
 * into Swift and C++; absent census counts arrive as zero, never as fake nodes. */
export function collaborationPhase(attention: boolean, working: boolean, children: number, spawned: number, jobs: number): number {
  return attention ? 0 : working ? 1 : children > 0 || spawned > 0 || jobs > 0 ? 2 : 3;
}
