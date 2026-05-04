// SEO and Quality Control utility functions
// Run with: node scripts/seo-check.js

const fs = require('fs');
const path = require('path');

const checks = {
  // Check for missing meta descriptions
  metaDescriptions: (files) => {
    const missing = files.filter(f => 
      f.content.includes('export const metadata') && 
      !f.content.includes('description:')
    );
    return { 
      passed: missing.length === 0,
      message: `Meta descriptions: ${missing.length} pages missing description`,
      details: missing.map(f => f.name)
    };
  },

  // Check for proper title tags
  titles: (files) => {
    const missing = files.filter(f => 
      f.content.includes('export const metadata') && 
      !f.content.includes('title:')
    );
    return { 
      passed: missing.length === 0,
      message: `Page titles: ${missing.length} pages missing title`,
      details: missing.map(f => f.name)
    };
  },

  // Check for alt text on images
  altText: (files) => {
    const imgRegex = /<img[^>]*>/g;
    const altRegex = /alt=["'][^"']*["']/;
    const missing = files.filter(f => {
      const imgs = f.content.match(imgRegex) || [];
      return imgs.some(img => !altRegex.test(img));
    });
    return { 
      passed: missing.length === 0,
      message: `Alt text: ${missing.length} files with images missing alt text`,
      details: missing.map(f => f.name)
    };
  },

  // Check for broken internal links
  internalLinks: (files) => {
    const linkRegex = /href=["'](\/[^"']*)["']/g;
    const broken = [];
    files.forEach(f => {
      const links = [...f.content.matchAll(linkRegex)].map(m => m[1]);
      links.forEach(link => {
        if (link.startsWith('/')) {
          const filePath = path.join(__dirname, '..', 'app', link, 'page.js');
          if (!fs.existsSync(filePath) && !link.includes('[') && !link.includes('#')) {
            broken.push({ file: f.name, link });
          }
        }
      });
    });
    return { 
      passed: broken.length === 0,
      message: `Internal links: ${broken.length} potentially broken links`,
      details: broken.map(b => `${b.file} -> ${b.link}`)
    };
  },

  // Check for large images
  imageSizes: () => {
    const publicDir = path.join(__dirname, '..', 'public');
    const maxSize = 500 * 1024; // 500KB
    const largeImages = [];
    if (fs.existsSync(publicDir)) {
      const files = fs.readdirSync(publicDir, { recursive: true });
      files.forEach(file => {
        if (file.match(/\.(png|jpg|jpeg|gif)$/i)) {
          const filePath = path.join(publicDir, file);
          const stats = fs.statSync(filePath);
          if (stats.size > maxSize) {
            largeImages.push({ file, size: Math.round(stats.size / 1024) + 'KB' });
          }
        }
      });
    }
    return { 
      passed: largeImages.length === 0,
      message: `Image sizes: ${largeImages.length} images larger than 500KB`,
      details: largeImages.map(i => `${i.file} (${i.size})`)
    };
  },

  // Check for console.log in production code
  consoleLogs: (files) => {
    const hasLogs = files.filter(f => 
      f.content.includes('console.log(') && 
      !f.name.includes('.test.') && 
      !f.name.includes('scripts/')
    );
    return { 
      passed: hasLogs.length === 0,
      message: `Console logs: ${hasLogs.length} files with console.log statements`,
      details: hasLogs.map(f => f.name)
    };
  },

  // Check for accessibility basics
  accessibility: (files) => {
    const issues = [];
    files.forEach(f => {
      // Check for missing form labels
      if (f.content.includes('<input') && !f.content.includes('<label')) {
        issues.push({ file: f.name, issue: 'Form inputs without labels' });
      }
      // Check for missing heading hierarchy
      const h1Count = (f.content.match(/<h1/g) || []).length;
      if (h1Count > 1) {
        issues.push({ file: f.name, issue: `Multiple H1 tags (${h1Count})` });
      }
    });
    return { 
      passed: issues.length === 0,
      message: `Accessibility: ${issues.length} potential issues`,
      details: issues.map(i => `${i.file}: ${i.issue}`)
    };
  }
};

// Run all checks
function runSEOAudit() {
  console.log('🔍 Running SEO & Quality Control Audit...\n');
  
  const appDir = path.join(__dirname, '..', 'app');
  const files = [];
  
  function readDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        readDir(fullPath);
      } else if (item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
        files.push({
          name: fullPath.replace(appDir, 'app'),
          content: fs.readFileSync(fullPath, 'utf8')
        });
      }
    });
  }
  
  readDir(appDir);
  
  console.log(`📁 Found ${files.length} files to check\n`);
  
  const results = Object.entries(checks).map(([name, check]) => {
    const result = check(files);
    return { name, ...result };
  });
  
  // Print results
  results.forEach(r => {
    const icon = r.passed ? '✅' : '⚠️';
    console.log(`${icon} ${r.message}`);
    if (!r.passed && r.details.length > 0 && r.details.length <= 5) {
      r.details.forEach(d => console.log(`   • ${d}`));
    }
  });
  
  console.log(`\n📊 Summary:`);
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`   ${passed}/${total} checks passed`);
  
  if (passed === total) {
    console.log('🎉 All checks passed!');
  } else {
    console.log(`⚠️  ${total - passed} checks need attention`);
    process.exit(1);
  }
}

if (require.main === module) {
  runSEOAudit();
}

module.exports = { runSEOAudit, checks };
