"use client";

import { FormEvent, useEffect, useState } from "react";

const screens = ["Voucher", "Distributor", "Distribution", "VSP", "Claim", "SalesReturn", "User"] as const;
const permissionFields = [
  ["canNew", "New"],
  ["canEdit", "Edit"],
  ["canDelete", "Delete"],
  ["canView", "View"],
  ["canPrint", "Print"],
] as const;
type PermissionField = typeof permissionFields[number][0];
type Permissions = Record<typeof screens[number], Record<PermissionField, boolean>>;
type UserGroup = { id: string; name: string; permissions: Array<{ screenName: string }>; _count: { users: number } };

function initialPermissions(): Permissions {
  return Object.fromEntries(screens.map((screen) => [screen, { canNew: false, canEdit: false, canDelete: false, canView: true, canPrint: false }])) as Permissions;
}

export default function UserGroupsPage() {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permissions>(initialPermissions);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadGroups() {
    try {
      const response = await fetch("/api/user-groups");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load user groups.");
      setGroups(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load user groups.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadGroups());
  }, []);

  function togglePermission(screen: typeof screens[number], field: PermissionField) {
    setPermissions((current) => ({ ...current, [screen]: { ...current[screen], [field]: !current[screen][field] } }));
  }

  function resetForm() {
    setName("");
    setPermissions(initialPermissions());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/user-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions: screens.map((screenName) => ({ screenName, ...permissions[screenName] })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create user group.");
      setMessage(`${data.name} created successfully.`);
      resetForm();
      await loadGroups();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create user group.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">User group master</h1><p className="mt-2 text-slate-600">Define screen-level permissions for each security group.</p></header>
        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Create user group</h2>
          <form onSubmit={handleSubmit} className="mt-5">
            <label className="block max-w-md text-sm font-medium text-slate-700">Group name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 font-semibold">Screen</th>{permissionFields.map(([, label]) => <th key={label} className="px-4 py-3 text-center font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{screens.map((screen) => <tr key={screen}><th className="px-4 py-3 font-medium">{screen}</th>{permissionFields.map(([field, label]) => <td key={label} className="px-4 py-3 text-center"><input aria-label={`${screen} ${label}`} type="checkbox" checked={permissions[screen][field]} onChange={() => togglePermission(screen, field)} className="h-4 w-4 accent-blue-700" /></td>)}</tr>)}</tbody></table></div>
            <button disabled={isSubmitting} className="mt-5 rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving..." : "Create group"}</button>
          </form>
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </section>
        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200"><div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">Existing groups</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Name</th><th className="px-6 py-3 font-semibold">Screens configured</th><th className="px-6 py-3 font-semibold">Users</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={3} className="px-6 py-6 text-slate-500">Loading user groups...</td></tr> : groups.length === 0 ? <tr><td colSpan={3} className="px-6 py-6 text-slate-500">No user groups created yet.</td></tr> : groups.map((group) => <tr key={group.id}><td className="px-6 py-3 font-medium">{group.name}</td><td className="px-6 py-3">{group.permissions.length}</td><td className="px-6 py-3">{group._count.users}</td></tr>)}</tbody></table></div></section>
      </div>
    </main>
  );
}