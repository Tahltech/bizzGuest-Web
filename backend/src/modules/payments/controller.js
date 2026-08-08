import { asyncHandler, created, ok } from '../../lib/response.js';
import * as service from './service.js';

function ctxFrom(req) {
  return { userId: req.user?.id, permissions: req.user?.permissions, ip: req.ip };
}

export const initiateMobileMoney = asyncHandler(async (req, res) => {
  const payment = await service.initiateMobileMoneyPayment(req.params.idOrReference, req.body, ctxFrom(req));
  return created(res, payment);
});

export const recordManual = asyncHandler(async (req, res) => {
  const payment = await service.recordManualPayment(req.params.idOrReference, req.body, ctxFrom(req));
  return created(res, payment);
});

export const listForBooking = asyncHandler(async (req, res) => {
  const payments = await service.listPaymentsForBooking(req.params.idOrReference, ctxFrom(req));
  return ok(res, payments);
});

export const refresh = asyncHandler(async (req, res) => {
  const payment = await service.refreshPaymentStatus(req.params.id, ctxFrom(req));
  return ok(res, payment);
});

export const refund = asyncHandler(async (req, res) => {
  const payment = await service.refundPayment(req.params.id, req.body, ctxFrom(req));
  return ok(res, payment);
});

export const campayWebhook = asyncHandler(async (req, res) => {
  const result = await service.handleCampayWebhook(req);
  return ok(res, result);
});
