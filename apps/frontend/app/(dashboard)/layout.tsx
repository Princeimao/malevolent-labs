"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store";
import { Loader2 } from "lucide-react";
import AppHeader from "@/components/app/AppHeader";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const { isAuthenticated, isInitialized, user } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else if (user && !user.isOnboarded) {
      router.replace("/onboarding");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (!isInitialized || !isAuthenticated || (user && !user.isOnboarded)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppHeader />
      {children}
    </div>
  );
}
