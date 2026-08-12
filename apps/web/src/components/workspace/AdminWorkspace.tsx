"use client";

import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BriefcaseBusiness, CalendarRange, Loader2, ShieldCheck, Users } from 'lucide-react'
import { databases } from '../../lib/appwrite'
import { COLLECTIONS, DATABASE_ID } from '../../lib/appwrite-collections'
import { useMarketingPlans } from '../../api/queries'
import { Dialog } from '../ui/dialog'
import { Button } from '../ui/button'

const ROLE_OPTIONS = [
  ['ADMIN', 'Administrator'],
  ['CHIEF_COORDINATOR', 'Chief Coordinator'],
  ['MARKETING_COORDINATOR', 'Marketing Coordinator'],
  ['DESIGNER', 'Designer'],
  ['VIDEO_EDITOR', 'Video Editor'],
  ['MEDIA_DIRECTOR', 'Media Director'],
  ['CONTENT_WRITER', 'Content Writer'],
] as const;

export function AdminWorkspace() {
  const queryClient = useQueryClient();
  const { data: plansResponse } = useMarketingPlans();
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS)).documents,
  })
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [draftRoles, setDraftRoles] = useState<string[]>([]);
  const [draftEvents, setDraftEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const eventOptions = useMemo(() => Array.from(new Set(
    (plansResponse?.documents || []).map((plan: any) => plan.campaign || plan.eventName || plan.eventId).filter(Boolean)
  )).sort() as string[], [plansResponse]);

  const openAccessEditor = (user: any) => {
    setSelectedUser(user);
    setDraftRoles(Array.isArray(user.roles) ? user.roles : []);
    setDraftEvents(Array.isArray(user.events) ? user.events : []);
    setSaveError('');
  };

  const toggleValue = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };

  const saveAccess = async () => {
    if (!selectedUser?.$id) return;
    setSaving(true);
    setSaveError('');
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, selectedUser.$id, {
        roles: draftRoles,
        events: draftEvents,
      });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(null);
    } catch (error: any) {
      setSaveError(error?.message || 'Could not save this user assignment.');
    } finally {
      setSaving(false);
    }
  };

  const activeUsers = users?.filter((user: any) => user.status === 'ACTIVE').length || 0;
  const multiRoleUsers = users?.filter((user: any) => (user.roles || []).length > 1).length || 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="page-heading mb-8">
        <div><p>TEAM & ACCESS</p><h1>Administration Dashboard</h1><span>Assign positions and event scope to each passkey account.</span></div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Total users', users?.length || 0, Users],
          ['Active users', activeUsers, ShieldCheck],
          ['Multi-role users', multiRoleUsers, BriefcaseBusiness],
          ['Active events', eventOptions.length, CalendarRange],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="rounded-[20px] border border-border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2"><span className="text-sm font-semibold text-text-muted">{label}</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary"><Icon size={17}/></span></div>
            <strong className="text-3xl font-extrabold text-navy-950">{value}</strong>
          </div>
        ))}
      </div>

      <div className="mb-8 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-3 shadow sm:p-6">
        <div className="mb-4"><h2 className="text-xl font-bold text-navy-900">Roles & Event Assignments</h2><p className="mt-1 text-sm text-text-muted">Multiple positions are supported—for example, Dulaj can be both Chief Coordinator and Designer.</p></div>
        {usersLoading ? <div className="flex items-center gap-2 py-10 text-text-muted"><Loader2 className="h-5 w-5 animate-spin"/> Loading users…</div> : (
          <table className="min-w-[900px] w-full divide-y divide-slate-200">
            <thead><tr>
              <th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Positions</th><th className="px-4 py-3 text-left">Assigned Events</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Access</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-200">
              {users?.map((user: any) => <tr key={user.$id}>
                <td className="px-4 py-4"><p className="font-semibold text-navy-950">{user.name}</p><p className="text-xs text-text-muted">{user.email}</p></td>
                <td className="px-4 py-4"><div className="flex max-w-sm flex-wrap gap-1.5">{(user.roles || []).map((role: string) => <span key={role} className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold text-primary">{role.replace(/_/g,' ')}</span>)}</div></td>
                <td className="px-4 py-4"><div className="flex max-w-sm flex-wrap gap-1.5">{(user.events || []).length ? user.events.map((event: string) => <span key={event} className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-semibold text-navy-700">{event}</span>) : <span className="text-xs italic text-text-muted">No event assigned</span>}</div></td>
                <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span></td>
                <td className="px-4 py-4 text-right"><Button variant="outline" size="sm" onClick={() => openAccessEditor(user)}>Edit assignment</Button></td>
              </tr>)}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={Boolean(selectedUser)} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <div className="max-h-[78vh] overflow-y-auto pr-2">
          <h2 className="text-xl font-bold text-navy-950">Edit user assignment</h2>
          <p className="mt-1 text-sm text-text-muted">{selectedUser?.name} · permissions are loaded automatically after their passkey login.</p>

          <section className="mt-6"><h3 className="text-sm font-bold text-navy-900">Positions</h3><p className="mb-3 mt-1 text-xs text-text-muted">Select every position this person performs.</p>
            <div className="grid gap-2 sm:grid-cols-2">{ROLE_OPTIONS.map(([value,label]) => <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${draftRoles.includes(value) ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-white text-navy-700'}`}><input type="checkbox" checked={draftRoles.includes(value)} onChange={() => toggleValue(value,draftRoles,setDraftRoles)} className="h-4 w-4"/>{label}</label>)}</div>
          </section>

          <section className="mt-6"><h3 className="text-sm font-bold text-navy-900">Events they work on</h3><p className="mb-3 mt-1 text-xs text-text-muted">This scope controls Marketing Plan editing and Chief Coordinator analytics.</p>
            <div className="grid gap-2 sm:grid-cols-2">{eventOptions.map(event => <label key={event} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${draftEvents.includes(event) ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-white text-navy-700'}`}><input type="checkbox" checked={draftEvents.includes(event)} onChange={() => toggleValue(event,draftEvents,setDraftEvents)} className="h-4 w-4"/>{event}</label>)}</div>
            {!eventOptions.length && <p className="rounded-xl bg-surface p-3 text-sm text-text-muted">No marketing-plan events are available yet.</p>}
          </section>

          {saveError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}
          <div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setSelectedUser(null)}>Cancel</Button><Button onClick={saveAccess} disabled={saving || draftRoles.length === 0}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Save assignment</Button></div>
        </div>
      </Dialog>
    </div>
  )
}
