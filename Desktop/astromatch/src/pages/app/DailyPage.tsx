import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getSign } from '@/lib/astrology'

export function DailyPage() {
  const { profile } = useAuthStore()
  const [aiContent, setAiContent] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const signData = profile ? getSign(profile.sun_sign) : null

  const { data: horoscope } = useQuery({
    queryKey: ['horoscope', profile?.sun_sign],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase.from('daily_horoscopes')
        .select('*').eq('sign', profile!.sun_sign).eq('date', today).single()
      return data
    },
    enabled: !!profile,
  })

  const generateAIContent = async () => {
    if (!profile || loading) return
    setLoading(true)
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 600,
          system: `You are a witty, insightful astrologer. Generate a daily reading. Respond ONLY with valid JSON, no markdown.`,
          messages: [{
            role: 'user',
            content: `Generate a daily reading for ${profile.display_name}, a ${profile.sun_sign} (${profile.element} element). Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.
            
Return JSON: {"morning": "2 sentence morning energy message", "love": "love/connection insight today", "energy_level": 1-10, "do": ["thing1","thing2","thing3"], "dont": ["thing1","thing2"], "lucky_color": "color name", "mantra": "short daily mantra"}`
          }]
        })
      })
      const data = await resp.json()
      const text = data.content?.[0]?.text || '{}'
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setAiContent(parsed)
    } catch {
      setAiContent({
        morning: `The stars are aligned in your favor today, ${profile.display_name}. Your ${profile.element} energy burns bright.`,
        love: 'Open your heart to unexpected connections today.',
        energy_level: 7,
        do: ['Trust your intuition', 'Reach out to someone new', 'Spend time outdoors'],
        dont: ['Overthink decisions', 'Avoid difficult conversations'],
        lucky_color: 'Deep purple',
        mantra: 'I am aligned with the universe'
      })
    }
    setLoading(false)
  }

  const content = aiContent || horoscope

  return (
    <div className="page overflow-y-auto">
      <div className="px-5 pt-4 pb-6 space-y-4">
        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-bright rounded-3xl p-5 text-center"
          style={{ border: `1px solid ${signData?.color}22` }}
        >
          <div className="text-5xl mb-3 animate-float"
            style={{ filter: `drop-shadow(0 0 20px ${signData?.color})` }}>
            {signData?.symbol}
          </div>
          <h2 className="font-display text-2xl text-white mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h2>
          <p style={{ color: signData?.color }} className="text-sm font-medium">
            {profile?.sun_sign} · {profile?.element} Energy
          </p>
        </motion.div>

        {/* Generate button */}
        {!content && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={generateAIContent}
            disabled={loading}
            className="w-full btn-primary py-4 text-base font-semibold"
          >
            {loading ? '🔮 Reading the stars...' : '✨ Get My Daily Reading'}
          </motion.button>
        )}

        {/* Content */}
        {content && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Morning message */}
            {content.morning && (
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>🌅</span>
                  <span className="text-xs text-cosmos-muted font-medium uppercase tracking-wider">Morning Energy</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{content.morning}</p>
              </div>
            )}

            {/* Energy level */}
            {content.energy_level && (
              <div className="glass rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-cosmos-muted font-medium uppercase tracking-wider">Energy Level</span>
                  <span className="text-stellar-amber font-bold">{content.energy_level}/10</span>
                </div>
                <div className="h-2 bg-cosmos-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${signData?.color}, #FFB347)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${content.energy_level * 10}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Love */}
            {content.love && (
              <div className="glass rounded-2xl p-4"
                style={{ border: '1px solid rgba(255,179,71,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span>💫</span>
                  <span className="text-xs text-cosmos-muted font-medium uppercase tracking-wider">Love & Connection</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{content.love}</p>
              </div>
            )}

            {/* Do / Don't */}
            {(content.do || content.do_today) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(126,232,208,0.15)' }}>
                  <p className="text-stellar-mint text-xs font-bold mb-3 uppercase tracking-wider">✓ Do Today</p>
                  <ul className="space-y-1.5">
                    {(content.do || content.do_today || []).map((item: string, i: number) => (
                      <li key={i} className="text-white text-xs leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(255,107,74,0.15)' }}>
                  <p className="text-sign-fire text-xs font-bold mb-3 uppercase tracking-wider">✗ Avoid</p>
                  <ul className="space-y-1.5">
                    {(content.dont || content.dont_today || []).map((item: string, i: number) => (
                      <li key={i} className="text-white text-xs leading-relaxed">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Mantra + Lucky color */}
            {content.mantra && (
              <div className="glass rounded-2xl p-4 text-center"
                style={{ border: `1px solid ${signData?.color}22` }}>
                <p className="text-cosmos-muted text-xs mb-2 uppercase tracking-wider">Daily Mantra</p>
                <p className="font-display text-lg text-white italic">"{content.mantra}"</p>
                {content.lucky_color && (
                  <p className="text-cosmos-muted text-xs mt-3">Lucky color: <span style={{ color: signData?.color }}>{content.lucky_color}</span></p>
                )}
              </div>
            )}

            <button
              onClick={() => { setAiContent(null); generateAIContent() }}
              className="btn-ghost w-full text-sm py-2.5"
            >
              🔄 Refresh Reading
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
