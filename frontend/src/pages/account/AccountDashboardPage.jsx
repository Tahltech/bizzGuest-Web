import { useAuth } from '../../context/AuthContext.jsx';

export function AccountDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl">Welcome, {user?.fullName?.split(' ')[0]}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-1 text-sm uppercase tracking-wide text-ink-soft">Upcoming reservation</h2>
          <p className="mt-3 text-sm text-ink-soft">You have no upcoming reservations yet.</p>
        </div>
        <div className="card p-6">
          <h2 className="mb-1 text-sm uppercase tracking-wide text-ink-soft">Outstanding payment</h2>
          <p className="mt-3 text-sm text-ink-soft">Nothing outstanding.</p>
        </div>
      </div>
    </div>
  );
}
