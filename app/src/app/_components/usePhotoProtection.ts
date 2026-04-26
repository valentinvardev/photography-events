"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const BLUR_DURATION_MS = 3000;

// Mac screenshot shortcuts: Cmd+Shift+3/4/5
function isScreenshotCombo(e: KeyboardEvent): boolean {
  return e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
}

export function usePhotoProtection() {
  const [blurred, setBlurred] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const triggerBlur = useCallback(() => {
    setBlurred(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setBlurred(false), BLUR_DURATION_MS);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isScreenshotCombo(e)) triggerBlur();
    }

    function onContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-photo-protected]")) {
        e.preventDefault();
        triggerBlur();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onContextMenu);
      clearTimeout(timerRef.current);
    };
  }, [triggerBlur]);

  return { blurred };
}
