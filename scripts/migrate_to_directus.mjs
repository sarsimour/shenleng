// Remove direct imports that might fail
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIG
const DIRECTUS_URL = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin';

const CONTENT_DIR = path.resolve(__dirname, '../data/nextjs_content/content/json');
const IMAGES_DIR = path.resolve(__dirname, '../public/images');

// STATE
let TOKEN = '';
const IMAGE_MAP = new Map(); // filename -> file_id

async function login() {
  console.log('Logging in...');
  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    
    if (!res.ok) throw new Error(`Login failed: ${res.statusText}`);
    const data = await res.json();
    TOKEN = data.data.access_token;
    console.log('Login successful.');
  } catch (e) {
    console.error('Failed to login. Make sure Directus is running.');
    console.error(e);
    process.exit(1);
  }
}

async function api(endpoint, method = 'GET', body = null, isMultipart = false) {
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
  };
  
  // fetch handles multipart boundary automatically if body is FormData
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = isMultipart ? body : JSON.stringify(body);
  }

  const res = await fetch(`${DIRECTUS_URL}${endpoint}`, options);
  if (!res.ok) {
    const err = await res.text();
    // Ignore "Field already exists" errors for cleaner output
    if (err.includes("Field already exists") || err.includes("Collection already exists")) {
        // console.log(`Notice: ${endpoint} - Resource likely already exists.`);
        return { data: [] }; // Mock return
    }
    throw new Error(`API Error ${endpoint}: ${err}`);
  }
  return res.json();
}

async function setupSchema() {
  console.log('Setting up schema...');
  
  // 1. Create Collection
  try {
      await api('/collections', 'POST', {
        collection: 'posts',
        meta: {
          hidden: false,
          singleton: false,
          icon: 'article',
          note: 'Migrated from Next.js',
        },
        schema: {
          comment: 'Blog Posts'
        }
      });
      console.log('Collection "posts" created.');
  } catch (e) {
      console.log('Collection "posts" likely already exists, skipping creation.');
  }

  // 2. Create Fields
  const fields = [
    { field: 'slug', type: 'string', meta: { interface: 'input', special: null }, schema: { is_unique: true } },
    { field: 'title', type: 'string', meta: { interface: 'input' } },
    { field: 'date', type: 'dateTime', meta: { interface: 'datetime' } }, 
    { field: 'views', type: 'integer', meta: { interface: 'input' } },
    { field: 'description', type: 'text', meta: { interface: 'textarea' } },
    { field: 'content_html', type: 'text', meta: { interface: 'wysiwyg' } }, 
    { field: 'original_url', type: 'string', meta: { interface: 'input' } },
    {
        field: 'featured_image', 
        type: 'uuid', 
        meta: { interface: 'file-image', special: ['file'] },
        schema: { foreign_key_table: 'directus_files', foreign_key_column: 'id' }
    }
  ];

  for (const f of fields) {
    try {
      await api('/fields/posts', 'POST', f);
      console.log(`Field ${f.field} created.`);
    } catch (e) {
      // console.warn(`Field ${f.field} creation warning:`, e.message);
    }
  }
  
  // 3. Make Public Read
  // Directus by default is private. We need to allow Public to read 'posts' and 'directus_files'.
  console.log('Configuring public access...');
  try {
      // Get Public Role ID (it's always null in permissions table, but let's check roles just in case logic changes, actually for permissions role=null means public)
      // Create permission for posts
      await api('/permissions', 'POST', {
          role: null, 
          collection: 'posts',
          action: 'read',
          fields: ['*']
      });
      // Create permission for files
      await api('/permissions', 'POST', {
          role: null, 
          collection: 'directus_files',
          action: 'read',
          fields: ['*']
      });
       console.log('Public access enabled for Posts and Files.');
  } catch(e) {
      console.log('Permissions likely already exist.');
  }
}

async function uploadImages() {
  console.log('Uploading images...');
  const files = await fs.readdir(IMAGES_DIR);
  
  for (const file of files) {
    if (file.startsWith('.')) continue; // skip .DS_Store
    
    // Check if image already exists in Directus to save time
    try {
        const search = await api(`/files?filter[filename_download][_eq]=${file}`);
        if (search.data && search.data.length > 0) {
            IMAGE_MAP.set(file, search.data[0].id);
            // console.log(`Image skipped (exists): ${file}`);
            continue;
        }
    } catch(e) {}

    const filePath = path.join(IMAGES_DIR, file);
    const fileBuffer = await fs.readFile(filePath);
    
    const form = new FormData();
    form.append('file', fileBuffer, file);
    
    // For node-fetch with FormData, we need to pass headers manually? 
    // Actually standard fetch in Node 20+ supports FormData natively? 
    // If not, we use the 'form-data' package headers.
    // The previous 'api' function handles JSON. Let's make a specific upload call to be safe with headers.
    
    try {
        const headers = {
            'Authorization': `Bearer ${TOKEN}`,
            ...form.getHeaders() // Important for boundary
        };
        
        const res = await fetch(`${DIRECTUS_URL}/files`, {
            method: 'POST',
            headers: headers,
            body: form
        });
        
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        
        const fileId = json.data.id;
        IMAGE_MAP.set(file, fileId);
        console.log(`Uploaded: ${file}`);
    } catch (e) {
      console.error(`Failed to upload ${file}:`, e.message);
    }
  }
}

async function migrateContent() {
  console.log('Migrating content...');
  const files = await fs.readdir(CONTENT_DIR);
  let count = 0;

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
    const data = JSON.parse(raw);
    
    // Process Fields
    let contentHtml = data.content_html || '';
    
    // Replace image paths in content
    contentHtml = contentHtml.replace(/\/images\/([^"'\s>]+)/g, (match, filename) => {
        const decodedName = decodeURIComponent(filename);
        const fileId = IMAGE_MAP.get(decodedName);
        if (fileId) {
            return `/assets/${fileId}`;
        }
        return match;
    });

    // Handle Featured Image
    let featuredImageId = null;
    if (data.featured_image) {
        const fname = path.basename(data.featured_image);
        featuredImageId = IMAGE_MAP.get(decodeURIComponent(fname));
    }

    const payload = {
        slug: data.slug,
        title: data.title,
        date: data.date ? new Date(data.date).toISOString() : null,
        views: parseInt(data.views) || 0,
        description: data.description,
        content_html: contentHtml,
        original_url: data.original_url,
        featured_image: featuredImageId
    };

    try {
        // Check existence
        const existing = await api(`/items/posts?filter[slug][_eq]=${data.slug}`);
        if (existing.data && existing.data.length > 0) {
            const id = existing.data[0].id;
            await api(`/items/posts/${id}`, 'PATCH', payload);
            process.stdout.write('.'); // progress dot
        } else {
            await api('/items/posts', 'POST', payload);
            process.stdout.write('+'); // new dot
        }
        count++;
    } catch (e) {
        console.error(`
Failed to migrate ${data.slug}:`, e.message);
    }
  }
  console.log(`
Processed ${count} posts.`);
}

async function main() {
    await login();
    await setupSchema();
    await uploadImages();
    await migrateContent();
    console.log('Migration complete!');
}

main();
