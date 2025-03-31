/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://bank-api:3000/:path*',
      },
    ];
  }
}

module.exports = nextConfig 