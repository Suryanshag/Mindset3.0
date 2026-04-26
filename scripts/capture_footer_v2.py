from playwright.sync_api import sync_playwright

def capture_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})
        page.goto('http://localhost:3000', wait_until='networkidle')

        # Get total page height
        total_height = page.evaluate("document.body.scrollHeight")
        print(f"Total page height: {total_height}")

        # List all footer-like elements
        footers = page.query_selector_all('footer')
        print(f"Number of <footer> elements: {len(footers)}")
        for i, f in enumerate(footers):
            bb = f.bounding_box()
            print(f"  footer[{i}] bbox: {bb}")

        # Also check for divs that might be footer
        possible = page.evaluate("""
            () => {
                const elements = document.querySelectorAll('[class*="footer"], [id*="footer"]');
                return Array.from(elements).map(el => ({
                    tag: el.tagName,
                    className: el.className,
                    id: el.id,
                    rect: el.getBoundingClientRect(),
                    offsetTop: el.offsetTop
                }));
            }
        """)
        print(f"Elements with footer in class/id: {len(possible)}")
        for el in possible:
            print(f"  {el['tag']} class='{el['className']}' offsetTop={el['offsetTop']} rect={el['rect']}")

        # Scroll to bottom and screenshot
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)

        page.screenshot(path='/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_new.png', full_page=False)
        print("Saved footer_new.png (scrolled to bottom)")

        browser.close()

capture_footer()
