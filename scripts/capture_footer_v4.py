from playwright.sync_api import sync_playwright

def capture_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # Get the real footer element by class
        footer = page.query_selector('.block-footer')
        if footer:
            bb = footer.bounding_box()
            print(f"block-footer bounding box (absolute): {bb}")

            # Scroll so the very top of the footer aligns with the viewport top
            page.evaluate(f"window.scrollTo(0, {bb['y']})")
            page.wait_for_timeout(600)

            # Verify scroll position
            scroll_y = page.evaluate("window.scrollY")
            print(f"scrollY after scroll: {scroll_y}")

            page.screenshot(
                path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png',
                full_page=False
            )
            print("Saved footer_new.png")
        else:
            print("ERROR: .block-footer not found")

        browser.close()

capture_footer()
