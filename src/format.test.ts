import { describe, expect, it } from 'vitest';
import { scoreBreakdown, timeAgo } from './format';

describe('timeAgo', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  it('formats minutes, hours and days', () => {
    expect(timeAgo('2026-11-01T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-11-01T11:15:00Z', now)).toBe('45m ago');
    expect(timeAgo('2026-11-01T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-10-29T12:00:00Z', now)).toBe('3d ago');
  });
});

describe('scoreBreakdown', () => {
  it('lists only the stages that ran', () => {
    expect(scoreBreakdown({ keywordScore: 70, embeddingScore: null, llmScore: null })).toBe('keywords 70');
    expect(scoreBreakdown({ keywordScore: 70, embeddingScore: 64, llmScore: 82 })).toBe('keywords 70 · semantic 64 · AI 82');
  });
});
