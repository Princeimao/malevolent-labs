"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/store";
import { setContributorMode } from "@/lib/store/authSlice";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, Loader2, PenLine, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RequireContributor({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);

  if (user?.isContributor) return <>{children}</>;

  const unlock = async () => {
    setBusy(true);
    await dispatch(setContributorMode("both"));
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-500">
          <Sparkles className="size-7" />
        </span>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-ink">
            Unlock contributor access
          </h1>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm mx-auto">
            Contributors get two extra abilities on top of the full candidate
            workspace — you keep everything you already have.
          </p>
        </div>

        <div className="grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-500">
              <Layers className="size-4" />
            </span>
            <p className="text-sm font-semibold text-ink">Build interviews</p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Create AI interviewer agents, assemble full multi-round loops, and
              publish them for the community to practice.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <PenLine className="size-4" />
            </span>
            <p className="text-sm font-semibold text-ink">Share experiences</p>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Share your real interview stories — rounds, questions, how it felt
              — to help others prepare smarter.
            </p>
          </div>
        </div>

        <Button onClick={unlock} disabled={busy} size="lg" className="w-full">
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {busy ? "Unlocking..." : "Become a Contributor"}
        </Button>

        <p className="text-[11px] text-neutral-400">
          Your candidate workspace — goals, practice sessions, feed — stays
          exactly the same.
        </p>
      </div>
    </div>
  );
}

