import { getPayload } from 'payload'
import config from '../payload.config'

async function check() {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'articles',
    where: {
      title: {
        contains: '致客户的一封信',
      },
    },
    limit: 1,
    depth: 1, 
  })

  if (result.docs.length > 0) {
    const article = result.docs[0]
    console.log('Article Title:', article.title)
    console.log('CoverImage Raw:', JSON.stringify(article.coverImage, null, 2))
  } else {
    console.log('Target article not found')
  }
  process.exit(0)
}

check()