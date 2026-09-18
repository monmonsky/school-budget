import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { isAuthed } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import Sidebar from "@/components/Sidebar";

// Display face: headings, labels, and controls.
const display = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Body face: running text.
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Data face: currency figures, always tabular so digits line up across rows.
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Buku Kas Dana Kuliah",
  description: "Catat dana masuk, dana keluar, dan sisa dana kuliah",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthed();
  const fundName = authed ? getSettings().fund_name : "";

  return (
    <html lang="id" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans">
        {authed ? (
          <>
            <Sidebar fundName={fundName} />
            <div className="lg:pl-60">
              <main className="mx-auto w-full max-w-[1180px] px-4 pb-20 pt-6 sm:px-6 lg:px-10 lg:pt-10">
                {children}
              </main>
            </div>
          </>
        ) : (
          <main>{children}</main>
        )}
      </body>
    </html>
  );
}
