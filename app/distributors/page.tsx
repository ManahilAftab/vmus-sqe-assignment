"use client";

import { FormEvent, useEffect, useState } from "react";

type Distributor = {
  id: string;
  code: string;
  name: string;
  businessType: string;
  proprietorName: string;
  designation: string | null;
  address: string;
  contactNo: string | null;
  email: string | null;
  status: "active" | "deactivate";
};

type DistributorForm = Omit<Distributor, "id">;

const initialForm: DistributorForm = {
  code: "",
  name: "",
  businessType: "hospital",
  proprietorName: "",
  designation: "",
  address: "",
  contactNo: "",
  email: "",
  status: "active",
};

export default function DistributorsPage() {
  const [form, setForm] = useState<DistributorForm>(initialForm);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadDistributors() {
    try {
      const response = await fetch("/api/distributors");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load distributors.");
      setDistributors(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load distributors.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadDistributors());
  }, []);

  function updateField(field: keyof DistributorForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editDistributor(distributor: Distributor) {
    setEditingId(distributor.id);
    setForm({ ...distributor });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function submitDistributor(confirmDuplicate = false) {
    const endpoint = editingId ? `/api/distributors/${editingId}` : "/api/distributors";
    const response = await fetch(endpoint, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, confirmDuplicate }),
    });
    const data = await response.json();

    if (response.status === 409 && data.requiresConfirmation) {
      const confirmed = window.confirm(`${data.error} Save anyway?`);
      if (confirmed) return submitDistributor(true);
    }

    if (!response.ok) throw new Error(data.error || "Unable to save distributor.");
    return data;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const data = await submitDistributor();
      setMessage(data.message || (editingId ? "Distributor updated successfully." : "Distributor created successfully."));
      resetForm();
      await loadDistributors();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save distributor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteDistributor(distributor: Distributor) {
    if (!window.confirm(`Delete ${distributor.name}?`)) return;
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/distributors/${distributor.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete distributor.");
      setMessage(data.message);
      await loadDistributors();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete distributor.");
    }
  }

  async function toggleStatus(distributor: Distributor) {
    try {
      const response = await fetch(`/api/distributors/${distributor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...distributor, status: distributor.status === "active" ? "deactivate" : "active", confirmDuplicate: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change status.");
      setMessage(`${distributor.name} is now ${data.status}.`);
      await loadDistributors();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to change status.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Distributor master</h1>
          <p className="mt-2 text-slate-600">Create, review, update, and deactivate distributors.</p>
        </header>

        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">{editingId ? "Edit distributor" : "Add distributor"}</h2>
            {editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-slate-600 hover:text-slate-900">Cancel edit</button>}
          </div>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Code (optional)<input value={form.code} onChange={(event) => updateField("code", event.target.value)} placeholder="Auto-generated DS0001" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Name<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Business type<select required value={form.businessType} onChange={(event) => updateField("businessType", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option>hospital</option><option>pharmacy</option><option>NGO</option></select></label>
            <label className="text-sm font-medium text-slate-700">Proprietor name<input required value={form.proprietorName} onChange={(event) => updateField("proprietorName", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Designation<input value={form.designation ?? ""} onChange={(event) => updateField("designation", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Contact number<input value={form.contactNo ?? ""} onChange={(event) => updateField("contactNo", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Email<input type="email" value={form.email ?? ""} onChange={(event) => updateField("email", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address<textarea required value={form.address} onChange={(event) => updateField("address", event.target.value)} rows={2} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            {editingId && <label className="text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="active">Active</option><option value="deactivate">Deactivate</option></select></label>}
            <div className="sm:col-span-2 lg:col-span-3"><button disabled={isSubmitting} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving..." : editingId ? "Update distributor" : "Add distributor"}</button></div>
          </form>
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </section>

        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">Distributors</h2></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Code</th><th className="px-6 py-3 font-semibold">Name</th><th className="px-6 py-3 font-semibold">Business type</th><th className="px-6 py-3 font-semibold">Proprietor</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={6} className="px-6 py-6 text-slate-500">Loading distributors...</td></tr> : distributors.length === 0 ? <tr><td colSpan={6} className="px-6 py-6 text-slate-500">No distributors created yet.</td></tr> : distributors.map((distributor) => <tr key={distributor.id}><td className="whitespace-nowrap px-6 py-3 font-mono text-xs">{distributor.code}</td><td className="px-6 py-3 font-medium">{distributor.name}</td><td className="px-6 py-3 capitalize">{distributor.businessType}</td><td className="px-6 py-3">{distributor.proprietorName}</td><td className="px-6 py-3"><button type="button" onClick={() => toggleStatus(distributor)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${distributor.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{distributor.status}</button></td><td className="whitespace-nowrap px-6 py-3"><button type="button" onClick={() => editDistributor(distributor)} className="mr-3 font-semibold text-blue-700 hover:text-blue-900">Edit</button><button type="button" onClick={() => deleteDistributor(distributor)} className="font-semibold text-red-700 hover:text-red-900">Delete</button></td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}