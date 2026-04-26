from playwright.sync_api import sync_playwright
from PIL import Image
import io

def capture_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # Take full-page screenshot as bytes
        full_bytes = page.screenshot(full_page=True)

        # The footer absolute coords from our earlier probe:
        # block-footer: x=0, y=6146, width=1440, height=738
        # block-footer__top: y=6227, height=290  (brand + columns section)
        footer_y = 6146
        footer_height = 739

        img = Image.open(io.BytesIO(full_bytes))
        print(f"Full page image size: {img.size}")  # (width, height)

        # Crop to footer region
        cropped = img.crop((0, footer_y, 1440, footer_y + footer_height))
        cropped.save('/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png')
        print(f"Saved footer_new.png, cropped size: {cropped.size}")

        browser.close()

capture_footer()
