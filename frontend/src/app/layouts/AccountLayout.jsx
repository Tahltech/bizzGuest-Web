import { NavLink, Outlet, Link } from 'react-router-dom';
import { Logo } from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/account', label: 'Dashboard', end: true },
  { to: '/account/bookings', label: 'My Bookings' },
  { to: '/apartments', label: 'Find an Apartment' },
  { to: '/account/payments', label: 'Payments' },
  { to: '/account/receipts', label: 'Receipts' },
  { to: '/account/profile', label: 'Profile' }
];

function navLinkClass({ isActive }) {
  return `block rounded-md px-3 py-2 text-sm transition ${
    isActive ? 'bg-brass text-white' : 'text-ink-soft hover:bg-stone-line/50 hover:text-ink'
  }`;
}

export function AccountLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone">
      <header className="border-b border-stone-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/"><Logo /></Link>
          <span className="text-sm text-ink-soft">{user?.fullName}</span>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <aside className="w-56 flex-shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={logout} className="mt-4 w-full rounded-md px-3 py-2 text-left text-sm text-ink-soft hover:bg-stone-line/50 hover:text-ink">
            Logout
          </button>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
