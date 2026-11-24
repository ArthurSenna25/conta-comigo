import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// CSP fica para a fase de seguranca. frame-ancestors via CSP vem junto; por ora X-Frame-Options.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Server action de confirmação recebe a imagem (até 5 MiB + campos). O padrão do Next é 1 MB.
  // Na Vercel o corpo da requisição tem teto de 4,5 MB: o cliente reencoda a foto (AMEACAS #2) para caber.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
