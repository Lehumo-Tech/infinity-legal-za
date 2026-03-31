const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 960 } });
  const page = await context.newPage();
  const dir = '/app/public/update-ss';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const BASE = 'https://infinity-legal-sa-1.preview.emergentagent.com';

  async function snap(name, label) {
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
    console.log(`✅ ${label}`);
  }

  // --- INTAKE WIZARD ---
  await page.goto(`${BASE}/intake`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('01_intake_step1_empty', 'Intake Step 1 Empty');

  // Fill Step 1
  await page.fill('#firstName', 'Tidimalo');
  await page.fill('#lastName', 'Tsatsi');
  await page.fill('#email', 'tidimalo@infinitylegal.co.za');
  await page.fill('#phone', '+27821234567');
  await snap('02_intake_step1_filled', 'Intake Step 1 Filled');

  await page.click('button:text("Continue")', { force: true });
  await page.waitForTimeout(1500);
  await snap('03_intake_step2', 'Intake Step 2 - Case Details');

  // Fill Step 2 - use keyboard for selects
  try {
    const triggers = await page.$$('[role="combobox"]');
    if (triggers[0]) {
      await triggers[0].click({ force: true });
      await page.waitForTimeout(500);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    if (triggers[1]) {
      await triggers[1].click({ force: true });
      await page.waitForTimeout(500);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  } catch(e) { console.log('Select fill:', e.message.substring(0,40)); }
  await page.fill('#description', 'My employer dismissed me without any warning or due process after 5 years of dedicated service at the company. I was given no written reason and told to leave the premises immediately. I believe this constitutes unfair dismissal under the Labour Relations Act.');
  await snap('04_intake_step2_filled', 'Intake Step 2 Filled');

  await page.click('button:text("Continue")', { force: true });
  await page.waitForTimeout(1500);
  await snap('05_intake_step3', 'Intake Step 3 - Parties');

  // Fill Step 3
  await page.fill('#opposingParty', 'ABC Mining (Pty) Ltd');
  await page.fill('#opposingPartyContact', 'hr@abcmining.co.za');
  await page.fill('#witnesses', 'John Smith (colleague) - 082 555 1234\nSarah Mokoena (supervisor) - 083 444 5678');
  await page.click('button:text("Continue")', { force: true });
  await page.waitForTimeout(1500);
  await snap('06_intake_step4', 'Intake Step 4 - Documents');

  // Fill Step 4
  await page.fill('#incidentDate', '2026-03-15');
  await page.click('#hasDocuments', { force: true });
  await page.waitForTimeout(500);
  try { await page.fill('#documentList', 'Employment contract, dismissal letter, 3 months payslips, WhatsApp messages with HR'); } catch {}
  await page.click('button:text("Continue")', { force: true });
  await page.waitForTimeout(1500);
  await snap('07_intake_step5', 'Intake Step 5 - Consent');

  // Confirmation page
  await page.goto(`${BASE}/intake/confirmation?caseId=IL-2026-0250`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('08_confirmation', 'Confirmation Page');

  // --- PORTAL PAGES ---
  // Login
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'test_intake@infinitylegal.org');
  await page.fill('input[type="password"]', 'TestPass2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('🔐 Logged in');

  // Dashboard
  await page.goto(`${BASE}/portal`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('09_dashboard', 'Dashboard');

  // Cases
  await page.goto(`${BASE}/portal/cases`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('10_cases', 'Cases');

  // AI Intakes
  await page.goto(`${BASE}/portal/intakes`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  try { await page.click('button:text("all")', { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
  await snap('11_intakes', 'AI Intakes');

  // Intakes detail
  try { await page.click('button:text("Details")', { force: true, timeout: 2000 }); await page.waitForTimeout(1500); } catch {}
  await snap('12_intakes_detail', 'Intakes Detail');

  // Leads
  await page.goto(`${BASE}/portal/leads`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('13_leads', 'Leads Pipeline');

  // Documents
  await page.goto(`${BASE}/portal/documents`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('14_documents', 'Documents');

  // Tasks
  await page.goto(`${BASE}/portal/tasks`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('15_tasks', 'Tasks');

  // Calendar
  await page.goto(`${BASE}/portal/calendar`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('16_calendar', 'Calendar');

  // Knowledge Base
  await page.goto(`${BASE}/portal/knowledge`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('17_knowledge', 'Knowledge Base');

  // Homepage
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  await snap('18_homepage', 'Homepage');

  // Pricing
  await page.goto(`${BASE}/pricing`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await snap('19_pricing', 'Pricing');

  await browser.close();
  console.log('🎉 All done!');
})();
