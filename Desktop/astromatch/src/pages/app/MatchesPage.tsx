// MatchesPage.tsx
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase, type Match, type Profile } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getSign } from '@/lib/astrology'

export function MatchesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
        .eq('is_active', true)
        .order('matched_at', { ascending: false })

      if (!data) return []

      const enriched = await Promise.all(data.map(async (match) => {
        const partnerId = match.user_a === user!.id ? match.user_b : match.user_a
        const { data: partner } = await supabase.from('profiles').select('*').eq('id', partnerId).single()
        const { data: conv } = await supabase.from('conversations').select('id, last_message, last_message_at').eq('match_id', match.id).single()
        return { ...match, partner, conversation: conv }
      }))

      return enriched
    },
    enabled: !!user,
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-4xl animate-spin-slow">💫</div>
    </div>
  )

  return (
    <div className="page overflow-y-auto px-5 py-4">
      <h2 className="font-display text-2xl text-white mb-4">Your Matches</h2>

      {matches.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🌙</div>
          <p className="text-white font-medium mb-2">No matches yet</p>
          <p className="text-cosmos-muted text-sm">Discover people and start swiping ✨</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match: any, i: number) => {
            const partner: Profile = match.partner
            const signData = getSign(partner?.sun_sign)
            return (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/app/chat/${match.id}`)}
                className="w-full glass-bright rounded-2xl p-4 flex items-center gap-4 text-left hover:border-stellar-lavender/30 transition-all"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `${signData?.color}22`, border: `1.5px solid ${signData?.color}44` }}>
                  {partner?.photos?.[0]
                    ? <img src={partner.photos[0]} className="w-full h-full rounded-full object-cover" />
                    : signData?.symbol}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">{partner?.display_name}</p>
                    <span className="text-xs font-bold" style={{ color: signData?.color }}>{match.compat_score}%</span>
                  </div>
                  <p className="text-cosmos-muted text-xs truncate mt-0.5">
                    {match.conversation?.last_message || 'Say hello! 👋'}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}
