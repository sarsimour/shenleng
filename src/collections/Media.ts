import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    // 使用相对路径，避免 __dirname 在 Server Action / Bundled 环境下的解析问题
    staticDir: 'public/media',
    mimeTypes: ['image/*'],
  },
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'alt',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: '替代文字 (Alt Text)',
    },
  ],
}
