/**
 * 图标组件 - 使用内联 SVG，避免引入额外依赖
 * 图标尺寸默认 1em，颜色继承 currentColor
 */
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(size?: number): SVGProps<SVGSVGElement> {
  return {
    width: size ?? '1em',
    height: size ?? '1em',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
}

export const ChevronLeftIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
)

export const ChevronRightIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const CheckIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export const StarIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

export const PlusIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const TrashIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export const CalendarIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

export const ClockIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export const FlagIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)

export const TimerIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <line x1="10" y1="2" x2="14" y2="2" />
    <line x1="12" y1="14" x2="15" y2="11" />
    <circle cx="12" cy="14" r="8" />
  </svg>
)

export const PlayIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
)

export const PauseIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

export const SettingsIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
)

export const SplitIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </svg>
)

export const ChartIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
    <line x1="3" y1="20" x2="21" y2="20" />
  </svg>
)

export const DownloadIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export const UploadIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

export const CloseIcon = ({ size, ...props }: IconProps) => (
  <svg {...base(size)} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
