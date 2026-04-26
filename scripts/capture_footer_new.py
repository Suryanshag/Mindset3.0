from playwright.sync_api import sync_playwright

def capture_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # Scroll to the very bottom of the page
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1000)  # wait for any animations/lazy loads

        # Get the footer element's bounding box
        footer = page.query_selector('footer')
        if footer:
            bbox = footer.bounding_box()
            print(f"Footer bounding box: {bbox}")

            # Scroll so the top of the footer is near the top of the viewport
            page.evaluate(f"window.scrollTo(0, {bbox['y']})")
            page.wait_for_timeout(500)

            # Take a full screenshot of the current viewport (showing footer from top)
            page.screenshot(path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png', full_page=False)
            print("Screenshot saved to footer_new.png")
        else:
            print("No <footer> element found, taking bottom-of-page screenshot instead")
            page.screenshot(path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png', full_page=False)

        browser.close()

capture_footer()
