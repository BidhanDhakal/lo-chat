/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/conversations",
                permanent: true
            }
        ]
    }
};

module.exports = nextConfig; 