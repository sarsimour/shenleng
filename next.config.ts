import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  // Docker 部署必须
  output: "standalone",
  
  // 排除核心包打包
  serverExternalPackages: ['payload', 'sharp'],
  
  env: {
    // 强制指定 Payload 配置文件路径，解决 "config required" 错误
    PAYLOAD_CONFIG_PATH: path.resolve(process.cwd(), 'src/payload.config.ts'),
  },
  
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
