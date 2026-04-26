from playwright.sync_api import sync_playwright

def capture_footer_sections(url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.goto(url, wait_until='networkidle')

        total_height = page.evaluate("document.body.scrollHeight")
        print(f"Total page height: {total_height}px")

        # Capture last 2160px in two 1080px chunks
        # Chunk 1: 2160px from bottom
        scroll_pos_1 = total_height - 2160
        page.evaluate(f"window.scrollTo(0, {scroll_pos_1})")
        page.wait_for_timeout(600)
        page.screenshot(
            path="/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_upper.png",
            full_page=False
        )
        print(f"Footer upper chunk saved (scrolled to {scroll_pos_1})")

        # Chunk 2: very bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(600)
        page.screenshot(
            path="/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_bottom.png",
            full_page=False
        )
        print(f"Footer bottom chunk saved")

        # Inspect DOM near the bottom for actual footer structure
        structure = page.evaluate("""
            () => {
                const body = document.body;
                const children = Array.from(body.children);
                return children.map(el => ({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className.substring(0, 80),
                    offsetTop: el.offsetTop,
                    offsetHeight: el.offsetHeight
                })).filter(el => el.offsetTop > 6000);
            }
        """)
        print("Elements after 6000px mark:")
        for el in structure:
            print(f"  <{el['tag']}> id='{el['id']}' class='{el['classes']}' top={el['offsetTop']} h={el['offsetHeight']}")

        browser.close()

capture_footer_sections("http://localhost:3000")
