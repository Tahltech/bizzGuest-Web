import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import { initiateMobileMoneySchema, manualPaymentSchema, refundSchema, listQuerySchema } from './schema.js';

export const router = Router();

// Unauthenticated — Campay calls this directly. Protected by signature
// verification inside the service, not a session token. Mounted before the
// `authenticate` middleware below so it never requires one.
router.post('/webhook/campay', controller.campayWebhook);

router.use(authenticate);

router.get('/me', validate({ query: listQuerySchema }), controller.listMine);
router.get('/', requirePermission('payments.view'), validate({ query: listQuerySchema }), controller.listAll);

router.post('/bookings/:idOrReference/mobile-money', validate({ body: initiateMobileMoneySchema }), controller.initiateMobileMoney);
router.post('/bookings/:idOrReference/manual', requirePermission('payments.manage'), validate({ body: manualPaymentSchema }), controller.recordManual);
router.get('/bookings/:idOrReference', controller.listForBooking);

router.post('/:id/refresh', controller.refresh);
router.post('/:id/refund', requirePermission('payments.refund'), validate({ body: refundSchema }), controller.refund);
