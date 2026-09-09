"use client";

import { FormEvent, useEffect, useState } from "react";

type Vsp = {
  id: string;
  code: string;
  name: string;
  physicalAddress: string;
  communicationAddress: string;
  contactPerson: string | null;
  contactNo: string | null;
  email: string | null;
  status: "active" | "in-active";
  paymentMode: string | null;
  bankAccountNo: string | null;
  bankName: string | null;
  paymentType: string | null;
  validFrom: string | null;
  validTo: string | null;
  firstVisitFee: number;
  firstFollowUpFee: number;
  secondFollowUpFee: number;
  labFee: number;
};

type VspForm = Omit<Vsp, "id">;

const initialForm: VspForm = {
  code: "",
  name: "",
  physicalAddress: "",
  communicationAddress: "",
  contactPerson: "",
  contactNo: "",
  email: "",
  status: "active",
  paymentMode: "",
  bankAccountNo: "",
  bankName: "",
  paymentType: "",
  validFrom: "",
  validTo: "",
  firstVisitFee: 0,
  firstFollowUpFee: 0,
  secondFollowUpFee: 0,
  labFee: 0,
};

export default function VspsPage() {
  const [form, setForm] = useState<VspForm>(initialForm);
  const [vsps, setVsps] = useState<Vsp[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVsps() {
    try {
      const response = await fetch("/api/vsps");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load VSPs.");
      setVsps(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load VSPs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadVsps());
  }, []);

  function updateField(field: keyof VspForm, value: string | number) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editVsp(vsp: Vsp) {
    setEditingId(vsp.id);
    setForm({ ...vsp, validFrom: vsp.validFrom?.slice(0, 10) || "", validTo: vsp.validTo?.slice(0, 10) || "" });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(editingId ? `/api/vsps/${editingId}` : "/api/vsps", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save VSP.");
      setMessage(editingId ? "VSP updated successfully." : "VSP created successfully.");
      resetForm();
      await loadVsps();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save VSP.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteVsp(vsp: Vsp) {
    if (!window.confirm(`Delete ${vsp.name}?`)) return;
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/vsps/${vsp.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete VSP.");
      setMessage(data.message);
      await loadVsps();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete VSP.");
    }
  }

  async function toggleStatus(vsp: Vsp) {
    try {
      const response = await fetch(`/api/vsps/${vsp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vsp, status: vsp.status === "active" ? "in-active" : "active" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change status.");
      setMessage(`${vsp.name} is now ${data.status}.`);
      await loadVsps();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to change status.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">VSP master</h1><p className="mt-2 text-slate-600">Manage voucher service providers and their payment terms.</p></header>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-semibold">Provider details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Code (optional)<input value={form.code} onChange={(event) => updateField("code", event.target.value)} placeholder="Auto-generated HP0001" className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Name<input required value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Contact person<input value={form.contactPerson ?? ""} onChange={(event) => updateField("contactPerson", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Physical address<textarea required rows={2} value={form.physicalAddress} onChange={(event) => updateField("physicalAddress", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Communication address<textarea required rows={2} value={form.communicationAddress} onChange={(event) => updateField("communicationAddress", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Contact number<input value={form.contactNo ?? ""} onChange={(event) => updateField("contactNo", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Email<input type="email" value={form.email ?? ""} onChange={(event) => updateField("email", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            {editingId && <label className="text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="active">Active</option><option value="in-active">In-active</option></select></label>}
          </div></section>

          <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"><h2 className="text-lg font-semibold">Payment terms</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">Payment mode<select value={form.paymentMode ?? ""} onChange={(event) => updateField("paymentMode", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">Not specified</option><option value="Cash">Cash</option><option value="Bank">Bank</option></select></label>
            <label className="text-sm font-medium text-slate-700">Bank account number<input value={form.bankAccountNo ?? ""} onChange={(event) => updateField("bankAccountNo", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Bank name<input value={form.bankName ?? ""} onChange={(event) => updateField("bankName", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Payment type<select value={form.paymentType ?? ""} onChange={(event) => updateField("paymentType", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">Not specified</option><option value="Bi-Monthly">Bi-Monthly</option><option value="Monthly">Monthly</option></select></label>
            <label className="text-sm font-medium text-slate-700">Valid from<input type="date" value={form.validFrom ?? ""} onChange={(event) => updateField("validFrom", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">Valid to<input type="date" value={form.validTo ?? ""} onChange={(event) => updateField("validTo", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            {(["firstVisitFee", "firstFollowUpFee", "secondFollowUpFee", "labFee"] as const).map((field) => <label key={field} className="text-sm font-medium text-slate-700">{field === "firstVisitFee" ? "First visit fee" : field === "firstFollowUpFee" ? "First follow-up fee" : field === "secondFollowUpFee" ? "Second follow-up fee" : "Lab fee"}<input min="0" step="0.01" type="number" value={form[field]} onChange={(event) => updateField(field, Number(event.target.value))} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>)}
          </div></section>
          <div className="flex gap-3"><button disabled={isSubmitting} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving..." : editingId ? "Update VSP" : "Add VSP"}</button>{editingId && <button type="button" onClick={resetForm} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100">Cancel edit</button>}</div>
        </form>
        {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200"><div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">VSPs</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Code</th><th className="px-6 py-3 font-semibold">Name</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold">Payment type</th><th className="px-6 py-3 font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={5} className="px-6 py-6 text-slate-500">Loading VSPs...</td></tr> : vsps.length === 0 ? <tr><td colSpan={5} className="px-6 py-6 text-slate-500">No VSPs created yet.</td></tr> : vsps.map((vsp) => <tr key={vsp.id}><td className="whitespace-nowrap px-6 py-3 font-mono text-xs">{vsp.code}</td><td className="px-6 py-3 font-medium">{vsp.name}</td><td className="px-6 py-3"><button type="button" onClick={() => toggleStatus(vsp)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${vsp.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>{vsp.status}</button></td><td className="px-6 py-3">{vsp.paymentType || "-"}</td><td className="whitespace-nowrap px-6 py-3"><button type="button" onClick={() => editVsp(vsp)} className="mr-3 font-semibold text-blue-700 hover:text-blue-900">Edit</button><button type="button" onClick={() => deleteVsp(vsp)} className="font-semibold text-red-700 hover:text-red-900">Delete</button></td></tr>)}</tbody></table></div></section>
      </div>
    </main>
  );
}