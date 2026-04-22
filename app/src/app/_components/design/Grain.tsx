"use client";

import { usePathname } from "next/navigation";

export function Grain() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <div className="grain-layer" aria-hidden="true" />;
}
