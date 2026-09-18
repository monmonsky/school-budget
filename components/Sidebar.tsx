"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/actions";
import {
  IconBarChart,
  IconHistory,
  IconHome,
  IconLogOut,
  IconMenu,
  IconReceipt,
  IconSliders,
  IconX,
} from "@/components/icons";

const NAV_ITEMS = [
  { href: "/", label: "Beranda", Icon: IconHome },
  { href: "/transaksi", label: "Transaksi", Icon: IconReceipt },
  { href: "/rekap", label: "Rekap", Icon: IconBarChart },
  { href: "/audit", label: "Jejak", Icon: IconHistory },
  { href: "/pengaturan", label: "Pengaturan", Icon: IconSliders },
];

export default function Sidebar({ fundName }: { fundName: string }) {
  const pathname = usePathname();
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  // Close the drawer whenever navigation happens.
  useEffect(() => setDrawerOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3" aria-label="Navigasi utama">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group relative flex items-center gap-3 rounded-control px-3 py-2.5 font-display text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-white/[0.07] text-paper-card"
                : "text-paper/55 hover:bg-white/[0.04] hover:text-paper"
            }`}
          >
            {/* Active marker: a brass rule at the edge, like a book tab. */}
            <span
              className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brass transition-opacity duration-150 ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="px-6 pb-6 pt-5">
      <p className="font-display text-[15px] font-semibold uppercase leading-tight tracking-[0.12em] text-paper-card">
        {fundName || "Dana Kuliah"}
      </p>
      <span className="mt-2.5 block h-px w-9 bg-brass" />
      <p className="mt-2.5 text-[11px] text-paper/40">Buku kas</p>
    </div>
  );

  const footer = (
    <form action={logoutAction} className="border-t border-white/10 p-3">
      <button className="flex w-full cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 font-display text-sm font-medium text-paper/55 transition-colors duration-150 hover:bg-white/[0.04] hover:text-paper">
        <IconLogOut className="h-[18px] w-[18px] shrink-0" />
        Keluar
      </button>
    </form>
  );

  return (
    <>
      {/* Fixed sidebar — large screens */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-ink lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Top bar — small screens */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Buka menu"
          aria-expanded={isDrawerOpen}
          className="-ml-1 cursor-pointer rounded-control p-2 text-ink transition-colors duration-150 hover:bg-paper-sunk"
        >
          <IconMenu className="h-5 w-5" />
        </button>
        <p className="font-display text-sm font-semibold uppercase tracking-[0.12em]">
          {fundName || "Dana Kuliah"}
        </p>
      </header>

      {/* Drawer — small screens */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/45"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-ink">
            <div className="flex items-start justify-between">
              {brand}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Tutup menu"
                className="m-4 cursor-pointer rounded-control p-1.5 text-paper/55 transition-colors duration-150 hover:bg-white/[0.06] hover:text-paper"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}
    </>
  );
}
