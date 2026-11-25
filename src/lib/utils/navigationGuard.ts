/**
 * App-wide "may we leave this page?" check for client-side navigations that don't go through
 * an <a> element (e.g. `router.push` from a button). The admin editor registers one while it
 * has unsaved changes; everyone else just calls `confirmNavigation()` before navigating.
 */
let guard: (() => boolean) | null = null;

/** Registers the guard; returns a function that removes it (if it is still the active one). */
export function setNavigationGuard(next: () => boolean): () => void {
  guard = next;
  return () => {
    if (guard === next) guard = null;
  };
}

/** True when navigation may proceed (no guard, or the guard allowed it). */
export function confirmNavigation(): boolean {
  return guard ? guard() : true;
}
