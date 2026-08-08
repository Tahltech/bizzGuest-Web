import { Router } from 'express';
import { authenticate, optionalAuthenticate, requirePermission } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../lib/storageAdapter/index.js';
import * as controller from './controller.js';
import {
  createApartmentSchema, updateApartmentSchema, listQuerySchema,
  mediaUpdateSchema, blockedDateSchema, pricingRuleSchema
} from './schema.js';

export const router = Router();
const manage = [authenticate, requirePermission('apartments.manage')];

router.get('/', optionalAuthenticate, validate({ query: listQuerySchema }), controller.list);
router.get('/:idOrSlug', optionalAuthenticate, controller.detail);

router.post('/', manage, validate({ body: createApartmentSchema }), controller.create);
router.put('/:id', manage, validate({ body: updateApartmentSchema }), controller.update);
router.delete('/:id', manage, controller.remove);

router.post('/:id/media', manage, upload.array('files', 20), controller.uploadMedia);
router.delete('/:id/media/:mediaId', manage, controller.deleteMedia);
router.patch('/:id/media/:mediaId', manage, validate({ body: mediaUpdateSchema }), controller.updateMedia);

router.post('/:id/block-dates', manage, validate({ body: blockedDateSchema }), controller.addBlockedDate);
router.delete('/:id/block-dates/:blockId', manage, controller.removeBlockedDate);

router.post('/:id/pricing-rules', manage, validate({ body: pricingRuleSchema }), controller.addPricingRule);
router.delete('/:id/pricing-rules/:ruleId', manage, controller.removePricingRule);
