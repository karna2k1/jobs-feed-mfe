/** "3h ago", "2d ago" etc. for match timestamps. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const s = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Which scoring stages produced the final score, for the breakdown line. */
export function scoreBreakdown(m: { keywordScore: number; embeddingScore: number | null; llmScore: number | null }): string {
  const parts = [`keywords ${m.keywordScore}`];
  if (m.embeddingScore != null) parts.push(`semantic ${m.embeddingScore}`);
  if (m.llmScore != null) parts.push(`AI ${m.llmScore}`);
  return parts.join(' · ');
}
