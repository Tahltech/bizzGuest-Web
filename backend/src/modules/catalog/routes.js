import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import { createApartmentTypeSchema, createAmenitySchema } from './schema.js';

export const apartmentTypesRouter = Router();
apartmentTypesRouter.get('/', controller.listApartmentTypes);
apartmentTypesRouter.post(
  '/',
  authenticate,
  requirePermission('apartments.manage'),
  validate({ body: createApartmentTypeSchema }),
  controller.createApartmentType
);

export const amenitiesRouter = Router();
amenitiesRouter.get('/', controller.listAmenities);
amenitiesRouter.post(
  '/',
  authenticate,
  requirePermission('apartments.manage'),
  validate({ body: createAmenitySchema }),
  controller.createAmenity
);
