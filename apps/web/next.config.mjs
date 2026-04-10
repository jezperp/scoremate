/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@scoremate/api', '@scoremate/types', '@scoremate/supabase'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'media-3.api-sports.io' },
      { protocol: 'https', hostname: 'media-4.api-sports.io' },
      { protocol: 'https', hostname: 'crests.football-data.org' },
    ],
  },
};

export default nextConfig;
