"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

const links = [
  { href: "/", label: "Beranda" },
  { href: "/transaksi", label: "Transaksi" },
  { href: "/rekap", label: "Rekap" },
  { href: "/audit", label: "Jejak" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default function NavBar({ fundName }: { fundName: string }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">₨</span>
          <span className="hidden sm:inline">{fundName || "Pencatat Kuliah"}</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                isActive(l.href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button className="rounded-lg px-3 py-1.5 font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600">
              Keluar
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
