import { useEffect, useState } from "react";
import type { Quote } from "../../../shared/types";

import { cached, preloadQuote, invalidateKey } from "../quote-cache";
export { preloadQuote, invalidateQuote } from "../quote-cache";
export function useLiveQuote(
  key: string | null,
  load: (signal: AbortSignal) => Promise<Quote>,
  revision = 0,
  delay = 450,
) {
  const [result, setResult] = useState<{ key: string; revision: number; quote?: Quote; error?: string }>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!key) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void preloadQuote(key, () => load(controller.signal))
        .catch(e => { if (active && e?.name === "AbortError") return preloadQuote(key, () => load(controller.signal)); throw e; })
        .then(quote => { if (active) setResult({ key, revision, quote }); })
        .catch(e => {
          if (active) setResult({ key, revision, error: e instanceof Error ? e.message : "Could not check the credit price." });
        });
    }, cached(key) ? 0 : delay);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
    // The key describes every input used by load.
  }, [key, revision, retry, delay]);
  const current = result?.key === key && result.revision === revision ? result : undefined;
  const quote = cached(key) ?? (current?.quote && current.quote.expiresAt > Date.now() + 5000 ? current.quote : undefined);
  useEffect(() => {
    if (!quote) return;
    const timer = setTimeout(() => {
      if (key) invalidateKey(key);
      setResult(undefined);
      setRetry(v => v + 1);
    }, Math.max(0, quote.expiresAt - Date.now() - 5000));
    return () => clearTimeout(timer);
  }, [quote, key]);
  return {
    quote,
    // A previous displayed price is never an approval quote.
    previousTotal: key && result?.quote && JSON.parse(key)[0] === JSON.parse(result.key)[0]
      ? result.quote.total : undefined,
    error: quote ? undefined : current?.error,
    loading: !!key && !quote && !current?.error,
    retry: () => {
      if (key) invalidateKey(key);
      setResult(undefined);
      setRetry(v => v + 1);
    },
  };
}
