import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-gutter lg:px-page-margin py-4 lg:py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
          </div>
          <h1 className="text-headline font-bold text-primary">Drive Fusion</h1>
        </div>
        <div className="hidden lg:flex items-center gap-2 lg:gap-4">
          <Link
            href="/login"
            className="px-4 lg:px-6 py-3 text-on-surface-variant font-semibold hover:text-on-surface transition-colors min-h-[44px] flex items-center"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 lg:px-6 py-3 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-[16px] font-semibold premium-shadow hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all min-h-[44px] flex items-center"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-label mb-6 uppercase tracking-wider">
            Unified Cloud Storage
          </span>
          <h2 className="font-large-title text-large-title text-on-surface mb-4 leading-tight">
            One Cloud Drive.<br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Unlimited Possibilities.</span>
          </h2>
          <p className="text-body text-on-surface-variant mb-10 max-w-xl mx-auto">
            Connect all your Google Drives in one place. AI-powered search, smart organization, and unified storage analytics.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/signup"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] text-white rounded-[16px] font-bold premium-shadow hover:shadow-lg hover:shadow-primary/20 active:scale-95 transition-all text-body w-full sm:w-auto"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="px-6 sm:px-8 py-3 sm:py-4 border border-outline-variant/30 text-on-surface rounded-[16px] font-bold hover:bg-surface-container-low active:scale-95 transition-all text-body w-full sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* Background decoration */}
      <div className="fixed top-0 right-0 w-[200px] h-[200px] lg:w-[500px] lg:h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[150px] h-[150px] lg:w-[300px] lg:h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  )
}
