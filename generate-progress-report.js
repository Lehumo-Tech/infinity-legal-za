const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport for consistent rendering
  await page.setViewportSize({ width: 1400, height: 900 });
  
  // Load the HTML report
  await page.goto('http://localhost:3000/progress-report.html', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Wait for fonts and images to load
  await page.waitForTimeout(3000);
  
  // Generate PDF
  await page.pdf({
    path: '/app/public/Infinity_Legal_Progress_Report.pdf',
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: {
      top: '0',
      right: '0',
      bottom: '0',
      left: '0'
    }
  });
  
  console.log('PDF generated successfully: /app/public/Infinity_Legal_Progress_Report.pdf');
  
  await browser.close();
})();
