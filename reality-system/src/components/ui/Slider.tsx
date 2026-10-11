import { useId } from 'react'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  disabled?: boolean
}

export function Slider({ label, value, min, max, step = 1, onChange, format, disabled }: SliderProps) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-1.5 py-1">
      <div className="flex items-center justify-between text-sm">
        <label htmlFor={id} className="font-medium text-fg">
          {label}
        </label>
        <span className="num text-xs text-muted">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--rs-accent)] disabled:opacity-40"
        style={{ background: `linear-gradient(90deg, var(--rs-accent) ${pct}%, var(--rs-surface2) ${pct}%)` }}
      />
    </div>
  )
}
