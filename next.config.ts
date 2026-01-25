import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {
  // Enable React Compiler for automatic memoization
  reactCompiler: true,
  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
  // Configure image domains if needed
  images: {
    remotePatterns: [],
  },
  // Transpile Three.js packages
  transpilePackages: ["three"],
};

export default withNextIntl(nextConfig);
