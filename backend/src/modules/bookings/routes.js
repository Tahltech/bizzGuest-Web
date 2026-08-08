import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import { createBookingSchema, cancelBookingSchema, listQuerySchema } from './schema.js';

export const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listQuerySchema }), controller.list);
router.post('/', validate({ body: createBookingSchema }), controller.create);
router.get('/:idOrReference', controller.detail);
router.post('/:idOrReference/cancel', validate({ body: cancelBookingSchema }), controller.cancel);
