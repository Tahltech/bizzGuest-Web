import { Router } from 'express';
import { router as authRouter } from '../modules/auth/routes.js';

export const router = Router();

router.use('/auth', authRouter);

// Mounted as each module is built (see architecture §18 phases):
// router.use('/apartments', apartmentsRouter);
// router.use('/availability', availabilityRouter);
// router.use('/bookings', bookingsRouter);
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
