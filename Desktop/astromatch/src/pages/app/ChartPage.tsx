// ChartPage.tsx
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth'
import { getSign, SIGNS, PLANETS } from '@/lib/astrology'

export function ChartPage() {
  const { profile } = useAuthStore()
  const signData = profile ? getSign(profile.sun_sign) : null

  if (!profile) return null

  const planets = [
    { label: '☀️ Sun',     sign: profile.sun_sign,     house: '1st House' },
    { label: '🌙 Moon',    sign: profile.moon_sign,    house: '4th House' },
    { label: '⬆️ Rising',  sign: profile.rising_sign,  house: 'Ascendant' },
  ].filter(p => p.sign)

  return (
    <div className="page overflow-y-auto px-5 py-4">
      <h2 className="font-display text-2xl text-white mb-4">Birth Chart</h2>

      {/* Chart visual */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-bright rounded-3xl p-6 mb-4 text-center"
        style={{ border: `1px solid ${signData?.color}22` }}
      >
        <div className="relative w-44 h-44 mx-auto mb-4">
          <svg viewBox="0 0 176 176" className="w-full h-full">
            {/* Rings */}
            {[80, 62, 44, 26].map((r, i) => (
              <circle key={i} cx="88" cy="88" r={r} fill="none"
                stroke={i === 0 ? `${signData?.color}30` : 'rgba(255,255,255,0.06)'}
                strokeWidth={i === 0 ? 1.5 : 1} />
            ))}
            {/* House lines */}
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i * 30 - 90) * Math.PI / 180
              return <line key={i} x1={88 + 26 * Math.cos(a)} y1={88 + 26 * Math.sin(a)}
                x2={88 + 80 * Math.cos(a)} y2={88 + 80 * Math.sin(a)}
                stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
            })}
            {/* Signs on outer ring */}
            {SIGNS.map((s, i) => {
              const a = (i * 30 - 75) * Math.PI / 180
              const isActive = s.name === profile.sun_sign || s.name === profile.moon_sign || s.name === profile.rising_sign
              return <text key={i} x={88 + 70 * Math.cos(a)} y={88 + 70 * Math.sin(a)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isActive ? 11 : 8}
                fill={isActive ? signData?.color : 'rgba(200,180,240,0.35)'}
                style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                {s.symbol}
              </text>
            })}
            {/* Center */}
            <circle cx="88" cy="88" r="22" fill={`${signData?.color}15`} stroke={signData?.color} strokeWidth="1.5"/>
            <text x="88" y="88" textAnchor="middle" dominantBaseline="middle"
              fontSize="22" fill={signData?.color}>{signData?.symbol}</text>
          </svg>
        </div>
        <h3 className="font-display text-xl text-white">{profile.display_name}</h3>
        <p className="text-cosmos-muted text-xs mt-1">{profile.birth_date} · {profile.birth_city}</p>
      </motion.div>

      {/* Planet list */}
      <div className="space-y-2">
        {planets.map((p, i) => {
          const ps = getSign(p.sign!)
          return (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-4 flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${ps?.color}20`, border: `1px solid ${ps?.color}40` }}>
                {ps?.symbol}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-white text-sm font-medium">{p.label}</span>
                  <span className="text-sm font-semibold" style={{ color: ps?.color }}>{p.sign}</span>
                </div>
                <p className="text-cosmos-muted text-xs mt-0.5">{p.house} · {ps?.element}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────
import { useState } from 'react'
import toast from 'react-hot-toast'

export function ProfilePage() {
  const { profile, updateProfile, signOut } = useAuthStore()
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const signData = profile ? getSign(profile.sun_sign) : null

  const save = async () => {
    setSaving(true)
    const { error } = await updateProfile({ bio })
    if (!error) toast.success('Profile updated ✨')
    setSaving(false)
  }

  if (!profile) return null

  return (
    <div className="page overflow-y-auto px-5 py-4">
      <h2 className="font-display text-2xl text-white mb-4">Profile</h2>

      {/* Avatar */}
      <div className="text-center mb-6">
        <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl mb-3"
          style={{ background: `${signData?.color}22`, border: `2px solid ${signData?.color}44`,
            boxShadow: `0 0 30px ${signData?.color}22` }}>
          {signData?.symbol}
        </div>
        <h3 className="font-display text-xl text-white">{profile.display_name}</h3>
        <p style={{ color: signData?.color }} className="text-sm mt-1">
          {profile.sun_sign} · {profile.element}
        </p>
      </div>

      {/* Bio edit */}
      <div className="glass-bright rounded-2xl p-4 mb-4">
        <label className="text-xs text-cosmos-muted mb-2 block uppercase tracking-wider">About Me</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          className="input-field resize-none h-24 text-sm mb-3"
          maxLength={300}
          placeholder="Tell the world about yourself..."
        />
        <button onClick={save} disabled={saving} className="btn-primary w-full text-sm py-2.5">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Sun', value: profile.sun_sign },
          { label: 'Moon', value: profile.moon_sign || '—' },
          { label: 'Rising', value: profile.rising_sign || '—' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <p className="text-cosmos-muted text-xs mb-1">{s.label}</p>
            <p className="text-white text-xs font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={signOut} className="btn-ghost w-full text-sm py-3 text-red-400 border-red-400/20 hover:bg-red-400/10">
        Sign Out
      </button>
    </div>
  )
}
