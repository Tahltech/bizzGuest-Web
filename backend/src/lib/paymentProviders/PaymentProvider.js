/**
 * The interface every payment provider adapter implements, per architecture
 * §11. Services call these methods only — never a provider SDK directly —
 * so swapping or adding a provider never touches booking/payment logic.
 *
 * @typedef {Object} PaymentProvider
 * @property {(args: {amountMinor:number, currency:string, phone:string, description:string, externalReference:string}) => Promise<{providerReference:string, raw:any}>} createCollection
 *   Initiates a mobile money collection request. Returns the provider's
 *   reference for this attempt; the payment stays `pending` until a webhook
 *   (or a status poll) confirms it.
 * @property {(rawBody:string, headers:Record<string,string>) => boolean} verifyWebhookSignature
 * @property {(payload:any) => {providerReference:string, status:'succeeded'|'failed'|'pending', amountMinor:number, raw:any}} parseWebhookEvent
 * @property {(args: {providerReference:string, amountMinor:number}) => Promise<{refundReference:string, raw:any}>} refund
 */
export {};
