/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ['hrm.amrzaki.online', 'apihrm.amrzaki.online'],

  // Prevent proxy/CDN caching of auth pages.
  // "private" tells shared caches (Nginx proxy_cache, CDNs) they MUST NOT store the response.
  // "no-store" additionally prevents browser caching.
  async headers() {
    return [
      {
        source: "/login",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
