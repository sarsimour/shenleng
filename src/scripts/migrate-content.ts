import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  console.log('🚀 Starting Robust Migration...')

  const DATA_DIR = process.env.MIGRATION_SOURCE_DIR || path.resolve(__dirname, '../../data/nextjs_content')
  const ARTICLES_DIR = path.join(DATA_DIR, 'content/articles')
  const IMAGES_DIR = path.join(DATA_DIR, 'public/images')
  const REDIRECTS_DIR = process.env.REDIRECTS_OUTPUT_DIR || '/tmp'

  console.log(`Reading data from: ${DATA_DIR}`)

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(`❌ Error: Articles directory not found at ${ARTICLES_DIR}`)
    process.exit(1)
  }

  // 初始化 Payload (这会触发 payload.config.ts 里的 push:true)
  const payload = await getPayload({ config })
  console.log('✅ Payload initialized.')

  // 1. 创建管理员
  try {
    const adminEmail = 'admin@shenleng.com'
    const users = await payload.find({ collection: 'users', where: { email: { equals: adminEmail } } })
    if (users.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: { email: adminEmail, password: 'shenleng2026' }
      })
      console.log('👤 Admin user created.')
    }
  } catch (e) {
    console.warn('⚠️ Admin check skipped.')
  }

  // 2. 处理文章
  const files = fs.readdirSync(ARTICLES_DIR).filter(f => f.endsWith('.json'))
  console.log(`📝 Found ${files.length} articles to process.`) 

  const urlMap: Record<string, string> = {}
  const nginxRules: string[] = []

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8'))
      
      // 处理封面图
      let mediaId = null
      if (data.featured_image) {
        const imgName = path.basename(data.featured_image)
        const imgPath = path.join(IMAGES_DIR, imgName)
        if (fs.existsSync(imgPath)) {
          const existingMedia = await payload.find({ collection: 'media', where: { filename: { equals: imgName } } })
          if (existingMedia.totalDocs > 0) {
            mediaId = existingMedia.docs[0].id
          } else {
            const media = await payload.create({
              collection: 'media',
              data: { alt: data.title },
              file: { 
                data: fs.readFileSync(imgPath),
                name: imgName, 
                mimetype: 'image/jpeg', 
                size: fs.statSync(imgPath).size 
              }
            })
            mediaId = media.id
          }
        }
      }

      // 创建文章
      const slug = data.slug || 'article-' + Date.now()
      try {
        await payload.create({
          collection: 'articles',
          data: {
            title: data.title,
            slug: slug,
            summary: data.description || '',
            legacyHtml: data.content_html || '',
            isLegacy: true,
            originalUrl: data.original_url || '',
            baseViews: parseInt(data.views || '0', 10),
            coverImage: mediaId,
            publishedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
            _status: 'published',
            content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ text: 'Legacy content.', type: 'text' }] }] } }
          }
        })
        console.log(`✅ Success: ${data.title}`)
      } catch (err: any) {
        if (err.message && err.message.includes('unique')) {
          console.log(`⏩ Skipped (already exists): ${data.title}`)
        } else {
          throw err
        }
      }

      if (data.original_url) {
        urlMap[data.original_url] = `/articles/${slug}`
        nginxRules.push(`rewrite ^${data.original_url.replace(/\?/g, '\\?')}$ /articles/${slug} permanent;`)
      }
    } catch (err) {
      console.error(`❌ Failed ${file}:`, err)
    }
  }

  // 写入重定向
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'url_map.json'), JSON.stringify(urlMap, null, 2))
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'nginx_rewrite_rules.conf'), nginxRules.join('\n'))

  console.log('🎊 Migration finished.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('💀 Fatal error:', err)
  process.exit(1)
})