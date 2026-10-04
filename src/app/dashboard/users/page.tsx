'use client';

import Pagination from '@/components/Pagination';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { adminService, type AdminUser, type AdminUserStatus } from '@/services/admin.service';
import { ApiError } from '@/services/apiClient';
import { useEffect, useState, type FormEvent } from 'react';

const roles = [
  { label: 'All', value: 'ALL' },
  { label: 'Student', value: 'STUDENT' },
  { label: 'Teacher', value: 'TEACHER' },
  { label: 'Moderator', value: 'MODERATOR' },
  { label: 'Admin', value: 'ADMIN' },
] as const;

type RoleFilter = (typeof roles)[number]['value'];

const statusTone: Record<AdminUserStatus, string> = {
  ACCEPTED: 'bg-accent-100 text-accent-800',
  REJECTED: 'bg-red-100 text-red-700',
};

interface Feedback {
  message: string;
  type: 'success' | 'error';
}

export default function DashboardUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      adminService.getUsers({
        page,
        limit,
        search: search.trim() || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      }).then((response) => {
        if (!active) return;
        setUsers(response.data || []);
        setTotal(response.meta?.total || 0);
      }).catch((requestError: unknown) => {
        if (active) setFeedback({ message: requestError instanceof ApiError ? requestError.message : 'Unable to load users.', type: 'error' });
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, search ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [limit, page, refreshKey, roleFilter, search, statusFilter]);

  useEffect(() => setSelectedIds([]), [page, roleFilter, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectableUsers = users.filter((user) => user.role !== 'ADMIN');
  const allSelected = selectableUsers.length > 0 && selectableUsers.every((user) => selectedIds.includes(user.id));

  const updateStatus = async (user: AdminUser, nextStatus: AdminUserStatus) => {
    setBusyUserId(user.id);
    setFeedback(null);
    try {
      await adminService.changeUserStatus(user.id, nextStatus);
      setFeedback({ message: `${user.displayName} ${nextStatus.toLowerCase()}.`, type: 'success' });
      setRefreshKey((current) => current + 1);
    } catch (requestError: unknown) {
      setFeedback({ message: requestError instanceof ApiError ? requestError.message : 'Unable to update user status.', type: 'error' });
    } finally {
      setBusyUserId(null);
    }
  };

  const updateSelected = async (nextStatus: AdminUserStatus) => {
    const targets = users.filter((user) => selectedIds.includes(user.id) && user.role !== 'ADMIN' && user.status !== nextStatus);
    if (!targets.length) return;
    setBulkBusy(true);
    setFeedback(null);
    const results = await Promise.allSettled(targets.map((user) => adminService.changeUserStatus(user.id, nextStatus)));
    const changed = results.filter((result) => result.status === 'fulfilled').length;
    setBulkBusy(false);
    setSelectedIds([]);
    setRefreshKey((current) => current + 1);
    if (changed) setFeedback({ message: `${changed} user${changed === 1 ? '' : 's'} ${nextStatus.toLowerCase()}.`, type: 'success' });
    if (changed < targets.length) setFeedback({ message: `${targets.length - changed} user status update(s) failed.`, type: 'error' });
  };

  return (
    <div className="w-full min-w-0">
      <section className="w-full min-w-0 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-700">User Management</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Workspace users</h2>
            <p className="mt-1 text-sm text-slate-600">Review account status and manage user access.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter users by role">
            {roles.map((role) => <button key={role.value} type="button" role="tab" aria-selected={roleFilter === role.value} onClick={() => { setRoleFilter(role.value); setPage(1); }} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${roleFilter === role.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{role.label}</button>)}
          </div>
        </div>

        {feedback && <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-4 rounded-lg border px-3 py-2 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{feedback.message}</p>}

        <div className="mt-4 space-y-3">
          <Input aria-label="Search by name, email or user ID" placeholder="Search by name, email or user ID" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as AdminUserStatus | 'ALL'); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
              <option value="ALL">All statuses</option><option value="ACCEPTED">Accepted</option><option value="REJECTED">Rejected</option>
            </select>
            <Button type="button" variant="outline" size="sm" disabled={!selectedIds.length || bulkBusy} isLoading={bulkBusy} onClick={() => { void updateSelected('REJECTED'); }}>Bulk reject</Button>
            <Button type="button" variant="primary" size="sm" disabled={!selectedIds.length || bulkBusy} isLoading={bulkBusy} onClick={() => { void updateSelected('ACCEPTED'); }}>Bulk accept</Button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700"><tr>
              <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Select all users on this page" checked={allSelected} disabled={!selectableUsers.length || loading || bulkBusy} onChange={(event) => setSelectedIds(event.target.checked ? selectableUsers.map((user) => user.id) : [])} /></th>
              <th className="px-4 py-3 font-semibold">User</th><th className="px-4 py-3 font-semibold">Role</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Loading users…</td></tr> : users.length ? users.map((user) => <tr key={user.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${user.displayName}`} checked={selectedIds.includes(user.id)} disabled={user.role === 'ADMIN' || bulkBusy} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} /></td>
                <td className="px-4 py-3"><span className="block font-semibold text-slate-900">{user.displayName}</span><span className="mt-0.5 block text-xs text-slate-500">{user.email}</span></td>
                <td className="px-4 py-3 capitalize text-slate-600">{user.role.toLowerCase()}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone[user.status]}`}>{user.status}</span></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">
                  {user.role !== 'ADMIN' && (user.status === 'REJECTED' ? (
                    <Button type="button" variant="secondary" size="sm" disabled={busyUserId === user.id} isLoading={busyUserId === user.id} className="!rounded-full !bg-accent-50 !px-2.5 !py-1 !text-xs !text-accent-800" onClick={() => { void updateStatus(user, 'ACCEPTED'); }}>Approve</Button>
                  ) : (
                    <Button type="button" variant="danger" size="sm" disabled={busyUserId === user.id} isLoading={busyUserId === user.id} className="!rounded-full !bg-red-50 !px-2.5 !py-1 !text-xs !text-red-700" onClick={() => { void updateStatus(user, 'REJECTED'); }}>Reject</Button>
                  ))}
                </div></td>
              </tr>) : <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">No users match these filters.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
          />
        </div>
      </section>

    </div>
  );
}
