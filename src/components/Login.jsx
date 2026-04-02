import React, { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const s = {
    input: {
      width: '100%', padding: '11px 14px',
      background: 'rgba(28,25,23,0.8)', border: '1px solid #44403C',
      borderRadius: 8, color: '#FAFAF9', fontSize: 15,
      outline: 'none', fontFamily: 'DM Sans, sans-serif',
      transition: 'border-color 0.2s',
    },
    label: {
      display: 'block', fontSize: 12, fontWeight: 600,
      color: '#78716C', marginBottom: 7,
      textTransform: 'uppercase', letterSpacing: '0.07em'
    },
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--dark)', padding: 16,
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(245,158,11,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.03) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--amber)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(245,158,11,0.3)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="7" ry="3"/>
              <path d="M5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5"/>
              <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'Bebas Neue, sans-serif',
            fontSize: 36, letterSpacing: '0.05em',
            color: 'var(--amber)', lineHeight: 1, marginBottom: 6
          }}>KEG TRACKER</h1>
          <p style={{ color: '#78716C', fontSize: 14 }}>Sign in to continue</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#292524',
          border: '1px solid #3C3835',
          borderRadius: 14,
          padding: 32,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div>
              <label style={s.label}>Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={s.input}
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                onBlur={e => e.target.style.borderColor = '#44403C'}
              />
            </div>

            <div>
              <label style={s.label}>Password</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={s.input}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                onBlur={e => e.target.style.borderColor = '#44403C'}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 8, padding: '10px 14px',
                color: '#FCA5A5', fontSize: 13
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#92400E' : 'var(--amber)',
                color: '#1C1917', border: 'none', borderRadius: 8,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(245,158,11,0.25)',
                marginTop: 4,
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#44403C', fontSize: 12, marginTop: 24 }}>
          Contact your administrator to get access
        </p>
      </div>
    </div>
  )
}
