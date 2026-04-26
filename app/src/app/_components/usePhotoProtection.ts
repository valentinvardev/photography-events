"use client";

import { useState, useEffect } from "react";

const BLUR_DURATION_MS = 3000;

// Mac screenshot shortcuts: Cmd+Shift+3/4/5
function isScreenshotCombo(e: KeyboardEvent): boolean {
  return e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
}

export function usePhotoProtection() {
  const [blurred, setBlurred] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function onKeyDown(e: KeyboardEvent) {
      if (isScreenshotCombo(e)) {
        setBlurred(true);
        clearTimeout(timer);
        timer = setTimeout(() => setBlurred(false), BLUR_DURATION_MS);
      }
    }

    function onContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-photo-protected]")) {
        e.preventDefault();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("contextmenu", onContextMenu);
      clearTimeout(timer);
    };
  }, []);

  return { blurred };
}
