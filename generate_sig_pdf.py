"""Generate PDF version of the email signature using Playwright from live URL."""
import asyncio
from playwright.async_api import async_playwright

async def generate_pdf():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # Load from localhost (internal routing, images are hosted)
        await page.goto("http://localhost:3000/Tidimalo_Tsatsi_Email_Signature.html", wait_until="networkidle", timeout=15000)
        await page.wait_for_timeout(3000)
        
        # Generate PDF
        await page.pdf(
            path="/app/public/Tidimalo_Tsatsi_Email_Signature.pdf",
            format="A4",
            print_background=True,
            margin={
                "top": "20mm",
                "bottom": "20mm",
                "left": "15mm",
                "right": "15mm"
            }
        )
        print("PDF generated successfully from live URL!")
        
        await browser.close()

asyncio.run(generate_pdf())
