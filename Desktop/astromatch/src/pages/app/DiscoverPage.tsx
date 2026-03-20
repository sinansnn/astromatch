import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase, type Profile } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getSign, calculateCompatibility, getElementColor, SIGNS } from '@/lib/astrology'

// ─── Compatibility ring SVG ───────────────────────────────────────────────────
function CompatRing({ score, color }: { score: number; color: string }) {
  const r = 26, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4"/>
        <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-white">{score}%</span>
      </div>
    </div>
  )
}

// ─── Profile Card ─────────────────────────────────────────────────────────────
function ProfileCard({
  profile, compatScore, signData, onSwipe, onAnonQuestion, isTop
}: {
  profile: Profile
  compatScore: number
  signData: any
  onSwipe: (dir: 'left' | 'right' | 'super') => void
  onAnonQuestion: () => void
  isTop: boolean
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const likeOpacity = useTransform(x, [30, 100], [0, 1])
  const passOpacity = useTransform(x, [-100, -30], [1, 0])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right')
    else if (info.offset.x < -100) onSwipe('left')
    else x.set(0)
  }

  if (!isTop) {
    return (
      <div className="absolute inset-0 rounded-3xl overflow-hidden scale-95 opacity-60"
        style={{ background: 'rgba(26,26,53,0.6)', border: '1px solid rgba(255,255,255,0.06)' }} />
    )
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Photo / Avatar area */}
      <div className="h-[55%] relative flex items-center justify-center"
        style={{ background: `linear-gradient(160deg, ${signData?.color}22, ${signData?.color}08)` }}>

        {profile.photos?.[0] ? (
          <img src={profile.photos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-8xl mb-2 animate-float" style={{ filter: `drop-shadow(0 0 30px ${signData?.color})` }}>
              {signData?.symbol}
            </div>
          </div>
        )}

        {/* Swipe indicators */}
        <motion.div style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 px-4 py-2 rounded-xl border-2 border-stellar-mint text-stellar-mint font-bold text-lg rotate-[-15deg]">
          LIKE ♥
        </motion.div>
        <motion.div style={{ opacity: passOpacity }}
          className="absolute top-6 right-6 px-4 py-2 rounded-xl border-2 border-red-400 text-red-400 font-bold text-lg rotate-[15deg]">
          PASS ✕
        </motion.div>

        {/* Compat badge */}
        <div className="absolute top-4 right-4">
          <CompatRing score={compatScore} color={signData?.color || '#E8C5FF'} />
        </div>

        {/* Location */}
        {profile.location_city && (
          <div className="absolute bottom-3 left-3 glass px-2 py-1 rounded-lg text-xs text-cosmos-muted flex items-center gap-1">
            📍 {profile.location_city}{profile.location_country ? `, ${profile.location_country}` : ''}
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="h-[45%] p-4 flex flex-col justify-between"
        style={{ background: 'linear-gradient(180deg, rgba(18,18,42,0.98), rgba(10,10,26,1))' }}>

        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-display text-2xl text-white">{profile.display_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span style={{ color: signData?.color }} className="text-sm font-medium">
                  {profile.sun_sign} {signData?.symbol}
                </span>
                {profile.element && (
                  <span className="text-cosmos-muted text-xs">· {profile.element}</span>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-cosmos-muted text-sm line-clamp-2 leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => onSwipe('left')}
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'rgba(255,80,80,0.12)', border: '1.5px solid rgba(255,80,80,0.3)' }}>
            ✕
          </button>

          <button onClick={onAnonQuestion}
            className="w-10 h-10 rounded-full flex items-center justify-center text-base transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'rgba(126,232,208,0.1)', border: '1.5px solid rgba(126,232,208,0.25)', color: '#7EE8D0' }}>
            🎭
          </button>

          <button onClick={() => onSwipe('super')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-base transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'rgba(255,179,71,0.1)', border: '1.5px solid rgba(255,179,71,0.25)' }}>
            ⭐
          </button>

          <button onClick={() => onSwipe('right')}
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-transform hover:scale-110 active:scale-95"
            style={{ background: 'rgba(100,200,100,0.12)', border: '1.5px solid rgba(100,200,100,0.3)', color: '#7EE8D0' }}>
            ♥
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Anon Question Modal ──────────────────────────────────────────────────────
function AnonQuestionModal({ target, onClose }: { target: Profile; onClose: () => void }) {
  const [question, setQuestion] = useState('')
  const [sent, setSent] = useState(false)
  const { user } = useAuthStore()

  const send = async () => {
    if (!question.trim() || !user) return
    await supabase.from('anon_questions').insert({
      sender_id: user.id,
      receiver_id: target.id,
      question: question.trim(),
    })
    setSent(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-bright w-full max-w-md rounded-3xl p-6"
      >
        {!sent ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🎭</div>
              <div>
                <h3 className="text-white font-semibold">Anonymous Question</h3>
                <p className="text-cosmos-muted text-xs">They won't know it's you</p>
              </div>
            </div>
            <textarea
              autoFocus
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder={`Ask ${target.display_name} something...`}
              className="input-field resize-none h-24 mb-4"
              maxLength={200}
            />
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 text-sm py-2.5">Cancel</button>
              <button onClick={send} disabled={!question.trim()}
                className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-40">
                Send 🎭
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-white font-semibold mb-2">Question sent!</h3>
            <p className="text-cosmos-muted text-sm mb-4">You'll be notified when they answer</p>
            <button onClick={onClose} className="btn-primary px-8 text-sm py-2.5">Done</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Main Discover Page ───────────────────────────────────────────────────────
export function DiscoverPage() {
  const { profile } = useAuthStore()
  const [anonTarget, setAnonTarget] = useState<Profile | null>(null)
  const qc = useQueryClient()

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['discover', profile?.id],
    queryFn: async () => {
      if (!profile) return []
      // Get users we haven't swiped yet
      const { data: swiped } = await supabase
        .from('swipes').select('to_user').eq('from_user', profile.id)
      const swipedIds = swiped?.map(s => s.to_user) || []

      let query = supabase.from('profiles')
        .select('*')
        .neq('id', profile.id)
        .eq('profile_complete', true)
        .eq('is_banned', false)
        .limit(20)

      if (swipedIds.length) query = query.not('id', 'in', `(${swipedIds.join(',')})`)

      const { data } = await query
      return (data || []) as Profile[]
    },
    enabled: !!profile,
  })

  const swipeMutation = useMutation({
    mutationFn: async ({ toUser, action }: { toUser: string; action: string }) => {
      await supabase.from('swipes').insert({
        from_user: profile!.id,
        to_user: toUser,
        action,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discover'] }),
  })

  const [cardIndex, setCardIndex] = useState(0)
  const current = candidates[cardIndex]
  const next = candidates[cardIndex + 1]

  const handleSwipe = (dir: 'left' | 'right' | 'super') => {
    if (!current) return
    const action = dir === 'right' ? 'like' : dir === 'super' ? 'super_like' : 'pass'
    swipeMutation.mutate({ toUser: current.id, action })
    if (dir === 'right') toast('💫 Liked!', { icon: '♥' })
    if (dir === 'super') toast('⭐ Super Liked!', { icon: '⭐' })
    setCardIndex(i => i + 1)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-spin-slow">🔮</div>
        <p className="text-cosmos-muted text-sm">Reading the stars...</p>
      </div>
    </div>
  )

  if (!current) return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🌙</div>
        <h3 className="font-display text-2xl text-white mb-2">You've seen everyone</h3>
        <p className="text-cosmos-muted text-sm">Check back later — the stars bring new souls daily</p>
      </div>
    </div>
  )

  const currentSign = getSign(current.sun_sign)
  const compatData = profile && currentSign
    ? calculateCompatibility(
        profile.sun_sign, profile.element || 'Fire', 'Fixed',
        current.sun_sign, current.element || 'Fire', currentSign.quality
      )
    : null

  return (
    <div className="page p-4">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="font-display text-2xl text-white">Discover</h2>
        <span className="text-cosmos-muted text-xs">{candidates.length - cardIndex} profiles left</span>
      </div>

      {/* Card stack */}
      <div className="relative flex-1" style={{ minHeight: 0 }}>
        {next && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden scale-[0.96] opacity-50 translate-y-2"
            style={{ background: 'rgba(26,26,53,0.5)', border: '1px solid rgba(255,255,255,0.04)' }} />
        )}
        <AnimatePresence>
          <ProfileCard
            key={current.id}
            profile={current}
            compatScore={compatData?.overall || 70}
            signData={currentSign}
            onSwipe={handleSwipe}
            onAnonQuestion={() => setAnonTarget(current)}
            isTop={true}
          />
        </AnimatePresence>
      </div>

      {/* Compat detail */}
      {compatData && (
        <div className="flex gap-2 mt-4">
          {compatData.breakdown.map(b => (
            <div key={b.label} className="flex-1 glass rounded-xl p-2 text-center">
              <p className="text-[10px] text-cosmos-muted">{b.label}</p>
              <p className="text-sm font-semibold" style={{ color: b.score >= 75 ? '#7EE8D0' : b.score >= 60 ? '#FFB347' : '#FF6B4A' }}>
                {b.score}%
              </p>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {anonTarget && (
          <AnonQuestionModal target={anonTarget} onClose={() => setAnonTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
