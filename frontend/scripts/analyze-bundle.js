#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * 
 * Analyzes the total size of frontend assets and checks against
 * the performance budget defined in performance-budget.json.
 * 
 * Usage: node scripts/analyze-bundle.js
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(__dirname, '..');

const ASSET_EXTENSIONS = {
  js: ['.js', '.mjs'],
  css: ['.css'],
  html: ['.html'],
  images: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'],
  fonts: ['.woff', '.woff2', '.ttf', '.otf', '.eot']
};

async function getFiles(dir, baseDir = dir) {
  const files = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.git', 'a11y-reports', 'scripts'].includes(entry.name)) continue;
        files.push(...await getFiles(fullPath, baseDir));
      } else {
        const relativePath = fullPath.replace(baseDir + '/', '');
        const stats = await stat(fullPath);
        files.push({ path: relativePath, size: stats.size, fullPath });
      }
    }
  } catch (e) {
    // skip
  }
  return files;
}

function getCategory(filePath) {
  const ext = extname(filePath).toLowerCase();
  for (const [category, extensions] of Object.entries(ASSET_EXTENSIONS)) {
    if (extensions.includes(ext)) return category;
  }
  return 'other';
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

async function estimateGzipSize(filePath) {
  try {
    const content = await readFile(filePath);
    return gzipSync(content).length;
  } catch {
    return 0;
  }
}

async function main() {
  console.log('📦 WhatsHappening Frontend Bundle Analysis\n');
  console.log('='.repeat(60));

  const files = await getFiles(FRONTEND_DIR);
  const categories = {};
  let totalSize = 0;
  let totalGzip = 0;

  for (const file of files) {
    const cat = getCategory(file.path);
    if (!categories[cat]) categories[cat] = { files: [], size: 0, gzip: 0 };
    
    let gzipSize = 0;
    if (['js', 'css', 'html'].includes(cat)) {
      gzipSize = await estimateGzipSize(file.fullPath);
    }
    
    categories[cat].files.push({ ...file, gzipSize });
    categories[cat].size += file.size;
    categories[cat].gzip += gzipSize;
    totalSize += file.size;
    totalGzip += gzipSize;
  }

  // Print results by category
  for (const [cat, data] of Object.entries(categories).sort((a, b) => b[1].size - a[1].size)) {
    console.log(`\n📁 ${cat.toUpperCase()} (${data.files.length} files)`);
    console.log(`   Raw: ${formatBytes(data.size)}${data.gzip ? ` | Gzip: ${formatBytes(data.gzip)}` : ''}`);
    
    // Show top 5 largest files
    const sorted = data.files.sort((a, b) => b.size - a.size).slice(0, 5);
    for (const f of sorted) {
      const gzipInfo = f.gzipSize ? ` (gzip: ${formatBytes(f.gzipSize)})` : '';
      console.log(`   - ${f.path}: ${formatBytes(f.size)}${gzipInfo}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 TOTALS`);
  console.log(`   Total raw size: ${formatBytes(totalSize)}`);
  console.log(`   Total gzip (JS+CSS+HTML): ${formatBytes(totalGzip)}`);

  // Check against budget
  let budgetPath;
  try {
    budgetPath = join(FRONTEND_DIR, 'performance-budget.json');
    const budget = JSON.parse(await readFile(budgetPath, 'utf-8'));
    const maxGzip = budget.budgets.bundle.maxGzippedBytes;
    
    // Only count JS + CSS for bundle budget
    const bundleGzip = (categories.js?.gzip || 0) + (categories.css?.gzip || 0);
    
    console.log(`\n🎯 PERFORMANCE BUDGET`);
    console.log(`   JS + CSS gzipped: ${formatBytes(bundleGzip)}`);
    console.log(`   Budget: ${formatBytes(maxGzip)}`);
    
    if (bundleGzip <= maxGzip) {
      console.log(`   ✅ PASS — ${formatBytes(maxGzip - bundleGzip)} under budget`);
    } else {
      console.log(`   ❌ FAIL — ${formatBytes(bundleGzip - maxGzip)} over budget`);
      process.exit(1);
    }
  } catch (e) {
    console.log('\n⚠️  Could not load performance budget');
  }

  console.log('');
}

main().catch(console.error);
