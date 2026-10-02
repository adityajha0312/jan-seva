export function MicIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <path d="M5 11 C5 15.5 8.5 19 12 19 C15.5 19 19 15.5 19 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <line x1="12" y1="19" x2="12" y2="22.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="22.5" x2="16" y2="22.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function StopIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2.5" fill={color} />
    </svg>
  )
}

export function SpeakerOnIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9.5 V14.5 H7.5 L12.5 18.5 V5.5 L7.5 9.5 Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M16.5 8.5 C17.8 9.8 17.8 14.2 16.5 15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M19 5.5 C21.5 8 21.5 16 19 18.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7" />
    </svg>
  )
}

export function SpeakerOffIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 9.5 V14.5 H7.5 L12.5 18.5 V5.5 L7.5 9.5 Z" fill={color} stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="16" y1="9" x2="21" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="21" y1="9" x2="16" y2="15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function MenuIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="17" x2="20" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function CloseIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function PlusChatIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

export function GridIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.7" />
    </svg>
  )
}

export function DocumentIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 3.5 H14.5 L19 8 V20.5 H7 Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14.5 3.5 V8 H19" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
      <line x1="9.5" y1="12.5" x2="16" y2="12.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9.5" y1="16" x2="16" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function BookmarkIcon({ size = 17, color = 'currentColor', filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.5 4 H17.5 V20.5 L12 16.5 L6.5 20.5 Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      />
    </svg>
  )
}

export function UserCircleIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.7" stroke={color} strokeWidth="1.7" />
      <path d="M6.3 18.2 C7.3 15.8 9.4 14.5 12 14.5 C14.6 14.5 16.7 15.8 17.7 18.2" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function SettingsGearIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function FemaleIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.5" r="5" />
      <line x1="12" y1="13.5" x2="12" y2="21" />
      <line x1="8.5" y1="17.5" x2="15.5" y2="17.5" />
    </svg>
  )
}

export function MaleIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="14" r="5" />
      <line x1="13.5" y1="10.5" x2="19.5" y2="4.5" />
      <polyline points="14.5 4.5 19.5 4.5 19.5 9.5" />
    </svg>
  )
}

export function GlobeIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.6" />
      <ellipse cx="12" cy="12" rx="3.4" ry="8.5" stroke={color} strokeWidth="1.6" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={color} strokeWidth="1.6" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4.5" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 6.5 L18.5 12 L13 17.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export function SendIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 12 L20 4.5 L15.5 20.5 L11 13.5 L3.5 12 Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill="none" />
      <line x1="11" y1="13.5" x2="16.5" y2="8.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function HelpCircleIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.7" />
      <path d="M9.5 9.3 C9.5 7.7 10.6 6.7 12.1 6.7 C13.5 6.7 14.6 7.6 14.6 8.9 C14.6 10.9 12.1 10.7 12.1 13.1" stroke={color} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <circle cx="12.1" cy="16.2" r="0.9" fill={color} />
    </svg>
  )
}

export function SearchIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="1.8" />
      <line x1="15.3" y1="15.3" x2="20.5" y2="20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ShieldAlertIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2.5 L19.5 5.8 V11.5 C19.5 16.5 16.3 20.8 12 22 C7.7 20.8 4.5 16.5 4.5 11.5 V5.8 L12 2.5 Z" stroke={color} strokeWidth="1.7" strokeLinejoin="round" fill="none" />
      <line x1="12" y1="8" x2="12" y2="12.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="15.5" r="0.9" fill={color} />
    </svg>
  )
}

export function CalculatorIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="3" width="14" height="18" rx="2.5" stroke={color} strokeWidth="1.7" />
      <rect x="8" y="6" width="8" height="3" rx="1" stroke={color} strokeWidth="1.2" />
      <circle cx="8.5" cy="13" r="1" fill={color} />
      <circle cx="12" cy="13" r="1" fill={color} />
      <circle cx="15.5" cy="13" r="1" fill={color} />
      <circle cx="8.5" cy="17" r="1" fill={color} />
      <circle cx="12" cy="17" r="1" fill={color} />
      <circle cx="15.5" cy="17" r="1" fill={color} />
    </svg>
  )
}

export function BarChartIcon({ size = 17, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="20" x2="20" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="6" y="12" width="3" height="8" rx="1" fill={color} />
      <rect x="11" y="8" width="3" height="12" rx="1" fill={color} />
      <rect x="16" y="4" width="3" height="16" rx="1" fill={color} />
    </svg>
  )
}

export function AgricultureIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4.1 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.4 2-4.6-2.7.1-4.2.9-5.2 2z" />
    </svg>
  )
}

export function WomenEmpowermentIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7.5" r="4" />
      <path d="M6 21v-1.5a6 6 0 0 1 12 0V21" />
      <path d="M12 11.5v9" strokeWidth="1.5" opacity="0.4" />
      <path d="M16.5 13.5l2 2 3-3" strokeWidth="1.6" />
    </svg>
  )
}

export function EducationIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}

export function BriefcaseJobIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="7" width="20" height="14" rx="2.5" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <path d="M2 13h20" strokeWidth="1.4" />
    </svg>
  )
}

export function WorkerToolsIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
      <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
    </svg>
  )
}

export function SeniorPensionIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8.5c-.8-1-2.2-1-3 0s-.8 2.2 0 3l3 3 3-3c.8-.8.8-2 0-3s-2.2-1-3 0z" fill={color} fillOpacity="0.2" />
    </svg>
  )
}

export function CitizenAvatarIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20.5C4.5 16.634 7.85786 13.5 12 13.5C16.1421 13.5 19.5 16.634 19.5 20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
