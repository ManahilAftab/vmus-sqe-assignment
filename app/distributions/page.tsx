"use client";

import { FormEvent, useEffect, useState } from "react";

type Distributor = { id: string; name: string; code: string; status: string };
type Distribution = {
  id: string;
  invoiceNo: string;
  quantity: number;
  invoiceAmount: number;
  date: string;
  distributor: { name: string };
  _count: { items: number };
};

export default function DistributionsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [transactions, setTransactions] = useState<Distribution[]>([]);
  const [distributorId, setDistributorId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [availableCount, setAvailableCount] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadData() {
    try {
      const [distributorResponse, distributionResponse] = await Promise.all([
        fetch("/api/distributors"),
        fetch("/api/distributions"),
      ]);
      const distributorData = await distributorResponse.json();
      const distributionData = await distributionResponse.json();
      if (!distributorResponse.ok) throw new Error(distributorData.error || "Unable to load distributors.");
      if (!distributionResponse.ok) throw new Error(distributionData.error || "Unable to load transactions.");
      setDistributors(distributorData.filter((distributor: Distributor) => distributor.status === "active"));
      setTransactions(distributionData.transactions);
      setAvailableCount(distributionData.availableCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load distribution data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributorId, quantity }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create distribution transaction.");
      setMessage(`${data.distribution.invoiceNo} created for ${data.distribution.quantity} vouchers.`);
      setQuantity("1");
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create distribution transaction.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Distribution transaction</h1>
          <p className="mt-2 text-slate-600">Sell available vouchers to a distributor.</p>
        </header>

        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold">Create transaction</h2>
          <p className="mt-1 text-sm text-slate-500">Available unsold vouchers: <strong className="text-slate-900">{availableCount}</strong></p>
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-medium text-slate-700">Distributor<select required value={distributorId} onChange={(event) => setDistributorId(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"><option value="">Select a distributor</option>{distributors.map((distributor) => <option key={distributor.id} value={distributor.id}>{distributor.code} - {distributor.name}</option>)}</select></label>
            <label className="w-full text-sm font-medium text-slate-700 sm:w-40">Quantity<input required min="1" step="1" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 font-normal outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" /></label>
            <button disabled={isSubmitting || isLoading} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Processing..." : "Create transaction"}</button>
          </form>
          <p className="mt-3 text-xs text-slate-500">Invoice amount uses the temporary wholesale price of 300 per voucher.</p>
          {message && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
          {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </section>

        <section className="mt-8 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-lg font-semibold">Past transactions</h2></div>
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-6 py-3 font-semibold">Invoice</th><th className="px-6 py-3 font-semibold">Distributor</th><th className="px-6 py-3 font-semibold">Quantity</th><th className="px-6 py-3 font-semibold">Invoice amount</th><th className="px-6 py-3 font-semibold">Date</th><th className="px-6 py-3 font-semibold">Allocated</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? <tr><td colSpan={6} className="px-6 py-6 text-slate-500">Loading transactions...</td></tr> : transactions.length === 0 ? <tr><td colSpan={6} className="px-6 py-6 text-slate-500">No distribution transactions yet.</td></tr> : transactions.map((transaction) => <tr key={transaction.id}><td className="px-6 py-3 font-mono text-xs">{transaction.invoiceNo}</td><td className="px-6 py-3">{transaction.distributor.name}</td><td className="px-6 py-3">{transaction.quantity}</td><td className="px-6 py-3">{transaction.invoiceAmount.toLocaleString()}</td><td className="px-6 py-3">{new Date(transaction.date).toLocaleDateString()}</td><td className="px-6 py-3">{transaction._count.items}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </main>
  );
}