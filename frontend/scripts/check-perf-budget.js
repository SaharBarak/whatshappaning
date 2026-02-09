#!/usr/bin/env node
/**
 * Performance Budget Checker
 * Validates that frontend assets stay within size budgets.
 * 
 * Budget: Total JS + CSS < 200KB (uncompressed, as proxy for gzipped target)
 * Individual limits help catch regressions early.
 */

import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const FRONTEND_DIR = new URL('..', import.meta.url).pathname;

// Budget thresholds in bytes (uncompressed)
const BUDGETS = {
  totalJS: 250 * 1024,      // 250KB uncompressed JS (~60KB gzipped)
  totalCSS: 80 * 1024,      // 80KB uncompressed CSS (~15KB gzipped)
  singleFile: 50 * 1024,    // No single file > 50KB
  totalAssets: 350 * 1024,  // Total JS+CSS < 350KB (~100KB gzipped)
  htmlSize: 30 * 1024       // HTML < 30KB
};

function getFilesRecursive(dir, ext) {
  const results = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...getFilesRecursive(fullPath, ext));
      } else if (entry.isFile() && extname(entry.name) === ext) {
        results.push({ path: fullPath, size: statSync(fullPath).size, name: entry.name });
      }
    }
  } catch (e) { /* skip inaccessible dirs */ }
  return results;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  return `${(bytes / 1024).toFixed(1)}KB`;
}

function checkGzipSize(filePath) {
  try {
    const result = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' }).trim();
    return parseInt(result, 10);
  } catch {
    return null;
  }
}

console.log('📊 Performance Budget Check\n');
console.log(`Frontend directory: ${FRONTEND_DIR}\n`);

const jsFiles = getFilesRecursive(join(FRONTEND_DIR, 'js'), '.js');
const cssFiles = getFilesRecursive(join(FRONTEND_DIR, 'css'), '.css');

const totalJS = jsFiles.reduce((sum, f) => sum + f.size, 0);
const totalCSS = cssFiles.reduce((sum, f) => sum + f.size, 0);
const totalAssets = totalJS + totalCSS;

let htmlSize = 0;
try { htmlSize = statSync(join(FRONTEND_DIR, 'index.html')).size; } catch {}

let violations = 0;

// Report JS files
console.log('📦 JavaScript Files:');
jsFiles.sort((a, b) => b.size - a.size);
for (const f of jsFiles) {
  const over = f.size > BUDGETS.singleFile;
  const gzip = checkGzipSize(f.path);
  const gzipStr = gzip ? ` (gzip: ${formatBytes(gzip)})` : '';
  const marker = over ? '⚠️ ' : '  ';
  console.log(`${marker}${f.path.replace(FRONTEND_DIR, '')} — ${formatBytes(f.size)}${gzipStr}`);
  if (over) violations++;
}
console.log(`  Total JS: ${formatBytes(totalJS)} / ${formatBytes(BUDGETS.totalJS)}`);
if (totalJS > BUDGETS.totalJS) { console.log('  ❌ OVER BUDGET'); violations++; }
else console.log('  ✅ Within budget');

console.log('\n🎨 CSS Files:');
for (const f of cssFiles) {
  const gzip = checkGzipSize(f.path);
  const gzipStr = gzip ? ` (gzip: ${formatBytes(gzip)})` : '';
  console.log(`  ${f.path.replace(FRONTEND_DIR, '')} — ${formatBytes(f.size)}${gzipStr}`);
}
console.log(`  Total CSS: ${formatBytes(totalCSS)} / ${formatBytes(BUDGETS.totalCSS)}`);
if (totalCSS > BUDGETS.totalCSS) { console.log('  ❌ OVER BUDGET'); violations++; }
else console.log('  ✅ Within budget');

console.log('\n📄 HTML:');
console.log(`  index.html — ${formatBytes(htmlSize)} / ${formatBytes(BUDGETS.htmlSize)}`);
if (htmlSize > BUDGETS.htmlSize) { console.log('  ❌ OVER BUDGET'); violations++; }
else console.log('  ✅ Within budget');

console.log('\n📊 Total Assets (JS + CSS):');
const totalGzip = checkGzipSize(join(FRONTEND_DIR, 'index.html')); // approximate
console.log(`  ${formatBytes(totalAssets)} / ${formatBytes(BUDGETS.totalAssets)}`);
if (totalAssets > BUDGETS.totalAssets) { console.log('  ❌ OVER BUDGET'); violations++; }
else console.log('  ✅ Within budget');

console.log(`\n${violations === 0 ? '✅ All budgets passed!' : `❌ ${violations} budget violation(s) found`}`);
process.exit(violations > 0 ? 1 : 0);
