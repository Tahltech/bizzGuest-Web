import { BookingDetail } from '../../../components/BookingDetail.jsx';

export function ReservationDetailPage() {
  return (
    <div className="p-8">
      <BookingDetail backTo="/dashboard/reservations" backLabel="Reservations" showGuestContact />
    </div>
  );
}
