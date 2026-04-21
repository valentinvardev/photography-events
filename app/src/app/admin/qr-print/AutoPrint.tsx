"use client";
import { useEffect } from "react";
export function AutoPrint() {
  useEffect(() => { setTimeout(() => window.print(), 700); }, []);
  return null;
}
