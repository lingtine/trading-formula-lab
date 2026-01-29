const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@trading-formula-lab/core",
    "@trading-formula-lab/data-bybit",
    "@trading-formula-lab/engine-smc",
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Allow Node.js modules in server-side code
      config.externals = config.externals || [];

      // Add alias to resolve schema file correctly
      config.resolve.alias = {
        ...config.resolve.alias,
        "@schema": path.resolve(
          __dirname,
          "../../packages/core/schemas/smc-output.schema.json",
        ),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
