/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 自动从 tsconfig.json 读取路径别名，无需手动配置 webpack alias
  transpilePackages: ['antd', '@ant-design/plots', '@ant-design/icons'],
  
  // 配置webpack以排除服务器端模块
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 在客户端构建时，排除这些模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        'node:fs': false,
        'node:path': false,
        'node:crypto': false,
      };
    }

    if (isServer) {
      // node-pty 是原生模块，只在服务端使用，不打包进客户端
      config.externals = [...(config.externals || []), 'node-pty'];
    }

    return config;
  },
  
  // 配置空的 turbopack 对象以消除 Next.js 16 的警告
  turbopack: {},
};

export default nextConfig;
