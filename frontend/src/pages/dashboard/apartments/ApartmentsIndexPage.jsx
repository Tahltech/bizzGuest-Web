import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apartmentsApi } from '../../../api/apartments.js';
import { formatXAF } from '../../../utils/formatCurrency.js';
import { useAuth } from '../../../context/AuthContext.jsx';

const STATUS_STYLES = {
  available: 'bg-status-good/15 text-status-good',
  reserved: 'bg-status-warn/15 text-status-warn',
  occupied: 'bg-navy/15 text-navy',
  cleaning: 'bg-gold/20 text-gold-dark',
  maintenance: 'bg-status-danger/15 text-status-danger',
  out_of_service: 'bg-ink-soft/15 text-ink-soft'
};

export function ApartmentsIndexPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('apartments.manage');

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'apartments'],
    queryFn: () => apartmentsApi.list({ perPage: 50, includeInactive: true })
  });

  const apartments = data?.data || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Apartments</h1>
        {canManage && <Link to="/dashboard/apartments/new" className="btn-primary">New apartment</Link>}
      </div>

      <div className="mt-6 overflow-x-auto rounded-card border border-cream-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-cream-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price / night</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">Loading…</td></tr>
            )}
            {!isLoading && apartments.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-ink-soft">No apartments yet. Create the first one to get started.</td></tr>
            )}
            {apartments.map((apt) => (
              <tr key={apt.id} className="border-b border-cream-line last:border-0 hover:bg-cream/60">
                <td className="px-4 py-3 font-mono text-xs">{apt.code}</td>
                <td className="px-4 py-3">{apt.name}</td>
                <td className="px-4 py-3 text-ink-soft">{apt.apartmentType?.name}</td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatXAF(apt.pricing?.nightMinor)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[apt.status] || ''}`}>{apt.status}</span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{apt.isActive ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right">
                  {canManage && <Link to={`/dashboard/apartments/${apt.id}`} className="text-gold-dark hover:underline">Edit</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
