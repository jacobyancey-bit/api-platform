/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        "@dangling-dice/engine-finance",
        "@dangling-dice/engine-schema",
        "@dangling-dice/engine-geo",
        "@dangling-dice/engine-privacy",
    ],
};

export default nextConfig;
