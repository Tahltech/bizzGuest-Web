import * as availabilityRepo from './repository.js';
import * as apartmentsRepo from '../apartments/repository.js';

function nightsBetween(checkIn, checkOut) {
  const ms = new Date(checkOut).setHours(0, 0, 0, 0) - new Date(checkIn).setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export async function search({ checkIn, checkOut, guests }) {
  const [rows, totalActive] = await Promise.all([
    availabilityRepo.searchAvailable({ checkIn, checkOut, guests }),
    availabilityRepo.countActiveApartments()
  ]);

  const nights = nightsBetween(checkIn, checkOut);
  const ids = rows.map((r) => r.id);
  const [amenitiesByApartment, featuredMediaByApartment] = await Promise.all([
    apartmentsRepo.getAmenitiesForApartments(ids),
    apartmentsRepo.getFeaturedMediaForApartments(ids)
  ]);

  const apartments = rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    slug: row.slug,
    description: row.description,
    apartmentType: { name: row.apartment_type_name, slug: row.apartment_type_slug },
    maxGuests: row.max_guests,
    beds: row.beds,
    bathrooms: row.bathrooms,
    isFeatured: Boolean(row.is_featured),
    amenities: amenitiesByApartment[row.id] || [],
    featuredMedia: featuredMediaByApartment[row.id]
      ? { url: featuredMediaByApartment[row.id].url, type: featuredMediaByApartment[row.id].type }
      : null,
    pricing: {
      nightMinor: row.price_night_minor,
      currency: 'XAF',
      nights,
      estimatedTotalMinor: row.price_night_minor * nights
    }
  }));

  return {
    checkIn,
    checkOut,
    nights,
    guests,
    apartments,
    // Honest scarcity signal — real counts only, per architecture §57. Only
    // surfaced when genuinely scarce so it never reads as manufactured urgency.
    scarcity:
      totalActive > 0 && apartments.length > 0 && apartments.length <= Math.max(2, Math.ceil(totalActive * 0.2))
        ? { remaining: apartments.length }
        : null
  };
}
