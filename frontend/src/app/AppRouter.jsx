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
import { BookingReviewPage } from '../pages/booking/BookingReviewPage.jsx';
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage.jsx';
import { MyBookingsPage } from '../pages/account/MyBookingsPage.jsx';
import { BookingConfirmationPage } from '../pages/account/BookingConfirmationPage.jsx';
import { MyPaymentsPage } from '../pages/account/MyPaymentsPage.jsx';
import { ReceiptsPage } from '../pages/account/ReceiptsPage.jsx';
import { ProfilePage } from '../pages/account/ProfilePage.jsx';
import { DashboardHomePage } from '../pages/dashboard/DashboardHomePage.jsx';
import { ApartmentsIndexPage } from '../pages/dashboard/apartments/ApartmentsIndexPage.jsx';
import { ApartmentFormPage } from '../pages/dashboard/apartments/ApartmentFormPage.jsx';
import { ReservationsIndexPage } from '../pages/dashboard/reservations/ReservationsIndexPage.jsx';
import { ReservationDetailPage } from '../pages/dashboard/reservations/ReservationDetailPage.jsx';
import { PaymentsIndexPage } from '../pages/dashboard/payments/PaymentsIndexPage.jsx';
import { ReceiptsIndexPage } from '../pages/dashboard/receipts/ReceiptsIndexPage.jsx';
import { ProfilePage as StaffProfilePage } from '../pages/dashboard/profile/ProfilePage.jsx';
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

        <Route element={<AuthGuard />}>
          <Route path="/book/:slug" element={<BookingReviewPage />} />
        </Route>
      </Route>

      <Route element={<AuthGuard />}>
        <Route path="/account" element={<AccountLayout />}>
          <Route index element={<AccountDashboardPage />} />
          <Route path="bookings" element={<MyBookingsPage />} />
          <Route path="bookings/:reference" element={<BookingConfirmationPage />} />
          <Route path="payments" element={<MyPaymentsPage />} />
          <Route path="receipts" element={<ReceiptsPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
          <Route
            path="reservations"
            element={<PermissionGuard permission="bookings.view"><ReservationsIndexPage /></PermissionGuard>}
          />
          <Route
            path="reservations/:reference"
            element={<PermissionGuard permission="bookings.view"><ReservationDetailPage /></PermissionGuard>}
          />
          <Route
            path="payments"
            element={<PermissionGuard permission="payments.view"><PaymentsIndexPage /></PermissionGuard>}
          />
          <Route
            path="receipts"
            element={<PermissionGuard permission="payments.view"><ReceiptsIndexPage /></PermissionGuard>}
          />
          <Route path="profile" element={<StaffProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
