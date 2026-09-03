"use client";

import Header from "@/components/header";
import Footer from "@/components/footer";

export default function StaticLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
