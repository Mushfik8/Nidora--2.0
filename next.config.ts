import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — new image host
      new URL('https://res.cloudinary.com/**'),
      // Firebase Storage — backwards compatibility for old listings
      new URL('https://firebasestorage.googleapis.com/**'),
    ],
  },
};

export default nextConfig;
