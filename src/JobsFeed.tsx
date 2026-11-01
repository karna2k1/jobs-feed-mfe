import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, EmptyState, ErrorNote, Input, ScoreBadge, Spinner } from 'shell/ui';
import type { HttpClient, Match, MatchStatus, Page } from './types';
import { scoreBreakdown, timeAgo } from './format';
import './index.css';

type Tab = MatchStatus | 'ALL';
const TABS: { id: Tab; label: string }[] = [
  { id: 'NEW', label: 'New' },
  { id: 'SAVED', label: 'Saved' },
  { id: 'IGNORED', label: 'Ignored' },
  { id: 'ALL', label: 'All' },
];

function MatchCard({ m, onStatus, busy }: { m: Match; onStatus: (s: MatchStatus) => void; busy: boolean }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {m.company}
            {m.location && ` · ${m.location}`}
            {m.remote && ' · Remote'}
            {m.source && ` · ${m.source.replace('_', ' ').toLowerCase()}`} · {timeAgo(m.createdAt)}
          </p>
          <a href={m.url} target="_blank" rel="noreferrer" className="text-base font-semibold text-slate-900 hover:text-indigo-600">
            {m.title}
          </a>
        </div>
        <div className="text-right">
          <ScoreBadge score={m.finalScore} />
          <p className="mt-1 text-[11px] text-slate-400">{scoreBreakdown(m)}</p>
        </div>
      </div>

      {m.reasons.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-600">
          {m.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1">
        {m.matchedSkills.map((s) => (
          <Badge key={`m-${s}`} tone="green">{s}</Badge>
        ))}
        {m.skillGaps.map((s) => (
          <Badge key={`g-${s}`} tone="amber">missing: {s}</Badge>
        ))}
      </div>

      <div className="flex gap-2">
        {m.status !== 'SAVED' && (
          <Button size="sm" onClick={() => onStatus('SAVED')} disabled={busy}>
            Save to board
          </Button>
        )}
        {m.status !== 'IGNORED' && (
          <Button size="sm" variant="ghost" onClick={() => onStatus('IGNORED')} disabled={busy}>
            Ignore
          </Button>
        )}
        {m.status !== 'NEW' && <Badge tone={m.status === 'SAVED' ? 'indigo' : 'slate'}>{m.status.toLowerCase()}</Badge>}
      </div>
    </Card>
  );
}

function Feed({ http }: { http: HttpClient }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('NEW');
  const [minScore, setMinScore] = useState(50);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const feed = useInfiniteQuery({
    queryKey: ['matches', tab, minScore, q],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (await http.get<Page<Match>>('/matches', { params: { status: tab, minScore, q, page: pageParam, size: 20 } })).data,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: MatchStatus }) =>
      (await http.patch<Match>(`/matches/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });

  const items = feed.data?.pages.flatMap((p) => p.content) ?? [];
  const total = feed.data?.pages[0]?.totalElements ?? 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Matched jobs</h1>
        <p className="text-sm text-slate-500">Scored against your profile. Saving adds the job to your board.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1 text-sm font-medium ${tab === t.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Min score
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} />
          <span className="w-8 tabular-nums">{minScore}</span>
        </label>
        <div className="w-64">
          <Input placeholder="Search title or company" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!feed.isLoading && <span className="text-sm text-slate-500">{total} jobs</span>}
      </div>

      {feed.isLoading && <Spinner label="Loading matches" />}
      {feed.error && <ErrorNote message={(feed.error as Error).message} />}
      {!feed.isLoading && items.length === 0 && (
        <EmptyState title="No matches here yet" hint="New jobs are ingested every 30 minutes; add skills to your profile to get scored." />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((m) => (
          <MatchCard
            key={m.id}
            m={m}
            busy={setStatus.isPending && setStatus.variables?.id === m.id}
            onStatus={(status) => setStatus.mutate({ id: m.id, status })}
          />
        ))}
      </div>

      {feed.hasNextPage && (
        <div className="text-center">
          <Button variant="secondary" onClick={() => feed.fetchNextPage()} disabled={feed.isFetchingNextPage}>
            {feed.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Exposed as jobsFeed/JobsFeed. Owns its QueryClient so it works in any host. */
export default function JobsFeed({ http }: { http: HttpClient }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <Feed http={http} />
    </QueryClientProvider>
  );
}
