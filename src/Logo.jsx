export default function Logo({ size = 40 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="janSevaGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#059669" />
          <stop offset="0.5" stopColor="#0284c7" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>

      {/* Modern hexagonal/shield base */}
      <rect x="2" y="2" width="44" height="44" rx="14" fill="url(#shieldGrad)" stroke="url(#janSevaGrad)" strokeWidth="2" />

      {/* Saffron Arc (Top Left) */}
      <path d="M14 16 C 18 10, 30 10, 34 16" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Central Citizen Pillar & Wings */}
      <circle cx="24" cy="19" r="4" fill="#38bdf8" />
      <path
        d="M15 32 C15 26.5 19 24 24 24 C29 24 33 26.5 33 32"
        stroke="#10b981"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* AI Intelligence Sparkle nodes */}
      <circle cx="35" cy="13" r="2.5" fill="#f59e0b" />
      <circle cx="13" cy="35" r="2" fill="#10b981" />
    </svg>
  )
}
