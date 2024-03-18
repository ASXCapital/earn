const nextConfig = {
  
  reactStrictMode: true,
  i18n: {
    locales: ['default',],
    defaultLocale: 'default',
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },

};

module.exports = nextConfig;
