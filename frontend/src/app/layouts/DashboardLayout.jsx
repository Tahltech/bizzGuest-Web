import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', end: true },
  { to: '/dashboard/reservations', label: 'Reservations', permission: 'bookings.view' },
  { to: '/dashboard/apartments', label: 'Apartments', permission: 'apartments.view' },
  { to: '/dashboard/guests', label: 'Guests', permission: 'guests.view' },
  { to: '/dashboard/calendar', label: 'Calendar', permission: 'bookings.view' },
  { to: '/dashboard/payments', label: 'Payments', permission: 'payments.view' },
  { to: '/dashboard/expenses', label: 'Expenses', permission: 'expenses.view' },
  { to: '/dashboard/housekeeping', label: 'Housekeeping', permission: 'housekeeping.view' },
  { to: '/dashboard/maintenance', label: 'Maintenance', permission: 'maintenance.view' },
  { to: '/dashboard/staff', label: 'Staff', permission: 'staff.view' },
  { to: '/dashboard/reports', label: 'Reports', permission: 'reports.view' },
  { to: '/dashboard/reviews', label: 'Reviews', permission: 'reviews.moderate' },
  { to: '/dashboard/settings', label: 'Settings', permission: 'settings.view' }
];

function navLinkClass({ isActive }) {
  return `block rounded-md border-l-2 px-3 py-2 text-sm transition ${
    isActive ? 'border-gold bg-white/[.06] text-gold' : 'border-transparent text-cream/70 hover:bg-white/5 hover:text-cream'
  }`;
}

export function DashboardLayout() {
  const { user, hasPermission, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="flex w-64 flex-shrink-0 flex-col bg-navy px-4 py-6">
        <div className="mb-8 px-2"><Logo variant="light" /></div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission)).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="px-2 text-xs text-cream/50">{user?.email}</p>
          <button onClick={logout} className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-cream/70 hover:bg-white/5 hover:text-cream">
            Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
