'use client';

import Pagination from '@/components/Pagination';
import { adminService, type AuditLogEntry } from '@/services/admin.service';
import { useEffect, useState } from 'react';

const labelFor = (action: string) => action.toLowerCase().replaceAll('_', ' ');

export default function ModerationPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    adminService.getAuditLogs(page, limit).then((response) => {
      if (!active) return;
      setLogs(response.data || []);
      setTotal(response.meta?.total || 0);
      setError('');
    }).catch((requestError: unknown) => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Unable to load audit activity.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [limit, page]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Moderation</p><h2 className="mt-1 text-xl font-bold text-slate-900">Audit activity</h2><p className="mt-1 text-sm text-slate-500">Administrative and supervisory actions recorded by the server.</p></div><span className="text-sm text-slate-500">{total.toLocaleString()} events</span></div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 divide-y divide-slate-100">
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading audit records…</p> : logs.length ? logs.map((log) => <article key={log.id} className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-800">{labelFor(log.action)}</span><span className="text-sm font-semibold text-slate-800">{log.actor.displayName}</span><span className="text-xs text-slate-500">{log.actor.role.toLowerCase()}</span></div><p className="mt-2 text-sm text-slate-700">{log.detail || 'No additional details recorded.'}</p>{log.targetId && <p className="mt-1 text-xs text-slate-500">Target: {log.targetType || 'record'} · {log.targetId}</p>}</div><time className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</time></article>) : <p className="py-8 text-center text-sm text-slate-500">No audit activity recorded.</p>}
      </div>
      <div className="mt-4">
        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
        />
      </div>
    </section>
  );
}
