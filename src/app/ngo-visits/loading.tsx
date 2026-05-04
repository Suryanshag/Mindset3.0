export default function Loading() {
  return (
    <div>
      <section
        className="py-12 md:py-16"
        style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--background) 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="ms-skel" style={{ height: '2.75rem', width: '14rem', borderRadius: '8px', marginBottom: '0.85rem' }} />
          <div className="ms-skel" style={{ height: '1rem', width: '32rem', maxWidth: '100%', borderRadius: '6px' }} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
    </div>
  )
}
