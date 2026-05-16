
import fs, { openAsBlob } from 'fs';
import path from 'path';

// ================= 配置区域 =================
const SERVER_URL = 'https://www.finverse.top'; // 您的服务器地址
const API_URL = `${SERVER_URL}/api`;
const CREDENTIALS = {
  email: 'admin@shenleng.com', // ⚠️ 请确保这与您在服务器上初始化的账号一致
  password: 'shenleng123',       // ⚠️ 请确保这与您在服务器上初始化的密码一致
};

const DATA_DIR = path.join(process.cwd(), 'data/nextjs_content');
const JSON_DIR = path.join(DATA_DIR, 'content/json');
const PUBLIC_DIR = path.join(DATA_DIR, 'public'); // 图片所在的根目录
// ===========================================

type RemoteArticlePayload = {
  title: string;
  slug: string;
  summary?: string;
  legacyHtml?: string;
  originalUrl?: string;
  isLegacy: boolean;
  baseViews: number;
  publishedAt: string;
  content: typeof DEFAULT_CONTENT;
  coverImage?: number;
};

// 简单的 RichText 占位符
const DEFAULT_CONTENT = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '（此文章迁移自旧官网，完整格式请参考“遗留 HTML 内容”或原文链接）',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
};

async function main() {
  console.log('🚀 开始迁移流程...');
  console.log(`📡 目标服务器: ${SERVER_URL}`);

  // 1. 登录获取 Token
  const token = await login();
  if (!token) {
    console.error('❌ 登录失败，请检查账号密码。');
    return;
  }
  console.log('✅ 登录成功，获取到 Token。');

  // 2. 读取所有 JSON 文件
  if (!fs.existsSync(JSON_DIR)) {
    console.error(`❌ 数据目录不存在: ${JSON_DIR}`);
    return;
  }
  const files = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'));
  console.log(`📄 找到 ${files.length} 篇文章待处理。`);

  // 3. 遍历处理
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(JSON_DIR, file);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const article = JSON.parse(rawData);

    console.log(`
Processing: [${article.id}] ${article.title}`);

    // 检查是否已存在 (通过 slug)
    const exists = await checkArticleExists(article.slug, token);
    if (exists) {
      console.log('  ⏭️  文章已存在，跳过。');
      skipCount++;
      continue;
    }

    try {
      // 4. 处理图片上传
      let coverImageId = null;
      if (article.featured_image) {
        // article.featured_image 类似 "/images/xxx.jpg"
        // 本地路径应该是 data/nextjs_content/public/images/xxx.jpg
        const relativePath = article.featured_image.startsWith('/') 
          ? article.featured_image.slice(1) 
          : article.featured_image;
        
        const imagePath = path.join(PUBLIC_DIR, relativePath);

        if (fs.existsSync(imagePath)) {
          console.log(`  🖼️  正在上传封面图: ${relativePath}`);
          coverImageId = await uploadMedia(imagePath, token);
        } else {
          console.warn(`  ⚠️  封面图文件未找到: ${imagePath}`);
        }
      }

      // 5. 创建文章
      const payload = {
        title: article.title,
        slug: article.slug,
        summary: article.description,
        legacyHtml: article.content_html, // 映射 HTML
        originalUrl: article.original_url,
        isLegacy: true,
        baseViews: parseInt(article.views || '0', 10),
        publishedAt: new Date(article.date).toISOString(),
        content: DEFAULT_CONTENT, // 必填的 RichText
        ...(coverImageId && { coverImage: coverImageId }),
      };

      await createArticle(payload, token);
      console.log('  ✅ 文章创建成功');
      successCount++;

    } catch (err) {
      console.error(`  ❌ 处理失败:`, err);
      failCount++;
    }
  }

  console.log('\n===========================================');
  console.log(`🎉 迁移完成！`);
  console.log(`✅ 成功: ${successCount}`);
  console.log(`⏭️  跳过: ${skipCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log('===========================================');
}

// ================= 工具函数 =================

async function login() {
  try {
    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CREDENTIALS),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      return data.token;
    }
    console.error('Login Error:', data);
    return null;
  } catch (e) {
    console.error('Login Network Error:', e);
    return null;
  }
}

async function checkArticleExists(slug: string, token: string) {
  const res = await fetch(`${API_URL}/articles?where[slug][equals]=${slug}`, {
    headers: { Authorization: `JWT ${token}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.docs && data.docs.length > 0;
}

async function uploadMedia(filePath: string, token: string) {
  const fileName = path.basename(filePath);

  // 构造 FormData
  const formData = new FormData();
  formData.append('alt', fileName); 

  try {
    // 使用 Node.js 原生 openAsBlob (Node 18+)
    const blob = await openAsBlob(filePath);
    formData.append('file', blob, fileName);
  } catch {
     // 回退方案
     const fileBuffer = fs.readFileSync(filePath);
     const mimeType = getMimeType(fileName);
     const blob = new Blob([fileBuffer], { type: mimeType });
     formData.append('file', blob, fileName);
  }

  const res = await fetch(`${API_URL}/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Media upload failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.doc.id;
}

async function createArticle(articleData: RemoteArticlePayload, token: string) {
  const res = await fetch(`${API_URL}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `JWT ${token}`,
    },
    body: JSON.stringify(articleData),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Article create failed: ${res.status} ${err}`);
  }
  return await res.json();
}

function getMimeType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

main().catch(console.error);
