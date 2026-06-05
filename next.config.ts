import type { NextConfig } from 'next';

// Hosts we trust to serve user-controlled `image` URLs (avatars, company
// logos). next/image rewrites any URL outside this list at request time —
// keep it tight. Add new entries here, never widen.
const REMOTE_IMAGE_HOSTS = [
  'lh3.googleusercontent.com', // Google profile avatars
  'avatars.githubusercontent.com', // GitHub avatars
] as const;

const SECURITY_HEADERS = [
  // Force HTTPS for a year, including subdomains. Drop `preload` until you've
  // actually submitted to hstspreload.org.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Refuse to render the app in a frame to block clickjacking.
  { key: 'X-Frame-Options', value: 'DENY' },
  // Defense-in-depth for MIME sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Strip referrer when navigating cross-origin so candidate IDs / tokens
  // don't leak through Referer headers.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features the app doesn't use.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const nextConfig: NextConfig = {
  // Shrink the client bundle by treeshaking these packages' barrel exports.
  // `lucide-react` is in 40+ importers; `date-fns` in 8. Without this, Next
  // ships the full module from each.
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-icons',
    ],
  },
  images: {
    remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
