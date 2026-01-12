import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function migrate() {
  console.log('🚀 Starting Robust Migration...')

  const SOURCE_DIR = process.env.MIGRATION_SOURCE_DIR || path.resolve(__dirname, '../../data/nextjs_content')
  const ARTICLES_DIR = path.join(SOURCE_DIR, 'content/json')
  const IMAGES_DIR = path.join(SOURCE_DIR, 'public/images')
  const REDIRECTS_DIR = process.env.REDIRECTS_OUTPUT_DIR || '/tmp'

  if (!fs.existsSync(ARTICLES_DIR)) {
    console.error(`❌ Error: Articles directory not found at ${ARTICLES_DIR}`)
    process.exit(1)
  }

  // 初始化 Payload
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

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf-8'))
      
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

      const slug = data.slug || 'article-' + Math.random().toString(36).substring(7)
      
      // 检查是否存在
      const existing = await payload.find({
        collection: 'articles',
        where: { slug: { equals: slug } }
      })

      if (existing.totalDocs === 0) {
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
            content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ text: 'Legacy article.', type: 'text' }] }] } }
          }
        })
        console.log(`✅ Success: ${data.title}`)
      } else {
        console.log(`⏩ Skipped: ${data.title}`)
      }
    } catch (err) {
      console.error(`❌ Failed ${file}:`, err)
    }
  }

  console.log('🎊 Migration finished.')
  process.exit(0)
}

migrate().catch(err => {
  console.error('💀 Fatal error:', err)
  process.exit(1)
})
