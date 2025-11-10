import React from 'react'

interface StudentAvatarProps {
  src?: string | null
  size?: number
  alt?: string
  rounded?: number // border radius in px
}

export function StudentAvatar({ src, size = 48, alt = 'Foto do aluno', rounded = 6 }: StudentAvatarProps) {
  const dim = { width: size, height: size, borderRadius: rounded }
  if (src && typeof src === 'string' && src.trim().length > 0) {
    return <img src={src} alt={alt} style={{ ...dim, objectFit: 'cover', display: 'block' }} />
  }
  // Placeholder SVG (person silhouette) to match the modeling
  return (
    <svg 
      role="img" aria-label="Sem foto" 
      width={size} height={size} viewBox="0 0 64 64"
      style={{ display:'block', borderRadius: rounded, background:'#eceff4', border:'1px solid #dfe3ea' }}
    >
      <defs>
        <clipPath id="r">
          <rect x="0" y="0" width="64" height="64" rx={rounded} ry={rounded} />
        </clipPath>
      </defs>
      <g clipPath="url(#r)">
        <rect x="0" y="0" width="64" height="64" fill="#e9edf5" />
        {/* head */}
        <circle cx="32" cy="24" r="10" fill="#96a4b8" />
        {/* shoulders/body */}
        <path d="M10 58c2-12 12-18 22-18s20 6 22 18" fill="#b6c0cf" />
      </g>
    </svg>
  )
}

export default StudentAvatar
