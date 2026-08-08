/**
 * Cash / bank transfer payments recorded by staff. No external calls — a
 * Receptionist or Accountant confirms the money was received and the payment
 * is marked succeeded immediately, attributed to the recording user
 * (payments.recorded_by), never anonymous.
 */
export async function createCollection() {
  throw new Error('Manual payments are recorded directly by staff, not initiated through a provider call.');
}

export function verifyWebhookSignature() {
  return false; // manual payments have no webhook
}

export function parseWebhookEvent() {
  throw new Error('Manual payments do not receive webhooks.');
}

export async function refund() {
  throw new Error('Manual refunds are recorded directly by an Accountant, not through a provider call.');
}

export const ManualProvider = {
  createCollection,
  verifyWebhookSignature,
  parseWebhookEvent,
  refund
};
