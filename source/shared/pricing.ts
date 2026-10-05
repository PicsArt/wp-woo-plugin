import type { CreditRange } from '@picsart/ai-sdk';
import { displayResolution } from './video-options';

export interface PricingCatalog {
  basis: 'public-estimate';
  expiresAt: number;
  models: Record<string, CreditRange | null>;
}

/** Only scale units whose complete quantity is known; token/megapixel rates aren't totals. */
export function estimatePrice(catalog: PricingCatalog | undefined, model: string, input: {
  kind: 'image' | 'video'; resolution?: string; duration?: number;
}, now = Date.now()): string | undefined {
  if (!catalog || catalog.expiresAt <= now) return;
  const tiers = catalog.models[model]?.tiers.filter(t =>
    (!t.useCase || t.useCase === (input.kind === 'image' ? 'image-to-image' : 'image-to-video')) &&
    (!t.quality || (input.kind === 'image' ? t.quality === 'medium' : displayResolution(t.quality) === input.resolution)) &&
    (t.audio === undefined || t.audio === false));
  if (!tiers?.length) return;
  const totals = tiers.map(t => t.unit === 'generation' ? t.credits :
    t.unit === 'second' && input.kind === 'video' && input.duration && input.duration > 0 ? t.credits * input.duration : NaN);
  if (totals.some(n => !Number.isFinite(n) || n < 0)) return;
  const min = Math.min(...totals), max = Math.max(...totals);
  const format = (n: number) => Number(n.toFixed(2)).toString();
  return min === max ? format(min) : `${format(min)}–${format(max)}`;
}
