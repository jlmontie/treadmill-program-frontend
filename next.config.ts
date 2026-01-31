import type { NextConfig } from 'next'
import bundleAnalyzer from '@next/bundle-analyzer'

// Bundle analyzer (run with ANALYZE=true npm run build)
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  // Note: typedRoutes requires route type generation and Link component updates
  // Can be enabled later: typedRoutes: true,

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        // Content Security Policy - Protects against XSS attacks
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval & inline
            "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
            "img-src 'self' data: https:", // Allow data URIs and HTTPS images
            "font-src 'self' data:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co", // Supabase API + realtime
            "frame-ancestors 'none'", // Equivalent to X-Frame-Options: DENY
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        // HSTS - Force HTTPS in production only
        ...(process.env.NODE_ENV === 'production'
          ? [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains; preload',
              },
            ]
          : []),
      ],
    },
  ],

  // Logging configuration for development
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
}

export default withBundleAnalyzer(nextConfig)
