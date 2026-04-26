from playwright.sync_api import sync_playwright

def capture_footer_zoomed(url, output_path):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.goto(url, wait_until='networkidle')

        # Get total page height
        total_height = page.evaluate("document.body.scrollHeight")
        print(f"Total page height: {total_height}px")

        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1000)

        # Take viewport screenshot at bottom
        page.screenshot(path=output_path, full_page=False)
        print(f"Footer screenshot saved: {output_path}")

        # Also get footer element bounds if it exists
        footer_info = page.evaluate("""
            () => {
                const footer = document.querySelector('footer');
                if (footer) {
                    const rect = footer.getBoundingClientRect();
                    return {
                        found: true,
                        scrollTop: window.scrollY,
                        top: rect.top,
                        bottom: rect.bottom,
                        height: rect.height,
                        innerHTML_preview: footer.innerHTML.substring(0, 500)
                    };
                }
                return { found: false };
            }
        """)
        print(f"Footer element info: {footer_info}")

        browser.close()

capture_footer_zoomed(
    "http://localhost:3000",
    "/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_zoomed.png"
)
