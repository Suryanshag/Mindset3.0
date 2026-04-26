import Navbar from '@/components/Navbar'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="relative h-screen flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: 'var(--cream)' }}
    >
      <Navbar />

      {/* ── Floating decorative shapes ── */}
      <img
        src="/images/blog-shape-1.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none"
        style={{
          width: 'clamp(100px, 14vw, 180px)',
          top: '6%',
          left: '-2%',
          opacity: 0.45,
          transform: 'rotate(-12deg)',
          animation: 'authFloat 8s ease-in-out infinite',
        }}
      />
      <img
        src="/images/hero-shape-1.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none hidden sm:block"
        style={{
          width: 'clamp(120px, 16vw, 220px)',
          top: '8%',
          right: '-3%',
          opacity: 0.3,
          transform: 'rotate(15deg)',
          animation: 'authFloat 10s ease-in-out 1s infinite reverse',
        }}
      />
      <img
        src="/images/blog-shape-2.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none hidden md:block"
        style={{
          width: 'clamp(80px, 10vw, 140px)',
          bottom: '10%',
          left: '5%',
          opacity: 0.3,
          transform: 'rotate(25deg)',
          animation: 'authFloat 9s ease-in-out 2s infinite',
        }}
      />
      <img
        src="/images/blog-shape-3.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none"
        style={{
          width: 'clamp(70px, 9vw, 120px)',
          bottom: '6%',
          right: '4%',
          opacity: 0.35,
          transform: 'rotate(-20deg)',
          animation: 'authFloat 7s ease-in-out 0.5s infinite reverse',
        }}
      />
      <img
        src="/images/blog-shape-4.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute select-none hidden lg:block"
        style={{
          width: 'clamp(60px, 8vw, 100px)',
          top: '50%',
          left: '3%',
          opacity: 0.2,
          transform: 'rotate(8deg)',
          animation: 'authFloat 11s ease-in-out 3s infinite',
        }}
      />


      {/* ── Form Card + Page Content ── */}
      <div className="relative z-10 w-full max-w-[720px] flex flex-col items-center">
        {children}
      </div>

      {/* ── Footer ── */}
      <p
        className="relative z-10 mt-4 text-xs text-center"
        style={{ color: 'rgba(30,68,92,0.3)' }}
      >
        &copy; {new Date().getFullYear()} Mindset. All rights reserved.
      </p>
    </div>
  )
}
