import { useMemo } from 'react'

type Star = {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

export function StarField({ count = 80 }: { count?: number }) {
  const stars = useMemo<Star[]>(() => (
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.6 + 0.1,
    }))
  ), [count])

  return (
    <div className="star-field" aria-hidden="true">
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
      {/* Nebula glows */}
      <div style={{
        position: 'absolute', width: '40%', height: '40%',
        top: '10%', left: '5%',
        background: 'radial-gradient(ellipse, rgba(155, 143, 255, 0.06) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', width: '35%', height: '35%',
        bottom: '15%', right: '10%',
        background: 'radial-gradient(ellipse, rgba(255, 179, 71, 0.05) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute', width: '30%', height: '30%',
        top: '40%', right: '20%',
        background: 'radial-gradient(ellipse, rgba(126, 232, 208, 0.04) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
    </div>
  )
}
