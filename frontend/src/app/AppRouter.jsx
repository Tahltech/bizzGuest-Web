import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AccountLayout } from './layouts/AccountLayout.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';
import { AuthGuard } from './guards/AuthGuard.jsx';
import { HomePage } from '../pages/public/HomePage.jsx';
import { ApartmentListPage } from '../pages/public/ApartmentListPage.jsx';
import { LoginPage } from '../pages/public/LoginPage.jsx';
import { RegisterPage } from '../pages/public/RegisterPage.jsx';
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage.jsx';
import { DashboardHomePage } from '../pages/dashboard/DashboardHomePage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/apartments" element={<ApartmentListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountDashboardPage />} />
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
