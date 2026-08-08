import { asyncHandler, ok } from '../../lib/response.js';
import * as service from './service.js';

export const search = asyncHandler(async (req, res) => {
  const result = await service.search(req.query);
  return ok(res, result);
});
