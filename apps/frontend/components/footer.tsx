import Link from "next/link";
import { footerLinks } from "@/constants";

const groups = [
  { title: "Platform", links: footerLinks.slice(0, 4) },
  { title: "Account", links: footerLinks.slice(4) },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
          {/* Brand + statement */}
          <div className="max-w-sm space-y-4">
            <span className="flex items-center gap-2.5 select-none">
              <span className="flex size-12 items-center justify-center rounded-full border border-white/25 bg-white text-sm font-serif italic text-black">
                <img src="./logo.png" alt="logo" width={24} height={24} />
              </span>
              <span className="text-[17px] font-medium tracking-tight text-paper">
                Malevolent
                <span className="text-paper/45">{" "}Labs</span>
              </span>
            </span>
            <p className="text-sm font-light leading-relaxed text-paper/45">
              Practice the interview you're actually preparing for — live,
              multi-round simulations built from real company loops and refined
              by the people preparing for the same seats you are.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-16">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-paper/35">
                  {group.title}
                </p>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-paper/60 transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-paper/35">
            ©2026 Malevolent Labs. Crafted for people who take interviews
            seriously.
          </p>
          <p className="text-xs text-paper/25">
            Simulated interviews are for practice only — not affiliated with any
            company.
          </p>
        </div>
      </div>
    </footer>
  );
}
