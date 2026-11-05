import type { NextConfig } from "next";
import { environmentProblems } from "./lib/env/guard";

const problems = environmentProblems(process.env);
if (problems.length > 0) {
  console.error(`Refusing to start:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ht-ins.co.il",
        pathname: "/wp-content/**",
      },
    ],
  },
};

export default nextConfig;
