"use client";

import React, { useId, useMemo } from "react";
import Particles from "@tsparticles/react";
import type { Container, ISourceOptions } from "@tsparticles/engine";
import { cn } from "@/lib/utils";
import { motion, useAnimation } from "motion/react";

type ParticlesProps = {
  id?: string;
  className?: string;
  background?: string;
  particleSize?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

export const SparklesCore = ({
  id,
  className,
  background,
  minSize = 1,
  maxSize = 3,
  speed = 4,
  particleColor = "#ffffff",
  particleDensity = 120,
}: ParticlesProps) => {
  const generatedId = useId();
  const controls = useAnimation();

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: {
          duration: 1,
        },
      });
    }
  };

  const options = useMemo<ISourceOptions>(
    () => ({
      background: {
        color: {
          value: background || "#0d47a1",
        },
      },

      fullScreen: {
        enable: false,
        zIndex: 1,
      },

      fpsLimit: 120,

      interactivity: {
        events: {
          onClick: {
            enable: true,
            mode: "push",
          },
          onHover: {
            enable: false,
            mode: "repulse",
          },
          resize: true,
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },

      particles: {
        color: {
          value: particleColor,
        },

        number: {
          density: {
            enable: true,
            width: 400,
            height: 400,
          },
          value: particleDensity,
        },

        opacity: {
          value: {
            min: 0.1,
            max: 1,
          },
          animation: {
            enable: true,
            speed,
            mode: "auto",
            startValue: "random",
            destroy: "none",
          },
        },

        size: {
          value: {
            min: minSize,
            max: maxSize,
          },
        },

        move: {
          enable: true,
          direction: "none",
          random: false,
          speed: {
            min: 0.1,
            max: 1,
          },
          straight: false,
          outModes: {
            default: "out",
          },
        },

        shape: {
          type: "circle",
        },

        links: {
          enable: false,
        },

        collisions: {
          enable: false,
        },

        rotate: {
          enable: false,
        },

        tilt: {
          enable: false,
        },

        wobble: {
          enable: false,
        },

        roll: {
          enable: false,
        },

        twinkle: {
          particles: {
            enable: false,
          },
          lines: {
            enable: false,
          },
        },
      },

      detectRetina: true,
    }),
    [background, minSize, maxSize, speed, particleColor, particleDensity],
  );

  return (
    <motion.div animate={controls} className={cn("opacity-0", className)}>
      <Particles
        id={id || generatedId}
        className="h-full w-full"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    </motion.div>
  );
};
