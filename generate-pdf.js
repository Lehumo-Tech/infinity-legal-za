const { chromium } = require('/usr/lib/node_modules/@playwright/test/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(__dirname, 'public', 'test-report.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  
  // Wait for fonts to load
  await page.waitForTimeout(2000);
  
  const outputPath = path.resolve(__dirname, 'public', 'Infinity_Legal_Test_Report.pdf');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  
  console.log(`PDF generated: ${outputPath}`);
  await browser.close();
})();
