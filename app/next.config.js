/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  devIndicators: false,
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
