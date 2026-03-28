const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Navigate to the HTML report
  await page.goto('https://demo-staging-1.preview.emergentagent.com/progress-report-feb2026.html', {
    waitUntil: 'networkidle',
    timeout: 30000
  });
  
  // Wait for images to load
  await page.waitForTimeout(3000);
  
  // Generate PDF
  await page.pdf({
    path: '/app/public/Infinity_Legal_Feb2026_Report.pdf',
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });
  
  console.log('PDF generated successfully at /app/public/Infinity_Legal_Feb2026_Report.pdf');
  await browser.close();
})();
