import "~/styles/globals.css";

import { type Metadata } from "next";
import { Barlow_Condensed, Instrument_Sans, Fragment_Mono } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Grain } from "~/app/_components/design/Grain";

export const metadata: Metadata = {
  title: "Ivana Maritano — Fotografía",
  description: "Fotografía deportiva. Encontrá tus imágenes por número de dorsal.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-barlow",
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument",
  display: "swap",
});

const fragment = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fragment",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${barlow.variable} ${instrument.variable} ${fragment.variable}`}
    >
      <body className="bg-[color:var(--color-paper)] text-[color:var(--color-ink)] antialiased overflow-x-hidden">
        <TRPCReactProvider>
          {children}
        </TRPCReactProvider>
        <Grain />
      </body>
    </html>
  );
}
