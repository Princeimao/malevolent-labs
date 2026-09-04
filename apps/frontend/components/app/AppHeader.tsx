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
  Sparkles,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, logout, isAuthenticated } = useAuth();
  const [becomingContributor, setBecomingContributor] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleBecomeContributor = async () => {
    setBecomingContributor(true);
    await dispatch(setContributorMode("both"));
    setBecomingContributor(false);
  };

  const isContributor = !!user?.isContributor;
  const contributorType = user?.contributorType || null;

  const baseNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Interviews", href: "/interviews", icon: Users },
    { name: "Feed", href: "/feed", icon: Compass },
  ];

  const contributorNav = isContributor
    ? [
        { name: "Studio", href: "/studio/interviews", icon: Bot },
        { name: "Share", href: "/feed/contribute", icon: Sparkles },
      ]
    : [];

  const navItems = [...baseNav, ...contributorNav];

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: brand + nav */}
        <div className="flex items-center gap-6 min-w-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-xs tracking-tight text-ink shrink-0"
          >
            <span className="hidden sm:inline">
              <img src="./logo.png" alt="logo" height={30} width={30} />
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-neutral-100 text-ink border border-neutral-300 font-semibold"
                      : "text-neutral-500 hover:bg-neutral-100 hover:text-ink"
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
              className="hidden sm:inline-flex border-neutral-300 text-neutral-700 bg-neutral-100 gap-1.5"
              title="Contributor Access Unlocked"
            >
              <Sparkles className="size-3 text-indigo-500" />
              Contributor
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={handleBecomeContributor}
              disabled={becomingContributor}
              className="hidden sm:inline-flex border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              {becomingContributor ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5 text-indigo-500" />
              )}
              {becomingContributor ? "Unlocking..." : "Become a Contributor"}
            </Button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2.5 text-xs text-neutral-600 hover:text-ink transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.[0] || "U"}
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-md text-neutral-500 hover:text-rose-500 hover:bg-neutral-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="bg-ink text-paper hover:bg-neutral-800"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

    </header>
  );
}
