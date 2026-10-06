import { platformEndpoint, platformFetch } from "../platform";
import { useEffect, useState } from 'react';
import type { PricingCatalog } from '../../../shared/pricing';

let value: PricingCatalog | undefined;
let pending: Promise<PricingCatalog> | undefined;
function load(): Promise<PricingCatalog> {
  if (value && value.expiresAt > Date.now()) return Promise.resolve(value);
  if (pending) return pending;
  const url = new URL(platformEndpoint('/pricing-catalog'));
  url.searchParams.set('route', '/pricing-catalog');
  // Deliberately independent of the authenticated mutation queue and account state.
  pending = platformFetch(url, { signal: AbortSignal.timeout(20_000) })
    .then(async response => {
      if (!response.ok) throw new Error('Catalog estimates unavailable');
      value = await response.json() as PricingCatalog;
      return value;
    }).finally(() => { pending = undefined; });
  return pending;
}
export function usePricingCatalog() {
  const [catalog, setCatalog] = useState(value);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const next = await load();
        if (active) setCatalog(next);
      } catch {
        value = undefined;
        if (active) setCatalog(undefined);
        // Exact authenticated pricing remains available; retry estimates later.
      }
      if (active) timer = setTimeout(refresh, Math.max(1000, (value?.expiresAt ?? Date.now() + 30_000) - Date.now()));
    }
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, []);
  return catalog;
}
