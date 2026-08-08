import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function SearchWidget({ className = '' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [checkIn, setCheckIn] = useState(params.get('checkIn') || todayISO());
  const [checkOut, setCheckOut] = useState(params.get('checkOut') || tomorrowISO());
  const [guests, setGuests] = useState(params.get('guests') || '1');

  function onSubmit(e) {
    e.preventDefault();
    navigate(`/apartments?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`);
  }

  return (
    <form onSubmit={onSubmit} className={`card grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end ${className}`}>
      <div>
        <label className="label" htmlFor="checkIn">Check-in</label>
        <input id="checkIn" type="date" min={todayISO()} className="input" value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="checkOut">Check-out</label>
        <input id="checkOut" type="date" min={checkIn} className="input" value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)} required />
      </div>
      <div>
        <label className="label" htmlFor="guests">Guests</label>
        <input id="guests" type="number" min="1" max="20" className="input w-24" value={guests}
          onChange={(e) => setGuests(e.target.value)} required />
      </div>
      <button type="submit" className="btn-primary">Search</button>
    </form>
  );
}
