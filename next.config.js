const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/admin/:path*',
          destination: 'https://0xv2fbt8-8000.use.devtunnels.ms/admin/:path*',
        },
        {
          source: '/static/:path*',
          destination: 'https://0xv2fbt8-8000.use.devtunnels.ms/static/:path*',
        },
      ];
    },
  };
  
  module.exports = nextConfig;
  