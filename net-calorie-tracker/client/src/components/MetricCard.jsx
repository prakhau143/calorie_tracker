export function MetricCard({ label, value, unit = 'kcal', tone = 'neutral', hint }) {
  return (
    <div className={`metric-card glass-panel metric-card--${tone}`}>
      <span className="metric-card__label eyebrow">{label}</span>
      <span className="metric-card__value mono">
        {value}
        <span className="metric-card__unit">{unit}</span>
      </span>
      {hint && <span className="metric-card__hint">{hint}</span>}
    </div>
  );
}
