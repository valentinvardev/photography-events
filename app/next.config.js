/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/**
 * Hosts que resolveMediaUrl() puede producir: CloudFront en produccion,
 * S3 presignado como fallback de dev, y Supabase para keys legacy.
 * El bucket va pineado exacto: un wildcard *.s3.* convierte /_next/image
 * en un proxy de resize para cualquier bucket S3 publico de cualquier cuenta.
 */
/** @type {NonNullable<NonNullable<import("next").NextConfig["images"]>["remotePatterns"]>} */
const remotePatterns = [
  {
    protocol: "https",
    hostname: `${process.env.AWS_S3_BUCKET ?? "mediaseller-photos"}.s3.${process.env.AWS_REGION ?? "us-east-2"}.amazonaws.com`,
  },
];
if (process.env.CLOUDFRONT_DOMAIN) {
  remotePatterns.push({ protocol: "https", hostname: process.env.CLOUDFRONT_DOMAIN });
}
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  remotePatterns.push({
    protocol: "https",
    hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
  });
}

/** @type {import("next").NextConfig} */
const config = {
  devIndicators: false,
  images: {
    remotePatterns,
    // Sin allowlist, q=1..100 son 100 variantes cacheables por ancho — una
    // palanca de DoS por CPU sobre el VPS. Las cards no piden quality, asi
    // que 75 (el default) es la unica que hace falta.
    qualities: [75],
    // Toda imagen subida estrena key (Date.now() en el path — banners, logos,
    // portadas y portadas de categoria), asi que una URL nunca se reusa con
    // otro contenido: cachear el derivado 31 dias es seguro. Sin esto, el TTL
    // default de 60 s re-optimizaria las ~40 portadas una y otra vez sobre la
    // CPU del VPS.
    minimumCacheTTL: 60 * 60 * 24 * 31,
  },
  serverExternalPackages: ["ffmpeg-static", "fluent-ffmpeg"],
  webpack(config, { isServer }) {
    if (isServer) {
      const prev = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...prev, "ffmpeg-static", "fluent-ffmpeg"];
    }
    return config;
  },
};

export default config;
