from playwright.sync_api import sync_playwright

def capture_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # The real footer (block-footer) starts at y=6146
        # Scroll so y=6146 is at the top of the viewport
        footer_top_y = 6146
        page.evaluate(f"window.scrollTo(0, {footer_top_y})")
        page.wait_for_timeout(600)

        page.screenshot(
            path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png',
            full_page=False
        )
        print("Saved footer_new.png — viewport starts at footer top")

        browser.close()

capture_footer()
