/**
 * Shared motion tokens for luxury UI. Pair with `motion-safe:` / `motion-reduce:` variants.
 * Prefer these over one-off durations so the product feels consistent.
 */
export const motionEasing = {
  /** Slow ease-out — calm, editorial */
  luxuryOut: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Slightly quicker exit */
  luxuryIn: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const motionDuration = {
  fast: "180ms",
  base: "420ms",
  slow: "580ms",
} as const;

/** Page / section entrance — respects reduced motion via `motion-safe:` prefix on the element */
export const pageEnterClasses =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]";

/** Modal / drawer panel — subtle scale + drift */
export const dialogPanelEnterClasses =
  "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-[0.99] motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]";

export const dialogBackdropClasses =
  "fixed inset-0 z-50 flex items-end bg-[oklch(0.22_0.02_50_/_0.42)] backdrop-blur-[2px] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] lg:items-center lg:justify-center";
