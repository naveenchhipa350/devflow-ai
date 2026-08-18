import { useMemo, useState } from 'react';
import { GitCommitHorizontal, GitPullRequest, ListChecks, MessageSquare, Search, UserPlus, Zap } from 'lucide-react';
import { getListActivityQueryKey, useListActivity } from '@workspace/api-client-react';
import { Avatar, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select } from '@/components/devflow-ui';

const iconFor = (kind: string) => kind.toLowerCase().includes('commit') ? GitCommitHorizontal : kind.toLowerCase().includes('pull') ? GitPullRequest : kind.toLowerCase().includes('task') ? ListChecks : kind.toLowerCase().includes('member') ? UserPlus : kind.toLowerCase().includes('comment') ? MessageSquare : Zap;

export default function ActivityPage() {
  const activity = useListActivity({ query: { queryKey: getListActivityQueryKey() } });
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const filtered = useMemo(() => (activity.data ?? []).filter((item) => (kind === 'all' || item.kind === kind) && `${item.title} ${item.description} ${item.user}`.toLowerCase().includes(search.toLowerCase())), [activity.data, kind, search]);
  const kinds = [...new Set((activity.data ?? []).map((item) => item.kind))];
  if (activity.isLoading) return <><PageHeader eyebrow="Workspace / Activity" title="Activity" description="A living record of the decisions and motion behind the work." /><LoadingState rows={7} /></>;
  if (activity.isError) return <ErrorState onRetry={() => activity.refetch()} />;
  return <div className="reveal">
    <PageHeader eyebrow="Workspace / Activity" title="Activity" description="A living record of the decisions and motion behind the work." />
    <div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative max-w-sm flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input data-testid="input-search-activity" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity..." className="pl-9" /></div><Select data-testid="select-activity-kind" value={kind} onChange={(event) => setKind(event.target.value)} className="sm:w-44"><option value="all">All activity</option>{kinds.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</Select></div>
    <Card className="p-5 md:p-8">{filtered.length === 0 ? <EmptyState title="Nothing matches yet" body="Try widening your search or clearing the filter." /> : <div className="relative ml-3 border-l border-border">{filtered.map((item) => { const Icon = iconFor(item.kind); return <div data-testid={`timeline-item-${item.id}`} key={item.id} className="relative pb-8 pl-8 last:pb-1"><div className="absolute -left-[15px] top-0 grid h-7 w-7 place-items-center rounded-full border-4 border-card bg-muted text-muted-foreground"><Icon size={12} /></div><div className="flex flex-col justify-between gap-2 sm:flex-row"><div><div className="text-sm"><span className="font-semibold">{item.user}</span><span className="text-muted-foreground"> {item.title}</span></div><p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p><div className="mt-3 flex items-center gap-2"><Avatar initials={item.userInitials} /><span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{item.kind.replaceAll('_', ' ')}</span></div></div><span className="shrink-0 font-mono text-[10px] text-muted-foreground/65">{item.timestamp}</span></div></div>; })}</div>}</Card>
  </div>;
}