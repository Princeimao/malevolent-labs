"use client";
import {
  Navbar as NavbarComp,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import Link from "next/link";
import { Sparkles, Video, Compass, PlusCircle } from "lucide-react";

export default function Navbar() {
  const navItems = [
    {
      name: "Interview Simulator",
      link: "/simulator",
    },
    {
      name: "Community Feed",
      link: "/feed",
    },
    {
      name: "Contribute Experience",
      link: "/feed/contribute",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full z-50">
      <NavbarComp>
        {/* Desktop Navigation */}
        <NavBody>
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-white"
          >
            <span className="tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Agora
            </span>
          </Link>

          <NavItems items={navItems} />

          <div className="flex items-center gap-3">
            <Link href="/feed">
              <NavbarButton variant="secondary" className="text-xs md:text-sm">
                <Compass className="w-4 h-4 mr-1.5 inline text-indigo-400" />
                Browse Feed
              </NavbarButton>
            </Link>
            <Link href="/simulator">
              <NavbarButton
                variant="primary"
                className="text-xs md:text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/25 hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-1.5 inline text-indigo-200" />
                Start Simulation
              </NavbarButton>
            </Link>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg text-white"
            >
              <div className="p-1.5 rounded-lg bg-indigo-600">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span>AgoraInterview</span>
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-300 hover:text-white py-1"
              >
                <span className="block font-medium">{item.name}</span>
              </Link>
            ))}
            <div className="flex w-full flex-col gap-3 pt-2">
              <Link href="/simulator" className="w-full">
                <NavbarButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  variant="primary"
                  className="w-full bg-indigo-600 text-white"
                >
                  Start Simulation
                </NavbarButton>
              </Link>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </NavbarComp>
    </div>
  );
}
