const QUICK_OPTIONS = [1, 2, 5, 10]
const MIN = 0.5
const MAX = 20

export default function RadiusControl({ radius, onChange }) {
  const pct = ((radius - MIN) / (MAX - MIN)) * 100

  return (
    <div className="radius-control">
      <span className="radius-label">
        Straal: <strong>{radius < 1 ? `${radius * 1000}m` : `${radius} km`}</strong>
      </span>
      <div className="radius-quick">
        {QUICK_OPTIONS.map(km => (
          <button
            key={km}
            className={`radius-btn ${radius === km ? 'active' : ''}`}
            onClick={() => onChange(km)}
          >
            {km} km
          </button>
        ))}
      </div>
      <input
        type="range"
        min={MIN}
        max={MAX}
        step="0.5"
        value={radius}
        onChange={e => onChange(Number(e.target.value))}
        className="radius-slider"
        style={/** @type {any} */({ '--pct': pct })}
      />
    </div>
  )
}
