import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { APP_NAME } from '@/lib/constants'

/** Auth page — magic link login, MECH DS styled. */
export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })

    setLoading(false)

    if (supabaseError) {
      setError(supabaseError.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-mech-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-mech-dark flex items-center justify-center flex-shrink-0">
            <span className="font-mono text-mech-paper text-sm font-bold">M</span>
          </div>
          <span className="font-grotesk font-bold text-display-md text-mech-dark tracking-tight">
            MECH <span className="text-mech-ink-50 font-medium">Finance</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-mech-paper-secondary border border-mech-ink-20 p-6">
          {sent ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 font-mono text-xs uppercase tracking-[0.08em] border border-mech-signal-green text-mech-signal-green bg-[rgba(46,204,113,0.08)]">
                  SENT
                </span>
              </div>
              <h2 className="font-grotesk font-semibold text-display-sm text-mech-dark">
                Check your email
              </h2>
              <p className="font-poppins text-body-md text-mech-ink-80">
                Magic link sent to <span className="font-medium text-mech-dark">{email}</span>.
                Click it to sign in.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-2 font-grotesk text-sm text-mech-ink-80 underline underline-offset-2 decoration-mech-ink-20 hover:text-mech-dark hover:decoration-mech-dark transition-colors duration-instant text-left"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <h2 className="font-grotesk font-semibold text-display-sm text-mech-dark mb-1">
                  Sign in
                </h2>
                <p className="font-poppins text-body-sm text-mech-ink-50">
                  {APP_NAME} · No password required.
                </p>
              </div>

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="font-grotesk font-medium text-xs uppercase tracking-[0.08em] text-mech-ink-80"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 bg-mech-paper text-mech-dark font-poppins text-sm border border-mech-ink-20 placeholder:text-mech-ink-50 transition-colors duration-instant focus:outline-none focus:border-2 focus:border-mech-orange"
                />
              </div>

              {error && (
                <p className="font-poppins text-body-sm text-mech-signal-red">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-mech-orange text-white font-grotesk font-medium text-sm tracking-[0.01em] border-2 border-mech-orange transition-opacity duration-fast hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Working...' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 font-mono text-mono-sm text-mech-ink-50 uppercase tracking-[0.10em] text-center">
          THE MECH STUDIO · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
