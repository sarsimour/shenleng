import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  console.log('Starting migration with schema synchronization...')

  const DATA_DIR = process.env.MIGRATION_SOURCE_DIR || path.resolve(__dirname, '../../data/nextjs_content')
  const ARTICLES_DIR = path.join(DATA_DIR, 'content/articles')
  const IMAGES_DIR = path.join(DATA_DIR, 'public/images')
  const REDIRECTS_DIR = process.env.REDIRECTS_OUTPUT_DIR || '/tmp'

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`)
    process.exit(1)
  }

  // 初始化 Payload
  const payload = await getPayload({ config })

  // 关键修复：强制同步数据库表结构
  // 在生产模式下，Payload 不会自动创建表。我们利用 db-sqlite 的内部机制推送 Schema。
  console.log('Synchronizing database schema...')
  if (payload.db.push) {
    await payload.db.push()
    console.log('Schema synchronization completed.')
  }

  // 确保重定向目录存在
  if (!fs.existsSync(REDIRECTS_DIR)) {
    fs.mkdirSync(REDIRECTS_DIR, { recursive: true })
  }

  // 创建默认管理员
  try {
    const existingUsers = await payload.find({ collection: 'users', limit: 1 })
    if (existingUsers.totalDocs === 0) {
      console.log('Creating default admin user...')
      await payload.create({
        collection: 'users',
        data: {
          email: 'admin@shenleng.com',
          password: 'shenleng2026',
        },
      })
    }
  } catch (e) {
    console.warn('Skipping admin creation.')
  }

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(`Articles directory not found: ${ARTICLES_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter((file) => file.endsWith('.json'))
  console.log(`Found ${files.length} article files to migrate...`)

  const urlMap: Record<string, string> = {}
  const nginxRules: string[] = []

  for (const file of files) {
    try {
      const filePath = path.join(ARTICLES_DIR, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      console.log(`Processing: ${data.title}...`)

      // 处理封面图
      let coverImageId: string | null = null
      if (data.featured_image) { 
        const imageName = path.basename(data.featured_image)
        const imagePath = path.join(IMAGES_DIR, imageName)

        if (fs.existsSync(imagePath)) {
          const existingMedia = await payload.find({
            collection: 'media',
            where: { filename: { equals: imageName } }
          })

          if (existingMedia.totalDocs > 0) {
            coverImageId = existingMedia.docs[0].id as string
          } else {
            const media = await payload.create({
              collection: 'media',
              data: { alt: data.title },
              file: {
                data: fs.readFileSync(imagePath),
                name: imageName,
                mimetype: 'image/jpeg',
                size: fs.statSync(imagePath).size,
              },
            })
            coverImageId = media.id as string
          }
        }
      }

      // 创建文章
      const slug = data.slug || '' 
      // 修复：确保变量在作用域内定义
      const existingArticles = await payload.find({
        collection: 'articles',
        where: { slug: { equals: slug } }
      })

      if (existingArticles.totalDocs === 0) {
        await payload.create({
          collection: 'articles',
          data: {
            title: data.title,
            slug: slug,
            summary: data.description,
            legacyHtml: data.content_html,
            isLegacy: true,
            originalUrl: data.original_url,
            baseViews: parseInt(data.views || '0', 10),
            coverImage: coverImageId,
            publishedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            _status: 'published',
            content: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [{ text: 'Migrated legacy content.', type: 'text' }]
                  }
                ]
              }
            }
          },
        })
      }

      if (data.original_url) {
        urlMap[data.original_url] = `/articles/${slug}`
        nginxRules.push(`rewrite ^${data.original_url.replace(/\?/g, '\\?')}$ /articles/${slug} permanent;`)
      }

    } catch (err) {
      console.error(`Failed to migrate ${file}:`, err)
    }
  }

  fs.writeFileSync(path.join(REDIRECTS_DIR, 'url_map.json'), JSON.stringify(urlMap, null, 2))
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'nginx_rewrite_rules.conf'), nginxRules.join('\n'))

  console.log('Migration completed successfully.')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Fatal: Migration script failed:', err)
  process.exit(1)
})
