/* Gilded Night — eight-point certificate seal, the brand's trust motif. */
export function Seal({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2l2.4 1.7 2.9-.2 1 2.7 2.4 1.6-.6 2.9 1 2.7-2 2.1.1 2.9-2.8.9-1.6 2.4-2.8-.7-2.8.7-1.6-2.4-2.8-.9.1-2.9-2-2.1 1-2.7-.6-2.9L4.7 6.2l1-2.7 2.9.2L12 2z"
        fill="none"
        stroke="#c88f2c"
        strokeWidth="1.3"
      />
      <path
        d="M8.5 12l2.3 2.3 4.7-4.7"
        fill="none"
        stroke="#f5c451"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
