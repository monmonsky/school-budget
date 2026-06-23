/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // bun:sqlite adalah modul bawaan Bun — jangan di-bundle, biarkan require saat runtime
    config.externals = config.externals || [];
    config.externals.push({ "bun:sqlite": "commonjs bun:sqlite" });
    return config;
  },
};

export default nextConfig;
