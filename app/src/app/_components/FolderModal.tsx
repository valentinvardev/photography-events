"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { api } from "~/trpc/react";
import { useCart } from "~/app/_components/CartContext";
import { Sheet } from "~/app/_components/design/Sheet";
import { Field } from "~/app/_components/design/Field";
import { Lightbox } from "~/app/_components/design/Lightbox";

type Step = "cart" | "buy" | "email";

function PhotoRow({
  photoId,
  bibNumber,
  index,
  total,
  price,
  onRemove,
  onPreview,
}: {
  photoId: string;
  bibNumber: string | null;
  index: number;
  total: number;
  price: number;
  onRemove: () => void;
  onPreview: (url: string) => void;
}) {
  const { data } = api.photo.getPreviewUrls.useQuery({ ids: [photoId] });
  const url = data?.[0]?.url;

  return (
    <li className="flex items-center gap-4 py-4 border-b border-[color:var(--color-grey-300)] last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] w-12 shrink-0">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
      <button
        onClick={() => url && onPreview(url)}
        className="w-16 h-16 overflow-hidden bg-[color:var(--color-grey-300)] shrink-0 group/thumb"
        disabled={!url}
        aria-label="Previsualizar"
      >
        {url ? (
          <img
            src={url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-105"
          />
        ) : (
          <span className="block w-full h-full animate-pulse bg-[color:var(--color-grey-300)]" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
          Número
        </p>
        <p className="font-display italic text-[20px] leading-tight text-[color:var(--color-ink)] truncate">
          {bibNumber ? `#${bibNumber}` : "—"}
        </p>
      </div>
      {total > 0 && (
        <span className="font-mono text-[11px] tracking-[0.06em] text-[color:var(--color-ink)] shrink-0">
          ${price.toLocaleString("es-AR")}
        </span>
      )}
      <button
        onClick={onRemove}
        className="ml-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-safelight)] transition-colors shrink-0"
      >
        [×]
      </button>
    </li>
  );
}

export function BibCheckoutModal({
  bib,
  photoIds: initialPhotoIds,
  collectionId,
  onClose,
}: {
  bib: string;
  photoIds: string[];
  collectionId: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("cart");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [photoIds, setPhotoIds] = useState(initialPhotoIds);

  const { items: cartItems, toggle: toggleCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (photoIds.length === 0) onClose();
  }, [photoIds, onClose]);

  const { data: collectionInfo } = api.collection.getPrice.useQuery({ collectionId });

  // Use per-photo prices already stored in cart items (photo.price ?? collection.pricePerBib)
  const priceById = new Map(cartItems.map((i) => [i.photoId, i.price]));
  const getPhotoPrice = (id: string) => priceById.get(id) ?? (collectionInfo?.price ?? 0);
  const total = photoIds.reduce((sum, id) => sum + getPhotoPrice(id), 0);

  const createPreference = api.purchase.createPreference.useMutation({
    onSuccess: (data) => {
      if (data.initPoint) window.location.href = data.initPoint;
    },
  });

  const accessByEmail = api.purchase.accessByEmail.useMutation({
    onSuccess: (token) => {
      if (token) {
        router.push(`/descarga/${token}`);
      } else {
        setEmailError("No encontramos una compra aprobada para este email.");
      }
    },
  });

  const handleRemove = (photoId: string) => {
    setPhotoIds((prev) => prev.filter((id) => id !== photoId));
    const item = cartItems.find((i) => i.photoId === photoId);
    if (item) toggleCart(item);
  };

  const handleBuy = () => {
    if (!email || !name) return;
    createPreference.mutate({
      collectionId,
      photoIds,
      buyerEmail: email,
      buyerName: name,
      buyerLastName: lastName || undefined,
      buyerPhone: phone || undefined,
    });
  };

  const handleEmailAccess = () => {
    if (!emailInput) return;
    setEmailError("");
    accessByEmail.mutate({ email: emailInput, collectionId, bibNumber: bib });
  };

  const stepIndex = step === "cart" ? "01" : step === "buy" ? "02" : "01b";
  const stepTitle =
    step === "buy" ? "Tus datos." : step === "email" ? "Acceder." : "Tu selección.";

  return (
    <>
      <Sheet open onClose={onClose} position="right" width="520px">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-7 pt-9 pb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                {step === "email" ? "Ya compré" : `${photoIds.length} foto${photoIds.length !== 1 ? "s" : ""} seleccionada${photoIds.length !== 1 ? "s" : ""}`}
              </p>
              <h2
                className="mt-3 font-display italic font-light leading-[0.95] tracking-[-0.02em] text-[color:var(--color-ink)]"
                style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
              >
                {stepTitle}
              </h2>
              {collectionInfo && (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] truncate">
                  {collectionInfo.title}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors shrink-0"
            >
              Cerrar [esc]
            </button>
          </div>

          <div className="h-px bg-[color:var(--color-grey-300)] mx-7" />

          {/* Steps switcher */}
          <div className="flex-1 overflow-y-auto px-7 py-5 min-h-0">
            <AnimatePresence mode="wait">
              {step === "cart" && (
                <motion.div
                  key="cart"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <ul>
                    {photoIds.map((id, i) => {
                      const cartItem = cartItems.find((c) => c.photoId === id);
                      return (
                        <PhotoRow
                          key={id}
                          photoId={id}
                          bibNumber={cartItem?.bibNumber ?? bib ?? null}
                          index={i}
                          total={photoIds.length}
                          price={getPhotoPrice(id)}
                          onRemove={() => handleRemove(id)}
                          onPreview={(url) => setLightboxUrl(url)}
                        />
                      );
                    })}
                  </ul>
                </motion.div>
              )}

              {step === "buy" && (
                <motion.form
                  key="buy"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleBuy();
                  }}
                  className="flex flex-col gap-7"
                >
                  <div className="flex items-baseline justify-between border-b border-[color:var(--color-grey-300)] pb-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                      {photoIds.length} {photoIds.length === 1 ? "foto" : "fotos"}
                    </p>
                    <p className="font-display italic text-[28px] leading-none text-[color:var(--color-ink)]">
                      ${total.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <Field
                      label="Nombre *"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ana"
                      required
                      autoFocus
                    />
                    <Field
                      label="Apellido"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Pérez"
                    />
                  </div>
                  <Field
                    label="Teléfono"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 351 555 5555"
                  />
                  <Field
                    label="Email *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vos@correo.com"
                    required
                    hint="Te llega el comprobante y el link de descarga."
                  />
                  {createPreference.isError && (
                    <div className="border-l-2 border-[color:var(--color-safelight)] pl-4 py-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)]">
                        Error · pago
                      </p>
                      <p className="mt-1 font-sans text-[14px] text-[color:var(--color-ink)]">
                        Ocurrió un error. Intentá de nuevo.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!email || !name || createPreference.isPending}
                      className="group inline-flex items-center justify-between border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] px-5 py-4 hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40 disabled:cursor-wait"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                        {createPreference.isPending
                          ? "Redirigiendo a MercadoPago…"
                          : `Pagar $${total.toLocaleString("es-AR")}`}
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors self-start"
                    >
                      ← Volver
                    </button>
                  </div>
                </motion.form>
              )}

              {step === "email" && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-7"
                >
                  <p className="font-sans text-[15px] leading-[1.6] text-[color:var(--color-grey-700)]">
                    Ingresá el email con el que compraste{" "}
                    {bib ? `el dorsal #${bib}` : "estas fotos"}. Te llevamos directo a la descarga.
                  </p>
                  <Field
                    label="Email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError("");
                    }}
                    placeholder="vos@correo.com"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEmailAccess();
                    }}
                    autoFocus
                  />
                  {emailError && (
                    <div className="border-l-2 border-[color:var(--color-safelight)] pl-4 py-1">
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-safelight)]">
                        Sin resultados
                      </p>
                      <p className="mt-1 font-sans text-[14px] text-[color:var(--color-ink)]">
                        {emailError}
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={handleEmailAccess}
                      disabled={!emailInput || accessByEmail.isPending}
                      className="group inline-flex items-center justify-between border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] px-5 py-4 hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors disabled:opacity-40"
                    >
                      <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                        {accessByEmail.isPending ? "Buscando…" : "Acceder a mis fotos"}
                      </span>
                      <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </button>
                    <button
                      onClick={() => setStep("cart")}
                      className="link-draw font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)] hover:text-[color:var(--color-ink)] transition-colors self-start"
                    >
                      ← Volver
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer — only on cart step */}
          {step === "cart" && (
            <div className="border-t border-[color:var(--color-grey-300)] px-7 py-6 flex flex-col gap-4 shrink-0">
              {total > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-grey-500)]">
                    Total · sin marca de agua
                  </span>
                  <span className="font-display italic text-[28px] leading-none text-[color:var(--color-ink)]">
                    ${total.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-3">
                {total > 0 && (
                  <button
                    onClick={() => setStep("buy")}
                    className="group inline-flex items-center justify-between border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-paper)] px-5 py-4 hover:bg-transparent hover:text-[color:var(--color-ink)] transition-colors"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
                      Comprar · ${total.toLocaleString("es-AR")}
                    </span>
                    <span className="font-mono text-[11px] tracking-[0.22em] transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                )}
                <button
                  onClick={() => setStep("email")}
                  className="group inline-flex items-center justify-between border border-[color:var(--color-grey-300)] hover:border-[color:var(--color-ink)] px-5 py-3.5 transition-colors"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-grey-700)] group-hover:text-[color:var(--color-ink)]">
                    Ya compré · acceder con email
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.22em] text-[color:var(--color-grey-500)] group-hover:text-[color:var(--color-ink)] transition-colors">
                    →
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </Sheet>

      <Lightbox open={lightboxUrl !== null} url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </>
  );
}
