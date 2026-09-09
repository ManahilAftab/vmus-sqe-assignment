import Link from "next/link";

const modules = [
  { href: "/vouchers", title: "Vouchers", description: "Create and track voucher inventory." },
  { href: "/distributors", title: "Distributors", description: "Manage distributor records and status." },
  { href: "/distributions", title: "Distributions", description: "Sell available vouchers to distributors." },
  { href: "/vsps", title: "VSPs", description: "Maintain VSP details and payment terms." },
  { href: "/claims", title: "Claims", description: "Capture and review submitted claims." },
  { href: "/returns", title: "Returns", description: "Process vouchers returned by distributors." },
  { href: "/user-groups", title: "User Groups", description: "Configure screen-level permissions." },
  { href: "/users", title: "Users", description: "Create users and assign security groups." },
];

export default function Home() {
  return (
    <main className="flex-1 bg-slate-50 px-4 py-10 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">VMUS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Voucher Management System</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Manage voucher operations, distribution partners, claims, returns, and access control from one workspace.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="VMUS modules">
          {modules.map((module) => (
            <Link key={module.href} href={module.href} className="group rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-blue-300">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">{module.title}</h2>
                <span aria-hidden="true" className="text-lg text-blue-700">-&gt;</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{module.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
