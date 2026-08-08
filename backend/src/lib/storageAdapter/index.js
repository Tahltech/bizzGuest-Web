import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../../config/env.js';

/**
 * Local-disk storage adapter. Swap for S3/R2/Cloudinary later by replacing
 * this file's exports — every caller only deals in { storageKey, url },
 * never a filesystem path, so the swap never touches calling code.
 */

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function extensionFor(mimetype) {
  return { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov' }[mimetype] || '';
}

function subfolderFor(mimetype) {
  return IMAGE_TYPES.includes(mimetype) ? 'images' : 'videos';
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(env.storage.localPath, subfolderFor(file.mimetype));
    ensureDir(dir);
    cb(null, dir);
  },
  filename(req, file, cb) {
    // Random filename — never trust the client-supplied name, which also
    // sidesteps path traversal entirely.
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extensionFor(file.mimetype)}`;
    cb(null, name);
  }
});

function fileFilter(req, file, cb) {
  if (![...IMAGE_TYPES, ...VIDEO_TYPES].includes(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
  cb(null, true);
}

/** Express middleware: `upload.array('files', 20)` on a media upload route. */
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_VIDEO_BYTES }
});

/** Rejects images that slipped past MAX_IMAGE_BYTES (multer's limit is set to the video ceiling since one middleware handles both types). */
export function assertWithinSizeLimit(file) {
  const isImage = IMAGE_TYPES.includes(file.mimetype);
  const max = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > max) {
    throw new Error(`${file.originalname} exceeds the ${Math.round(max / (1024 * 1024))}MB limit for its file type.`);
  }
}

export function toPublicRecord(file) {
  const storageKey = path.relative(env.storage.localPath, file.path).split(path.sep).join('/');
  return {
    storageKey,
    url: `${env.storage.publicBaseUrl}/${storageKey}`,
    type: IMAGE_TYPES.includes(file.mimetype) ? 'image' : 'video'
  };
}

export function deleteFile(storageKey) {
  const fullPath = path.join(env.storage.localPath, storageKey);
  fs.rm(fullPath, { force: true }, () => {});
}
