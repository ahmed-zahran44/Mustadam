"use client";

import { useEffect, useState } from "react";

interface HeroFoldingLaptopProps {
  locale?: string;
}

/**
 * Uses the real straight-on studio photograph of the Dell Inspiron 16 Plus 7610
 * (`/products/laptops/dell-inspiron-16-plus-7610/2.jpg`).
 *
 * In this photograph:
 * - 0% -> 80.5% vertically is the open display screen & thin bezel.
 * - 80.5% is the exact horizontal hinge axis where the screen meets the base.
 * - 80.5% -> 100% vertically is the real aluminum keyboard & trackpad base deck.
 *
 * Both planes render the exact same real photograph inside a large centered 3D stage.
 * At scroll = 0, they join seamlessly into one large real laptop photo in the middle of the hero.
 * As the user scrolls down, the top screen plane rotates in 3D around `50% 80.5%` (the hinge line),
 * physically folding the real laptop screen down until it closes flat onto the keyboard base.
 */
export function HeroFoldingLaptopBackground({
  locale = "en",
}: HeroFoldingLaptopProps) {
  const isAr = locale === "ar";
  const [foldProgress, setFoldProgress] = useState(0);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let rafId: number | null = null;

    const updateScroll = () => {
      rafId = null;
      const maxScroll = 380;
      const next = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      setFoldProgress(next);
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateScroll);
      }
    };

    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Top screen photo folds from 0deg (fully open) down to -88deg (closed over the keyboard base)
  const lidRotateX = -Math.round(foldProgress * 88 * 10) / 10;
  // Subtle camera pitch as the laptop folds closed
  const stageRotateX = Math.round(foldProgress * 16 * 10) / 10;
  const stageScale = Math.round((1 - foldProgress * 0.05) * 1000) / 1000;
  const stageTranslateY = Math.round(foldProgress * 24);
  const screenBrightness = Math.round((1 - foldProgress * 0.55) * 100) / 100;
  const openAngleDeg = Math.round((1 - foldProgress) * 110);

  const realLaptopPhotoUrl = "/products/laptops/dell-inspiron-16-plus-7610/2.jpg";

  return (
    <div
      aria-hidden="true"
      data-testid="hero-folding-laptop-bg"
      className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden select-none"
    >
      {/* Studio Spotlight behind the centered real laptop photo */}
      <div
        className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 h-[36rem] w-[58rem] max-w-full rounded-full bg-emerald-500/20 blur-3xl transition-opacity duration-300 dark:bg-emerald-500/25"
        style={{ opacity: 1 - foldProgress * 0.35 }}
      />

      {/* Big Centered 3D Laptop Photo Stage */}
      <div
        className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-4"
        style={{ perspective: "1600px" }}
      >
        <div
          className="relative w-[92%] sm:w-[86%] lg:w-[52rem] max-w-full aspect-[1140/785] opacity-75 dark:opacity-80 transition-transform duration-75 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `translate3d(0, ${stageTranslateY}px, 0) rotateX(${stageRotateX}deg) scale(${stageScale})`,
          }}
        >
          {/* 1. REAL LAPTOP BASE / KEYBOARD DECK (Bottom 19.5% of the real photograph, below the 80.5% hinge line) */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0% 80.2%, 100% 80.2%, 100% 100%, 0% 100%)",
            }}
          >
            <img
              src={realLaptopPhotoUrl}
              alt=""
              className="h-full w-full object-contain drop-shadow-[0_26px_45px_rgba(0,0,0,0.38)]"
            />
          </div>

          {/* 2. REAL LAPTOP SCREEN / LID (Top 80.5% of the real photograph, rotating around the 80.5% hinge axis) */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: "polygon(0% 0%, 100% 0%, 100% 80.6%, 0% 80.6%)",
              transformOrigin: "50% 80.5%",
              transformStyle: "preserve-3d",
              transform: `rotateX(${lidRotateX}deg)`,
              filter: `brightness(${screenBrightness})`,
            }}
          >
            <img
              src={realLaptopPhotoUrl}
              alt=""
              className="h-full w-full object-contain"
            />

            {/* Anodized slate-aluminum outer lid shell that fades in as the screen folds past 40 degrees */}
            <div
              className="absolute inset-x-[7.5%] top-[1.5%] bottom-[19.5%] rounded-t-[16px] border border-slate-400/50 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-800 shadow-2xl flex items-center justify-center"
              style={{
                opacity: Math.max(0, (foldProgress - 0.32) / 0.68),
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-300/50 text-[11px] font-black tracking-tighter text-slate-200/80">
                DELL
              </div>
            </div>
          </div>

          {/* Dynamic shadow cast onto the keyboard deck as the lid folds down */}
          <div
            className="pointer-events-none absolute inset-x-[6%] top-[80.2%] h-[13%] rounded-full bg-black/60 blur-md"
            style={{
              opacity: Math.min(0.85, foldProgress * 0.95),
              transform: `scaleY(${0.35 + foldProgress * 0.85})`,
            }}
          />
        </div>

        {/* Live Scroll-to-Fold Indicator Pill centered under the laptop */}
        <div className="mt-2 flex justify-center">
          <span className="ltr-data rounded-full border border-emerald-600/30 bg-white/85 px-3 py-1 font-mono text-[11px] font-bold text-emerald-900 shadow-xs backdrop-blur-md dark:border-emerald-500/35 dark:bg-neutral-900/85 dark:text-emerald-300">
            {foldProgress > 0.78
              ? isAr
                ? "تم إغلاق اللابتوب بالكامل • مرّر للأعلى لفتحه"
                : "LAPTOP FOLDED CLOSED • SCROLL UP TO OPEN"
              : isAr
                ? `زاوية الشاشة ${openAngleDeg}° • مرّر للأسفل لطي وإغلاق اللابتوب`
                : `LAPTOP OPEN (${openAngleDeg}°) • SCROLL DOWN TO FOLD CLOSED`}
          </span>
        </div>
      </div>
    </div>
  );
}

