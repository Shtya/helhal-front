const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
	devIndicators: false,
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
    ],
  },
};

module.exports = withNextIntl(nextConfig);
