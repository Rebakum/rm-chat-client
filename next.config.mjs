/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/admin', destination: '/dashboard', permanent: false },
      { source: '/admin/users', destination: '/dashboard/users', permanent: false },
    ];
  },
};

export default nextConfig;