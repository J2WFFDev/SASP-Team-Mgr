/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling server-only native modules
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
};
module.exports = nextConfig;
