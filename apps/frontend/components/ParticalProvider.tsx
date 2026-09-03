"use client";

import type { ReactNode } from "react";
import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export function ParticleProvider({ children }: { children: ReactNode }) {
  return (
    <ParticlesProvider
      init={async (engine) => {
        await loadSlim(engine);
      }}
    >
      {children}
    </ParticlesProvider>
  );
}
