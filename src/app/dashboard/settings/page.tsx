'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Preferences {
  emailNotices: boolean;
  browserNotices: boolean;
}

const defaults: Preferences = { emailNotices: true, browserNotices: false };

export default function SettingsPage() {
  const { user } = useAuth();
  const storageKey = `rahmah-dashboard-preferences-${user?.id || 'guest'}`;
  const [preferences, setPreferences] = useState(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) setPreferences({ ...defaults, ...JSON.parse(stored) as Partial<Preferences> });
    } catch {
      setPreferences(defaults);
    } finally {
      setReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [preferences, ready, storageKey]);

  const toggle = (key: keyof Preferences) => setPreferences((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">System settings</p><h2 className="mt-1 text-xl font-bold text-slate-900">Notification preferences</h2><p className="mt-1 text-sm text-slate-500">Preferences are saved in this browser for this signed-in account.</p>
        <div className="mt-5 divide-y divide-slate-100">
          <label className="flex items-center justify-between gap-4 py-4"><span><span className="block text-sm font-semibold text-slate-800">Email activity notices</span><span className="mt-1 block text-xs text-slate-500">Show invitation and account activity notices.</span></span><input type="checkbox" checked={preferences.emailNotices} onChange={() => toggle('emailNotices')} className="h-4 w-4 accent-blue-700" /></label>
          <label className="flex items-center justify-between gap-4 py-4"><span><span className="block text-sm font-semibold text-slate-800">Browser notifications</span><span className="mt-1 block text-xs text-slate-500">Keep a local preference for future browser notifications.</span></span><input type="checkbox" checked={preferences.browserNotices} onChange={() => toggle('browserNotices')} className="h-4 w-4 accent-blue-700" /></label>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue-700">Access policy</p><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-slate-500">Signed-in role</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{user?.role || '—'}</dd></div><div><dt className="text-xs text-slate-500">Session</dt><dd className="mt-1 text-sm font-semibold text-slate-800">Secure httpOnly cookie</dd></div><div><dt className="text-xs text-slate-500">User management</dt><dd className="mt-1 text-sm font-semibold text-slate-800">Administrator only</dd></div><div><dt className="text-xs text-slate-500">Chat monitoring</dt><dd className="mt-1 text-sm font-semibold text-slate-800">Administrator and moderator</dd></div></dl></section>
    </div>
  );
}
