export interface CreditShortfall {
  available: number;
  required: number;
  missing: number;
}

export function getCreditShortfall(
  balance: number | null | undefined,
  reserved: number,
  required: number | null | undefined,
): CreditShortfall | null {
  if (balance == null || required == null) return null;
  const available = Math.max(0, balance - reserved);
  if (available >= required) return null;
  return { available, required, missing: required - available };
}

/** Only authoritative billing-period usage; never infer allowance from a balance snapshot. */
export function packageUsageThreshold(usage?:{used:number;allowance:number}):50|80|90|null {
 if(!usage||!Number.isFinite(usage.used)||!Number.isFinite(usage.allowance)||usage.used<0||usage.allowance<=0)return null;
 const percent=100*usage.used/usage.allowance;return percent>=90?90:percent>=80?80:percent>=50?50:null;
}
