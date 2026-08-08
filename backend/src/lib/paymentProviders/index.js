import { CampayProvider } from './CampayProvider.js';
import { ManualProvider } from './ManualProvider.js';

const providers = {
  campay: CampayProvider,
  manual: ManualProvider
};

/** Resolves the adapter for a payments.provider value. See architecture §11. */
export function getPaymentProvider(providerKey) {
  const provider = providers[providerKey];
  if (!provider) throw new Error(`Unknown payment provider "${providerKey}".`);
  return provider;
}
