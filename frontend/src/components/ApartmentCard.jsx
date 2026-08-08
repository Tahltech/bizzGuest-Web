import { Link } from 'react-router-dom';
import { formatXAF } from '../utils/formatCurrency.js';

export function ApartmentCard({ apartment, searchParams }) {
  const detailHref = searchParams ? `/apartments/${apartment.slug}?${searchParams}` : `/apartments/${apartment.slug}`;

  return (
    <Link to={detailHref} className="card group flex flex-col overflow-hidden transition hover:border-gold/50 hover:shadow-lg">
      <div className="aspect-[4/3] w-full overflow-hidden bg-cream-line">
        {apartment.featuredMedia ? (
          <img
            src={apartment.featuredMedia.url}
            alt={apartment.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-soft">No photo yet</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{apartment.apartmentType?.name}</p>
        <h3 className="mt-1 text-lg">{apartment.name}</h3>
        <p className="mt-1 text-sm text-ink-soft">Up to {apartment.maxGuests} guests · {apartment.beds} bed{apartment.beds > 1 ? 's' : ''} · {apartment.bathrooms} bath{apartment.bathrooms > 1 ? 's' : ''}</p>
        {apartment.amenities?.length > 0 && (
          <p className="mt-2 text-xs text-ink-soft">{apartment.amenities.slice(0, 4).map((a) => a.label).join(' · ')}</p>
        )}
        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <span className="font-mono text-lg tabular-nums">{formatXAF(apartment.pricing?.nightMinor)}</span>
            <span className="text-xs text-ink-soft"> / night</span>
          </div>
          <span className="btn-primary !px-4 !py-1.5 !text-xs">View</span>
        </div>
      </div>
    </Link>
  );
}
