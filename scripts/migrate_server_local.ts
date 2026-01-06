
import { getPayload } from 'payload'
import path from 'path'
import fs from 'fs'

// 动态导入配置
async function main() {
  console.log('🚀 开始服务器本地迁移...');

  // 1. 初始化 Payload
  process.env.PAYLOAD_CONFIG_PATH = path.resolve(process.cwd(), 'src/payload.config.ts');
  const { default: configPromise } = await import('../src/payload.config');
  const payload = await getPayload({ config: configPromise });

  console.log('✅ Payload 初始化成功');

  // 2. 确定数据目录
  // 假设我们将数据挂载到了 /app/migration_data
  const DATA_DIR = process.env.MIGRATION_DATA_DIR || '/app/migration_data';
  const JSON_DIR = path.join(DATA_DIR, 'content/json');
  const PUBLIC_DIR = path.join(DATA_DIR, 'public');

  if (!fs.existsSync(JSON_DIR)) {
    console.error(`❌ 数据目录不存在: ${JSON_DIR}`);
    console.log('请确保已将 data/nextjs_content 挂载到容器的 /app/migration_data');
    process.exit(1);
  }

  const files = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'));
  console.log(`📄 找到 ${files.length} 篇文章。`);

  // 默认 RichText
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

  for (const file of files) {
    const filePath = path.join(JSON_DIR, file);
    const article = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`Processing: ${article.title}`);

    // 检查是否存在
    const existing = await payload.find({
      collection: 'articles',
      where: { slug: { equals: article.slug } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      console.log('  ⏭️  已存在，跳过');
      continue;
    }

    let coverImageId = null;

    // 上传图片 (Local API)
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
              mimetype: 'image/jpeg', // 简单起见，或者用 path.extname 判断
              size: buffer.length,
            },
          });
          coverImageId = mediaDoc.id;
          console.log('  🖼️  封面图上传成功');
        } catch (e) {
          console.error('  ❌ 图片上传失败:', e);
        }
      } else {
          console.warn(`  ⚠️  图片文件未找到: ${imagePath}`);
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
      console.log('  ✅ 文章创建成功');
    } catch (e) {
      console.error('  ❌ 文章创建失败:', e);
    }
  }

  console.log('🎉 迁移完成');
  process.exit(0);
}

main().catch(console.error);
