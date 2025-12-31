import { getPayload } from 'payload'
import config from '../payload.config'

async function init() {
  console.log('Building database schema...')
  const payload = await getPayload({ config })
  
  // 这会触发 Payload 的初始化逻辑，对于 SQLite adapter，它通常会同步表结构
  // 只要 payload 实例成功启动，表就应该存在了
  console.log('Payload initialized. Schema should be ready.')
  process.exit(0)
}

init().catch(console.error)
