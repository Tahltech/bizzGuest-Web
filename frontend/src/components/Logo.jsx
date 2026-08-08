export function Logo({ variant = 'dark', className = '' }) {
  const textColor = variant === 'light' ? 'text-cream' : 'text-ink';
  const accentColor = variant === 'light' ? 'text-gold' : 'text-gold-dark';
  return (
    <span className={`inline-flex items-baseline gap-1.5 font-serif text-xl ${textColor} ${className}`}>
      <span className={accentColor}>Bizz</span>
      <span>Guest</span>
    </span>
  );
}
