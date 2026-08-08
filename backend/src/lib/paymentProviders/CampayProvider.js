import axios from 'axios';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';
import { logger } from '../logger.js';

/**
 * Campay adapter — implements PaymentProvider for MTN Mobile Money + Orange
 * Money collections in Cameroon via https://www.campay.net.
 *
 * >>> REQUIRES CAMPAY_APP_USERNAME / CAMPAY_APP_PASSWORD / CAMPAY_WEBHOOK_KEY <<<
 * Set these in your .env from your Campay dashboard (Apps → your app →
 * credentials, and Webhooks → signing key). Until they're set, every method
 * below throws a clear "Campay is not configured" error rather than silently
 * pretending to succeed — no payment is ever faked (architecture §11).
 *
 * Note on webhooks: this adapter treats an incoming webhook as a trigger to
 * re-confirm the transaction via Campay's status endpoint using our own
 * authenticated token, rather than trusting the webhook body alone. That's
 * deliberately robust to the exact webhook signing scheme on your Campay
 * account tier — double-check the payload shape/headers against your
 * dashboard's webhook docs once you're wired up, and tighten
 * `verifyWebhookSignature` if Campay gives you a per-request signature header.
 */

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function assertConfigured() {
  if (!env.campay.isConfigured) {
    throw new Error(
      'Campay is not configured. Set CAMPAY_APP_USERNAME and CAMPAY_APP_PASSWORD in .env (see .env.example).'
    );
  }
}

async function getAccessToken() {
  assertConfigured();
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const { data } = await axios.post(`${env.campay.baseUrl}/api/token/`, {
    username: env.campay.appUsername,
    password: env.campay.appPassword
  });

  cachedToken = data.token;
  // Campay tokens are short-lived; refresh a little early to avoid edge races.
  cachedTokenExpiresAt = Date.now() + 25 * 60 * 1000;
  return cachedToken;
}

async function authedClient() {
  const token = await getAccessToken();
  return axios.create({
    baseURL: env.campay.baseUrl,
    headers: { Authorization: `Token ${token}` }
  });
}

/** Initiates a mobile money collection request (MTN MoMo or Orange Money — Campay auto-detects the operator from the phone prefix). */
export async function createCollection({ amountMinor, phone, description, externalReference }) {
  const client = await authedClient();
  const { data } = await client.post('/api/collect/', {
    amount: String(amountMinor),
    currency: 'XAF',
    from: phone,
    description,
    external_reference: externalReference
  });

  logger.info(`[campay] collection initiated ref=${data.reference} external=${externalReference}`);
  return { providerReference: data.reference, raw: data };
}

/** Authoritative status check — call this after a webhook fires, before trusting a "succeeded" state. */
export async function getTransactionStatus(providerReference) {
  const client = await authedClient();
  const { data } = await client.get(`/api/transaction/status/${providerReference}/`);
  return { status: mapCampayStatus(data.status), raw: data };
}

function mapCampayStatus(rawStatus) {
  switch ((rawStatus || '').toUpperCase()) {
    case 'SUCCESSFUL':
      return 'succeeded';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}

/**
 * Verifies the shared webhook signing key configured in the Campay dashboard.
 * Confirm the exact header name Campay sends on your account (commonly a
 * custom header or a `?key=` query param) and adjust the lookup below —
 * this defaults to checking a `x-campay-webhook-key` header.
 */
export function verifyWebhookSignature(req) {
  if (!env.campay.isWebhookConfigured) {
    throw new Error('CAMPAY_WEBHOOK_KEY is not set — cannot verify webhook authenticity.');
  }
  const provided = req.headers['x-campay-webhook-key'] || req.query.key;
  if (!provided) return false;

  const providedBuf = Buffer.from(String(provided));
  const expectedBuf = Buffer.from(env.campay.webhookKey);
  // timingSafeEqual throws on unequal-length buffers rather than returning
  // false — an attacker-controlled length must never crash the endpoint.
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export function parseWebhookEvent(payload) {
  return {
    providerReference: payload.reference,
    status: mapCampayStatus(payload.status),
    amountMinor: Number(payload.amount),
    raw: payload
  };
}

export async function refund() {
  // Campay's public API does not expose a direct refund endpoint at the time
  // of writing — refunds are typically processed as a manual reverse
  // collection via the dashboard. Recorded here as `payments.status =
  // 'refunded'` by an Accountant action (payments.refund permission) with a
  // manual provider entry, not through this adapter. Revisit if Campay adds
  // a refund API to your account tier.
  throw new Error('Campay refunds are not automated — process the reversal in the Campay dashboard, then record it manually.');
}

export const CampayProvider = {
  createCollection,
  getTransactionStatus,
  verifyWebhookSignature,
  parseWebhookEvent,
  refund
};
