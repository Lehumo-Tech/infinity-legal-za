import asyncio
from playwright.async_api import async_playwright

async def capture_screenshots():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        
        base = 'http://localhost:3000'
        out = '/app/public/report-ss'
        
        # 1. Homepage hero
        await page.goto(base, wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/01_hero.png', full_page=False)
        print('1. Hero captured')
        
        # 2. Carousel (scroll down)
        await page.evaluate("window.scrollTo(0, 750)")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f'{out}/02_carousel.png', full_page=False)
        print('2. Carousel captured')
        
        # 3. Pricing page
        await page.goto(f'{base}/pricing', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/fresh_pricing.png', full_page=False)
        print('3. Pricing captured')
        
        # 4. Resources page
        await page.goto(f'{base}/resources', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/06_resources.png', full_page=False)
        print('4. Resources captured')
        
        # 5. Login page
        await page.goto(f'{base}/login', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{out}/07_login.png', full_page=False)
        print('5. Login captured')
        
        # 6. Resources templates + email gate
        await page.goto(f'{base}/resources?tab=templates', wait_until='networkidle', timeout=30000)
        await page.wait_for_timeout(2000)
        
        # Click download button to trigger email gate
        buttons = await page.query_selector_all('button')
        for btn in buttons:
            text = await btn.text_content()
            if text and 'Download Template' in text:
                await btn.click()
                break
        await page.wait_for_timeout(500)
        
        # Fill form
        name_input = await page.query_selector('input[type="text"]')
        email_input = await page.query_selector('input[type="email"]')
        if name_input and email_input:
            await name_input.fill('Demo Client')
            await email_input.fill('client@demo.com')
            submit = await page.query_selector('button[type="submit"]')
            if submit:
                await submit.click()
                await page.wait_for_timeout(2000)
        
        await page.screenshot(path=f'{out}/08_email_gate_success.png', full_page=False)
        print('6. Email gate success captured')
        
        await browser.close()
        print('All screenshots captured!')

asyncio.run(capture_screenshots())
