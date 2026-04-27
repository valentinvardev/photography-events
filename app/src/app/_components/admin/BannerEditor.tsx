"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

type Props = {
  collectionId: string;
  initialBannerUrl: string | null;     // resolved URL for preview
  initialBannerKey: string | null;     // raw key stored in DB
  initialLogoUrl: string | null;
  initialLogoKey: string | null;
  initialFocalY: number;
};

function BannerDragger({
  bannerUrl,
  focalY,
  onChange,
}: {
  bannerUrl: string;
  focalY: number;
  onChange: (y: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startFocal = useRef(0);

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const delta = e.clientY - startY.current;
      const frac = delta / containerRef.current.clientHeight;
      onChange(clamp(startFocal.current + frac));
    };
    const onUp = () => { dragging.current = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const delta = e.touches[0]!.clientY - startY.current;
      const frac = delta / containerRef.current.clientHeight;
      onChange(clamp(startFocal.current + frac));
    };
    const onTouchEnd = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onChange]);

  return (
    <div
      ref={containerRef}
      className="relative h-32 overflow-hidden cursor-ns-resize select-none bg-[color:var(--color-grey-200)]"
      onMouseDown={(e) => { dragging.current = true; startY.current = e.clientY; startFocal.current = focalY; e.preventDefault(); }}
      onTouchStart={(e) => { dragging.current = true; startY.current = e.touches[0]!.clientY; startFocal.current = focalY; }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerUrl}
        alt=""
        draggable={false}
        className="w-full h-full object-cover pointer-events-none"
        style={{ objectPosition: `center ${Math.round(focalY * 100)}%` }}
      />
      <div
        className="absolute left-0 right-0 h-px bg-[color:var(--color-paper)]/60 pointer-events-none"
        style={{ top: `${focalY * 100}%` }}
      />
      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[color:var(--color-ink)]/70 font-mono text-[8px] uppercase tracking-[0.18em] text-[color:var(--color-paper)] pointer-events-none">
        Arrastrá ↕
      </div>
    </div>
  );
}

export function BannerEditor({
  collectionId,
  initialBannerUrl,
  initialBannerKey,
  initialLogoUrl,
  initialLogoKey,
  initialFocalY,
}: Props) {
  const router = useRouter();
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl ?? "");
  const [bannerKey, setBannerKey] = useState(initialBannerKey ?? "");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? "");
  const [logoKey, setLogoKey] = useState(initialLogoKey ?? "");
  const [focalY, setFocalY] = useState(initialFocalY);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const bannerInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const update = api.collection.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      setSavedAt(Date.now());
      router.refresh();
    },
  });

  const uploadImage = async (file: File, type: "banner" | "logo") => {
    const setUploading = type === "banner" ? setUploadingBanner : setUploadingLogo;
    setUploading(true);
    try {
      const path = `_collections/${type}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!signRes.ok) return;
      const { signedUrl } = await signRes.json() as { signedUrl: string };
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) return;
      const previewUrl = URL.createObjectURL(file);
      if (type === "banner") {
        setBannerUrl(previewUrl);
        setBannerKey(path);
      } else {
        setLogoUrl(previewUrl);
        setLogoKey(path);
      }
      setDirty(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    update.mutate({
      id: collectionId,
      bannerUrl: bannerKey || null,
      logoUrl: logoKey || null,
      bannerFocalY: focalY,
    });
  };

  const handleFocalChange = (y: number) => {
    setFocalY(y);
    setDirty(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Banner */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mb-2">
          Banner
        </p>
        {bannerUrl ? (
          <div className="border border-[color:var(--color-grey-300)]">
            <BannerDragger
              bannerUrl={bannerUrl}
              focalY={focalY}
              onChange={handleFocalChange}
            />
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <button
                onClick={() => bannerInput.current?.click()}
                disabled={uploadingBanner}
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-50"
              >
                {uploadingBanner ? "Subiendo…" : "Cambiar"}
              </button>
              <button
                onClick={() => { setBannerUrl(""); setBannerKey(""); setDirty(true); }}
                className="font-mono text-[9px] uppercase tracking-[0.14em] text-red-600 hover:text-red-700 transition-colors"
              >
                Quitar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => bannerInput.current?.click()}
            disabled={uploadingBanner}
            className="w-full px-3 py-3 border border-dashed border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-500)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-50"
          >
            {uploadingBanner ? "Subiendo…" : "+ Subir banner"}
          </button>
        )}
        <input
          ref={bannerInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f, "banner"); }}
        />
      </div>

      {/* Logo */}
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--color-grey-500)] mb-2">
          Logo
        </p>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative w-14 h-14 overflow-hidden border border-[color:var(--color-grey-300)] flex-shrink-0 bg-[color:var(--color-grey-100)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null}
          <button
            onClick={() => logoInput.current?.click()}
            disabled={uploadingLogo}
            className="px-3 py-1.5 border border-[color:var(--color-grey-300)] font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--color-grey-600)] hover:border-[color:var(--color-ink)] hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-50"
          >
            {uploadingLogo ? "Subiendo…" : logoUrl ? "Cambiar" : "+ Subir logo"}
          </button>
          {logoUrl && (
            <button
              onClick={() => { setLogoUrl(""); setLogoKey(""); setDirty(true); }}
              className="font-mono text-[9px] uppercase tracking-[0.14em] text-red-600 hover:text-red-700 transition-colors"
            >
              Quitar
            </button>
          )}
        </div>
        <input
          ref={logoInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadImage(f, "logo"); }}
        />
      </div>

      {/* Save bar */}
      {(dirty || savedAt) && (
        <div className="flex items-center gap-3 pt-2 border-t border-[color:var(--color-grey-200)]">
          <button
            onClick={handleSave}
            disabled={!dirty || update.isPending}
            className="px-3 py-1.5 bg-[color:var(--color-ink)] text-[color:var(--color-paper)] font-mono text-[10px] uppercase tracking-[0.18em] hover:opacity-80 disabled:opacity-40 transition-opacity"
          >
            {update.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
          {!dirty && savedAt && (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-green-700">
              ✓ Guardado
            </span>
          )}
        </div>
      )}
    </div>
  );
}
