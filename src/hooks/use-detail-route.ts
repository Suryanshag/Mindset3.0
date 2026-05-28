"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Syncs an in-place list↔detail toggle with the browser URL using the native
 * History API (which Next.js' App Router patches to stay in sync with
 * usePathname/useSearchParams). Opening a detail pushes `${basePath}/${id}`;
 * the browser back button and a deep-linked reload both resolve to the right
 * view because a real `[id]`/`[slug]` route renders the same component.
 *
 * `onOpen`/`onClose` only mutate React state — they must NOT touch history.
 */
export function useDetailRoute({
  basePath,
  onOpen,
  onClose,
}: {
  basePath: string;
  onOpen: (id: string) => void;
  onClose: () => void;
}) {
  // Keep latest callbacks in refs so the popstate listener (attached once)
  // always invokes the current closure with fresh state.
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;

  // True when the detail was opened from the list within this session, meaning
  // there's a list entry beneath it we can safely pop back to.
  const openedFromListRef = useRef(false);

  const parseId = useCallback(
    (pathname: string): string | null => {
      if (pathname === basePath || pathname === `${basePath}/`) return null;
      if (!pathname.startsWith(`${basePath}/`)) return null;
      const rest = pathname.slice(basePath.length + 1).replace(/\/$/, "");
      if (!rest || rest.includes("/")) return null;
      return decodeURIComponent(rest);
    },
    [basePath]
  );

  useEffect(() => {
    const onPopState = () => {
      const id = parseId(window.location.pathname);
      if (id) onOpenRef.current(id);
      else onCloseRef.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [parseId]);

  const openDetail = useCallback(
    (id: string) => {
      openedFromListRef.current = true;
      window.history.pushState(null, "", `${basePath}/${encodeURIComponent(id)}`);
      onOpenRef.current(id);
    },
    [basePath]
  );

  const closeDetail = useCallback(() => {
    if (openedFromListRef.current) {
      // Pop the detail entry; the popstate handler restores the list view.
      openedFromListRef.current = false;
      window.history.back();
    } else {
      // Deep-landed on the detail URL — there's no list entry below, so move
      // forward to the list rather than leaving the site.
      window.history.pushState(null, "", basePath);
      onCloseRef.current();
    }
  }, [basePath]);

  return { openDetail, closeDetail };
}
