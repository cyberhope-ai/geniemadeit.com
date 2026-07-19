/* Gilded Night — gold lamp mark + serif wordmark. */
export function LampIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" style={{ filter: "drop-shadow(0 3px 10px rgba(245,196,81,.5))" }}>
      <defs>
        <linearGradient id="gm-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe390" />
          <stop offset="1" stopColor="#e0a52f" />
        </linearGradient>
      </defs>
      <path
        d="M6 30c0-4 6-7 15-7 3 0 5 .3 7 .8l7-3.5c1.4-.7 2.6.9 1.7 2.2l-2.3 3.2c2 1.3 3.2 2.8 3.2 4.3 0 4-7 7-16.5 7S6 34 6 30Z"
        fill="url(#gm-lg)"
      />
    </svg>
  );
}

export function Wordmark({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className}`}>
      Genie<b className="gold-text font-bold">Made</b>
    </span>
  );
}
