import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Set viewport
        await page.set_viewport_size({"width": 1400, "height": 900})
        
        # Load the HTML report
        await page.goto('http://localhost:3000/progress-report.html', 
                        wait_until='networkidle',
                        timeout=30000)
        
        # Wait for fonts and images
        await page.wait_for_timeout(3000)
        
        # Generate PDF
        await page.pdf(
            path='/app/public/Infinity_Legal_Progress_Report.pdf',
            format='A4',
            landscape=True,
            print_background=True,
            margin={
                'top': '0',
                'right': '0',
                'bottom': '0',
                'left': '0'
            }
        )
        
        print('PDF generated: /app/public/Infinity_Legal_Progress_Report.pdf')
        await browser.close()

asyncio.run(main())
