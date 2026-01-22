import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('verify legacy site redirects', async ({ page }) => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3010';
  const mapPath = path.resolve(process.cwd(), 'redirects/url_map.json');
  
  if (!fs.existsSync(mapPath)) {
    console.error('❌ url_map.json not found');
    return;
  }

  const urlMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));

  // 抽样测试 5 个链接以验证逻辑
  const samples = Object.entries(urlMap).slice(0, 5);

  console.log(`🚀 Starting redirect verification for ${samples.length} samples...`);

  for (const [oldPath, expectedNewPath] of samples) {
    console.log(`🔍 Testing: ${oldPath} -> ${expectedNewPath}`);
    
    // Playwright 会自动跟随 301 重定向
    const response = await page.goto(`${baseUrl}${oldPath}`, { waitUntil: 'networkidle' });
    
    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);

    // 验证重定向后的路径是否符合预期
    expect(finalUrl).toContain(expectedNewPath as string);
    expect(response?.status()).toBe(200);
  }

  console.log('✅ Redirect verification finished.');
});
