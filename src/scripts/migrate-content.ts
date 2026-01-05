import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  console.log('Starting migration...')

  // 1. 确定数据源路径
  // 默认：../../data/nextjs_content
  // Docker: /app/migration_source
  const DATA_DIR = process.env.MIGRATION_SOURCE_DIR || path.resolve(__dirname, '../../data/nextjs_content')
  
  // 容器内挂载的结构是 /app/migration_source/content/articles
  // 本地结构是 data/nextjs_content/content/articles
  const ARTICLES_DIR = path.join(DATA_DIR, 'content/articles')
  const IMAGES_DIR = path.join(DATA_DIR, 'public/images')

  // 2. 确定输出目录
  // 本地：../../redirects
  // Docker: /tmp (避免权限问题)
  const REDIRECTS_DIR = process.env.REDIRECTS_OUTPUT_DIR || '/tmp'

  console.log(`Reading data from: ${DATA_DIR}`)
  console.log(`Outputting redirects to: ${REDIRECTS_DIR}`)

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`)
    process.exit(1)
  }

  // 初始化 Payload
  const payload = await getPayload({ config })

  // 3. 确保重定向目录存在
  if (!fs.existsSync(REDIRECTS_DIR)) {
    fs.mkdirSync(REDIRECTS_DIR, { recursive: true })
  }

  // 4. 创建默认管理员
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
      console.log('Admin user created.')
    }
  } catch (e) {
    console.warn('Skipping admin creation (error or already exists).')
  }

  // 5. 遍历文章
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
      const content = fs.readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)

      console.log(`Processing: ${data.title}...`)

      // 处理封面图
      let coverImageId: string | null = null
      // 恢复字段名: featured_image
      if (data.featured_image) { 
        const imageName = path.basename(data.featured_image)
        const imagePath = path.join(IMAGES_DIR, imageName)

        if (fs.existsSync(imagePath)) {
          // ... (图片上传逻辑不变)
          // 检查图片是否已存在
          const existingMedia = await payload.find({
            collection: 'media',
            where: {
              filename: {
                equals: imageName
              }
            }
          })

          if (existingMedia.totalDocs > 0) {
            coverImageId = existingMedia.docs[0].id as string
          } else {
            const media = await payload.create({
              collection: 'media',
              data: {
                alt: data.title,
              },
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

      // ...

      if (existingArticle.totalDocs === 0) {
        await payload.create({
          collection: 'articles',
          data: {
            title: data.title,
            slug: slug,
            summary: data.description, // 恢复字段名
            legacyHtml: data.content_html, // 恢复字段名
            isLegacy: true,
            originalUrl: data.original_url,
            baseViews: parseInt(data.views || '0', 10),
            coverImage: coverImageId,
            // ...
            content: {
              root: {
                type: 'root',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'paragraph',
                    version: 1,
                    children: [
                      {
                        text: 'This is a migrated legacy article.',
                        type: 'text',
                        version: 1
                      }
                    ]
                  }
                ]
              }
            }
          },
        })
      }

      // 记录重定向
      if (data.original_url) {
        const newUrl = `/articles/${slug}`
        urlMap[data.original_url] = newUrl
        // 简单的 Nginx rewrite
        nginxRules.push(`rewrite ^${data.original_url.replace(/\?/g, '\\?')}$ ${newUrl} permanent;`)
      }

    } catch (err) {
      console.error(`Failed to migrate ${file}:`, err)
    }
  }

  // 6. 写入结果
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'url_map.json'), JSON.stringify(urlMap, null, 2))
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'nginx_rewrite_rules.conf'), nginxRules.join('\n'))

  console.log('Migration completed successfully.')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration script failed:', err)
  process.exit(1)
})