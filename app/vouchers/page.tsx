"use client";

import { FormEvent, useEffect, useState } from "react";

type Voucher = {
  id: string;
  voucherNumber: string;
  status: string;
  validityDate: string;
};

type VoucherForm = {
  projectCode: string;
  groupBatch: string;
  batchNumber: string;
  mrp: string;
  validityDate: string;
  quantity: string;
};

const initialForm: VoucherForm = {
  projectCode: "",
  groupBatch: "",
  batchNumber: "",
  mrp: "",
  validityDate: "",
  quantity: "10",
};

export default function VouchersPage() {
  const [form, setForm] = useState(initialForm);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVouchers() {
    try {
      const response = await fetch("/api/vouchers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load vouchers.");
      }

      setVouchers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load vouchers.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadVouchers());
  }, []);

  function updateField(field: keyof VoucherForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create vouchers.");
      }

      setMessage(data.message);
      setForm(initialForm);
      await loadVouchers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create vouchers.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Voucher creation</h1>
          <p className="mt-2 text-slate-600">Create a batch of vouchers and review generated voucher numbers.</p>
        </header>

        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Create voucher batch</h2>
          <p className="mt-1 text-sm text-slate-500">The minimum batch size is 10 vouchers.</p>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(["projectCode", "groupBatch", "batchNumber"] as const).map((field) => (
              <label key={field} className="text-sm font-medium text-slate-700">
                {field === "projectCode" ? "Project code" : field === "groupBatch" ? "Group batch" : "Batch number"}
                <input
                  required
                  value={form[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            ))}
            <label className="text-sm font-medium text-slate-700">
              MRP
              <input required min="0" step="0.01" type="number" value={form.mrp} onChange={(event) => updateField("mrp", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Validity date
              <input required type="date" value={form.validityDate} onChange={(event) => updateField("validityDate", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Quantity
              <input required min="10" step="1" type="number" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <button disabled={isSubmitting} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? "Creating..." : "Create vouchers"}
              </button>
            </div>
          </form>
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </section>

        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold">Existing vouchers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-6 py-3 font-semibold">Voucher number</th><th className="px-6 py-3 font-semibold">Status</th><th className="px-6 py-3 font-semibold">Validity date</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? <tr><td colSpan={3} className="px-6 py-6 text-slate-500">Loading vouchers...</td></tr> : vouchers.length === 0 ? <tr><td colSpan={3} className="px-6 py-6 text-slate-500">No vouchers created yet.</td></tr> : vouchers.map((voucher) => <tr key={voucher.id}><td className="whitespace-nowrap px-6 py-3 font-mono text-xs">{voucher.voucherNumber}</td><td className="px-6 py-3 capitalize">{voucher.status}</td><td className="px-6 py-3">{new Date(voucher.validityDate).toLocaleDateString()}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}