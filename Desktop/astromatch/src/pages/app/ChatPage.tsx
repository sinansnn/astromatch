import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase, type Message, type Profile } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { getSign } from '@/lib/astrology'

export function ChatPage() {
  const { id: matchId } = useParams<{ id: string }>()
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Get match + partner profile
  const { data: matchData } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const { data: match } = await supabase
        .from('matches').select('*').eq('id', matchId).single()
      if (!match) return null

      const partnerId = match.user_a === user?.id ? match.user_b : match.user_a
      const { data: partner } = await supabase
        .from('profiles').select('*').eq('id', partnerId).single()
      const { data: conv } = await supabase
        .from('conversations').select('*').eq('match_id', matchId).single()

      return { match, partner: partner as Profile, conversationId: conv?.id }
    },
    enabled: !!matchId && !!user,
  })

  // Load messages
  useEffect(() => {
    if (!matchData?.conversationId) return

    supabase.from('messages')
      .select('*')
      .eq('conversation_id', matchData.conversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data || []) as Message[]))

    // Subscribe realtime
    const channel = supabase
      .channel(`conv:${matchData.conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${matchData.conversationId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchData?.conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string, type: Message['type'] = 'text') => {
    if (!content.trim() || !matchData?.conversationId || !user) return

    await supabase.from('messages').insert({
      conversation_id: matchData.conversationId,
      sender_id: user.id,
      content: content.trim(),
      type,
    })
    setInput('')
  }

  const getAISuggestion = async () => {
    if (!matchData?.partner || !profile) return
    setAiLoading(true)

    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 150,
          system: `You are an astrology-based conversation assistant. Generate a short, charming conversation starter or question based on the two people's zodiac signs. Keep it under 2 sentences, make it playful and astrological.`,
          messages: [{
            role: 'user',
            content: `I'm a ${profile.sun_sign} talking to a ${matchData.partner.sun_sign}. Our compatibility score is ${matchData.match?.compat_score}%. Suggest a fun conversation starter.`
          }]
        })
      })
      const data = await resp.json()
      const suggestion = data.content?.[0]?.text
      if (suggestion) setInput(suggestion)
    } catch {
      // silently fail
    }
    setAiLoading(false)
  }

  const partner = matchData?.partner
  const partnerSign = partner ? getSign(partner.sun_sign) : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,26,0.95)' }}>
        <button onClick={() => navigate(-1)} className="text-cosmos-muted text-xl hover:text-white transition-colors">
          ←
        </button>

        <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${partnerSign?.color}22`, border: `1.5px solid ${partnerSign?.color}44` }}>
          {partner?.photos?.[0]
            ? <img src={partner.photos[0]} className="w-full h-full rounded-full object-cover" />
            : partnerSign?.symbol}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm truncate">{partner?.display_name}</p>
          <p className="text-xs" style={{ color: partnerSign?.color }}>
            {partner?.sun_sign} · {matchData?.match?.compat_score}% compatible
          </p>
        </div>

        <button onClick={getAISuggestion} disabled={aiLoading}
          className="text-lg transition-transform hover:scale-110 active:scale-95"
          title="Get AI conversation starter">
          {aiLoading ? '⏳' : '🔮'}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-cosmos-muted text-sm">You matched! Say something cosmic...</p>
            <p className="text-cosmos-muted text-xs mt-1">Tap 🔮 for an AI-powered opener</p>
          </div>
        )}

        {messages.map(msg => {
          const isOwn = msg.sender_id === user?.id
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isOwn
                  ? 'text-cosmos-bg rounded-br-sm'
                  : 'text-white rounded-bl-sm'
              }`} style={isOwn
                ? { background: 'linear-gradient(135deg, #E8C5FF, #C4A0F0)' }
                : { background: 'rgba(40,40,80,0.8)', border: '1px solid rgba(255,255,255,0.06)' }
              }>
                {msg.type === 'ai_suggestion' && (
                  <span className="text-xs text-cosmos-muted block mb-1">🔮 AI suggestion</span>
                )}
                {msg.content}
              </div>
            </motion.div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 flex gap-3 items-end"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(10,10,26,0.95)' }}>
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="input-field resize-none pr-4 text-sm py-2.5"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-cosmos-bg font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #E8C5FF, #C4A0F0)' }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
