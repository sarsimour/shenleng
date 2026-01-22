import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generate() {
  console.log('🛠️ Generating Nginx Configuration...')

  const mapPath = path.resolve(__dirname, '../../redirects/url_map.json');
  if (!fs.existsSync(mapPath)) {
    console.error('❌ Error: url_map.json not found. Run generate_redirect_map.ts first.');
    process.exit(1);
  }

  const urlMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
  
  let config = '# Nginx Redirect Rules for Shenleng Legacy Site Migration\n';
  config += '# Generated automatically from Payload CMS data\n\n';
  config += 'map $request_uri $new_uri {\n';
  config += '    default "";\n\n';

  for (const [oldPath, newPath] of Object.entries(urlMap)) {
    // 确保路径中有空格或特殊字符时能正确处理
    config += `    "${oldPath}" "${newPath}";\n`;
  }

  config += '}\n\n';
  config += '# Add this block to your server context:\n';
  config += '# if ($new_uri) {\n';
  config += '#     return 301 $new_uri;\n';
  config += '# }\n';

  const outputPath = path.resolve(__dirname, '../../redirects/nginx_rewrite_rules.conf');
  fs.writeFileSync(outputPath, config);

  console.log(`✅ Nginx configuration generated at ${outputPath}`);
}

generate();
