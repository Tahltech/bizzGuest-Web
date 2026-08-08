import { asyncHandler, created, noContent, ok } from '../../lib/response.js';
import * as service from './service.js';

function ctxFrom(req) {
  return { userId: req.user?.id, ip: req.ip };
}

export const list = asyncHandler(async (req, res) => {
  const isStaffView = Boolean(req.user?.permissions?.includes('apartments.view'));
  const { data, meta } = await service.listApartments(req.query, { isStaffView });
  return ok(res, data, meta);
});

export const detail = asyncHandler(async (req, res) => {
  const apartment = await service.getApartment(req.params.idOrSlug);
  return ok(res, apartment);
});

export const create = asyncHandler(async (req, res) => {
  const apartment = await service.createApartment(req.body, ctxFrom(req));
  return created(res, apartment);
});

export const update = asyncHandler(async (req, res) => {
  const apartment = await service.updateApartment(req.params.id, req.body, ctxFrom(req));
  return ok(res, apartment);
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteApartment(req.params.id, ctxFrom(req));
  return noContent(res);
});

export const uploadMedia = asyncHandler(async (req, res) => {
  const media = await service.uploadMedia(req.params.id, req.files, ctxFrom(req));
  return created(res, media);
});

export const deleteMedia = asyncHandler(async (req, res) => {
  await service.deleteMedia(req.params.id, req.params.mediaId, ctxFrom(req));
  return noContent(res);
});

export const updateMedia = asyncHandler(async (req, res) => {
  const media = await service.updateMedia(req.params.id, req.params.mediaId, req.body, ctxFrom(req));
  return ok(res, media);
});

export const addBlockedDate = asyncHandler(async (req, res) => {
  const rows = await service.addBlockedDate(req.params.id, req.body, ctxFrom(req));
  return created(res, rows);
});

export const removeBlockedDate = asyncHandler(async (req, res) => {
  const rows = await service.removeBlockedDate(req.params.id, req.params.blockId, ctxFrom(req));
  return ok(res, rows);
});

export const addPricingRule = asyncHandler(async (req, res) => {
  const rows = await service.addPricingRule(req.params.id, req.body, ctxFrom(req));
  return created(res, rows);
});

export const removePricingRule = asyncHandler(async (req, res) => {
  const rows = await service.removePricingRule(req.params.id, req.params.ruleId, ctxFrom(req));
  return ok(res, rows);
});
