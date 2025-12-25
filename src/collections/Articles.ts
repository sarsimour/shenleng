import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: '标题',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL 别名',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      label: '摘要',
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: '视频链接 (可选)',
      admin: {
        description: '支持 YouTube, Bilibili 等外部视频链接',
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: '封面图片',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: '文章正文',
    },
    {
      name: 'baseViews',
      type: 'number',
      label: '基础阅读数',
      defaultValue: 800,
      admin: {
        description: '管理员可手动修改',
        position: 'sidebar',
      },
    },
    {
      name: 'viewCount',
      type: 'number',
      label: '新增阅读数',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      label: '发布时间',
      defaultValue: () => new Date(),
    },
  ],
}