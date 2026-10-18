import { flushSync } from "react-dom";

export type MotionKind = "theme" | "list" | "layout";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function withMotion(update: () => void, kind: MotionKind = "theme") {
  const root = document.documentElement;
  const skipLayout = kind === "layout" && window.matchMedia("(max-width: 860px)").matches;
  if (prefersReducedMotion() || skipLayout || typeof document.startViewTransition !== "function") {
    update();
    return;
  }

  root.dataset.motion = kind;
  try {
    const transition = document.startViewTransition(() => {
      flushSync(update);
    });
    transition.finished.finally(() => {
      if (root.dataset.motion === kind) delete root.dataset.motion;
    });
  } catch {
    delete root.dataset.motion;
    update();
  }
}
