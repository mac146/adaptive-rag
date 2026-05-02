'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, ArrowRight, Sun, User, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const BAR_HEIGHTS = [14, 22, 36, 52, 70, 88, 106, 124, 138, 128, 110, 92, 76, 60, 48, 62, 80, 98, 118, 106, 82, 60, 42, 28, 18, 12]
const GITHUB_URL = 'https://github.com/mac146/adaptive-rag'

type AuthMode = 'login' | 'signup'

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  function openAuth(mode: AuthMode = 'login') {
    setAuthMode(mode)
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
    setShowAuth(true)
  }

  function closeAuth() {
    setShowAuth(false)
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
  }

  function handleCTAClick() {
    if (isLoggedIn) {
      router.push('/dashboard')
    } else {
      openAuth('login')
    }
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setSuccess('Check your email to confirm your account, then sign in.')
        setLoading(false)
      }
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden text-white"
      style={{
        background:
          'radial-gradient(ellipse 90% 80% at 68% 50%, #0d2045 0%, #071120 55%, #050912 100%)',
      }}
    >
      {/* Concentric arc decoration */}
      <svg
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-[56%]"
        viewBox="0 0 660 900"
        fill="none"
        preserveAspectRatio="xMaxYMid meet"
      >
        {[100, 195, 290, 385, 480, 575, 660].map((r) => (
          <circle
            key={r}
            cx="660"
            cy="450"
            r={r}
            stroke="rgba(255,255,255,0.048)"
            strokeWidth="1"
          />
        ))}
      </svg>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-10 py-6">
        <span className="text-[17px] font-bold tracking-tight">AdaptRAG</span>

        <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-1 backdrop-blur-sm">
          <a
            href="#how-it-works"
            className="rounded-full px-4 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white/90"
          >
            How it works
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-4 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white/90"
          >
            GitHub
          </a>
        </div>

        <button
          onClick={() => isLoggedIn ? router.push('/dashboard') : openAuth('login')}
          className="rounded-full border border-white/[0.18] bg-white/[0.05] px-5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.09] hover:text-white"
        >
          {isLoggedIn ? 'Go to App' : 'Sign in / Sign up'}
        </button>
      </nav>

      {/* Left floating icon buttons */}
      <div className="pointer-events-none absolute left-9 top-1/2 z-10 flex -translate-y-[58%] flex-col gap-5">
        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
          <User className="h-5 w-5 text-white/35" />
        </div>
        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
          <Sun className="h-5 w-5 text-white/35" />
        </div>
      </div>

      {/* Right floating icon */}
      <div className="pointer-events-none absolute right-[14%] top-[40%] z-10">
        <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04]">
          <Activity className="h-5 w-5 text-white/35" />
        </div>
      </div>

      {/* Hero */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-2 text-center">
        <p className="mb-5 text-[10.5px] font-semibold uppercase tracking-[0.26em] text-white/30">
          Structure-Aware Retrieval
        </p>

        <h1
          className="mx-auto mb-6 max-w-[800px] font-extrabold leading-[1.04] tracking-tight text-white"
          style={{ fontSize: 'clamp(2.6rem, 5.8vw, 4.4rem)' }}
        >
          Retrieve and Answer From Documents Like Never Before.
        </h1>

        <p className="mx-auto mb-10 max-w-[510px] text-[15px] leading-[1.72] text-white/45">
          Adaptive RAG profiles your document first, detecting structure, heading density,
          and section depth, then picks the retrieval strategy that actually fits instead of forcing a fixed one.
        </p>

        <button
          onClick={handleCTAClick}
          className="group flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.06] py-2.5 pl-6 pr-2.5 text-sm font-medium text-white/75 transition-all hover:bg-white/[0.1] hover:text-white"
        >
          {isLoggedIn ? 'Upload document' : 'Upload a document'}
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 transition-transform group-hover:scale-105">
            <ArrowRight className="h-4 w-4 text-white" />
          </span>
        </button>
      </main>

      <section
        id="how-it-works"
        className="relative z-10 mx-auto mb-24 w-full max-w-5xl px-6"
      >
        <div className="rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_60px_rgba(3,8,20,0.35)] backdrop-blur-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/38">
            How It Works
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Adaptive RAG adjusts retrieval before it answers.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68">
            When you upload a document, Adaptive RAG first analyzes its structure, sections,
            and heading quality. It then chooses the retrieval strategy that best fits that
            document and your question, so answers stay grounded in the right parts of the source
            instead of using a one-size-fits-all search flow.
          </p>
        </div>
      </section>

      {/* Bottom bar-chart decoration */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 z-0 flex -translate-x-1/2 items-end gap-[3px]">
        {BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="w-[10px] rounded-t-sm"
            style={{ height: `${h}px`, background: 'rgba(255,255,255,0.07)' }}
          />
        ))}
      </div>

      {/* Auth modal */}
      {showAuth && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeAuth() }}
        >
          <div className="relative w-full max-w-[360px] rounded-2xl border border-white/[0.1] bg-[#0b1929] p-8 shadow-2xl">
            <button
              onClick={closeAuth}
              className="absolute right-4 top-4 text-white/25 transition-colors hover:text-white/60"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#534AB7] text-[11px] font-bold text-white">
                AR
              </div>
              <span className="text-[14px] font-semibold text-white">Adaptive RAG</span>
            </div>

            {success ? (
              <div className="space-y-5">
                <p className="text-[13px] leading-5 text-white/55">{success}</p>
                <button
                  onClick={() => { setSuccess(null); setAuthMode('login') }}
                  className="w-full rounded-xl bg-[#534AB7] py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <h2 className="mb-5 text-[20px] font-bold text-white">
                  {authMode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-[13px] text-white placeholder-white/25 outline-none transition-colors focus:border-white/[0.22]"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-[13px] text-white placeholder-white/25 outline-none transition-colors focus:border-white/[0.22]"
                  />
                  {error && (
                    <p className="text-[11px] text-red-400">{error}</p>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#534AB7] py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {loading
                      ? 'Please wait...'
                      : authMode === 'login'
                      ? 'Sign in'
                      : 'Create account'}
                  </button>
                </form>

                <button
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login')
                    setError(null)
                  }}
                  className="mt-4 w-full text-center text-[11px] text-white/30 transition-colors hover:text-white/55"
                >
                  {authMode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Sign in'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
