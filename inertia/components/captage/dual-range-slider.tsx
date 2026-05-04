import { useEffect, useRef } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

type DualRangeSliderProps = {
  years: number[]
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  onCommit: (min: number, max: number) => void
}

export default function DualRangeSlider({
  years,
  valueMin,
  valueMax,
  onChange,
  onCommit,
}: DualRangeSliderProps) {
  if (years.length === 0) return null

  const min = years[0]
  const max = years[years.length - 1]
  const blue = fr.colors.decisions.border.default.blueFrance.default
  const grey = fr.colors.decisions.border.default.grey.default

  const toPercent = (val: number) => ((val - min) / (max - min || 1)) * 100
  const leftPct = toPercent(valueMin)
  const rightPct = toPercent(valueMax)

  // Refs track the latest pending values so onPointerUp/onKeyUp
  // always commit the most recent drag position without stale closures.
  const pendingMinRef = useRef(valueMin)
  const pendingMaxRef = useRef(valueMax)
  useEffect(() => {
    pendingMinRef.current = valueMin
  }, [valueMin])
  useEffect(() => {
    pendingMaxRef.current = valueMax
  }, [valueMax])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), pendingMaxRef.current)
    pendingMinRef.current = val
    onChange(val, pendingMaxRef.current)
  }
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), pendingMinRef.current)
    pendingMaxRef.current = val
    onChange(pendingMinRef.current, val)
  }
  const handleCommit = () => onCommit(pendingMinRef.current, pendingMaxRef.current)

  if (years.length === 1) {
    return (
      <p
        className="fr-text--sm fr-mb-0"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        {years[0]}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Selected range label */}
      <div className="flex justify-center">
        <span
          className="fr-text--sm fr-mb-0 fr-px-1w fr-py-0"
          style={{
            background: fr.colors.decisions.background.alt.blueFrance.default,
            color: fr.colors.decisions.text.label.blueFrance.default,
            fontWeight: 700,
            borderRadius: 4,
          }}
        >
          {valueMin === valueMax ? String(valueMin) : `${valueMin} – ${valueMax}`}
        </span>
      </div>

      {/* Track + thumbs */}
      <div style={{ position: 'relative', height: 24, margin: '0 8px' }}>
        {/* Background track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 4,
            background: grey,
            transform: 'translateY(-50%)',
            borderRadius: 2,
          }}
        >
          {/* Active range highlight */}
          <div
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              right: `${100 - rightPct}%`,
              height: '100%',
              background: blue,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Min input */}
        <input
          type="range"
          aria-label="Année minimum"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          aria-valuetext={String(valueMin)}
          min={min}
          max={max}
          step={1}
          value={valueMin}
          onChange={handleMinChange}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: valueMin === valueMax ? 5 : 3,
          }}
          className="dual-range-thumb"
        />

        {/* Max input */}
        <input
          type="range"
          aria-label="Année maximum"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={String(valueMax)}
          min={min}
          max={max}
          step={1}
          value={valueMax}
          onChange={handleMaxChange}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 4,
          }}
          className="dual-range-thumb"
        />
      </div>

      {/* Year labels */}
      <div className="flex justify-between">
        {years.map((year) => (
          <span
            key={year}
            className="fr-text--xs fr-mb-0"
            style={{
              color:
                year >= valueMin && year <= valueMax
                  ? fr.colors.decisions.text.label.blueFrance.default
                  : fr.colors.decisions.text.mention.grey.default,
              fontWeight: year === valueMin || year === valueMax ? 700 : 400,
            }}
          >
            {year}
          </span>
        ))}
      </div>
    </div>
  )
}
