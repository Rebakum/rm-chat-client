'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import AuthGuard from '@/components/common/AuthGuard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { ApiError } from '@/services/apiClient';
import { adminService, type AdminRole, type AdminUser, type AdminUserStatus, type CreateUserInput } from '@/services/admin.service';
import { formatDateTime } from '@/utils/formatDate';

const PAGE_SIZE = 10;
const ROLE_OPTIONS: AdminRole[] = ['STUDENT', 'TEACHER', 'MODERATOR'];
const STATUS_FILTERS: Array<{ value: AdminUserStatus | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'REJECTED', label: 'Rejected' },
];

const statusBadge: Record<AdminUserStatus, string> = {
  ACCEPTED: 'bg-accent-100 text-accent-800',
  REJECTED: 'bg-red-100 text-red-800',
};

interface Feedback {
  message: string;
  type: 'success' | 'error';
}

interface CreatedState {
  userId: string;
  email: string;
  invite: 'sent' | 'printed' | 'failed';
}

export default function AdminUsersPage() {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <UsersManagement />
    </AuthGuard>
  );
}

function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<AdminUserStatus | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateUserInput>({ displayName: '', email: '', role: 'STUDENT' });
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState<CreatedState | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getUsers({
        page,
        limit: PAGE_SIZE,
        search: searchQuery || undefined,
        status: status || undefined,
      });
      setUsers(response.data || []);
      setTotal(response.meta?.total || 0);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        message: error instanceof ApiError ? error.message : 'Failed to load users',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, status]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (window.location.hash === '#invite') setIsCreateOpen(true);
  }, []);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleStatusChange = async (user: AdminUser, nextStatus: AdminUserStatus) => {
    setBusyId(user.id);
    try {
      await adminService.changeUserStatus(user.id, nextStatus);
      setFeedback({ message: `User ${nextStatus.toLowerCase()}`, type: 'success' });
      await loadUsers();
    } catch (error) {
      setFeedback({
        message: error instanceof ApiError ? error.message : 'Failed to update user',
        type: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsCreating(true);
    setFeedback(null);
    try {
      const response = await adminService.createUser({
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        role: form.role,
      });
      const data = response.data;
      if (data) {
        setCreated({ userId: data.userId, email: data.email, invite: data.invite });
      }
      setIsCreateOpen(false);
      setForm({ displayName: '', email: '', role: 'STUDENT' });
      setPage(1);
      await loadUsers();
    } catch (error) {
      setFeedback({
        message: error instanceof ApiError ? error.message : 'Failed to create user',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="mx-auto min-h-[55vh] max-w-7xl py-2">
      <div id="invite" className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Workspace users</h2>
          <p className="mt-1 text-sm text-gray-600">Create accounts, review status and manage access.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Add user</Button>
      </div>

      {feedback && (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      {created && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">User created for {created.email}</p>
          <p className="mt-1">
            User ID: <span className="font-mono font-semibold">{created.userId}</span>
          </p>
          <p className="mt-1">
            {created.invite === 'sent' && 'The invite email has been sent.'}
            {created.invite === 'printed' && 'The invite email was printed to the server console.'}
            {created.invite === 'failed' && 'The invite email could not be sent — share the ID manually.'}
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium underline"
            onClick={() => setCreated(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSearch} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Input
            label="Search"
            placeholder="Name, email or user ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="w-44">
          <label htmlFor="status-filter" className="mb-1 block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminUserStatus | '');
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {isLoading ? (
        <div className="mt-10 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <p className="mt-10 text-center text-sm text-gray-500">No users match the current filters.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{user.displayName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{user.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[user.status]}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {user.createdAt ? formatDateTime(user.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {user.status === 'REJECTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={busyId === user.id}
                          onClick={() => handleStatusChange(user, 'ACCEPTED')}
                        >
                          Approve
                        </Button>
                      )}
                      {user.status === 'ACCEPTED' && (
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={busyId === user.id}
                          onClick={() => handleStatusChange(user, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create user">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Display name"
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create user
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
