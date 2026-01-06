
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.resolve(process.cwd(), 'payload-local-init.db')

// 强制使用临时数据库文件，避免影响现有的（如果有）
process.env.DATABASE_URI = `file:${DB_PATH}`
process.env.PAYLOAD_SECRET = 'init-secret'

async function main() {
  console.log('🚀 初始化本地数据库用于部署...')
  
  if (fs.existsSync(DB_PATH)) {
    console.log('🗑️ 删除旧的初始化数据库文件...')
    fs.unlinkSync(DB_PATH)
  }

  const payload = await getPayload({ config: configPromise })

  console.log('📦 Payload 已启动，表结构已同步。')

  // 创建初始管理员
  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: 'admin@shenleng.com',
      },
    },
  })

  if (existingUsers.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@shenleng.com',
        password: 'shenleng123', 
      },
    })
    console.log('👤 管理员账号已创建: admin@shenleng.com / shenleng123')
  } else {
    console.log('👤 管理员账号已存在。')
  }

  console.log('✅ 数据库初始化完成。')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
