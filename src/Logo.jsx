export default function Logo({ size = 46, withText = false, className = '' }) {
  if (withText) {
    return (
      <div className={`ym-logo-lockup ${className}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <svg
          width={size}
          height={Math.round(size * 0.88)}
          viewBox="20 15 60 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Center Blue Figure */}
          <circle cx="50" cy="22" r="5" fill="#0f357a" />
          <path
            d="M 50 50 C 47.5 41 43 32 34 23 C 39.5 27 45.5 32 50 32 C 54.5 32 60.5 27 66 23 C 57 32 52.5 41 50 50 Z"
            fill="#0f357a"
          />

          {/* Left Saffron Figure */}
          <circle cx="34.5" cy="32.5" r="4.2" fill="#f27212" />
          <path
            d="M 44.5 48 C 39 41.5 31.5 37 26 36.5 C 30 40 33 43.5 35 44 C 36.5 41 40 37 44 34.5 C 44 39.5 44.2 44 44.5 48 Z"
            fill="#f27212"
          />

          {/* Right Green Figure */}
          <circle cx="65.5" cy="32.5" r="4.2" fill="#16a34a" />
          <path
            d="M 55.5 48 C 61 41.5 68.5 37 74 36.5 C 70 40 67 43.5 65 44 C 63.5 41 60 37 56 34.5 C 56 39.5 55.8 44 55.5 48 Z"
            fill="#16a34a"
          />

          {/* Caring Hands Base (Cupped Hands) */}
          <path
            d="M 49 64 C 38.5 64.5 28.5 57.5 23.5 42 C 25.5 48.5 31.5 57.5 41.5 61.8 C 45 63 47.8 63.6 49 64 Z"
            fill="#0f357a"
          />
          <path
            d="M 46 54.5 C 41 53.5 36.5 50.5 32.5 47.5 C 35.5 50.5 39 53 43 54.2 C 44.5 54.6 45.5 54.6 46 54.5 Z"
            fill="#0f357a"
          />
          <path
            d="M 51 64 C 61.5 64.5 71.5 57.5 76.5 42 C 74.5 48.5 68.5 57.5 58.5 61.8 C 55 63 52.2 63.6 51 64 Z"
            fill="#0f357a"
          />
          <path
            d="M 54 54.5 C 59 53.5 63.5 50.5 67.5 47.5 C 64.5 50.5 61 53 57 54.2 C 55.5 54.6 54.5 54.6 54 54.5 Z"
            fill="#0f357a"
          />
        </svg>

        <div style={{ marginTop: '3px', lineHeight: 1.15 }}>
          <div style={{ fontSize: `${size * 0.42}px`, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.3px' }}>
            <span style={{ color: '#0b2664' }}>Jan </span>
            <span style={{ color: '#0d8d49' }}>Seva</span>
          </div>
          <div style={{ fontSize: `${Math.max(10, size * 0.18)}px`, color: '#0b2664', fontWeight: 600, marginTop: '2px' }}>
            Sarkari Seva, Aapke Saath
          </div>
        </div>
      </div>
    )
  }

  // Standard standalone emblem (Tight viewBox ensures graphic fills 100% of frame with zero blank padding)
  return (
    <svg
      width={size}
      height={Math.round(size * 0.88)}
      viewBox="20 15 60 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      {/* Central Blue Figure */}
      <circle cx="50" cy="22" r="5.2" fill="#0f357a" />
      <path
        d="M 50 49 C 47.5 40 43 31.5 34 22.5 C 39.5 26.5 45.5 31.5 50 31.5 C 54.5 31.5 60.5 26.5 66 22.5 C 57 31.5 52.5 40 50 49 Z"
        fill="#0f357a"
      />

      {/* Left Saffron Figure */}
      <circle cx="34.5" cy="32.5" r="4.3" fill="#f27212" />
      <path
        d="M 44.5 47.5 C 38.5 41 31.5 36.5 26 36 C 30 39.5 33 43 35 43.5 C 36.5 40.5 40 36.5 44 34 C 44 39 44.2 43.5 44.5 47.5 Z"
        fill="#f27212"
      />

      {/* Right Green Figure */}
      <circle cx="65.5" cy="32.5" r="4.3" fill="#16a34a" />
      <path
        d="M 55.5 47.5 C 61.5 41 68.5 36.5 74 36 C 70 39.5 67 43 65 43.5 C 63.5 40.5 60 36.5 56 34 C 56 39 55.8 43.5 55.5 47.5 Z"
        fill="#16a34a"
      />

      {/* Caring Hands Base (Cupped Hands Cradling the Citizens) */}
      <path
        d="M 49 64 C 38.5 64.5 28.5 57.5 23.5 42 C 25.5 48.5 31.5 57.5 41.5 61.8 C 45 63 47.8 63.6 49 64 Z"
        fill="#0f357a"
      />
      <path
        d="M 46 54.5 C 41 53.5 36.5 50.5 32.5 47.5 C 35.5 50.5 39 53 43 54.2 C 44.5 54.6 45.5 54.6 46 54.5 Z"
        fill="#0f357a"
      />

      <path
        d="M 51 64 C 61.5 64.5 71.5 57.5 76.5 42 C 74.5 48.5 68.5 57.5 58.5 61.8 C 55 63 52.2 63.6 51 64 Z"
        fill="#0f357a"
      />
      <path
        d="M 54 54.5 C 59 53.5 63.5 50.5 67.5 47.5 C 64.5 50.5 61 53 57 54.2 C 55.5 54.6 54.5 54.6 54 54.5 Z"
        fill="#0f357a"
      />
    </svg>
  )
}
