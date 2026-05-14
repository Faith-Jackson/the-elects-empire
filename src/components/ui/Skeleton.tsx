export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`animate-pulse bg-[var(--color-text)]/10 rounded ${className}`} />
  );
}
