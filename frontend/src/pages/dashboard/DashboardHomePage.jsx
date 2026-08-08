import { useAuth } from '../../context/AuthContext.jsx';

const STAT_LABELS = ["Today's bookings", 'Check-ins today', 'Check-outs today', "Today's revenue"];

export function DashboardHomePage() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl">Today's overview</h1>
      <p className="mt-1 text-sm text-ink-soft">Signed in as {user?.fullName} — {user?.roles?.join(', ')}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_LABELS.map((label) => (
          <div key={label} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
            <p className="mt-2 font-mono text-2xl tabular-nums">—</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        Live figures appear here once reservations, payments, and housekeeping are wired up in the following build phases.
      </p>
    </div>
  );
}
