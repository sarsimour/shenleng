import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from "next";
import path from 'path';
import fs from 'fs';

const nextConfig: NextConfig = {
  // Docker 部署必须：生成独立的最小化运行包
  output: "standalone", 
  
  // Payload SQLite adapter 依赖 libsql 原生包，standalone trace 需要显式保留这些服务端包。
  serverExternalPackages: ['payload', 'sharp', 'libsql', '@libsql/client'],
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/libsql/**/*',
      './node_modules/@libsql/client/**/*',
      './node_modules/.pnpm/libsql@*/node_modules/libsql/**/*',
      './node_modules/.pnpm/libsql@*/node_modules/@libsql/**/*',
      './node_modules/.pnpm/libsql@*/node_modules/@neon-rs/**/*',
      './node_modules/.pnpm/@libsql+*/node_modules/@libsql/**/*',
    ],
  },
  
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
            const has: Array<{ type: 'query'; key: string; value: string }> = [];
            
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
};

export default withPayload(nextConfig);
