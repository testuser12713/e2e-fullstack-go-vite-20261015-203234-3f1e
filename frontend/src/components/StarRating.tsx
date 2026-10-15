import { useState } from 'react';
import { nextRating } from '../lib/rating';

export interface StarRatingProps {
  value: number;
  disabled?: boolean;
  onChange: (rating: number) => void;
}

export default function StarRating({ value, disabled = false, onChange }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const shown = disabled ? value : hover || value;
  return (
    <div className="star-rating" role="radiogroup" aria-label="Bewertung" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          className={`star-rating__star${n <= shown ? ' is-filled' : ''}`}
          aria-label={n === 1 ? '1 Stern' : `${n} Sterne`}
          aria-checked={n === value}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(nextRating(value, n))}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
export { StarRating };
