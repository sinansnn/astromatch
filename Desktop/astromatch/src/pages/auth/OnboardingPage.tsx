import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'
import { getSunSign, getApproxMoonSign, getApproxRisingSign, SIGNS, getSign } from '@/lib/astrology'

type OnboardingData = {
  display_name: string
  birth_date: string
  birth_time: string
  birth_city: string
  birth_country: string
  gender: string
  looking_for: string[]
  purpose: 'romantic' | 'friendship' | 'both'
  bio: string
}

const STEPS = ['name', 'birth', 'identity', 'purpose', 'bio'] as const
type Step = typeof STEPS[number]

const variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    display_name: '', birth_date: '', birth_time: '',
    birth_city: '', birth_country: '', gender: '',
    looking_for: [], purpose: 'both', bio: '',
  })
  const { updateProfile, user } = useAuthStore()
  const navigate = useNavigate()

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  const sunSign = data.birth_date ? getSunSign(data.birth_date) : null
  const signData = sunSign ? getSign(sunSign) : null

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const finish = async () => {
    if (!data.display_name) return toast.error('Please enter your name')
    if (!data.birth_date) return toast.error('Please enter your birth date')

    const sunSign = getSunSign(data.birth_date)
    const moonSign = getApproxMoonSign(data.birth_date)
    const risingSign = getApproxRisingSign(data.birth_date, data.birth_time)
    const signInfo = getSign(sunSign)
    const element = signInfo?.element || 'Fire'

    const { error } = await updateProfile({
      display_name: data.display_name,
      birth_date: data.birth_date,
      birth_time: data.birth_time || undefined,
      birth_city: data.birth_city || undefined,
      birth_country: data.birth_country || undefined,
      gender: data.gender || undefined,
      looking_for: data.looking_for.length > 0 ? data.looking_for : ['Everyone'],
      purpose: data.purpose,
      bio: data.bio || undefined,
      sun_sign: sunSign,
      moon_sign: moonSign,
      rising_sign: risingSign,
      element: element,
      profile_complete: true,
    })

    if (error) {
      console.error('Profile error:', error)
      return toast.error('Something went wrong, please try again')
    }
    toast.success('Welcome to AstroMatch! ✨')
    navigate('/app')
  }

  return (
    <div className="page px-5 py-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-cosmos-muted text-xs">{step + 1} of {STEPS.length}</span>
          {step > 0 && (
            <button onClick={back} className="text-cosmos-muted text-sm hover:text-white transition-colors">
              ← Back
            </button>
          )}
        </div>
        <div className="h-1 bg-cosmos-border rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #E8C5FF, #7EE8D0)' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          {/* STEP: Name */}
          {currentStep === 'name' && (
            <div>
              <div className="text-4xl mb-6">👋</div>
              <h2 className="font-display text-3xl text-white mb-2">What's your name?</h2>
              <p className="text-cosmos-muted mb-8">This is how you'll appear to others</p>
              <input
                autoFocus
                value={data.display_name}
                onChange={e => setData({ ...data, display_name: e.target.value })}
                placeholder="Your first name"
                className="input-field text-lg mb-6"
                maxLength={30}
                onKeyDown={e => e.key === 'Enter' && data.display_name && next()}
              />
              <button
                onClick={next}
                disabled={!data.display_name}
                className="btn-primary w-full disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP: Birth */}
          {currentStep === 'birth' && (
            <div>
              <div className="text-4xl mb-6">🌟</div>
              <h2 className="font-display text-3xl text-white mb-2">Your birth details</h2>
              <p className="text-cosmos-muted mb-8">We need this to calculate your birth chart</p>

              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs text-cosmos-muted mb-1 block">Birth Date *</label>
                  <input
                    type="date"
                    value={data.birth_date}
                    onChange={e => setData({ ...data, birth_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-cosmos-muted mb-1 block">Birth Time (optional)</label>
                  <input
                    type="time"
                    value={data.birth_time}
                    onChange={e => setData({ ...data, birth_time: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs text-cosmos-muted mb-1 block">Birth City</label>
                  <input
                    value={data.birth_city}
                    onChange={e => setData({ ...data, birth_city: e.target.value })}
                    placeholder="e.g. Istanbul, Tokyo, New York"
                    className="input-field"
                  />
                </div>
              </div>

              {signData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl p-4 mb-6 text-center"
                >
                  <div className="text-5xl mb-2">{signData.symbol}</div>
                  <p className="text-white font-semibold">{signData.name}</p>
                  <p className="text-cosmos-muted text-xs mt-1">{signData.element} · {signData.quality}</p>
                </motion.div>
              )}

              <button
                onClick={next}
                disabled={!data.birth_date}
                className="btn-primary w-full disabled:opacity-40"
              >
                Continue →
              </button>
            </div>
          )}

          {/* STEP: Identity */}
          {currentStep === 'identity' && (
            <div>
              <div className="text-4xl mb-6">🪞</div>
              <h2 className="font-display text-3xl text-white mb-2">About you</h2>
              <p className="text-cosmos-muted mb-8">Help others find you</p>

              <div className="mb-6">
                <label className="text-xs text-cosmos-muted mb-2 block">I am</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Man', 'Woman', 'Non-binary', 'Other'].map(g => (
                    <button
                      key={g}
                      onClick={() => setData({ ...data, gender: g })}
                      className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                        data.gender === g
                          ? 'border-stellar-lavender bg-stellar-lavender/10 text-stellar-lavender'
                          : 'border-cosmos-border text-cosmos-muted hover:border-cosmos-muted'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs text-cosmos-muted mb-2 block">Interested in</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Men', 'Women', 'Non-binary', 'Everyone'].map(opt => {
                    const selected = data.looking_for.includes(opt)
                    return (
                      <button
                        key={opt}
                        onClick={() => setData({
                          ...data,
                          looking_for: selected
                            ? data.looking_for.filter(x => x !== opt)
                            : [...data.looking_for, opt]
                        })}
                        className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                          selected
                            ? 'border-stellar-mint bg-stellar-mint/10 text-stellar-mint'
                            : 'border-cosmos-border text-cosmos-muted hover:border-cosmos-muted'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button onClick={next} className="btn-primary w-full">Continue →</button>
            </div>
          )}

          {/* STEP: Purpose */}
          {currentStep === 'purpose' && (
            <div>
              <div className="text-4xl mb-6">🎯</div>
              <h2 className="font-display text-3xl text-white mb-2">What are you looking for?</h2>
              <p className="text-cosmos-muted mb-8">Be honest — it helps the stars align ✨</p>

              <div className="space-y-3 mb-8">
                {([
                  { value: 'romantic', icon: '💑', label: 'Romantic Connection', desc: 'Love, dating, partnership' },
                  { value: 'friendship', icon: '🤝', label: 'Friendship', desc: 'Meaningful connections, platonic' },
                  { value: 'both', icon: '✨', label: 'Open to both', desc: "I'll know it when I feel it" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setData({ ...data, purpose: opt.value })}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      data.purpose === opt.value
                        ? 'border-stellar-lavender bg-stellar-lavender/10'
                        : 'border-cosmos-border hover:border-cosmos-muted'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className={`font-medium ${data.purpose === opt.value ? 'text-stellar-lavender' : 'text-white'}`}>{opt.label}</p>
                      <p className="text-cosmos-muted text-xs mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={next} className="btn-primary w-full">Continue →</button>
            </div>
          )}

          {/* STEP: Bio */}
          {currentStep === 'bio' && (
            <div>
              <div className="text-4xl mb-6">✍️</div>
              <h2 className="font-display text-3xl text-white mb-2">Tell your story</h2>
              <p className="text-cosmos-muted mb-8">What should people know about you?</p>

              <div className="relative mb-6">
                <textarea
                  value={data.bio}
                  onChange={e => setData({ ...data, bio: e.target.value })}
                  placeholder="I'm a... who loves... looking for someone who..."
                  className="input-field resize-none h-32"
                  maxLength={300}
                />
                <span className="absolute bottom-3 right-3 text-xs text-cosmos-muted">
                  {data.bio.length}/300
                </span>
              </div>

              <button
                onClick={finish}
                className="btn-primary w-full text-base font-semibold"
              >
                Launch into the cosmos 🚀
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
