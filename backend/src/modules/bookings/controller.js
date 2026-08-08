import { asyncHandler, created, ok } from '../../lib/response.js';
import * as service from './service.js';
import { getUserContact } from './repository.js';

function ctxFrom(req) {
  return { userId: req.user.id, permissions: req.user.permissions, ip: req.ip };
}

export const create = asyncHandler(async (req, res) => {
  const contact = await getUserContact(req.user.id);
  const booking = await service.createBooking(req.body, {
    ...ctxFrom(req),
    fullName: contact.full_name,
    email: contact.email,
    phone: contact.phone,
    source: 'website'
  });
  return created(res, booking);
});

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.listBookings(req.query, ctxFrom(req));
  return ok(res, data, meta);
});

export const detail = asyncHandler(async (req, res) => {
  const booking = await service.getBooking(req.params.idOrReference, ctxFrom(req));
  return ok(res, booking);
});

export const cancel = asyncHandler(async (req, res) => {
  const booking = await service.cancelBooking(req.params.idOrReference, req.body, ctxFrom(req));
  return ok(res, booking);
});
