"use client";

import { FormEvent, useEffect, useState } from "react";

type Vsp = { id: string; code: string; name: string; status: string };
type Voucher = { id: string; voucherNumber: string; status: string };
type Claim = {
  id: string;
  claimNo: string;
  patientName: string;
  visitType: string;
  claimAmount: number;
  claimStatus: string;
  vsp: { name: string; code: string };
  voucher: { voucherNumber: string };
};

type ClaimForm = {
  treatmentFormNo: string;
  vspId: string;
  voucherId: string;
  visitType: string;
  patientType: string;
  patientName: string;
  age: string;
  gender: string;
  address: string;
  doctorName: string;
  drugsQty: string;
  drugsCost: string;
  thumbprintMismatch: boolean;
};

const initialForm: ClaimForm = {
  treatmentFormNo: "",
  vspId: "",
  voucherId: "",
  visitType: "first_visit",
  patientType: "client",
  patientName: "",
  age: "",
  gender: "",
  address: "",
  doctorName: "",
  drugsQty: "0",
  drugsCost: "0",
  thumbprintMismatch: false,
};

export default function ClaimsPage() {
  const [form, setForm] = useState(initialForm);
  const [vsps, setVsps] = useState<Vsp[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    try {
      const [vspResponse, voucherResponse, claimResponse] = await Promise.all([
        fetch("/api/vsps"),
        fetch("/api/vouchers"),
        fetch("/api/claims"),
      ]);
      const vspData = await vspResponse.json();
      const voucherData = await voucherResponse.json();
      const claimData = await claimResponse.json();
      if (!vspResponse.ok) throw new Error(vspData.error || "Unable to load VSPs.");
      if (!voucherResponse.ok) throw new Error(voucherData.error || "Unable to load vouchers.");
      if (!claimResponse.ok) throw new Error(claimData.error || "Unable to load claims.");
      setVsps(vspData.filter((vsp: Vsp) => vsp.status === "active"));
      setVouchers(voucherData.filter((voucher: Voucher) => voucher.status === "sold"));
      setClaims(claimData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load claim data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  function updateField(field: keyof ClaimForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setWarning("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create claim.");
      setMessage(`${data.claim.claimNo} created. Amount: ${data.claim.claimAmount.toLocaleString()} (${data.claim.claimStatus}).`);
      if (data.vspDeactivated) setWarning("This VSP has been deactivated because its mismatch count reached 2 or more.");
      setForm(initialForm);
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create claim.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Claim entry</h1><p className="mt-2 text-slate-600">Record treatment claims against distributed vouchers.</p></header>
        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">New claim</h2>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Treatment form number<input required value={form.treatmentFormNo} onChange={(event) => updateField("treatmentFormNo", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <label className="text-sm font-medium text-slate-700">VSP<select required value={form.vspId} onChange={(event) => updateField("vspId", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"><option value="">Select a VSP</option>{vsps.map((vsp) => <option key={vsp.id} value={vsp.id}>{vsp.code} - {vsp.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Sold voucher<select required value={form.voucherId} onChange={(event) => updateField("voucherId", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"><option value="">Select a voucher</option>{vouchers.map((voucher) => <option key={voucher.id} value={voucher.id}>{voucher.voucherNumber}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Visit type<select required value={form.visitType} onChange={(event) => updateField("visitType", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"><option value="first_visit">First visit</option><option value="first_follow_up">First follow-up</option><option value="second_follow_up">Second follow-up</option></select></label>
            <label className="text-sm font-medium text-slate-700">Patient type<select required value={form.patientType} onChange={(event) => updateField("patientType", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal"><option value="client">Client</option><option value="partner">Partner</option></select></label>
            <label className="text-sm font-medium text-slate-700">Patient name<input required value={form.patientName} onChange={(event) => updateField("patientName", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">Age<input required min="0" type="number" value={form.age} onChange={(event) => updateField("age", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">Gender<input required value={form.gender} onChange={(event) => updateField("gender", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">Doctor name<input required value={form.doctorName} onChange={(event) => updateField("doctorName", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address<textarea required rows={2} value={form.address} onChange={(event) => updateField("address", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">Drugs quantity<input min="0" type="number" value={form.drugsQty} onChange={(event) => updateField("drugsQty", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="text-sm font-medium text-slate-700">Drugs cost per unit<input min="0" step="0.01" type="number" value={form.drugsCost} onChange={(event) => updateField("drugsCost", event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal" /></label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.thumbprintMismatch} onChange={(event) => updateField("thumbprintMismatch", event.target.checked)} className="h-4 w-4" /> Thumbprint mismatch</label>
            <div className="sm:col-span-2 lg:col-span-3"><button disabled={isSubmitting || isLoading} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Saving..." : "Create claim"}</button></div>
          </form>
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {warning && <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{warning}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </section>

        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200"><div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">Claims</h2></div><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Claim no.</th><th className="px-6 py-3 font-semibold">VSP</th><th className="px-6 py-3 font-semibold">Patient</th><th className="px-6 py-3 font-semibold">Visit type</th><th className="px-6 py-3 font-semibold">Amount</th><th className="px-6 py-3 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={6} className="px-6 py-6 text-slate-500">Loading claims...</td></tr> : claims.length === 0 ? <tr><td colSpan={6} className="px-6 py-6 text-slate-500">No claims created yet.</td></tr> : claims.map((claim) => <tr key={claim.id}><td className="px-6 py-3 font-mono text-xs">{claim.claimNo}</td><td className="px-6 py-3">{claim.vsp.code} - {claim.vsp.name}</td><td className="px-6 py-3">{claim.patientName}</td><td className="px-6 py-3">{claim.visitType}</td><td className="px-6 py-3">{claim.claimAmount.toLocaleString()}</td><td className="px-6 py-3 capitalize">{claim.claimStatus}</td></tr>)}</tbody></table></div></section>
      </div>
    </main>
  );
}