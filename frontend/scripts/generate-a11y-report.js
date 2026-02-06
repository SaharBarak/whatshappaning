#!/usr/bin/env node
/**
 * Generate Combined Accessibility Report
 * 
 * Combines axe-core and Lighthouse results into a comprehensive report.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPORTS_DIR = join(__dirname, '..', 'a11y-reports');

function generateCombinedReport() {
  console.log('📊 Generating Combined Accessibility Report...\n');
  
  // Load axe-core results
  let axeSummary = null;
  let axeDetailed = null;
  const axeSummaryPath = join(REPORTS_DIR, 'axe-audit-summary.json');
  const axeDetailedPath = join(REPORTS_DIR, 'axe-audit-detailed.json');
  
  if (existsSync(axeSummaryPath)) {
    axeSummary = JSON.parse(readFileSync(axeSummaryPath, 'utf-8'));
    axeDetailed = JSON.parse(readFileSync(axeDetailedPath, 'utf-8'));
    console.log('✅ Loaded axe-core results');
  } else {
    console.log('⚠️  No axe-core results found - run npm run a11y:axe first');
  }
  
  // Load Lighthouse results
  let lhSummary = null;
  let lhDetailed = null;
  const lhSummaryPath = join(REPORTS_DIR, 'lighthouse-audit-summary.json');
  const lhDetailedPath = join(REPORTS_DIR, 'lighthouse-audit-detailed.json');
  
  if (existsSync(lhSummaryPath)) {
    lhSummary = JSON.parse(readFileSync(lhSummaryPath, 'utf-8'));
    lhDetailed = JSON.parse(readFileSync(lhDetailedPath, 'utf-8'));
    console.log('✅ Loaded Lighthouse results');
  } else {
    console.log('⚠️  No Lighthouse results found - run npm run a11y:lighthouse first');
  }
  
  if (!axeSummary && !lhSummary) {
    console.error('❌ No audit results found. Run npm run a11y:audit first.');
    process.exit(1);
  }
  
  // Generate combined markdown report
  let md = `# Accessibility Audit Report\n\n`;
  md += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  md += `---\n\n`;
  
  // Executive Summary
  md += `## Executive Summary\n\n`;
  
  if (axeSummary) {
    const criticalSerious = axeSummary.bySeverity.critical + axeSummary.bySeverity.serious;
    if (criticalSerious > 0) {
      md += `⚠️ **${criticalSerious} critical/serious accessibility issues found** that need immediate attention.\n\n`;
    } else if (axeSummary.totalIssues > 0) {
      md += `✅ No critical/serious issues, but ${axeSummary.totalIssues} moderate/minor issues to address.\n\n`;
    } else {
      md += `🎉 **No axe-core violations found!**\n\n`;
    }
  }
  
  if (lhSummary) {
    const scoreIcon = lhSummary.averageScore >= 90 ? '🟢' : lhSummary.averageScore >= 50 ? '🟡' : '🔴';
    md += `Lighthouse Accessibility Score: ${scoreIcon} **${lhSummary.averageScore}/100**\n\n`;
  }
  
  // Axe-core Summary Table
  if (axeSummary) {
    md += `## Axe-core Results\n\n`;
    md += `| Severity | Count | Priority |\n`;
    md += `|----------|-------|----------|\n`;
    md += `| 🔴 Critical | ${axeSummary.bySeverity.critical} | Must fix immediately |\n`;
    md += `| 🟠 Serious | ${axeSummary.bySeverity.serious} | Fix before release |\n`;
    md += `| 🟡 Moderate | ${axeSummary.bySeverity.moderate} | Should fix |\n`;
    md += `| 🟢 Minor | ${axeSummary.bySeverity.minor} | Nice to fix |\n`;
    md += `| **Total** | **${axeSummary.totalIssues}** | |\n\n`;
  }
  
  // Lighthouse Summary Table
  if (lhSummary) {
    md += `## Lighthouse Accessibility Scores\n\n`;
    md += `| Page | Score | Status |\n`;
    md += `|------|-------|--------|\n`;
    for (const page of lhSummary.pages) {
      const icon = page.score >= 90 ? '🟢' : page.score >= 50 ? '🟡' : '🔴';
      const status = page.score >= 90 ? 'Good' : page.score >= 50 ? 'Needs Work' : 'Poor';
      md += `| ${page.name} | ${page.score}/100 | ${icon} ${status} |\n`;
    }
    md += `\n`;
  }
  
  // Priority Issues (Critical + Serious from axe-core)
  if (axeDetailed) {
    md += `## Priority Issues (Fix First)\n\n`;
    
    let hasPriorityIssues = false;
    
    for (const pageResult of axeDetailed) {
      if (!pageResult.violations) continue;
      
      const priorityViolations = pageResult.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      if (priorityViolations.length === 0) continue;
      
      hasPriorityIssues = true;
      md += `### ${pageResult.page}\n\n`;
      
      for (const violation of priorityViolations) {
        const icon = violation.impact === 'critical' ? '🔴' : '🟠';
        md += `#### ${icon} ${violation.id}\n\n`;
        md += `**Impact:** ${violation.impact.toUpperCase()}\n\n`;
        md += `**Problem:** ${violation.description}\n\n`;
        md += `**Solution:** ${violation.help}\n\n`;
        md += `**Reference:** [WCAG Guidelines](${violation.helpUrl})\n\n`;
        md += `**Affected Elements:** ${violation.nodes.length}\n\n`;
        
        if (violation.nodes.length > 0) {
          md += `<details>\n<summary>Show affected elements</summary>\n\n`;
          for (const node of violation.nodes.slice(0, 3)) {
            md += `\`\`\`html\n${node.html}\n\`\`\`\n`;
            md += `Fix: ${node.failureSummary}\n\n`;
          }
          if (violation.nodes.length > 3) {
            md += `*... and ${violation.nodes.length - 3} more elements*\n\n`;
          }
          md += `</details>\n\n`;
        }
      }
    }
    
    if (!hasPriorityIssues) {
      md += `✅ No critical or serious issues found!\n\n`;
    }
  }
  
  // Moderate Issues
  if (axeDetailed) {
    md += `## Moderate Issues\n\n`;
    
    let hasModerateIssues = false;
    
    for (const pageResult of axeDetailed) {
      if (!pageResult.violations) continue;
      
      const moderateViolations = pageResult.violations.filter(
        v => v.impact === 'moderate'
      );
      
      if (moderateViolations.length === 0) continue;
      
      hasModerateIssues = true;
      md += `### ${pageResult.page}\n\n`;
      
      for (const violation of moderateViolations) {
        md += `- **${violation.id}**: ${violation.help} (${violation.nodes.length} elements)\n`;
      }
      md += `\n`;
    }
    
    if (!hasModerateIssues) {
      md += `✅ No moderate issues found!\n\n`;
    }
  }
  
  // Minor Issues (collapsed)
  if (axeDetailed) {
    const minorIssues = [];
    for (const pageResult of axeDetailed) {
      if (!pageResult.violations) continue;
      const minor = pageResult.violations.filter(v => v.impact === 'minor');
      if (minor.length > 0) {
        minorIssues.push({ page: pageResult.page, violations: minor });
      }
    }
    
    if (minorIssues.length > 0) {
      md += `## Minor Issues\n\n`;
      md += `<details>\n<summary>Show ${minorIssues.reduce((sum, p) => sum + p.violations.length, 0)} minor issues</summary>\n\n`;
      
      for (const pageIssue of minorIssues) {
        md += `### ${pageIssue.page}\n\n`;
        for (const violation of pageIssue.violations) {
          md += `- **${violation.id}**: ${violation.help}\n`;
        }
        md += `\n`;
      }
      
      md += `</details>\n\n`;
    }
  }
  
  // WCAG Compliance Checklist
  md += `## WCAG 2.1 AA Compliance Checklist\n\n`;
  md += `| Principle | Status | Notes |\n`;
  md += `|-----------|--------|-------|\n`;
  
  if (axeSummary && axeSummary.bySeverity.critical === 0 && axeSummary.bySeverity.serious === 0) {
    md += `| Perceivable | ✅ | No critical issues |\n`;
    md += `| Operable | ✅ | No critical issues |\n`;
    md += `| Understandable | ✅ | No critical issues |\n`;
    md += `| Robust | ✅ | No critical issues |\n`;
  } else {
    md += `| Perceivable | ⚠️ | Review color contrast, alt text |\n`;
    md += `| Operable | ⚠️ | Review keyboard navigation, focus |\n`;
    md += `| Understandable | ⚠️ | Review labels, error handling |\n`;
    md += `| Robust | ⚠️ | Review ARIA usage |\n`;
  }
  md += `\n`;
  
  // Recommendations
  md += `## Recommendations\n\n`;
  md += `### Immediate Actions\n\n`;
  if (axeSummary && (axeSummary.bySeverity.critical > 0 || axeSummary.bySeverity.serious > 0)) {
    md += `1. Fix all critical and serious issues listed above\n`;
    md += `2. Run \`npm run a11y:audit\` after fixes to verify\n`;
    md += `3. Test with screen reader (VoiceOver, NVDA)\n`;
  } else {
    md += `1. Address moderate issues to improve score\n`;
    md += `2. Add manual testing with screen readers\n`;
    md += `3. Test keyboard navigation throughout\n`;
  }
  md += `\n`;
  
  md += `### Ongoing Maintenance\n\n`;
  md += `1. Add accessibility tests to CI pipeline\n`;
  md += `2. Train team on WCAG 2.1 guidelines\n`;
  md += `3. Include a11y checks in code review\n`;
  md += `4. Regular audits (monthly recommended)\n\n`;
  
  // Tools Used
  md += `---\n\n`;
  md += `## Tools Used\n\n`;
  md += `- **axe-core**: Automated accessibility testing engine\n`;
  md += `- **Lighthouse**: Google's web auditing tool\n`;
  md += `- **Playwright**: Browser automation for testing\n\n`;
  
  md += `## Files Generated\n\n`;
  md += `- \`ACCESSIBILITY-AUDIT.md\` - Axe-core detailed report\n`;
  md += `- \`LIGHTHOUSE-ACCESSIBILITY.md\` - Lighthouse detailed report\n`;
  md += `- \`axe-audit-summary.json\` - Machine-readable axe summary\n`;
  md += `- \`lighthouse-audit-summary.json\` - Machine-readable Lighthouse summary\n`;
  md += `- \`lighthouse-*.html\` - Full Lighthouse HTML reports\n`;
  
  // Save report
  const reportPath = join(REPORTS_DIR, 'COMBINED-A11Y-REPORT.md');
  writeFileSync(reportPath, md);
  console.log(`\n📁 Combined report saved: ${reportPath}`);
  
  // Also save to docs folder
  const docsReportPath = join(__dirname, '..', '..', 'docs', 'accessibility-audit-report.md');
  writeFileSync(docsReportPath, md);
  console.log(`📁 Report copied to docs: ${docsReportPath}`);
  
  console.log('\n✅ Report generation complete!');
}

generateCombinedReport();
