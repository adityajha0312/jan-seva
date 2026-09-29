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
        <linearGradient id="jsBgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f0fdf4" />
        </linearGradient>
        <linearGradient id="jsBorderGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="0.5" stopColor="#0284c7" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="jsSaffron" x1="10" y1="12" x2="24" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f97316" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="jsGreen" x1="24" y1="18" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="jsBlue" x1="24" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0284c7" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Modern Squircle Badge with Tricolor Gradient Border */}
      <rect x="2" y="2" width="44" height="44" rx="13" fill="url(#jsBgGrad)" stroke="url(#jsBorderGrad)" strokeWidth="2.2" />

      {/* Saffron Wing / Ray representing citizen empowerment */}
      <path
        d="M13 28 C13 18, 20 12, 24 12 C24 16, 18 22, 17 28 Z"
        fill="url(#jsSaffron)"
      />

      {/* Emerald Green Wing / Ray representing welfare & prosperity */}
      <path
        d="M35 28 C35 18, 28 12, 24 12 C24 16, 30 22, 31 28 Z"
        fill="url(#jsGreen)"
      />

      {/* Central Citizen Node (head) */}
      <circle cx="24" cy="18" r="4.2" fill="url(#jsBlue)" />

      {/* Welcoming Seva / Service Hands Base */}
      <path
        d="M14 34 C18 30, 30 30, 34 34 C30 37, 18 37, 14 34 Z"
        fill="url(#jsGreen)"
      />

      {/* AI Sparkle / Star of Governance at the apex */}
      <path
        d="M24 7 L25.2 10.2 L28.5 11 L25.2 11.8 L24 15 L22.8 11.8 L19.5 11 L22.8 10.2 Z"
        fill="#f59e0b"
      />
    </svg>
  )
}
