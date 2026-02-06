#!/usr/bin/env node
/**
 * Lighthouse Accessibility Audit Script
 * 
 * Runs Lighthouse accessibility audits on all pages.
 * Focuses on accessibility category scores and recommendations.
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '..', 'a11y-reports');

// Pages to audit
const PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Analytics', path: '/analytics.html' }
];

// Lighthouse config focused on accessibility
const LIGHTHOUSE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['accessibility', 'best-practices'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1280,
      height: 720,
      deviceScaleFactor: 1
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1
    }
  }
};

// Start local server
function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['serve', '-s', '.', '-l', '3001'], {
      cwd: join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    let started = false;
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Accepting connections') && !started) {
        started = true;
        setTimeout(() => resolve(server), 1000);
      }
    });
    
    server.stderr.on('data', (data) => {
      if (data.toString().includes('Address already in use')) {
        resolve(null);
      }
    });
    
    setTimeout(() => {
      if (!started) resolve(null);
    }, 5000);
  });
}

async function runLighthouseAudit() {
  console.log('🔦 Starting Lighthouse Accessibility Audit...\n');
  
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Start local server
  console.log('📦 Starting local server on port 3001...');
  const server = await startServer();
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
  });
  
  const allResults = [];
  const summary = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES.length,
    averageScore: 0,
    pages: []
  };
  
  let totalScore = 0;
  
  try {
    for (const pageInfo of PAGES) {
      console.log(`\n📄 Auditing: ${pageInfo.name} (${pageInfo.path})`);
      
      const url = `http://localhost:3001${pageInfo.path}`;
      
      try {
        const options = {
          port: chrome.port,
          output: 'json',
          logLevel: 'error'
        };
        
        const runnerResult = await lighthouse(url, options, LIGHTHOUSE_CONFIG);
        const report = runnerResult.lhr;
        
        // Extract accessibility results
        const a11yCategory = report.categories.accessibility;
        const a11yScore = Math.round(a11yCategory.score * 100);
        
        totalScore += a11yScore;
        
        // Get failed audits
        const failedAudits = [];
        const passedAudits = [];
        const manualAudits = [];
        
        for (const auditRef of a11yCategory.auditRefs) {
          const audit = report.audits[auditRef.id];
          if (!audit) continue;
          
          if (audit.scoreDisplayMode === 'manual') {
            manualAudits.push({
              id: audit.id,
              title: audit.title,
              description: audit.description
            });
          } else if (audit.score === null) {
            // Not applicable
          } else if (audit.score < 1) {
            failedAudits.push({
              id: audit.id,
              title: audit.title,
              description: audit.description,
              score: audit.score,
              details: audit.details
            });
          } else {
            passedAudits.push({
              id: audit.id,
              title: audit.title
            });
          }
        }
        
        const pageResult = {
          page: pageInfo.name,
          url: pageInfo.path,
          timestamp: new Date().toISOString(),
          score: a11yScore,
          failedAudits,
          passedCount: passedAudits.length,
          manualCount: manualAudits.length
        };
        
        allResults.push(pageResult);
        
        summary.pages.push({
          name: pageInfo.name,
          path: pageInfo.path,
          score: a11yScore,
          failed: failedAudits.length,
          passed: passedAudits.length
        });
        
        // Print results
        const scoreColor = a11yScore >= 90 ? '🟢' : a11yScore >= 50 ? '🟡' : '🔴';
        console.log(`   ${scoreColor} Accessibility Score: ${a11yScore}/100`);
        console.log(`   ✅ Passed: ${passedAudits.length}`);
        console.log(`   ❌ Failed: ${failedAudits.length}`);
        console.log(`   📋 Manual checks needed: ${manualAudits.length}`);
        
        // Save individual HTML report
        const htmlReport = runnerResult.report;
        const htmlPath = join(REPORTS_DIR, `lighthouse-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.html`);
        writeFileSync(htmlPath, htmlReport);
        
      } catch (error) {
        console.error(`   ❌ Error auditing ${pageInfo.name}: ${error.message}`);
        allResults.push({
          page: pageInfo.name,
          url: pageInfo.path,
          error: error.message
        });
      }
    }
    
    // Calculate average score
    summary.averageScore = Math.round(totalScore / PAGES.length);
    
    // Save detailed JSON report
    const detailedReportPath = join(REPORTS_DIR, 'lighthouse-audit-detailed.json');
    writeFileSync(detailedReportPath, JSON.stringify(allResults, null, 2));
    console.log(`\n📁 Detailed report saved: ${detailedReportPath}`);
    
    // Save summary report
    const summaryReportPath = join(REPORTS_DIR, 'lighthouse-audit-summary.json');
    writeFileSync(summaryReportPath, JSON.stringify(summary, null, 2));
    console.log(`📁 Summary report saved: ${summaryReportPath}`);
    
    // Generate markdown report
    const mdReport = generateMarkdownReport(summary, allResults);
    const mdReportPath = join(REPORTS_DIR, 'LIGHTHOUSE-ACCESSIBILITY.md');
    writeFileSync(mdReportPath, mdReport);
    console.log(`📁 Markdown report saved: ${mdReportPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('🔦 LIGHTHOUSE ACCESSIBILITY SUMMARY');
    console.log('='.repeat(60));
    const avgColor = summary.averageScore >= 90 ? '🟢' : summary.averageScore >= 50 ? '🟡' : '🔴';
    console.log(`${avgColor} Average Score: ${summary.averageScore}/100`);
    console.log('\nPer-page scores:');
    for (const page of summary.pages) {
      const color = page.score >= 90 ? '🟢' : page.score >= 50 ? '🟡' : '🔴';
      console.log(`  ${color} ${page.name}: ${page.score}/100 (${page.failed} issues)`);
    }
    console.log('='.repeat(60));
    
  } finally {
    await chrome.kill();
    if (server) {
      server.kill();
    }
  }
  
  return summary;
}

function generateMarkdownReport(summary, allResults) {
  let md = `# Lighthouse Accessibility Report\n\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  const avgColor = summary.averageScore >= 90 ? '🟢' : summary.averageScore >= 50 ? '🟡' : '🔴';
  md += `## Summary\n\n`;
  md += `**Average Accessibility Score:** ${avgColor} ${summary.averageScore}/100\n\n`;
  
  md += `| Page | Score | Failed Audits |\n`;
  md += `|------|-------|---------------|\n`;
  for (const page of summary.pages) {
    const color = page.score >= 90 ? '🟢' : page.score >= 50 ? '🟡' : '🔴';
    md += `| ${page.name} | ${color} ${page.score}/100 | ${page.failed} |\n`;
  }
  md += `\n`;
  
  md += `## Failed Audits by Page\n\n`;
  
  for (const pageResult of allResults) {
    if (pageResult.error) continue;
    
    md += `### ${pageResult.page} (Score: ${pageResult.score}/100)\n\n`;
    
    if (!pageResult.failedAudits || pageResult.failedAudits.length === 0) {
      md += `✅ All audits passed!\n\n`;
      continue;
    }
    
    for (const audit of pageResult.failedAudits) {
      md += `#### ❌ ${audit.title}\n\n`;
      md += `${audit.description}\n\n`;
      
      if (audit.details && audit.details.items && audit.details.items.length > 0) {
        md += `**Affected elements:**\n\n`;
        for (const item of audit.details.items.slice(0, 5)) {
          if (item.node && item.node.snippet) {
            md += `\`\`\`html\n${item.node.snippet}\n\`\`\`\n\n`;
          } else if (item.selector) {
            md += `- \`${item.selector}\`\n`;
          }
        }
        if (audit.details.items.length > 5) {
          md += `*... and ${audit.details.items.length - 5} more*\n\n`;
        }
      }
    }
  }
  
  md += `## Scoring Guide\n\n`;
  md += `- 🟢 **90-100**: Good accessibility\n`;
  md += `- 🟡 **50-89**: Needs improvement\n`;
  md += `- 🔴 **0-49**: Poor accessibility\n\n`;
  
  md += `## HTML Reports\n\n`;
  md += `Full Lighthouse HTML reports are available in the \`a11y-reports/\` folder.\n`;
  
  return md;
}

// Run if called directly
runLighthouseAudit().catch(console.error);

export { runLighthouseAudit };
