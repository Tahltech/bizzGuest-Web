import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../../components/Logo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function PublicLayout() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="sticky top-0 z-20 bg-navy shadow-[0_1px_0_rgba(201,164,92,.25)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/"><Logo variant="light" /></Link>
          <nav className="hidden items-center gap-8 text-sm text-cream/75 md:flex">
            <Link to="/apartments" className="transition hover:text-gold">{t('nav.apartments')}</Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/account"
                className="inline-flex items-center justify-center rounded-card border border-cream/25 px-4 py-2 text-sm font-medium text-cream transition hover:border-gold hover:text-gold"
              >
                Account
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-cream/75 transition hover:text-gold">{t('nav.login')}</Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-card bg-gold px-4 py-2 text-sm font-medium text-navy transition hover:bg-gold-light"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-navy text-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-4">
          <div>
            <Logo variant="light" />
            <p className="mt-3 text-sm text-cream/60">Comfortable serviced apartments and guest house rooms in Yaoundé.</p>
          </div>
          <div>
            <h4 className="mb-3 text-xs uppercase tracking-wide text-gold/70">Explore</h4>
            <ul className="space-y-2 text-sm text-cream/75">
              <li><Link to="/apartments" className="transition hover:text-gold">Apartments</Link></li>
              <li><Link to="/login" className="transition hover:text-gold">Booking</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs uppercase tracking-wide text-gold/70">Policies</h4>
            <ul className="space-y-2 text-sm text-cream/75">
              <li><Link to="/terms" className="transition hover:text-gold">Terms</Link></li>
              <li><Link to="/privacy" className="transition hover:text-gold">Privacy Policy</Link></li>
              <li><Link to="/cancellation-policy" className="transition hover:text-gold">Cancellation Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-xs uppercase tracking-wide text-gold/70">Contact</h4>
            <ul className="space-y-2 text-sm text-cream/75">
              <li>Yaoundé, Cameroon</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
