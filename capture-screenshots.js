const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 900 } });
  const page = await context.newPage();

  // 1. Homepage
  await page.goto('https://infinity-staging.preview.emergentagent.com', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/app/public/screenshots/01_homepage.png', fullPage: false });
  console.log('1. Homepage');

  // 2. Pricing
  await page.goto('https://infinity-staging.preview.emergentagent.com/pricing', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/app/public/screenshots/02_pricing.png', fullPage: false });
  console.log('2. Pricing');

  // Login - go to login page and fill form
  await page.goto('https://infinity-staging.preview.emergentagent.com/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Fill login credentials
  await page.fill('input[type="email"]', 'test_intake@infinitylegal.org');
  await page.fill('input[type="password"]', 'TestPass2026!');
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login
  await page.waitForTimeout(5000);
  console.log('Logged in, current URL:', page.url());

  // Set cookie/session - navigate to authenticated pages
  const pages = [
    { url: '/portal', name: '03_dashboard', label: 'Dashboard' },
    { url: '/portal/cases', name: '04_cases', label: 'Cases' },
    { url: '/portal/intakes', name: '05_intakes', label: 'AI Intakes' },
    { url: '/portal/leads', name: '06_leads', label: 'Leads Pipeline' },
    { url: '/portal/documents', name: '07_documents', label: 'Documents' },
    { url: '/portal/tasks', name: '08_tasks', label: 'Tasks' },
    { url: '/portal/calendar', name: '09_calendar', label: 'Calendar' },
    { url: '/portal/knowledge', name: '10_knowledge', label: 'Knowledge Base' },
    { url: '/portal/messages', name: '11_messages', label: 'Messages' },
  ];

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    try {
      await page.goto(`https://infinity-staging.preview.emergentagent.com${p.url}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // For intakes page, click "All" tab
      if (p.name === '05_intakes') {
        try { await page.click('button:text("all")', { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
      }
      
      await page.screenshot({ path: `/app/public/screenshots/${p.name}.png`, fullPage: false });
      const size = require('fs').statSync(`/app/public/screenshots/${p.name}.png`).size;
      console.log(`${i + 3}. ${p.label} (${Math.round(size/1024)}KB)`);
    } catch (err) {
      console.log(`Error on ${p.label}: ${err.message}`);
    }
  }

  await browser.close();
  console.log('All screenshots captured!');
})();
