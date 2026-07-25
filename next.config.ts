import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @napi-rs/canvas loads a native .node binding, which the bundler can't inline.
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
