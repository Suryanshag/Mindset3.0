from playwright.sync_api import sync_playwright

OUTPUT = '/Users/suryansh/Documents/Mindset/Mindset3/screenshots/footer_logo.png'
URL    = 'http://localhost:3000'

def capture_footer_logo():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1440, 'height': 900})

        print(f"Navigating to {URL} ...")
        page.goto(URL, wait_until='networkidle')
        print("Network idle.")

        # Scroll to bottom so all lazy-loaded content is present
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)
        # Scroll back up slightly so footer is rendered with its normal paint
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(600)

        # Target the real site footer by its BEM class
        footer = page.query_selector('.block-footer')
        if not footer:
            print("ERROR: .block-footer element not found!")
            browser.close()
            return

        box = footer.bounding_box()
        print(f".block-footer bounding box: {box}")

        # Screenshot the footer element itself
        footer.screenshot(path=OUTPUT)
        print(f"Footer screenshot saved to {OUTPUT}")

        # --- Inspect brand logo ---
        logo = page.query_selector('.block-footer__brand-logo')
        if logo:
            logo_box  = logo.bounding_box()
            logo_vis  = page.evaluate("el => { const s = window.getComputedStyle(el); return { display: s.display, visibility: s.visibility, opacity: s.opacity, width: s.width, height: s.height }; }", logo)
            logo_src  = logo.get_attribute('src')
            logo_alt  = logo.get_attribute('alt')
            natural   = page.evaluate("el => ({ nw: el.naturalWidth, nh: el.naturalHeight })", logo)
            print(f"\n--- Brand Logo (.block-footer__brand-logo) ---")
            print(f"  src      : {logo_src}")
            print(f"  alt      : {logo_alt}")
            print(f"  bounding : {logo_box}")
            print(f"  styles   : {logo_vis}")
            print(f"  natural  : {natural}")
        else:
            print("No .block-footer__brand-logo element found.")

        # --- Inspect container left padding ---
        container = page.query_selector('.block-footer__container')
        if container:
            c_box     = container.bounding_box()
            c_padding = page.evaluate("""el => {
                const s = window.getComputedStyle(el);
                return { paddingLeft: s.paddingLeft, paddingRight: s.paddingRight };
            }""", container)
            print(f"\n--- Container (.block-footer__container) ---")
            print(f"  bounding : {c_box}")
            print(f"  padding  : {c_padding}")

        # --- Inspect brand column offset relative to footer ---
        brand = page.query_selector('.block-footer__brand')
        if brand and box:
            brand_box = brand.bounding_box()
            if brand_box:
                left_offset = brand_box['x'] - box['x']
                print(f"\n--- Brand column (.block-footer__brand) ---")
                print(f"  bounding       : {brand_box}")
                print(f"  left offset px : {left_offset:.1f}px from footer left edge")

        browser.close()
        print("\nDone.")

if __name__ == '__main__':
    capture_footer_logo()
