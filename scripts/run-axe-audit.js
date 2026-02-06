#!/usr/bin/env node
/**
 * Axe-core Accessibility Audit Script
 * 
 * Runs axe-core accessibility tests on all pages using Playwright.
 * Generates detailed reports with issues categorized by severity.
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
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

// Severity order for sorting
const SEVERITY_ORDER = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3
};

// Start local server and return process
function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['serve', '-s', '.', '-l', '3000'], {
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
        // Server already running
        resolve(null);
      }
    });
    
    setTimeout(() => {
      if (!started) resolve(null);
    }, 5000);
  });
}

async function runAxeAudit() {
  console.log('🔍 Starting Axe-core Accessibility Audit...\n');
  
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  // Start local server
  console.log('📦 Starting local server...');
  const server = await startServer();
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const allResults = [];
  const summary = {
    timestamp: new Date().toISOString(),
    totalPages: PAGES.length,
    totalIssues: 0,
    bySeverity: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    },
    pages: []
  };
  
  try {
    for (const pageInfo of PAGES) {
      console.log(`\n📄 Auditing: ${pageInfo.name} (${pageInfo.path})`);
      
      const page = await context.newPage();
      const url = `http://localhost:3000${pageInfo.path}`;
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for dynamic content to load
        await page.waitForTimeout(2000);
        
        // Run axe-core
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
          .analyze();
        
        // Process results
        const pageResults = {
          page: pageInfo.name,
          url: pageInfo.path,
          timestamp: new Date().toISOString(),
          violations: results.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map(n => ({
              html: n.html.substring(0, 200),
              target: n.target,
              failureSummary: n.failureSummary
            }))
          })),
          passes: results.passes.length,
          incomplete: results.incomplete.length
        };
        
        // Update summary
        const pageViolations = {
          critical: 0,
          serious: 0,
          moderate: 0,
          minor: 0
        };
        
        results.violations.forEach(v => {
          const impact = v.impact || 'minor';
          pageViolations[impact] = (pageViolations[impact] || 0) + v.nodes.length;
          summary.bySeverity[impact] = (summary.bySeverity[impact] || 0) + v.nodes.length;
          summary.totalIssues += v.nodes.length;
        });
        
        summary.pages.push({
          name: pageInfo.name,
          path: pageInfo.path,
          violations: pageViolations,
          total: results.violations.reduce((sum, v) => sum + v.nodes.length, 0),
          passes: results.passes.length
        });
        
        allResults.push(pageResults);
        
        console.log(`   ✅ Passes: ${results.passes.length}`);
        console.log(`   ⚠️  Violations: ${results.violations.length} rules, ${pageViolations.critical + pageViolations.serious + pageViolations.moderate + pageViolations.minor} instances`);
        if (pageViolations.critical > 0) console.log(`      🔴 Critical: ${pageViolations.critical}`);
        if (pageViolations.serious > 0) console.log(`      🟠 Serious: ${pageViolations.serious}`);
        if (pageViolations.moderate > 0) console.log(`      🟡 Moderate: ${pageViolations.moderate}`);
        if (pageViolations.minor > 0) console.log(`      🟢 Minor: ${pageViolations.minor}`);
        
      } catch (error) {
        console.error(`   ❌ Error auditing ${pageInfo.name}: ${error.message}`);
        allResults.push({
          page: pageInfo.name,
          url: pageInfo.path,
          error: error.message
        });
      }
      
      await page.close();
    }
    
    // Sort violations by severity for detailed report
    allResults.forEach(pageResult => {
      if (pageResult.violations) {
        pageResult.violations.sort((a, b) => 
          (SEVERITY_ORDER[a.impact] || 3) - (SEVERITY_ORDER[b.impact] || 3)
        );
      }
    });
    
    // Save detailed report
    const detailedReportPath = join(REPORTS_DIR, 'axe-audit-detailed.json');
    writeFileSync(detailedReportPath, JSON.stringify(allResults, null, 2));
    console.log(`\n📁 Detailed report saved: ${detailedReportPath}`);
    
    // Save summary report
    const summaryReportPath = join(REPORTS_DIR, 'axe-audit-summary.json');
    writeFileSync(summaryReportPath, JSON.stringify(summary, null, 2));
    console.log(`📁 Summary report saved: ${summaryReportPath}`);
    
    // Generate markdown report
    const mdReport = generateMarkdownReport(summary, allResults);
    const mdReportPath = join(REPORTS_DIR, 'ACCESSIBILITY-AUDIT.md');
    writeFileSync(mdReportPath, mdReport);
    console.log(`📁 Markdown report saved: ${mdReportPath}`);
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ACCESSIBILITY AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Issues: ${summary.totalIssues}`);
    console.log(`  🔴 Critical: ${summary.bySeverity.critical}`);
    console.log(`  🟠 Serious: ${summary.bySeverity.serious}`);
    console.log(`  🟡 Moderate: ${summary.bySeverity.moderate}`);
    console.log(`  🟢 Minor: ${summary.bySeverity.minor}`);
    console.log('='.repeat(60));
    
    if (summary.bySeverity.critical > 0 || summary.bySeverity.serious > 0) {
      console.log('\n⚠️  Critical/Serious issues found! Please address these first.\n');
    }
    
  } finally {
    await browser.close();
    if (server) {
      server.kill();
    }
  }
  
  return summary;
}

function generateMarkdownReport(summary, allResults) {
  let md = `# Accessibility Audit Report\n\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Severity | Count |\n`;
  md += `|----------|-------|\n`;
  md += `| 🔴 Critical | ${summary.bySeverity.critical} |\n`;
  md += `| 🟠 Serious | ${summary.bySeverity.serious} |\n`;
  md += `| 🟡 Moderate | ${summary.bySeverity.moderate} |\n`;
  md += `| 🟢 Minor | ${summary.bySeverity.minor} |\n`;
  md += `| **Total** | **${summary.totalIssues}** |\n\n`;
  
  md += `## Pages Audited\n\n`;
  for (const page of summary.pages) {
    md += `### ${page.name} (${page.path})\n\n`;
    md += `- **Violations:** ${page.total}\n`;
    md += `- **Passes:** ${page.passes}\n\n`;
  }
  
  md += `## Detailed Violations\n\n`;
  
  for (const pageResult of allResults) {
    if (pageResult.error) continue;
    if (!pageResult.violations || pageResult.violations.length === 0) {
      md += `### ${pageResult.page}\n\n✅ No violations found!\n\n`;
      continue;
    }
    
    md += `### ${pageResult.page}\n\n`;
    
    for (const violation of pageResult.violations) {
      const severityIcon = {
        critical: '🔴',
        serious: '🟠',
        moderate: '🟡',
        minor: '🟢'
      }[violation.impact] || '⚪';
      
      md += `#### ${severityIcon} ${violation.id} (${violation.impact})\n\n`;
      md += `**Description:** ${violation.description}\n\n`;
      md += `**Help:** ${violation.help}\n\n`;
      md += `**More info:** [${violation.helpUrl}](${violation.helpUrl})\n\n`;
      md += `**Affected elements:** ${violation.nodes.length}\n\n`;
      
      md += `<details>\n<summary>View affected elements</summary>\n\n`;
      for (const node of violation.nodes.slice(0, 5)) {
        md += `\`\`\`html\n${node.html}\n\`\`\`\n\n`;
        md += `**Fix:** ${node.failureSummary}\n\n`;
      }
      if (violation.nodes.length > 5) {
        md += `*... and ${violation.nodes.length - 5} more*\n\n`;
      }
      md += `</details>\n\n`;
    }
  }
  
  return md;
}

// Run if called directly
runAxeAudit().catch(console.error);

export { runAxeAudit };
