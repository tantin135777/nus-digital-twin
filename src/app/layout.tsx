import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUS 3D Campus Digital Twin & Live Transit Tracker",
  description: "Interactive 3D digital twin and live transit command center for Kent Ridge Campus, National University of Singapore",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col font-sans bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
