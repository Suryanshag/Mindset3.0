from playwright.sync_api import sync_playwright

def capture_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        # Use a taller viewport so the footer fits without clipping issues
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # Scroll all the way to the bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(700)

        scroll_y = page.evaluate("window.scrollY")
        scroll_height = page.evaluate("document.body.scrollHeight")
        viewport_height = 900
        print(f"scrollY={scroll_y}, scrollHeight={scroll_height}, viewport={viewport_height}")

        # Re-query footer bounding box AFTER scrolling (bbox is relative to current viewport)
        footer = page.query_selector('.block-footer')
        bb = footer.bounding_box()
        print(f"block-footer viewport-relative bbox: {bb}")

        # The footer top is at bb['y'] relative to current viewport top
        # If it's negative or above 0, we need to clip from 0
        clip_y = max(0, bb['y'])
        clip_height = min(900, bb['height'] - max(0, -bb['y']))

        print(f"Clipping: y={clip_y}, height={clip_height}")

        page.screenshot(
            path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png',
            full_page=False,
            clip={'x': 0, 'y': clip_y, 'width': 1440, 'height': clip_height}
        )
        print("Saved footer_new.png (clipped to footer area)")

        browser.close()

capture_footer()
