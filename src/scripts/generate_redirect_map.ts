import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generate() {
  console.log('🚀 Generating Redirect Map...')

  const payload = await getPayload({ config })
  
  const articles = await payload.find({
    collection: 'articles',
    limit: 1000,
  })

  const map: Record<string, string> = {}

  articles.docs.forEach((article: any) => {
    if (article.originalUrl) {
      try {
        // 提取旧路径
        let urlPath = article.originalUrl;
        if (urlPath.startsWith('http')) {
          const url = new URL(urlPath);
          urlPath = url.pathname;
        }
        
        // 统一处理：确保以 / 开头，且不带末尾斜杠（除非是根路径）
        if (!urlPath.startsWith('/')) urlPath = '/' + urlPath;
        if (urlPath.length > 1 && urlPath.endsWith('/')) urlPath = urlPath.slice(0, -1);

        // 映射：旧路径 -> 新路径
        map[urlPath] = `/articles/${article.slug}`;
      } catch (e) {
        console.warn(`⚠️ Could not parse URL: ${article.originalUrl}`);
      }
    }
  })

  // 也可以手动添加一些已知的旧站核心页面映射
  // 例如：旧首页 /index.html -> /
  map['/index.html'] = '/';
  map['/about.html'] = '/about';
  map['/services.html'] = '/services/container';

  const outputPath = path.resolve(__dirname, '../../redirects/url_map.json');
  fs.writeFileSync(outputPath, JSON.stringify(map, null, 2));

  console.log(`✅ Redirect map generated with ${Object.keys(map).length} entries at ${outputPath}`);
  process.exit(0);
}

generate().catch(err => {
  console.error('💀 Fatal error:', err);
  process.exit(1);
})
