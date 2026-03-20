import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'

export function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, signUp, signInWithGoogle, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email || !password) return toast.error('Please fill all fields')

    if (mode === 'signup') {
      const { error } = await signUp(email, password)
      if (error) return toast.error(error.message)
      toast.success('Check your email to verify your account ✉️')
    } else {
      const { error } = await signIn(email, password)
      if (error) return toast.error('Invalid credentials')
      navigate('/app')
    }
  }

  return (
    <div className="page items-center justify-center px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="text-6xl mb-4 animate-float">✨</div>
        <h1 className="font-display text-4xl text-white tracking-widest mb-2">ASTROMATCH</h1>
        <p className="text-cosmos-muted text-sm tracking-wider">Navigate love by the stars</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-bright w-full rounded-3xl p-6"
      >
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6 bg-cosmos-surface p-1">
          {(['signin', 'signup'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? 'bg-stellar-lavender text-cosmos-bg'
                  : 'text-cosmos-muted hover:text-white'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            className="input-field"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="input-field"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full font-body font-semibold"
          >
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-cosmos-border" />
          <span className="text-cosmos-muted text-xs">or continue with</span>
          <div className="flex-1 h-px bg-cosmos-border" />
        </div>

        <button
          onClick={() => signInWithGoogle()}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
      </motion.div>

      <p className="text-cosmos-muted text-xs text-center mt-6 px-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  )
}
