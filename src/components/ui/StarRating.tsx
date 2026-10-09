import { Star } from 'lucide-react';

/** Read-only star display. Only ever rendered with real, aggregated review data. */
export function StarRating({ value, size = 14, label }: { value: number; size?: number; label: string }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={size}
          height={size}
          aria-hidden
          className={i <= rounded ? 'fill-warning text-warning' : i - 0.5 === rounded ? 'fill-warning/50 text-warning' : 'text-line-strong'}
        />
      ))}
    </span>
  );
}
