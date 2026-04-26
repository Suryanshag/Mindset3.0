from playwright.sync_api import sync_playwright

def capture_footer(url, output_path, viewport_width=1440, viewport_height=900):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
        page.goto(url, wait_until='networkidle')

        # Get full page height and footer absolute positions
        info = page.evaluate("""
            () => {
                const f = document.querySelector('footer.block-footer');
                const totalHeight = document.body.scrollHeight;
                const viewportHeight = window.innerHeight;
                if (!f) return {totalHeight, viewportHeight, found: false};
                const rect = f.getBoundingClientRect();
                const absTop = rect.top + window.scrollY;
                return {
                    found: true,
                    absTop: absTop,
                    height: rect.height,
                    totalHeight: totalHeight,
                    viewportHeight: viewportHeight
                };
            }
        """)
        print(f"Page info: {info}")

        if info and info['found']:
            footer_top = info['absTop']
            total_h = info['totalHeight']
            viewport_h = info['viewportHeight']

            # Scroll so the footer top is at the very top of the viewport
            scroll_target = int(footer_top)
            print(f"Scrolling to Y={scroll_target} (footer top), total page={total_h}, viewport={viewport_h}")

            page.evaluate(f"window.scrollTo({{top: {scroll_target}, behavior: 'instant'}})")
            page.wait_for_timeout(600)

            actual_scroll = page.evaluate("window.scrollY")
            print(f"Actual scrollY after scroll: {actual_scroll}")

            page.screenshot(path=output_path, full_page=False)
            print(f"Screenshot saved to {output_path}")
        else:
            print("block-footer not found")

        browser.close()

capture_footer(
    'http://localhost:3000',
    '/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_brand.png'
)
