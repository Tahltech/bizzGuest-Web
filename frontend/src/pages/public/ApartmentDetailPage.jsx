import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apartmentsApi } from '../../api/apartments.js';
import { formatXAF, formatDate } from '../../utils/formatCurrency.js';
import { useAuth } from '../../context/AuthContext.jsx';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ApartmentDetailPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState(params.get('checkIn') || '');
  const [checkOut, setCheckOut] = useState(params.get('checkOut') || '');
  const [guests, setGuests] = useState(params.get('guests') || '1');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const { data: apartment, isLoading, isError } = useQuery({
    queryKey: ['apartment', slug],
    queryFn: () => apartmentsApi.detail(slug)
  });

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-6 py-16"><div className="h-96 animate-pulse rounded-card bg-stone-line/40" /></div>;
  }

  if (isError || !apartment) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="text-lg">We couldn't find that apartment.</p>
        <Link to="/apartments" className="btn-primary mt-4 inline-flex">Back to apartments</Link>
      </div>
    );
  }

  const media = apartment.media?.length ? apartment.media : [];
  const activeMedia = media[activeMediaIndex];
  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)) : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/apartments" className="text-sm text-ink-soft hover:text-ink">← Back to apartments</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-card bg-stone-line">
            {activeMedia ? (
              activeMedia.type === 'video' ? (
                <video src={activeMedia.url} controls className="h-full w-full object-cover" />
              ) : (
                <img src={activeMedia.url} alt={apartment.name} className="h-full w-full object-cover" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-ink-soft">No photos yet</div>
            )}
          </div>
          {media.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMediaIndex(i)}
                  className={`flex aspect-square items-center justify-center overflow-hidden rounded-md border-2 bg-stone-line ${i === activeMediaIndex ? 'border-brass' : 'border-transparent'}`}
                >
                  {m.type === 'image' ? (
                    <img src={m.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-ink-soft">▶ Video</span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8">
            <p className="text-xs uppercase tracking-wide text-ink-soft">{apartment.apartmentType?.name}</p>
            <h1 className="mt-1 text-3xl">{apartment.name}</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Up to {apartment.maxGuests} guests · {apartment.beds} bed{apartment.beds > 1 ? 's' : ''} · {apartment.bathrooms} bath{apartment.bathrooms > 1 ? 's' : ''}
            </p>
            {apartment.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{apartment.description}</p>}

            {apartment.amenities?.length > 0 && (
              <div className="mt-6">
                <h2 className="mb-3 text-sm uppercase tracking-wide text-ink-soft">Amenities</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {apartment.amenities.map((a) => (
                    <span key={a.id} className="text-sm text-ink-soft">· {a.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="card h-fit p-6">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl tabular-nums">{formatXAF(apartment.pricing?.nightMinor)}</span>
            <span className="text-sm text-ink-soft">/ night</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-stone-line pt-4">
            <div>
              <label className="label" htmlFor="detailCheckIn">Check-in</label>
              <input id="detailCheckIn" type="date" min={todayISO()} className="input" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="detailCheckOut">Check-out</label>
              <input id="detailCheckOut" type="date" min={checkIn || todayISO()} className="input" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="detailGuests">Guests</label>
              <input id="detailGuests" type="number" min="1" max={apartment.maxGuests} className="input" value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
          </div>

          {nights && (
            <div className="mt-4 space-y-2 border-t border-stone-line pt-4 text-sm">
              <div className="flex justify-between text-ink-soft"><span>{formatDate(checkIn)} — {formatDate(checkOut)}</span><span>{nights} night{nights > 1 ? 's' : ''}</span></div>
              <div className="flex justify-between font-medium"><span>Estimated total</span><span className="font-mono tabular-nums">{formatXAF(apartment.pricing?.nightMinor * nights)}</span></div>
              <p className="text-xs text-ink-soft">Final price is confirmed on the next step.</p>
            </div>
          )}

          {checkIn && checkOut ? (
            user ? (
              <Link to={`/book/${slug}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`} className="btn-primary mt-6 w-full">
                Continue to book
              </Link>
            ) : (
              <Link
                to="/login"
                state={{ from: { pathname: `/apartments/${slug}`, search: `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}` } }}
                className="btn-primary mt-6 w-full"
              >
                Sign in to book
              </Link>
            )
          ) : (
            <button type="button" disabled className="btn-primary mt-6 w-full opacity-50">
              Select dates to continue
            </button>
          )}
          <p className="mt-2 text-center text-xs text-ink-soft">You'll confirm details and pay on the next step.</p>
        </aside>
      </div>
    </div>
  );
}
