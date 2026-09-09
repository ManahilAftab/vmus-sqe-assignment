"use client";

import { FormEvent, useEffect, useState } from "react";

type Distributor = { id: string; code: string; name: string; status: string };
type Voucher = { id: string; voucherNumber: string };
type SalesReturn = {
  id: string;
  date: string;
  returnAmount: number;
  distributor: { name: string };
  voucher: { voucherNumber: string };
};

const WHOLESALE_PRICE = 300;

export default function ReturnsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>([]);
  const [distributorId, setDistributorId] = useState("");
  const [voucherId, setVoucherId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadReturns() {
    const response = await fetch("/api/returns");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load sales returns.");
    setSalesReturns(data.returns);
  }

  async function loadInitialData() {
    try {
      const [distributorResponse, returnResponse] = await Promise.all([
        fetch("/api/distributors"),
        fetch("/api/returns"),
      ]);
      const distributorData = await distributorResponse.json();
      const returnData = await returnResponse.json();
      if (!distributorResponse.ok) throw new Error(distributorData.error || "Unable to load distributors.");
      if (!returnResponse.ok) throw new Error(returnData.error || "Unable to load sales returns.");
      setDistributors(distributorData.filter((distributor: Distributor) => distributor.status === "active"));
      setSalesReturns(returnData.returns);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load sales return data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadInitialData());
  }, []);

  useEffect(() => {
    if (!distributorId) return;

    let cancelled = false;
    void fetch(`/api/returns?distributorId=${encodeURIComponent(distributorId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load eligible vouchers.");
        if (!cancelled) setVouchers(data.vouchers);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load eligible vouchers.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingVouchers(false);
      });

    return () => { cancelled = true; };
  }, [distributorId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributorId, voucherId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create sales return.");
      setMessage(`${data.salesReturn.voucher.voucherNumber} returned successfully.`);
      setVoucherId("");
      await Promise.all([loadReturns(), refreshVouchers(distributorId)]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create sales return.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function refreshVouchers(selectedDistributorId: string) {
    const response = await fetch(`/api/returns?distributorId=${encodeURIComponent(selectedDistributorId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to refresh eligible vouchers.");
    setVouchers(data.vouchers);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Voucher sales return</h1>
          <p className="mt-2 text-slate-600">Return a voucher sold to the selected distributor.</p>
        </header>

        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Create sales return</h2>
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-3 sm:items-end">
            <label className="text-sm font-medium text-slate-700">Distributor<select required value={distributorId} onChange={(event) => { const selectedId = event.target.value; setDistributorId(selectedId); setVoucherId(""); setVouchers([]); setIsLoadingVouchers(Boolean(selectedId)); setError(""); }} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">Select a distributor</option>{distributors.map((distributor) => <option key={distributor.id} value={distributor.id}>{distributor.code} - {distributor.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Voucher<select required disabled={!distributorId || isLoadingVouchers} value={voucherId} onChange={(event) => setVoucherId(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">{isLoadingVouchers ? "Loading vouchers..." : "Select a voucher"}</option>{vouchers.map((voucher) => <option key={voucher.id} value={voucher.id}>{voucher.voucherNumber}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Return amount<input readOnly value={WHOLESALE_PRICE} className="mt-1 block w-full rounded-md border border-slate-300 bg-slate-100 px-3 py-2 font-normal text-slate-700" /></label>
            <div className="sm:col-span-3"><button disabled={isSubmitting || isLoading || isLoadingVouchers} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Processing..." : "Create return"}</button></div>
          </form>
          <p className="mt-3 text-xs text-slate-500">Return amount uses the wholesale price of 300 per voucher.</p>
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </section>

        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">Past returns</h2></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Voucher</th><th className="px-6 py-3 font-semibold">Distributor</th><th className="px-6 py-3 font-semibold">Return amount</th><th className="px-6 py-3 font-semibold">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={4} className="px-6 py-6 text-slate-500">Loading returns...</td></tr> : salesReturns.length === 0 ? <tr><td colSpan={4} className="px-6 py-6 text-slate-500">No sales returns yet.</td></tr> : salesReturns.map((salesReturn) => <tr key={salesReturn.id}><td className="px-6 py-3 font-mono text-xs">{salesReturn.voucher.voucherNumber}</td><td className="px-6 py-3">{salesReturn.distributor.name}</td><td className="px-6 py-3">{salesReturn.returnAmount.toLocaleString()}</td><td className="px-6 py-3">{new Date(salesReturn.date).toLocaleDateString()}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}