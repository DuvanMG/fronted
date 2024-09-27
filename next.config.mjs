/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/admin/:path*',
          destination: `https://0xv2fbt8-8000.use.devtunnels.ms/admin/:path*`, // Proxy a Django admin
        },
        {
          source: '/static/:path*',
          destination: `https://0xv2fbt8-8000.use.devtunnels.ms/static/:path*`, // Proxy a los archivos estáticos de Django
        },
      ];
    },
  };
  
  export default nextConfig;
  