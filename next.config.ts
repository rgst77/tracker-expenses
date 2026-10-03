import type { NextConfig } from "next";

// GitHub Pages serves this repo at /tracker-expenses/, not the domain root —
// only apply that prefix for the Pages build so `npm run dev` keeps working
// at a plain localhost root.
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  ...(isGithubPages ? { basePath: "/tracker-expenses", assetPrefix: "/tracker-expenses/" } : {}),
};

export default nextConfig;
