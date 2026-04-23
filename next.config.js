/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling Prisma's native binaries — they must remain external
  serverExternalPackages: ["@prisma/client", "prisma"],
};
module.exports = nextConfig;
