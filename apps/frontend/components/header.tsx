"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/store";
import { navigationData } from "@/constants";

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <span className="flex items-center gap-2.5 select-none">
    <img src="./logo.png" width={30} height={30} />
  </span>
);

const Header = ({ className }: { className?: string }) => {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const onScroll = useCallback(() => setScrolled(window.scrollY >= 24), []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const handleAuth = () =>
    router.push(isAuthenticated ? "/dashboard" : "/login");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 px-4 transition-all duration-300",
        scrolled
          ? "border-b border-ink/8 bg-paper/80 backdrop-blur-xl"
          : "border-b border-transparent bg-paper",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4">
        <Link href="/" aria-label="Home">
          <Logo />
        </Link>

        {/* Main menu */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigationData.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAuth}
            className="hidden h-9 rounded-full bg-ink px-4 text-sm text-paper hover:bg-ink/85 md:inline-flex"
          >
            {isAuthenticated ? "Dashboard" : "Sign in"}
          </Button>

          {/* Mobile drawer */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger id="mobile-menu-trigger">
                <span className="flex size-9 items-center justify-center rounded-full border border-ink/12 text-ink">
                  <Menu width={18} height={18} />
                  <span className="sr-only">Menu</span>
                </span>
              </SheetTrigger>

              <SheetContent
                showCloseButton={false}
                side="right"
                className="w-full border-ink/8 bg-paper sm:w-80"
              >
                <div className="flex items-center justify-between border-b border-ink/8 p-5">
                  <Logo />
                  <SheetClose id="mobile-menu-close">
                    <span className="flex size-9 items-center justify-center rounded-full border border-ink/12">
                      <X width={16} height={16} />
                    </span>
                  </SheetClose>
                </div>

                <div className="flex flex-col gap-1 p-5">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  {navigationData.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl px-3 py-2.5 text-[15px] text-ink/70 hover:bg-ink/5 hover:text-ink"
                    >
                      {item.title}
                    </Link>
                  ))}
                  <Button
                    onClick={handleAuth}
                    className="mt-3 h-10 rounded-full bg-ink text-paper"
                  >
                    {isAuthenticated ? "Dashboard" : "Sign in"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
