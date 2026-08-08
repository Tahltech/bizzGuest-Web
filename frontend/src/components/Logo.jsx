export function Logo({ variant = 'dark', className = '' }) {
  const textColor = variant === 'light' ? 'text-stone' : 'text-ink';
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-serif text-xl ${textColor} ${className}`}>
      <span className="text-brass">Bizz</span>
      <span>Guest</span>
    </span>
  );
}
