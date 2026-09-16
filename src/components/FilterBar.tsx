import { Check, ChevronDown, X } from 'lucide-react'
import { useState } from 'react'

export interface FilterOption<T extends string> {
  value: T
  label: string
}

/** A plain on/off filter — "Discounted", "Open now". */
export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip ${active ? 'chip-active' : ''}`}
    >
      {label}
    </button>
  )
}

/**
 * A filter with several choices. The pill carries the chosen value once it is
 * off its default, so the row reads as the current state of the search rather
 * than a menu of things that could be done to it.
 *
 * The choices open in a sheet from the bottom of the screen rather than a
 * popover under the pill: the row scrolls sideways, and anything absolutely
 * positioned inside a scrolling row gets clipped by it.
 */
export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
}) {
  const [open, setOpen] = useState(false)
  const isDefault = value === options[0]?.value
  const selected = options.find((option) => option.value === value)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`chip ${isDefault ? '' : 'chip-active'}`}
      >
        {isDefault ? label : (selected?.label ?? label)}
        <ChevronDown size={15} className={isDefault ? 'text-muted' : 'text-white/80'} />
      </button>

      {open && (
        <OptionSheet
          title={label}
          options={options}
          value={value}
          onChange={(next) => {
            onChange(next)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

export function OptionSheet<T extends string>({
  title,
  options,
  value,
  onChange,
  onClose,
}: {
  title: string
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-white pb-2 shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
            aria-label={`Close ${title}`}
          >
            <X size={20} />
          </button>
        </div>

        <ul role="listbox" aria-label={title} className="max-h-[60vh] overflow-y-auto py-1">
          {options.map((option) => {
            const chosen = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={chosen}
                  onClick={() => onChange(option.value)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-surface ${
                    chosen ? 'font-semibold text-navy' : 'text-ink'
                  }`}
                >
                  {option.label}
                  {chosen && <Check size={18} className="shrink-0 text-navy" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
