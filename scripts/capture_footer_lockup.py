from playwright.sync_api import sync_playwright

def capture_footer_lockup():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # Scroll to the bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)

        # Get the real site footer's top section bounding box
        top_section = page.query_selector('.block-footer__top')
        footer_root = page.query_selector('footer.block-footer')

        if not top_section or not footer_root:
            print("Could not find .block-footer__top or footer.block-footer")
            browser.close()
            return

        footer_box = footer_root.bounding_box()
        top_box = top_section.bounding_box()
        scroll_y = page.evaluate("window.scrollY")

        print(f"footer.block-footer viewport bbox: {footer_box}")
        print(f".block-footer__top viewport bbox:  {top_box}")
        print(f"scrollY: {scroll_y}")

        # Scroll so the footer top is near the top of the viewport
        page_abs_top = top_box['y'] + scroll_y
        target_scroll = max(0, page_abs_top - 60)
        page.evaluate(f"window.scrollTo(0, {target_scroll})")
        page.wait_for_timeout(400)

        # Re-measure after scroll
        footer_box = footer_root.bounding_box()
        top_box = top_section.bounding_box()
        scroll_y = page.evaluate("window.scrollY")
        print(f"After scroll — .block-footer__top viewport bbox: {top_box}, scrollY: {scroll_y}")

        # Add generous padding above and below the top section
        pad_top = 48
        pad_bottom = 48
        clip_y = max(0, top_box['y'] - pad_top)
        clip_height = top_box['height'] + pad_top + pad_bottom

        # Make sure we don't go below viewport
        viewport_h = 900
        if clip_y + clip_height > viewport_h:
            clip_height = viewport_h - clip_y

        clip = {
            'x': 0,
            'y': clip_y,
            'width': 1440,
            'height': clip_height
        }
        print(f"Clipping to: {clip}")

        page.screenshot(
            path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_lockup.png',
            clip=clip
        )
        print("Screenshot saved to screenshots/footer_lockup.png")
        browser.close()

capture_footer_lockup()
