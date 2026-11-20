import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["outliers.idealtouchtrading.com"],
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
	// Remote pattern rules for Supabase storage image loading
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co", // Allow all Supabase storage subdomains
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
