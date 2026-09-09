"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/vouchers", label: "Vouchers" },
  { href: "/distributors", label: "Distributors" },
  { href: "/distributions", label: "Distributions" },
  { href: "/vsps", label: "VSPs" },
  { href: "/claims", label: "Claims" },
  { href: "/returns", label: "Returns" },
  { href: "/user-groups", label: "User Groups" },
  { href: "/users", label: "Users" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-slate-900">
          VMUS
        </Link>
        <div className="flex flex-wrap gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}