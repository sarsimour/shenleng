
import { getPayload } from 'payload'
import path from 'path'
import fs from 'fs'

async function main() {
  console.log('🚀 开始容器内数据迁移...');

  // 1. 数据库路径 (容器内固定路径)
  const DB_PATH = '/app/database/payload.db';
  process.env.DATABASE_URI = `file:${DB_PATH}`;
  
  if (!process.env.PAYLOAD_SECRET) {
      console.warn('⚠️  未检测到 PAYLOAD_SECRET (环境变量)');
  }

  // 2. 初始化 Payload
  const configPath = path.resolve(process.cwd(), 'src/payload.config.ts');
  process.env.PAYLOAD_CONFIG_PATH = configPath;
  
  console.log(`🔌 连接数据库: ${DB_PATH}`);
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });
  console.log('✅ Payload 初始化成功');

  // 3. 确定数据目录
  // 优先读取 docker-compose 传入的环境变量
  let DATA_DIR = process.env.MIGRATION_DATA_DIR;

  // 后备：如果在本地运行，尝试当前目录
  if (!DATA_DIR || !fs.existsSync(DATA_DIR)) {
      const localPath = path.join(process.cwd(), 'data/nextjs_content');
      if (fs.existsSync(localPath)) {
          DATA_DIR = localPath;
      }
  }

  if (!DATA_DIR) {
    console.error(`❌ 未找到有效的数据目录。环境变量 MIGRATION_DATA_DIR: ${process.env.MIGRATION_DATA_DIR}`);
    process.exit(1);
  }
  
  console.log(`📂 数据源目录: ${DATA_DIR}`);

  const JSON_DIR = path.join(DATA_DIR, 'content/json');
  const PUBLIC_DIR = path.join(DATA_DIR, 'public');

  if (!fs.existsSync(JSON_DIR)) {
      console.error(`❌ JSON 目录不存在: ${JSON_DIR}`);
      process.exit(1);
  }

  const files = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'));
  console.log(`📄 找到 ${files.length} 篇文章。`);

  // 默认 RichText 结构
  const DEFAULT_CONTENT = {
    root: {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: '（历史文章归档）', version: 1 }], direction: 'ltr', format: '', indent: 0, textFormat: 0, version: 1 }],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  };

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = path.join(JSON_DIR, file);
    const article = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // 查重
    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: article.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      skipped++;
      continue;
    }

    let coverImageId = null;

    // 上传图片
    if (article.featured_image) {
      const relativePath = article.featured_image.startsWith('/') ? article.featured_image.slice(1) : article.featured_image;
      const imagePath = path.join(PUBLIC_DIR, relativePath);

      if (fs.existsSync(imagePath)) {
        try {
          const buffer = fs.readFileSync(imagePath);
          const mediaDoc = await payload.create({
            collection: 'media',
            data: {
              alt: path.basename(imagePath),
            },
            file: {
              data: buffer,
              name: path.basename(imagePath),
              mimetype: 'image/jpeg',
              size: buffer.length,
            },
          });
          coverImageId = mediaDoc.id;
        } catch (e) {
          console.error(`  ❌ 图片上传失败 [${relativePath}]:`, e);
        }
      }
    }

    // 创建文章
    try {
      await payload.create({
        collection: 'articles',
        data: {
          title: article.title,
          slug: article.slug,
          summary: article.description,
          legacyHtml: article.content_html,
          originalUrl: article.original_url,
          isLegacy: true,
          baseViews: parseInt(article.views || '0', 10),
          publishedAt: new Date(article.date).toISOString(),
          content: DEFAULT_CONTENT,
          ...(coverImageId && { coverImage: coverImageId }),
        },
      });
      console.log(`  ✅ 成功: ${article.title}`);
      success++;
    } catch (e) {
      console.error(`  ❌ 文章创建失败 [${article.title}]:`, e);
      failed++;
    }
  }

  console.log(`🎉 迁移完成！成功: ${success}, 跳过: ${skipped}, 失败: ${failed}`);
  process.exit(0);
}

main().catch(console.error);
