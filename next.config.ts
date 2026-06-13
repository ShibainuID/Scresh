import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  register: false,
  disable: process.env.NODE_ENV === "development",
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);
