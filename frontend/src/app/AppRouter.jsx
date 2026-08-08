import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AccountLayout } from './layouts/AccountLayout.jsx';
import { DashboardLayout } from './layouts/DashboardLayout.jsx';
import { AuthGuard, PermissionGuard } from './guards/AuthGuard.jsx';
import { HomePage } from '../pages/public/HomePage.jsx';
import { ApartmentListPage } from '../pages/public/ApartmentListPage.jsx';
import { ApartmentDetailPage } from '../pages/public/ApartmentDetailPage.jsx';
import { LoginPage } from '../pages/public/LoginPage.jsx';
import { RegisterPage } from '../pages/public/RegisterPage.jsx';
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage.jsx';
import { DashboardHomePage } from '../pages/dashboard/DashboardHomePage.jsx';
import { ApartmentsIndexPage } from '../pages/dashboard/apartments/ApartmentsIndexPage.jsx';
import { ApartmentFormPage } from '../pages/dashboard/apartments/ApartmentFormPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/apartments" element={<ApartmentListPage />} />
        <Route path="/apartments/:slug" element={<ApartmentDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AuthGuard />}>
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountDashboardPage />} />
        </Route>

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route
            path="apartments"
            element={<PermissionGuard permission="apartments.view"><ApartmentsIndexPage /></PermissionGuard>}
          />
          <Route
            path="apartments/new"
            element={<PermissionGuard permission="apartments.manage"><ApartmentFormPage /></PermissionGuard>}
          />
          <Route
            path="apartments/:id"
            element={<PermissionGuard permission="apartments.manage"><ApartmentFormPage /></PermissionGuard>}
          />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
