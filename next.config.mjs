/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma doit rester externe au bundle serveur
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
