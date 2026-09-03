"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppDispatch } from "@/lib/store";
import { setContributorMode } from "@/lib/store/authSlice";
import { useAuth } from "@/lib/auth-context";
import {
  LogOut,
  LayoutDashboard,
  Compass,
  Bot,
  PlusCircle,
  User,
  Sparkles,
  Users,
  PenLine,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function BecomeContributorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState<string | null>(null);

  const choose = async (type: "creator" | "sharer") => {
    setBusy(type);
    await dispatch(setContributorMode(type));
    setBusy(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Become a contributor</DialogTitle>
          <DialogDescription className="pt-1">
            Choose how you want to give back. You can switch anytime, and you keep
            full access to your candidate workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => choose("creator")}
            disabled={!!busy}
            className="group flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 text-left transition-colors hover:border-indigo-700 hover:bg-indigo-950/20 disabled:opacity-60"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-950/60 border border-indigo-900 text-indigo-400">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Interview Creator</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                Create interviewer agents with system prompts & behavior, assemble
                full interview loops, and publish them for the community to practice.
              </p>
            </div>
            {busy === "creator" && (
              <Loader2 className="size-4 animate-spin text-indigo-400" />
            )}
          </button>

          <button
            onClick={() => choose("sharer")}
            disabled={!!busy}
            className="group flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 text-left transition-colors hover:border-emerald-700 hover:bg-emerald-950/20 disabled:opacity-60"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-950/60 border border-emerald-900 text-emerald-400">
              <PenLine className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Experience Sharer</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">
                Share your real interview experience — story, questions, rounds,
                how it felt — to build the community question database.
              </p>
            </div>
            {busy === "sharer" && (
              <Loader2 className="size-4 animate-spin text-emerald-400" />
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, logout, isAuthenticated } = useAuth();
  const [contributorOpen, setContributorOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isContributor = !!user?.isContributor;
  const contributorType = user?.contributorType || null;

  const baseNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Interviews", href: "/interviews", icon: Users },
    { name: "Feed", href: "/feed", icon: Compass },
  ];

  const contributorNav = isContributor
    ? [{ name: "Studio", href: "/studio/agents", icon: Bot }]
    : [];

  const navItems = [...baseNav, ...contributorNav];

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: brand + nav */}
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xs tracking-tight text-white shrink-0">
            <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[11px] font-serif italic">
              A
            </div>
            <span className="hidden sm:inline">
              Agora<span className="text-neutral-400 font-normal">Interview</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-neutral-900 text-white border border-neutral-800 font-semibold"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: contributor + profile */}
        <div className="flex items-center gap-2">
          {isContributor ? (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex border-neutral-700 text-neutral-300 gap-1.5"
              title={contributorType === "creator" ? "Interview Creator" : "Experience Sharer"}
            >
              <Sparkles className="size-3 text-indigo-400" />
              {contributorType === "creator" ? "Creator" : "Sharer"}
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setContributorOpen(true)}
              className="hidden sm:inline-flex border-neutral-700 text-neutral-200 hover:bg-neutral-800"
            >
              <Sparkles className="size-3.5 text-indigo-400" />
              Become a Contributor
            </Button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.[0] || "U"}
                </div>
                <span className="hidden sm:inline font-medium max-w-28 truncate">
                  {user?.name || user?.email}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="bg-neutral-100 text-neutral-950 hover:bg-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      <BecomeContributorDialog open={contributorOpen} onOpenChange={setContributorOpen} />
    </header>
  );
}
