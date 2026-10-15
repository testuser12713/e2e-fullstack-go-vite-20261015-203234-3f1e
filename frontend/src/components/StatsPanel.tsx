import type { BookStatus, Stats } from '../types';
import { STATUS_LABELS } from '../labels';
import { booksLabel, formatAverage, MONTH_NAMES, monthBars } from '../lib/statsFormat';
import './StatsPanel.css';

export interface StatsPanelProps {
  stats: Stats | null;
}

const STATUS_ORDER: BookStatus[] = ['planned', 'reading', 'read'];

export default function StatsPanel({ stats }: StatsPanelProps) {
  if (!stats) {
    return (
      <section className="stats-panel" aria-label="Statistik" aria-busy="true">
        <h2 className="stats-panel__heading">Statistik</h2>
        <p className="stats-panel__placeholder">Statistik wird geladen …</p>
      </section>
    );
  }
  const now = new Date();
  const currentMonth = stats.year === now.getFullYear() ? now.getMonth() : -1;
  const bars = monthBars(stats.monthly);
  const summary = bars.map((b, i) => `${MONTH_NAMES[i]}: ${b.count}`).join(', ');
  return (
    <section className="stats-panel" aria-label="Statistik">
      <h2 className="stats-panel__heading">Statistik {stats.year}</h2>
      <div className="stats-panel__section">
        <div className="stats-panel__label">Dieses Jahr gelesen</div>
        <div className="stats-panel__hero" data-testid="read-count">{stats.readCount}</div>
      </div>
      <div className="stats-panel__section stats-panel__avg">
        <span className="stats-panel__label">Ø Bewertung</span>
        <span className="stats-panel__avg-value" data-testid="average-rating">
          {formatAverage(stats.averageRating)}
          {stats.averageRating !== null && <span className="stats-panel__star" aria-hidden="true">★</span>}
        </span>
      </div>
      <div className="stats-panel__section">
        <div className="month-bars" role="img" aria-label={`Gelesene Bücher pro Monat: ${summary}`}>
          {bars.map((b, i) => (
            <div key={b.label} className="month-bars__col">
              <div className="month-bars__track">
                <div
                  className={b.count > 0 ? 'month-bars__bar' : 'month-bars__bar month-bars__bar--zero'}
                  data-testid="month-bar"
                  style={b.count > 0 ? { height: `${Math.max(b.ratio * 100, 2)}%` } : undefined}
                  title={`${MONTH_NAMES[i]}: ${booksLabel(b.count)}`}
                />
              </div>
              <span className={i === currentMonth ? 'month-bars__label month-bars__label--current' : 'month-bars__label'}>
                <span className="month-bars__long">{b.label}</span>
                <span className="month-bars__short" aria-hidden="true">{b.label[0]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <ul className="stats-panel__section stats-panel__status">
        {STATUS_ORDER.map((s) => (
          <li key={s} className="stats-panel__status-row">
            <span className={`stats-panel__dot stats-panel__dot--${s}`} aria-hidden="true" />
            <span className="stats-panel__status-label">{STATUS_LABELS[s]}</span>
            <span className="stats-panel__count" data-testid={`status-count-${s}`}>{stats.statusCounts?.[s] ?? 0}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
export { StatsPanel };
