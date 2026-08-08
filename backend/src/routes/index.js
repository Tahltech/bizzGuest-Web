import { Router } from 'express';
import { router as authRouter } from '../modules/auth/routes.js';
import { router as apartmentsRouter } from '../modules/apartments/routes.js';
import { router as availabilityRouter } from '../modules/availability/routes.js';
import { apartmentTypesRouter, amenitiesRouter } from '../modules/catalog/routes.js';
import { router as bookingsRouter } from '../modules/bookings/routes.js';

export const router = Router();

router.use('/auth', authRouter);
router.use('/apartments', apartmentsRouter);
router.use('/availability', availabilityRouter);
router.use('/apartment-types', apartmentTypesRouter);
router.use('/amenities', amenitiesRouter);
router.use('/bookings', bookingsRouter);

// Mounted as each module is built (see architecture §18 phases):
// router.use('/payments', paymentsRouter);
// router.use('/guests', guestsRouter);
// router.use('/staff', staffRouter);
// router.use('/housekeeping', housekeepingRouter);
// router.use('/maintenance', maintenanceRouter);
// router.use('/expenses', expensesRouter);
// router.use('/reports', reportsRouter);
// router.use('/notifications', notificationsRouter);
// router.use('/reviews', reviewsRouter);
// router.use('/settings', settingsRouter);
