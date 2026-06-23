import type { Metadata } from "next";
import "./globals.css";
import { isAuthed } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Pencatat Pembayaran Kuliah",
  description: "Catat dana masuk, keluar, dan saldo biaya kuliah",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();
  const fundName = authed ? getSettings().fund_name : "";

  return (
    <html lang="id">
      <body>
        {authed && <NavBar fundName={fundName} />}
        <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">{children}</main>
      </body>
    </html>
  );
}
