import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchWidget } from '../../components/SearchWidget.jsx';
import { ApartmentCard } from '../../components/ApartmentCard.jsx';
import { availabilityApi } from '../../api/availability.js';
import { apartmentsApi } from '../../api/apartments.js';
import { formatDate } from '../../utils/formatCurrency.js';

export function ApartmentListPage() {
  const [params] = useSearchParams();
  const checkIn = params.get('checkIn');
  const checkOut = params.get('checkOut');
  const guests = params.get('guests') || '1';
  const isSearching = Boolean(checkIn && checkOut);

  const availabilityQuery = useQuery({
    queryKey: ['availability', checkIn, checkOut, guests],
    queryFn: () => availabilityApi.search({ checkIn, checkOut, guests }),
    enabled: isSearching
  });

  const catalogQuery = useQuery({
    queryKey: ['apartments', 'published'],
    queryFn: () => apartmentsApi.list({ perPage: 24 }),
    enabled: !isSearching
  });

  const isLoading = isSearching ? availabilityQuery.isLoading : catalogQuery.isLoading;
  const isError = isSearching ? availabilityQuery.isError : catalogQuery.isError;
  const apartments = isSearching ? availabilityQuery.data?.apartments : catalogQuery.data?.data;
  const scarcity = availabilityQuery.data?.scarcity;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl">Apartments</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {isSearching
          ? `${formatDate(checkIn)} — ${formatDate(checkOut)} · ${guests} guest${Number(guests) > 1 ? 's' : ''}`
          : 'Every apartment currently published by BizzGuest.'}
      </p>

      <SearchWidget className="mt-6" />

      {scarcity && (
        <p className="mt-4 text-sm font-medium text-status-warn">
          Only {scarcity.remaining} apartment{scarcity.remaining > 1 ? 's' : ''} left for these dates.
        </p>
      )}

      <div className="mt-8">
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-80 animate-pulse bg-stone-line/40" />
            ))}
          </div>
        )}

        {isError && (
          <div className="card p-10 text-center text-sm text-status-danger">
            Something went wrong loading apartments. Please try again.
          </div>
        )}

        {!isLoading && !isError && apartments?.length === 0 && (
          <div className="card flex flex-col items-center gap-2 p-16 text-center">
            <p className="text-lg">
              {isSearching ? 'All apartments are currently booked for your selected dates.' : "The apartment catalog isn't published yet."}
            </p>
            <p className="max-w-sm text-sm text-ink-soft">
              {isSearching
                ? 'Try different dates, or get in touch and BizzGuest will help you find a place to stay.'
                : "Once the guest house's apartments are added in the dashboard, they'll appear here."}
            </p>
            {isSearching && (
              <Link to="/apartments" className="btn-secondary mt-2">Clear dates</Link>
            )}
          </div>
        )}

        {!isLoading && !isError && apartments?.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {apartments.map((apartment) => (
              <ApartmentCard key={apartment.id} apartment={apartment} searchParams={isSearching ? params.toString() : null} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
