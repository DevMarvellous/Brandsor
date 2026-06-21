/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable the client-side Router Cache's reuse window so in-app
    // navigation (e.g. editor -> "Dashboard" link) always re-renders the
    // dashboard fresh instead of reusing a stale cached instance whose data
    // was fetched before a brand was just created/saved.
    staleTimes: { dynamic: 0, static: 0 },
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
