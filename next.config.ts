import type { NextConfig } from 'next';

// Hosts we trust to serve user-controlled `image` URLs (avatars, company
// logos). next/image rewrites any URL outside this list at request time —
// keep it tight. Add new entries here, never widen.
const REMOTE_IMAGE_HOSTS = [
  'lh3.googleusercontent.com', // Google profile avatars
  'avatars.githubusercontent.com', // GitHub avatars
] as const;

// Content-Security-Policy. Built as a directive list so each line is
// audited individually. Notes on why each entry exists:
//
//   script-src — Next's App Router injects inline bootstrap scripts on
//     every render, so 'unsafe-inline' is required for production. Dev
//     also needs 'unsafe-eval' for Turbopack/Webpack HMR; we conditional
//     it below. A future migration to nonce-based scripts (via middleware
//     injecting per-request nonces) would let us drop 'unsafe-inline'.
//   style-src — Tailwind v4 + shadcn variants emit inline style overrides
//     for theming; 'unsafe-inline' stays until those move to CSS vars only.
//   img-src — same host allowlist next/image already uses, plus data: and
//     blob: for inline avatars / generated previews.
//   connect-src — RSC + server actions hit same-origin; Upstash REST
//     (rate limiter) is the only outbound destination from the client.
//   frame-ancestors / X-Frame-Options — both refuse framing.
//   object-src 'none' / base-uri 'self' — kill plugin / <base> hijack
//     vectors that have no use in this app.
const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://lh3.googleusercontent.com',
    'https://avatars.githubusercontent.com',
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://*.upstash.io'],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

// Turbopack/Webpack HMR uses eval() in dev. Allow it only there.
if (process.env.NODE_ENV !== 'production') {
  CSP_DIRECTIVES['script-src'] = [...CSP_DIRECTIVES['script-src'], "'unsafe-eval'"];
  CSP_DIRECTIVES['connect-src'] = [...CSP_DIRECTIVES['connect-src'], 'ws:', 'wss:'];
}

const CSP_VALUE = Object.entries(CSP_DIRECTIVES)
  .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
  .join('; ');

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
  // Last line of defense against XSS exfil. See CSP_DIRECTIVES above.
  { key: 'Content-Security-Policy', value: CSP_VALUE },
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
