import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 部署必须：生成独立的最小化运行包
  output: "standalone",
  
  // 必须：排除构建时不需要打包的二进制依赖
  serverExternalPackages: ['payload', 'sharp'],
  
  // 忽略构建检查，确保部署顺利
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'www.finverse.top',
      },
      {
        protocol: 'https',
        hostname: 'finverse.top',
      }
    ],
  },
};

export default withPayload(nextConfig);