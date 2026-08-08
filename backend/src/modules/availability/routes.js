import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { searchSchema } from './schema.js';
import * as controller from './controller.js';

export const router = Router();

router.get('/search', validate({ query: searchSchema }), controller.search);
