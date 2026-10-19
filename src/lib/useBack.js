import { useCallback } from "react";
import { useNavigate, useNavigationType } from "react-router-dom";

/**
 * Back button that always returns to the page you actually just left.
 *
 * - Route screens: walks the real browser history (navigate(-1)) and only
 *   falls back to `fallback` when there is no history to walk.
 * - Guards against the POP loop: if the current entry was itself reached by
 *   a back/forward navigation, we go back one more step rather than
 *   bouncing between two entries.
 */
export function useSmartBack(fallback = "/") {
  const navigate = useNavigate();
  const navType = useNavigationType();

  return useCallback(() => {
    const state = window.history.state;
    const idx = typeof state?.idx === "number" ? state.idx : 0;
    if (idx > 0) {
      navigate(-1);
      return;
    }
    navigate(fallback, { replace: true });
  }, [navigate, fallback, navType]);
}

/** Same idea for in-flow steps (not routes): walk a step stack instead. */
export function useStepBack(fallbackStep) {
  return useCallback((stack, current) => {
    if (stack.length > 1) return stack[stack.length - 2];
    return fallbackStep;
  }, [fallbackStep]);
}
