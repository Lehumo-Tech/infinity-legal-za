import asyncio
from playwright.async_api import async_playwright

async def generate_pdf():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto(
            'http://localhost:3000/progress-report-mar2026.html',
            wait_until='networkidle',
            timeout=30000
        )
        await page.wait_for_timeout(4000)
        
        await page.pdf(
            path='/app/public/Infinity_Legal_Mar2026_Report.pdf',
            format='A4',
            print_background=True,
            margin={'top': '0', 'right': '0', 'bottom': '0', 'left': '0'},
            prefer_css_page_size=True,
        )
        
        print('PDF generated successfully!')
        await browser.close()

asyncio.run(generate_pdf())
