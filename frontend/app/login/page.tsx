'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        router.push('/')
        router.refresh()
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (data.session) {
        // email confirmation is disabled — user is logged in immediately
        router.push('/')
        router.refresh()
      } else {
        setSuccess('Check your email and click the confirmation link to sign in.')
        setLoading(false)
      }
    }
  }

  return (
    <main className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm border-[0.5px] border-border bg-card p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-7 items-center justify-center bg-[#534AB7] text-white text-[11px] font-medium">AR</div>
          <p className="text-[13px] font-medium">Adaptive RAG</p>
        </div>
        {success ? (
          <div className="space-y-4">
            <p className="text-[13px] leading-5 text-secondary-foreground">{success}</p>
            <button
              onClick={() => { setSuccess(null); setMode('login') }}
              className="w-full bg-[#534AB7] py-2 text-[13px] text-white"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border-[0.5px] border-border bg-background px-3 py-2 text-[13px] outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border-[0.5px] border-border bg-background px-3 py-2 text-[13px] outline-none"
              />
              {error && <p className="text-[11px] text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#534AB7] py-2 text-[13px] text-white disabled:opacity-50"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null) }}
              className="mt-4 w-full text-[11px] text-muted-foreground"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </>
        )}
      </div>
    </main>
  )
}
