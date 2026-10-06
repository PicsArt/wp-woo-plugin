import type { Quote } from "../../shared/types";

// Exact input keys include the account, source, model and all output settings.
const quotes = new Map<string, Quote>();
const pending = new Map<string, Promise<Quote>>();
export function cached(key: string | null) {
  const quote = key ? quotes.get(key) : undefined;
  return quote && quote.expiresAt > Date.now() + 5000 ? quote : undefined;
}
export function invalidateQuote(id: string) {
  for (const [key, quote] of quotes) if (quote.id === id) quotes.delete(key);
}
export async function preloadQuote(key: string, load: () => Promise<Quote>) {
  const ready = cached(key);
  if (ready) return ready;
  if (pending.has(key)) return pending.get(key)!;
  const task = load().then(quote => {
    for (const [k, q] of quotes) if (q.expiresAt <= Date.now()) quotes.delete(k);
    if (quotes.size >= 80) quotes.delete(quotes.keys().next().value!);
    quotes.set(key, quote);
    return quote;
  }).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}

export function invalidateKey(key: string) { quotes.delete(key); }

// Restore only live, unused quotes returned by the authenticated workspace.
export function restoreQuotes(subject: string | undefined, saved: Quote[]) {
  if (!subject) return;
  for (const quote of saved) {
    if (quote.expiresAt <= Date.now() + 5000) continue;
    const input = quote.kind === "image"
      ? { sourceId: quote.source?.id, prompt: quote.template.prompt, model: quote.model, quality: quote.params?.quality ?? "medium" }
      : { sourceId: quote.source?.id, templateId: quote.template.id,
          ...(quote.template.id === "custom" ? { customPrompt: quote.template.description } : {}),
          model: quote.model, duration: quote.output?.duration,
          resolution: quote.output?.resolution, aspectRatio: quote.output?.aspectRatio };
    const key = JSON.stringify([subject, input]);
    if (!cached(key)) quotes.set(key, quote);
  }
  while (quotes.size > 80) quotes.delete(quotes.keys().next().value!);
}
