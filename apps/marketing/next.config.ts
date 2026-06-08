import type { NextConfig } from 'next';

// Marketing site CSP — tighter than the dashboard's because we don't
// need server actions, RSC fetches to varied hosts, or third-party
// embeds (yet). Add analytics / form vendor hosts here as they land.
const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

if (process.env.NODE_ENV !== 'production') {
  CSP_DIRECTIVES['script-src'] = [...CSP_DIRECTIVES['script-src'], "'unsafe-eval'"];
  CSP_DIRECTIVES['connect-src'] = [...CSP_DIRECTIVES['connect-src'], 'ws:', 'wss:'];
}

const CSP_VALUE = Object.entries(CSP_DIRECTIVES)
  .map(([d, s]) => `${d} ${s.join(' ')}`)
  .join('; ');

const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  { key: 'Content-Security-Policy', value: CSP_VALUE },
];

const nextConfig: NextConfig = {
  // Tree-shake the icon barrel — lucide-react ships ~1k icons.
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
