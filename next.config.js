/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        outputFileTracingIncludes: {
            '/': ['./public/**/*'],
        },
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                net: false,
                tls: false,
            };
        }

        // Fix module resolution issues
        config.resolve.extensionAlias = {
            '.js': ['.js', '.ts', '.tsx'],
        };

        return config;
    },
}

module.exports = nextConfig