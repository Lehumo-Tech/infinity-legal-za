import asyncio
from playwright.async_api import async_playwright

async def capture_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        base = 'http://localhost:3000'
        out = '/app/public/report-ss'
        
        await page.goto(base, wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/01_hero.png', full_page=False)
        print('1. Hero')
        
        await page.evaluate("window.scrollTo(0, 750)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f'{out}/02_ai_intake_cta.png', full_page=False)
        print('2. AI Intake CTA')

        await page.evaluate("window.scrollTo(0, 2800)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=f'{out}/04_plans.png', full_page=False)
        print('3. Plans section')
        
        await page.goto(f'{base}/pricing', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/05_pricing.png', full_page=False)
        print('4. Pricing page')
        
        await page.goto(f'{base}/login', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/06_login.png', full_page=False)
        print('5. Login')
        
        await page.goto(f'{base}/intake', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/07_intake.png', full_page=False)
        print('6. Intake')
        
        await browser.close()
        print('Done!')

asyncio.run(capture_screenshots())
