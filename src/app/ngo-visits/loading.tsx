import Navbar from '@/components/Navbar'
import MarketingFooter from '@/components/marketing-footer'

// Mirrors the page chrome so the loading transition doesn't flash a
// bare-Tailwind hero before /workshops-style chrome appears. The body
// skeleton matches the React-rendered cards on the real page.

export default function Loading() {
  return (
    <>
      <Navbar light />
      <main className="wp-block-group is-layout-flow wp-block-group-is-layout-flow">
        <div className="entry-content wp-block-post-content is-layout-flow wp-block-post-content-is-layout-flow">
          <section className="block-blog-hero">
            <div className="block-blog-hero__container container">
              <div className="block-blog-hero__heading-wrapper">
                <h1 className="block-blog-hero__heading">NGO Visits</h1>
                <h2 className="block-blog-hero__subheading">
                  Our community outreach brings mental health awareness to those
                  who need it most. See our impact and join our next drive.
                </h2>
              </div>
            </div>
          </section>

          <section className="block-blog-listing">
            <div className="block-blog-listing__container container">
              {/* Stats skeleton */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`ms-skel-card p-6 ${i === 2 ? 'hidden md:block' : ''}`}
                    style={{ minHeight: '120px' }}
                    aria-hidden
                  >
                    <div
                      className="ms-skel mx-auto mb-2"
                      style={{ height: '2.25rem', width: '3.5rem', borderRadius: '8px' }}
                    />
                    <div
                      className="ms-skel mx-auto"
                      style={{ height: '0.7rem', width: '8rem', borderRadius: '6px' }}
                    />
                  </div>
                ))}
              </div>

              {/* Cards skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" aria-label="Loading NGO visits">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="ms-skel-card overflow-hidden">
                    <div className="ms-skel" style={{ height: '16rem', width: '100%', borderRadius: 0 }} />
                    <div className="p-5 space-y-3">
                      <div className="ms-skel ms-skel-card__chip" />
                      <div className="ms-skel ms-skel-card__title" />
                      <div className="ms-skel ms-skel-card__line" />
                      <div className="ms-skel ms-skel-card__line ms-skel-card__line--short" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </>
  )
}
