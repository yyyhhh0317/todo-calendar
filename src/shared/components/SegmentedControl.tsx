interface SegmentedControlOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-white/60 border border-brand-200/40 rounded-xl backdrop-blur-sm ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 px-3 h-8 text-sm font-medium rounded-lg transition-all duration-150 ${
              isActive
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-ink-muted hover:text-ink hover:bg-brand-50'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
