const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/gh/faker-js/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '54.91.53.15',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '54.91.53.15',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);
