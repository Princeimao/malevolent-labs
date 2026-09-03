"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/store";
import { setContributorMode } from "@/lib/store/authSlice";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, PenLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RequireContributor({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState<string | null>(null);

  if (user?.isContributor) return <>{children}</>;

  const choose = async (type: "creator" | "sharer") => {
    setBusy(type);
    await dispatch(setContributorMode(type));
    setBusy(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300">
          <Sparkles className="size-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">This is the contributor workspace</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Building interviews for the community is a contributor feature. Choose
            how you'd like to contribute to unlock it — you can keep practicing as
            a candidate anytime.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={() => choose("creator")} disabled={!!busy} className="h-auto flex-col gap-2 py-5 bg-indigo-950/60 border border-indigo-800 text-indigo-200 hover:bg-indigo-900/60">
            {busy === "creator" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-5" />}
            <span className="text-sm font-semibold text-white">Interview Creator</span>
            <span className="text-[11px] font-normal text-indigo-300/80">Agents, rounds & public interviews</span>
          </Button>
          <Button onClick={() => choose("sharer")} disabled={!!busy} className="h-auto flex-col gap-2 py-5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 hover:bg-emerald-900/60">
            {busy === "sharer" ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-5" />}
            <span className="text-sm font-semibold text-white">Experience Sharer</span>
            <span className="text-[11px] font-normal text-emerald-300/80">Share your real interview story</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
