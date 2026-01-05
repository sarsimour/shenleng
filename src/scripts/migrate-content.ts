import { getPayload } from 'payload'
import config from '../payload.config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, '../../data/nextjs_content/content/json')
const IMAGES_DIR = path.join(DATA_DIR, 'public/images')

// 将输出目录改为 /tmp，避免在 Docker 容器根目录创建文件夹时出现权限问题
// 之前的 '../../redirects' 位于 /app/redirects，非 root 用户无法写入
const REDIRECTS_DIR = process.env.REDIRECTS_OUTPUT_DIR || '/tmp'

const payload = await getPayload({ config })

  // 1. 确保重定向目录存在
  if (!fs.existsSync(REDIRECTS_DIR)) {
    fs.mkdirSync(REDIRECTS_DIR)
  }

  // 0. 创建默认管理员
  try {
    const existingUsers = await payload.find({ collection: 'users', limit: 1 })
    if (existingUsers.totalDocs === 0) {
      console.log('创建默认管理员账户...')
      await payload.create({
        collection: 'users',
        data: {
          email: 'admin@shenleng.com',
          password: 'shenleng2026',
        },
      })
    }
  } catch (e) {
    console.warn('跳过管理员创建（可能已存在）')
  }

  // 1. 遍历文章目录
  const files = fs.readdirSync(ARTICLES_DIR).filter((file) => file.endsWith('.json'))
  console.log(`找到 ${jsonFiles.length} 个文章文件待迁移...`)

  const urlMap: Record<string, string> = {}
  const nginxRules: string[] = []

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(DATA_DIR, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

      console.log(`正在处理: ${data.title}...`)

      // 处理封面图
      let coverImageId: string | null = null
      if (data.featured_image) {
        const imageName = path.basename(data.featured_image)
        const imagePath = path.join(IMAGES_DIR, imageName)

        if (fs.existsSync(imagePath)) {
          const media = await payload.create({
            collection: 'media',
            data: {
              alt: data.title,
            },
            file: {
              data: fs.readFileSync(imagePath),
              name: imageName,
              mimetype: 'image/jpeg', // 简化处理，实际可能需要检测
              size: fs.statSync(imagePath).size,
            },
          })
          coverImageId = media.id as string
        } else {
          console.warn(`警告: 图片不存在 ${imagePath}`)
        }
      }

      // 创建文章
      const article = await payload.create({
        collection: 'articles',
        data: {
          title: data.title,
          slug: data.slug,
          summary: data.description,
          legacyHtml: data.content_html,
          isLegacy: true,
          originalUrl: data.original_url,
          coverImage: coverImageId,
          baseViews: data.views || 0,
          publishedAt: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
          _status: 'published', // 关键：确保文章默认为发布状态，否则前端不可见
          // 必须包含 content 字段（富文本），否则可能验证失败
          content: {
            root: {
              type: 'root',
              format: '',
              indent: 0,
              version: 1,
              children: [
                {
                  type: 'paragraph',
                  format: '',
                  indent: 0,
                  version: 1,
                  children: [
                    {
                      mode: 'normal',
                      text: '迁移文章，详见下方遗留 HTML。',
                      type: 'text',
                      style: '',
                      detail: 0,
                      version: 1
                    }
                  ]
                }
              ]
            }
          }
        },
      })

      // 记录重定向关系
      if (data.original_url) {
        const newUrl = `/articles/${data.slug}`
        urlMap[data.original_url] = newUrl
        // Nginx rewrite 规则: rewrite ^/old-path$ /new-path permanent;
        // 注意处理正则特殊字符（如果有的话）
        nginxRules.push(`rewrite ^${data.original_url.replace(/\?/g, '\\?')}$ ${newUrl} permanent;`)
      }

    } catch (err) {
      console.error(`迁移失败 ${file}:`, err)
    }
  }

  // 写入重定向文件
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'url_map.json'), JSON.stringify(urlMap, null, 2))
  fs.writeFileSync(path.join(REDIRECTS_DIR, 'nginx_rewrite_rules.conf'), nginxRules.join('\n'))

  console.log('迁移完成！产物已生成至 redirects/ 目录。')
  process.exit(0)
}

migrate()
