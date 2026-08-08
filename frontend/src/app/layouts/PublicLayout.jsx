import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function PublicLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-stone">
      <header className="sticky top-0 z-20 border-b border-stone-line bg-stone/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/"><Logo /></Link>
          <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
            <Link to="/apartments" className="hover:text-ink">{t('nav.apartments')}</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/account" className="btn-secondary !px-4 !py-2">Account</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-ink-soft hover:text-ink">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary !px-4 !py-2">{t('nav.signup')}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-stone-line bg-ink text-stone">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <Logo variant="light" />
            <p className="mt-3 text-sm text-stone/70">Comfortable serviced apartments and guest house rooms in Yaoundé.</p>
          </div>
          <div>
            <h4 className="mb-3 text-xs uppercase tracking-wide text-stone/50">Explore</h4>
            <ul className="space-y-2 text-sm text-stone/80">
              <li><Link to="/apartments" className="hover:text-white">Apartments</Link></li>
              <li><Link to="/login" className="hover:text-white">Booking</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs uppercase tracking-wide text-stone/50">Policies</h4>
            <ul className="space-y-2 text-sm text-stone/80">
              <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/cancellation-policy" className="hover:text-white">Cancellation Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs uppercase tracking-wide text-stone/50">Contact</h4>
            <ul className="space-y-2 text-sm text-stone/80">
              <li>Yaoundé, Cameroon</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
