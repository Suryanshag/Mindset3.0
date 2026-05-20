import type { MetadataRoute } from 'next'

// File-based manifest replaces the previous public/manifest.webmanifest.
// Next 16 serves this at /manifest.webmanifest by default — no metadata
// change needed in layout.tsx.

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mindset',
    short_name: 'Mindset',
    description:
      'Mental health care — accessible, affordable, stigma-free. Talk to qualified therapists, journal, and access self-care resources.',
    start_url: '/user',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#F7F2EA',
    background_color: '#F7F2EA',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['health', 'lifestyle', 'medical'],
  }
}
