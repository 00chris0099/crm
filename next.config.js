/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ['better-sqlite3', 'pg', 'pg-native'],
};

module.exports = nextConfig;
