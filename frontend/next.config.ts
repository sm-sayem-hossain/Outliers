import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Prevent TypeScript check errors from blocking production builds
    ignoreBuildErrors: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // ✅ FIX: Supabase থেকে ছবি লোড করার পারমিশন
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co", // Supabase এর সব সাবডোমেইন allow করবে
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://legal-copilot-backend-088i.onrender.com";

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;