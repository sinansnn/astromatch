// ─── Astrology Engine ─────────────────────────────────────────────────────────
// Birth chart calculation and compatibility scoring

export const SIGNS = [
  { name: 'Aries',       symbol: '♈', emoji: '🐏', element: 'Fire',  quality: 'Cardinal', ruler: 'Mars',    color: '#FF6B4A', dates: 'Mar 21 – Apr 19' },
  { name: 'Taurus',      symbol: '♉', emoji: '🐂', element: 'Earth', quality: 'Fixed',    ruler: 'Venus',   color: '#7EC98F', dates: 'Apr 20 – May 20' },
  { name: 'Gemini',      symbol: '♊', emoji: '👯', element: 'Air',   quality: 'Mutable',  ruler: 'Mercury', color: '#93C5FD', dates: 'May 21 – Jun 20' },
  { name: 'Cancer',      symbol: '♋', emoji: '🦀', element: 'Water', quality: 'Cardinal', ruler: 'Moon',    color: '#9B8FFF', dates: 'Jun 21 – Jul 22' },
  { name: 'Leo',         symbol: '♌', emoji: '🦁', element: 'Fire',  quality: 'Fixed',    ruler: 'Sun',     color: '#FFB347', dates: 'Jul 23 – Aug 22' },
  { name: 'Virgo',       symbol: '♍', emoji: '🌾', element: 'Earth', quality: 'Mutable',  ruler: 'Mercury', color: '#7EC98F', dates: 'Aug 23 – Sep 22' },
  { name: 'Libra',       symbol: '♎', emoji: '⚖️', element: 'Air',   quality: 'Cardinal', ruler: 'Venus',   color: '#93C5FD', dates: 'Sep 23 – Oct 22' },
  { name: 'Scorpio',     symbol: '♏', emoji: '🦂', element: 'Water', quality: 'Fixed',    ruler: 'Pluto',   color: '#9B8FFF', dates: 'Oct 23 – Nov 21' },
  { name: 'Sagittarius', symbol: '♐', emoji: '🏹', element: 'Fire',  quality: 'Mutable',  ruler: 'Jupiter', color: '#FF6B4A', dates: 'Nov 22 – Dec 21' },
  { name: 'Capricorn',   symbol: '♑', emoji: '🐐', element: 'Earth', quality: 'Cardinal', ruler: 'Saturn',  color: '#7EC98F', dates: 'Dec 22 – Jan 19' },
  { name: 'Aquarius',    symbol: '♒', emoji: '🏺', element: 'Air',   quality: 'Fixed',    ruler: 'Uranus',  color: '#93C5FD', dates: 'Jan 20 – Feb 18' },
  { name: 'Pisces',      symbol: '♓', emoji: '🐟', element: 'Water', quality: 'Mutable',  ruler: 'Neptune', color: '#9B8FFF', dates: 'Feb 19 – Mar 20' },
] as const

export type SignName = typeof SIGNS[number]['name']
export type Element = 'Fire' | 'Earth' | 'Air' | 'Water'

export function getSign(name: string) {
  return SIGNS.find(s => s.name === name)
}

export function getSignIndex(name: string) {
  return SIGNS.findIndex(s => s.name === name)
}

// ─── Sun Sign from birthdate ──────────────────────────────────────────────────
export function getSunSign(birthDate: string): SignName {
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const md = month * 100 + day

  if (md >= 321 && md <= 419) return 'Aries'
  if (md >= 420 && md <= 520) return 'Taurus'
  if (md >= 521 && md <= 620) return 'Gemini'
  if (md >= 621 && md <= 722) return 'Cancer'
  if (md >= 723 && md <= 822) return 'Leo'
  if (md >= 823 && md <= 922) return 'Virgo'
  if (md >= 923 && md <= 1022) return 'Libra'
  if (md >= 1023 && md <= 1121) return 'Scorpio'
  if (md >= 1122 && md <= 1221) return 'Sagittarius'
  if (md >= 1222 || md <= 119) return 'Capricorn'
  if (md >= 120 && md <= 218) return 'Aquarius'
  return 'Pisces'
}

// Simplified moon sign (offset from sun — real calculation needs ephemeris)
export function getApproxMoonSign(birthDate: string): SignName {
  const date = new Date(birthDate)
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
  const moonIndex = Math.floor((dayOfYear * 13.37) / 30) % 12
  return SIGNS[moonIndex].name as SignName
}

// Approximate rising sign from birth time
export function getApproxRisingSign(birthDate: string, birthTime?: string): SignName {
  if (!birthTime) return getSunSign(birthDate)
  const [hours] = birthTime.split(':').map(Number)
  const sunIndex = getSignIndex(getSunSign(birthDate))
  const risingOffset = Math.floor(hours / 2)
  return SIGNS[(sunIndex + risingOffset) % 12].name as SignName
}

// ─── Compatibility Engine ─────────────────────────────────────────────────────

const ELEMENT_COMPAT: Record<string, Record<string, number>> = {
  Fire:  { Fire: 80, Air: 90,  Earth: 50, Water: 55 },
  Earth: { Earth: 85, Water: 92, Fire: 50,  Air: 55  },
  Air:   { Air: 82,  Fire: 90,  Water: 55, Earth: 55 },
  Water: { Water: 88, Earth: 92, Air: 55,  Fire: 55  },
}

const QUALITY_COMPAT: Record<string, Record<string, number>> = {
  Cardinal: { Cardinal: 65, Fixed: 80, Mutable: 75 },
  Fixed:    { Fixed: 70,    Cardinal: 80, Mutable: 85 },
  Mutable:  { Mutable: 75,  Fixed: 85, Cardinal: 75 },
}

// Sign-to-sign traditional compatibility
const SIGN_ASPECTS: Record<string, string[]> = {
  // Trine (same element) = very compatible
  Aries:       ['Leo', 'Sagittarius', 'Gemini', 'Aquarius'],
  Leo:         ['Aries', 'Sagittarius', 'Libra', 'Gemini'],
  Sagittarius: ['Aries', 'Leo', 'Aquarius', 'Libra'],
  Taurus:      ['Virgo', 'Capricorn', 'Cancer', 'Pisces'],
  Virgo:       ['Taurus', 'Capricorn', 'Scorpio', 'Cancer'],
  Capricorn:   ['Taurus', 'Virgo', 'Pisces', 'Scorpio'],
  Gemini:      ['Libra', 'Aquarius', 'Aries', 'Leo'],
  Libra:       ['Gemini', 'Aquarius', 'Leo', 'Sagittarius'],
  Aquarius:    ['Gemini', 'Libra', 'Sagittarius', 'Aries'],
  Cancer:      ['Scorpio', 'Pisces', 'Taurus', 'Virgo'],
  Scorpio:     ['Cancer', 'Pisces', 'Capricorn', 'Virgo'],
  Pisces:      ['Cancer', 'Scorpio', 'Taurus', 'Capricorn'],
}

export type CompatibilityResult = {
  overall: number
  element: number
  quality: number
  signs: number
  breakdown: {
    label: string
    score: number
    description: string
  }[]
  summary: string
  strengths: string[]
  challenges: string[]
}

export function calculateCompatibility(
  sign1: string, element1: string, quality1: string,
  sign2: string, element2: string, quality2: string
): CompatibilityResult {

  const elementScore = ELEMENT_COMPAT[element1]?.[element2] ?? 65
  const qualityScore = QUALITY_COMPAT[quality1]?.[quality2] ?? 70
  const signScore = SIGN_ASPECTS[sign1]?.includes(sign2) ? 88 : 60

  const overall = Math.round(elementScore * 0.35 + qualityScore * 0.30 + signScore * 0.35)

  const breakdown = [
    { label: 'Element Harmony',  score: elementScore, description: `${element1} + ${element2}` },
    { label: 'Energy Flow',      score: qualityScore, description: `${quality1} + ${quality2}` },
    { label: 'Sign Resonance',   score: signScore,    description: `${sign1} + ${sign2}` },
  ]

  const strengths = getStrengths(element1, element2, sign1, sign2)
  const challenges = getChallenges(element1, element2)
  const summary = getSummary(overall)

  return { overall, element: elementScore, quality: qualityScore, signs: signScore, breakdown, summary, strengths, challenges }
}

function getStrengths(el1: string, el2: string, s1: string, s2: string): string[] {
  const strengths: string[] = []
  if (el1 === el2) strengths.push('Deep mutual understanding')
  if ((el1 === 'Fire' && el2 === 'Air') || (el1 === 'Air' && el2 === 'Fire'))
    strengths.push('Electric intellectual chemistry')
  if ((el1 === 'Water' && el2 === 'Earth') || (el1 === 'Earth' && el2 === 'Water'))
    strengths.push('Grounding emotional security')
  if (SIGN_ASPECTS[s1]?.includes(s2)) strengths.push('Natural cosmic alignment')
  strengths.push('Complementary perspectives')
  return strengths.slice(0, 3)
}

function getChallenges(el1: string, el2: string): string[] {
  const challenges: string[] = []
  if ((el1 === 'Fire' && el2 === 'Water') || (el1 === 'Water' && el2 === 'Fire'))
    challenges.push('Balancing intensity vs. sensitivity')
  if ((el1 === 'Earth' && el2 === 'Air') || (el1 === 'Air' && el2 === 'Earth'))
    challenges.push('Bridging practicality and idealism')
  challenges.push('Building long-term trust takes time')
  return challenges.slice(0, 2)
}

function getSummary(score: number): string {
  if (score >= 85) return 'Cosmic soulmates — the stars aligned for you two ✨'
  if (score >= 75) return 'Powerful connection with real potential 🌟'
  if (score >= 65) return 'Interesting chemistry worth exploring 🔮'
  if (score >= 55) return 'Opposites can attract — growth awaits 🌙'
  return 'A challenging but transformative connection 💫'
}

// ─── Zodiac helpers ───────────────────────────────────────────────────────────

export function getElementColor(element: string): string {
  const colors: Record<string, string> = {
    Fire: '#FF6B4A', Earth: '#7EC98F', Air: '#93C5FD', Water: '#9B8FFF'
  }
  return colors[element] || '#E8C5FF'
}

export function getElementEmoji(element: string): string {
  const emojis: Record<string, string> = {
    Fire: '🔥', Earth: '🌍', Air: '💨', Water: '💧'
  }
  return emojis[element] || '✨'
}

export const PLANETS = [
  { key: 'sun',     label: '☀️ Sun',     meaning: 'Core identity & ego' },
  { key: 'moon',    label: '🌙 Moon',    meaning: 'Emotions & intuition' },
  { key: 'rising',  label: '⬆️ Rising',  meaning: 'How others see you' },
  { key: 'mercury', label: '☿ Mercury', meaning: 'Communication style' },
  { key: 'venus',   label: '♀ Venus',   meaning: 'Love & beauty' },
  { key: 'mars',    label: '♂ Mars',    meaning: 'Drive & passion' },
  { key: 'jupiter', label: '♃ Jupiter', meaning: 'Growth & luck' },
  { key: 'saturn',  label: '♄ Saturn',  meaning: 'Discipline & karma' },
]
