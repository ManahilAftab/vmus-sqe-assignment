"use client";

import { FormEvent, useEffect, useState } from "react";

type UserGroup = { id: string; name: string };
type User = { id: string; username: string; group: { name: string }; createdAt: string };

export default function UsersPage() {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [groupId, setGroupId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    try {
      const [groupResponse, userResponse] = await Promise.all([fetch("/api/user-groups"), fetch("/api/users")]);
      const groupData = await groupResponse.json();
      const userData = await userResponse.json();
      if (!groupResponse.ok) throw new Error(groupData.error || "Unable to load user groups.");
      if (!userResponse.ok) throw new Error(userData.error || "Unable to load users.");
      setGroups(groupData);
      setUsers(userData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  function resetForm() {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setGroupId("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password, groupId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create user.");
      setMessage(`${data.username} created successfully.`);
      resetForm();
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create user.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">User master</h1><p className="mt-2 text-slate-600">Create users and assign them to a security group.</p></header>
        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-semibold">Create user</h2><form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-medium text-slate-700">Username<input required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label><label className="text-sm font-medium text-slate-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label><label className="text-sm font-medium text-slate-700">Confirm password<input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label><label className="text-sm font-medium text-slate-700">User group<select required value={groupId} onChange={(event) => setGroupId(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">Select a group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><div className="sm:col-span-2 lg:col-span-4"><button disabled={isSubmitting || isLoading} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving..." : "Create user"}</button></div></form>{message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}{error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}</section>
        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200"><div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">Users</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Username</th><th className="px-6 py-3 font-semibold">User group</th><th className="px-6 py-3 font-semibold">Created</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={3} className="px-6 py-6 text-slate-500">Loading users...</td></tr> : users.length === 0 ? <tr><td colSpan={3} className="px-6 py-6 text-slate-500">No users created yet.</td></tr> : users.map((user) => <tr key={user.id}><td className="px-6 py-3 font-medium">{user.username}</td><td className="px-6 py-3">{user.group.name}</td><td className="px-6 py-3">{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
      </div>
    </main>
  );
}