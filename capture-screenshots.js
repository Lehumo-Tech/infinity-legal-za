const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 960 } });
  const page = await context.newPage();
  const dir = '/app/public/client-ss';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  async function capture(url, name, label, opts = {}) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(opts.wait || 3000);
      if (opts.scroll) { await page.evaluate((y) => window.scrollBy(0, y), opts.scroll); await page.waitForTimeout(1000); }
      if (opts.click) { try { await page.click(opts.click, { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {} }
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
      const sz = fs.statSync(`${dir}/${name}.png`).size;
      console.log(`✅ ${label} (${Math.round(sz/1024)}KB)`);
    } catch (err) { console.log(`❌ ${label}: ${err.message.substring(0, 50)}`); }
  }

  const BASE = 'https://infinity-staging.preview.emergentagent.com';

  // Public pages
  await capture(BASE, '01_homepage', 'Homepage', { wait: 4000 });
  try { await page.click('button:text("Accept")', { timeout: 1500 }); } catch {}
  await page.evaluate(() => window.scrollBy(0, 700)); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${dir}/02_homepage_features.png`, fullPage: false }); console.log('✅ Homepage Features');

  await capture(`${BASE}/pricing`, '03_pricing', 'Pricing');
  await capture(`${BASE}/apply`, '04_apply', 'Apply', { wait: 4000 });
  await capture(`${BASE}/login`, '05_login', 'Login Page');

  // Login
  try {
    await page.fill('input[type="email"]', 'test_intake@infinitylegal.org');
    await page.fill('input[type="password"]', 'TestPass2026!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(5000);
    console.log('🔐 Logged in:', page.url());
  } catch (e) { console.log('Login error:', e.message); }

  // Portal pages
  await capture(`${BASE}/portal`, '06_dashboard', 'Dashboard');
  await capture(`${BASE}/portal/cases`, '07_cases', 'Cases');
  await capture(`${BASE}/portal/intakes`, '08_intakes', 'AI Intakes', { click: 'button:text("all")' });
  await capture(`${BASE}/portal/leads`, '09_leads', 'Leads Pipeline');
  await capture(`${BASE}/portal/documents`, '10_documents', 'Documents');
  await capture(`${BASE}/portal/tasks`, '11_tasks', 'Tasks');
  await capture(`${BASE}/portal/calendar`, '12_calendar', 'Calendar');
  await capture(`${BASE}/portal/knowledge`, '13_knowledge', 'Knowledge Base');
  await capture(`${BASE}/portal/billing`, '14_billing', 'Billing');
  await capture(`${BASE}/portal/hr`, '15_hr', 'HR Management');
  await capture(`${BASE}/portal/reports`, '16_reports', 'Reports');
  await capture(`${BASE}/portal/settings`, '17_settings', 'Settings');

  // Intakes detail
  try {
    await page.goto(`${BASE}/portal/intakes`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    try { await page.click('button:text("all")', { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
    try { await page.click('button:text("Details")', { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
    await page.screenshot({ path: `${dir}/18_intakes_detail.png`, fullPage: false });
    console.log('✅ Intakes Detail');
  } catch {}

  // Leads new form
  try {
    await page.goto(`${BASE}/portal/leads`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    try { await page.click('button:text("+ New Lead")', { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
    await page.screenshot({ path: `${dir}/19_leads_form.png`, fullPage: false });
    console.log('✅ Leads New Form');
  } catch {}

  await browser.close();
  console.log('🎉 Done!');
})();
