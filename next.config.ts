import type { NextConfig } from 'next';

/* Keep the old static-site URLs working. */
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: false },
      { source: '/talents.html', destination: '/talents', permanent: false },
      { source: '/talent.html', has: [{ type: 'query', key: 'id', value: '(?<id>.+)' }], destination: '/talent/:id', permanent: false },
      { source: '/talent.html', destination: '/talent', permanent: false },
      { source: '/clubs.html', destination: '/clubs', permanent: false },
      { source: '/about.html', destination: '/about', permanent: false },
      { source: '/support.html', destination: '/support', permanent: false }
    ];
  }
};

export default nextConfig;
