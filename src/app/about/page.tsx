import { Heart, Users, Lightbulb } from 'lucide-react'
import { FadeInSection, SlideInSection, StaggerChild } from '@/components/about/animated-sections'

export const metadata = {
  title: 'About Us — Mindset',
  description: 'Learn about Mindset and our mission to make mental health accessible.',
}

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="section-padding"
        style={{ background: 'linear-gradient(180deg, var(--cream) 0%, var(--background) 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1
            className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6"
            style={{ color: 'var(--coral)' }}
          >
            Making Mental Health
            <br />
            Accessible For All
          </h1>
          <p className="text-lg md:text-xl max-w-2xl leading-relaxed" style={{ color: 'var(--navy)' }}>
            We believe everyone deserves access to quality mental health care.
            Mindset is building a world where seeking help is a sign of strength.
          </p>
        </div>
      </section>

      {/* Mission Section — Two Column */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
              <div>
                <p
                  className="font-heading text-3xl md:text-4xl font-bold leading-snug"
                  style={{ color: 'var(--coral)' }}
                >
                  &ldquo;Mental health care should be accessible, affordable, and stigma-free.&rdquo;
                </p>
              </div>
              <div>
                <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--navy)' }}>
                  At Mindset, our mission is to bridge the gap between those who need support
                  and qualified mental health professionals, while building a community
                  that prioritizes emotional well-being.
                </p>
                <p className="text-base leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.75 }}>
                  We combine professional therapy sessions with community outreach,
                  educational resources, and wellness products to create a holistic
                  approach to mental health.
                </p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* About Mindset — Alternating Blocks */}
      <section
        className="section-padding"
        style={{ background: 'var(--cream)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <SlideInSection direction="left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2
                  className="font-heading text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: 'var(--navy)' }}
                >
                  One-on-One Therapy
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.8 }}>
                  Connect with experienced counselors and psychologists for
                  personalized therapy sessions. Our professionals specialize
                  in anxiety, depression, relationships, career stress, and more.
                </p>
              </div>
              <div
                className="h-48 md:h-64 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--teal)', opacity: 0.15 }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--teal)', opacity: 1 }}
                >
                  <Heart size={36} color="white" />
                </div>
              </div>
            </div>
          </SlideInSection>

          <SlideInSection direction="right">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="md:order-2">
                <h2
                  className="font-heading text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: 'var(--navy)' }}
                >
                  Community Outreach
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.8 }}>
                  Through NGO visits and workshops, we bring mental health awareness
                  to communities that need it most. Our outreach programs have
                  touched lives across multiple cities.
                </p>
              </div>
              <div
                className="h-48 md:h-64 rounded-2xl flex items-center justify-center md:order-1"
                style={{ background: 'var(--coral)', opacity: 0.15 }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--coral)', opacity: 1 }}
                >
                  <Users size={36} color="white" />
                </div>
              </div>
            </div>
          </SlideInSection>

          <SlideInSection direction="left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h2
                  className="font-heading text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: 'var(--navy)' }}
                >
                  Educational Resources
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.8 }}>
                  Access free and premium study materials, e-books, and self-help
                  resources curated by mental health professionals. Knowledge
                  is the first step toward healing.
                </p>
              </div>
              <div
                className="h-48 md:h-64 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--amber)', opacity: 0.15 }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--amber)', opacity: 1 }}
                >
                  <Lightbulb size={36} color="white" />
                </div>
              </div>
            </div>
          </SlideInSection>
        </div>
      </section>

      {/* Founder Section */}
      <section className="section-padding">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <div className="flex flex-col items-center text-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl mb-6"
                style={{ background: 'var(--teal)', color: 'white' }}
              >
                <span className="font-heading font-bold text-3xl">M</span>
              </div>
              <h2
                className="font-heading text-3xl md:text-4xl font-bold mb-2"
                style={{ color: 'var(--navy)' }}
              >
                Our Founder
              </h2>
              <div className="flex gap-2 mt-3 mb-6">
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--teal)', color: 'white', opacity: 0.9 }}
                >
                  Mental Health Advocate
                </span>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: 'var(--coral)', color: 'white', opacity: 0.9 }}
                >
                  Community Builder
                </span>
              </div>
              <p
                className="max-w-prose text-base leading-relaxed"
                style={{ color: 'var(--navy)', opacity: 0.8 }}
              >
                Our founder started Mindset with a vision to make mental health
                support available to everyone, regardless of their background or
                financial situation. With a deep commitment to community welfare
                and mental health advocacy, they have built a platform that
                combines professional therapy with grassroots outreach.
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Values Section */}
      <section
        className="section-padding"
        style={{ background: 'var(--cream)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection>
            <h2
              className="font-heading text-3xl md:text-4xl font-bold text-center mb-12"
              style={{ color: 'var(--navy)' }}
            >
              Our Values
            </h2>
          </FadeInSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StaggerChild index={0}>
              <div className="card-premium p-8 text-center h-full">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'var(--teal)', opacity: 0.15 }}
                >
                  <Heart size={26} style={{ color: 'var(--teal)' }} />
                </div>
                <h3
                  className="font-heading text-xl font-bold mb-3"
                  style={{ color: 'var(--navy)' }}
                >
                  Mental Health Awareness
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.7 }}>
                  We actively work to reduce stigma and increase understanding of
                  mental health through education and community engagement.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild index={1}>
              <div className="card-premium p-8 text-center h-full">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'var(--coral)', opacity: 0.15 }}
                >
                  <Users size={26} style={{ color: 'var(--coral)' }} />
                </div>
                <h3
                  className="font-heading text-xl font-bold mb-3"
                  style={{ color: 'var(--navy)' }}
                >
                  Accessibility
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.7 }}>
                  We strive to make quality mental health care affordable and
                  available to everyone who needs it.
                </p>
              </div>
            </StaggerChild>

            <StaggerChild index={2}>
              <div className="card-premium p-8 text-center h-full">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'var(--amber)', opacity: 0.15 }}
                >
                  <Lightbulb size={26} style={{ color: 'var(--amber)' }} />
                </div>
                <h3
                  className="font-heading text-xl font-bold mb-3"
                  style={{ color: 'var(--navy)' }}
                >
                  Community
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--navy)', opacity: 0.7 }}>
                  We believe in the power of community support and build programs
                  that bring people together for collective healing.
                </p>
              </div>
            </StaggerChild>
          </div>
        </div>
      </section>
    </div>
  )
}
