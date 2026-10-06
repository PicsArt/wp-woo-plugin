import { friendlyModel } from "./labels";
import { displayResolution } from "../../shared/video-options";
import { useEffect, useRef, useState } from "react";
import type { Quote } from "../../shared/types";
export function GenerationConfirmation({
  quote,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  quote: Quote;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  const [expired, setExpired] = useState(() => Date.now() >= quote.expiresAt);
  useEffect(() => {
    setExpired(Date.now() >= quote.expiresAt);
    const timer = setTimeout(
      () => setExpired(true),
      Math.max(0, quote.expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [quote.expiresAt]);
  return (
    <dialog
      ref={dialog}
      className="generation-dialog"
      aria-labelledby="generation-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="generation-title">{quote.kind === "image" ? "Edit this photo?" : "Generate this video?"}</h2>
      <p>
        {quote.source?.productName ?? quote.source?.name ?? 'From your description'} · {quote.template.name}
      </p>
      <p>
        {quote.kind === "image" ? "1 photo" : `${String(quote.output?.duration ?? quote.params.duration)} seconds`} ·{" "}
        {quote.kind === "image" ? String(quote.params.quality) : displayResolution(quote.output?.resolution ?? quote.params.resolution ?? quote.params.quality)} ·{" "}
        {friendlyModel(quote.model)}
      </p>
      <strong className="confirm-price">{quote.total} Picsart credits</strong>
      <p>
        Confirming authorizes this credit amount for one {quote.kind === "image" ? "photo edit" : "video"}. We check the
        price again before submitting. Review the result before publishing.
      </p>
      {(quote.template.id === "custom" || quote.kind === "image") && (
        <details>
          <summary>Your custom direction</summary>
          <p>{quote.template.description}</p>
        </details>
      )}
      {error && <p role="alert">{error}</p>}
      {expired && (
        <p role="alert">
          This price expired. Close this window to get an updated price.
        </p>
      )}
      <div className="live-row">
        <button
          className="secondary"
          disabled={busy}
          onClick={onCancel}
          autoFocus
        >
          Cancel
        </button>
        <button
          disabled={busy || expired}
          onClick={() => {
            if (Date.now() < quote.expiresAt) onConfirm();
            else setExpired(true);
          }}
        >
          {busy
            ? "Submitting…"
            : `Confirm ${quote.kind === "image" ? "edit" : "video"} · ${quote.total} credits`}
        </button>
      </div>
    </dialog>
  );
}
