import { Check, Minus, Plus, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  formatPrice,
  SKIN_TYPES,
  SYMPTOMS,
  type Product,
  type SkinType,
  type Symptom,
} from '../data'
import {
  defaultUnitType,
  itemCategoryFor,
  unitTypesFor,
  volumeUnit,
} from '../lib/itemTypes'
import {
  isCounted,
  itemPrice,
  itemListPrice,
  packagingFor,
  roundMoney,
  unitLabel,
  unitPrice,
  type PackagingOption,
} from '../lib/packaging'

/**
 * How much of a product to buy, and in what form.
 *
 * The options come from the product itself (`packagingFor`), so a thermometer
 * offers only "single item" while a box of tablets can be split into a strip or
 * counted out loose. Everything is priced from one unit price, so a part-pack
 * is a plain fraction of the shelf price and a full pack lands exactly on it.
 */
export function ProductOptions({ product }: { product: Product }) {
  const { addConfigured } = useApp()

  const sizes = product.sizes
  const [size, setSize] = useState<number>(product.packSize)
  const options = useMemo(() => packagingFor(product, size), [product, size])

  const [kind, setKind] = useState(options[0].kind)
  const chosen: PackagingOption = options.find((o) => o.kind === kind) ?? options[0]

  const [typedUnits, setTypedUnits] = useState<number>(chosen.suggested ?? 1)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)

  // The shelf comes from the product; only the form is the shopper's to pick.
  const shelf = itemCategoryFor(product)
  const unitTypes = unitTypesFor(shelf)
  const [unitType, setUnitType] = useState(() => defaultUnitType(product))

  const [volume, setVolume] = useState('')
  const [skinType, setSkinType] = useState<SkinType | undefined>(undefined)
  const [dosage, setDosage] = useState('')
  const [perStrip, setPerStrip] = useState('')
  const [prescription, setPrescription] = useState(false)
  const [symptom, setSymptom] = useState<Symptom | undefined>(undefined)

  // A typed amount only applies to the options that ask for one.
  const units = chosen.units ?? clamp(typedUnits, chosen.min ?? 1, chosen.max ?? 9999)
  const each = roundMoney(itemPrice(product, units))
  const listEach = roundMoney(itemListPrice(product, units))
  const total = roundMoney(each * quantity)
  const per = unitPrice(product)
  const asksAmount = chosen.units === undefined
  const splittable = product.unit !== 'item'

  const amountLabel =
    product.unit === 'ml' || product.unit === 'g'
      ? `How many ${product.unit}?`
      : `How many ${unitLabel(product.unit, 2)}?`

  const choose = (option: PackagingOption) => {
    setKind(option.kind)
    if (option.units === undefined) setTypedUnits(option.suggested ?? option.min ?? 1)
    setAdded(false)
  }

  return (
    <div className="space-y-5">
      {sizes && sizes.length > 1 && (
        <Field label="Size" hint={`Sold in ${product.unit}`}>
          <div className="flex flex-wrap gap-2">
            {sizes.map((value, index) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSize(value)
                  setKind('box')
                  setAdded(false)
                }}
                aria-pressed={size === value}
                className={`chip ${size === value ? 'chip-active' : ''}`}
              >
                {['Small', 'Medium', 'Large'][index] ?? 'Size'} · {value}
                {product.unit}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Unit type" hint={shelf}>
        <div className="flex flex-wrap gap-2">
          {unitTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setUnitType(type)
                setAdded(false)
              }}
              aria-pressed={unitType === type}
              className={`chip ${unitType === type ? 'chip-active' : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </Field>

      {shelf === 'Skincare' && (
        <Field label="Details" hint="Optional">
          <div className="space-y-3 rounded-lg border border-line bg-surface p-3">
            <Line label={`Volume (${volumeUnit(product)})`}>
              <input
                type="number"
                min={1}
                value={volume}
                onChange={(event) => setVolume(event.target.value)}
                placeholder={String(product.packSize)}
                className="input w-28 py-1.5"
              />
            </Line>
            <Line label="Skin type">
              <Tags
                values={SKIN_TYPES}
                selected={skinType}
                onSelect={(next) => setSkinType(next)}
              />
            </Line>
          </div>
        </Field>
      )}

      {shelf === 'Medicine' && (
        <Field label="Details" hint="Optional">
          <div className="space-y-3 rounded-lg border border-line bg-surface p-3">
            <Line label="Dosage">
              <input
                value={dosage}
                onChange={(event) => setDosage(event.target.value)}
                placeholder="e.g. 500mg"
                maxLength={20}
                className="input w-28 py-1.5"
              />
            </Line>

            {isCounted(product.unit) && (
              <Line label="Per strip">
                <input
                  type="number"
                  min={1}
                  value={perStrip}
                  onChange={(event) => setPerStrip(event.target.value)}
                  placeholder="10"
                  className="input w-28 py-1.5"
                />
              </Line>
            )}

            <Line label="Prescription">
              <button
                type="button"
                onClick={() => setPrescription((on) => !on)}
                aria-pressed={prescription}
                className={`chip ${prescription ? 'chip-active' : ''}`}
              >
                {prescription ? 'Required' : 'Not required'}
              </button>
            </Line>

            <Line label="Symptom">
              <Tags values={SYMPTOMS} selected={symptom} onSelect={(next) => setSymptom(next)} />
            </Line>
          </div>
        </Field>
      )}

      <Field
        label="Packaging"
        hint={splittable ? `${formatPrice(per)} per ${unitLabel(product.unit, 1)}` : undefined}
      >
        <div className="space-y-2">
          {options.map((option) => {
            const active = option.kind === kind
            const preview = option.units ?? option.suggested ?? 1
            return (
              <button
                key={option.kind}
                type="button"
                onClick={() => choose(option)}
                aria-pressed={active}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  active ? 'border-navy bg-navy-tint/50' : 'border-line bg-white hover:border-navy'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    active ? 'border-navy' : 'border-line'
                  }`}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{option.label}</span>
                  <span className="block truncate text-xs text-muted">{option.note}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-navy">
                  {formatPrice(roundMoney(itemPrice(product, preview)))}
                </span>
              </button>
            )
          })}
        </div>
      </Field>

      {asksAmount && (
        <Field label={amountLabel} hint={`${chosen.min ?? 1}–${chosen.max ?? 999}`}>
          <div className="flex items-center gap-3">
            <Stepper
              value={units}
              min={chosen.min ?? 1}
              max={chosen.max ?? 999}
              onChange={(next) => {
                setTypedUnits(next)
                setAdded(false)
              }}
              suffix={unitLabel(product.unit, units)}
            />
          </div>
        </Field>
      )}

      <Field label="Quantity" hint={`How many ${asksAmount ? 'of these' : 'packs'}`}>
        <Stepper
          value={quantity}
          min={1}
          max={99}
          onChange={(next) => {
            setQuantity(next)
            setAdded(false)
          }}
        />
      </Field>

      <Field label="Notes for the pharmacy" hint="Optional">
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          maxLength={200}
          placeholder="e.g. only need 5 tablets, or the smallest size available"
          className="input resize-none"
        />
      </Field>

      <div className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">
            {quantity} × {units} {unitLabel(product.unit, units)}
          </span>
          <span className="flex items-baseline gap-2">
            {listEach > each && (
              <span className="text-sm text-muted line-through">
                {formatPrice(roundMoney(listEach * quantity))}
              </span>
            )}
            <span className="text-xl font-bold text-navy">{formatPrice(total)}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            addConfigured({
              productId: product.id,
              quantity,
              packaging: chosen.kind,
              units,
              size: sizes ? size : undefined,
              note: note.trim() || undefined,
              price: each,
              itemCategory: shelf,
              unitType,
              volume: Number(volume) || undefined,
              skinType,
              dosage: dosage.trim() || undefined,
              perStrip: Number(perStrip) || undefined,
              prescription: prescription || undefined,
              symptom,
            })
            setAdded(true)
          }}
          className="btn-primary mt-3 w-full"
        >
          {added ? <Check size={18} /> : <ShoppingCart size={18} />}
          {added ? 'Added to cart' : 'Add to cart'}
        </button>
      </div>
    </div>
  )
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">{label}</h3>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/** One optional field: its name on the left, its control on the right. */
function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </div>
  )
}

/** Single-select chips that clear when the chosen one is tapped again. */
function Tags<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: readonly T[]
  selected: T | undefined
  onSelect: (value: T | undefined) => void
}) {
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(selected === value ? undefined : value)}
          aria-pressed={selected === value}
          className={`chip px-2.5 py-1 text-xs ${selected === value ? 'chip-active' : ''}`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg border border-line bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="p-2.5 text-muted transition-colors hover:text-navy disabled:opacity-40"
          aria-label="Decrease"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
          className="w-14 border-0 bg-transparent p-0 text-center text-sm font-bold text-ink outline-none"
          aria-label="Amount"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="p-2.5 text-muted transition-colors hover:text-navy disabled:opacity-40"
          aria-label="Increase"
        >
          <Plus size={16} />
        </button>
      </div>
      {suffix && <span className="text-sm text-muted">{suffix}</span>}
    </div>
  )
}
