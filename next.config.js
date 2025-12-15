/** @type {import('next').NextConfig} */
const nextConfig = {
    // App router is now stable in Next.js 14, no experimental flag needed
    experimental: {
        // Improve build performance
        outputFileTracingIncludes: {
            '/': ['./public/**/*'],
        },
    },
    // Add webpack configuration for better builds
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }
        return config;
    },
}

module.exports = nextConfig