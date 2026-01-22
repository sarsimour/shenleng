import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from "next";
import path from 'path';
import fs from 'fs';

const nextConfig: NextConfig = {
  // Docker 部署必须：生成独立的最小化运行包
  output: "standalone", 
  
  // 必须：排除构建时不需要打包的二进制依赖
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
  async redirects() {
    try {
      const mapPath = path.resolve(process.cwd(), 'redirects/url_map.json');
      if (fs.existsSync(mapPath)) {
        const urlMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
        
        return Object.entries(urlMap).map(([oldPath, newPath]) => {
          // 处理带查询参数的 URL，例如 /show.asp?id=123
          if (oldPath.includes('?')) {
            const [pathname, query] = oldPath.split('?');
            const params = new URLSearchParams(query);
            const has = [];
            
            params.forEach((value, key) => {
              has.push({
                type: 'query',
                key,
                value,
              });
            });

            return {
              source: pathname,
              has: has,
              destination: newPath as string,
              permanent: true,
            };
          }

          // 处理普通 URL
          return {
            source: oldPath,
            destination: newPath as string,
            permanent: true,
          };
        });
      }
    } catch (e) {
      console.error('Failed to load redirects in next.config.ts:', e);
    }
    return [];
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://versecore-api:9000/:path*',
      },
    ]
  },
};

export default withPayload(nextConfig);
