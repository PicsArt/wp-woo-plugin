import {Fragment, useEffect, useRef, useState} from 'react';
import type {DeviceLoginStatus} from '../../shared/types';
import {countdown, type DeviceView} from './device-sign-in';

type Request = <T>(path: string, body?: unknown) => Promise<T>;
/**
 * Shows the device code and polls while mounted, including while the tab is hidden: approval happens
 * in another tab. The server paces calls to Picsart, so extra polls here are cheap.
 */
export function DeviceSignIn({view, request, onStatus, onRestart, onCancel, onClose, busy}: {
  view: DeviceView;
  request: Request;
  onStatus: (status: DeviceLoginStatus) => void;
  onRestart: () => void;
  onCancel: (attemptId: string) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const pending = view.kind === 'pending' ? view : undefined;
  const interval = useRef(5);
  interval.current = pending?.interval ?? 5;
  const status = useRef(onStatus);
  status.current = onStatus;
  const [now, setNow] = useState(Date.now());
  const [copy, setCopy] = useState<'idle' | 'copied' | 'manual'>('idle');
  const code = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!pending) return;
    let active = true, inFlight = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!active || inFlight) return;
      inFlight = true;
      clearTimeout(timer);
      try {
        const answer = await request<DeviceLoginStatus>('/auth/device/poll', {});
        if (active) status.current(answer);
      } catch { /* Transient: the code stays valid, so keep waiting. */ }
      finally {
        inFlight = false;
        if (active) timer = setTimeout(poll, interval.current * 1000);
      }
    };
    const wake = () => { if (document.visibilityState === 'visible') void poll(); };
    timer = setTimeout(poll, interval.current * 1000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(clock);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, [pending?.attemptId]);
  useEffect(() => setCopy('idle'), [pending?.attemptId]);
  if (!pending) {
    return (
      <section className="device-sign-in" aria-live="polite">
        <p role="alert">{view.kind === 'ended' ? view.message : ''}</p>
        <div className="device-actions">
          <button disabled={busy} onClick={onRestart}>Get a new code</button>
          <button className="secondary" onClick={onClose}>Close</button>
        </div>
      </section>
    );
  }
  const left = pending.deadline - now;
  const selectCode = () => {
    const range = document.createRange();
    if (code.current) range.selectNodeContents(code.current);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
  };
  return (
    <section className="device-sign-in" aria-live="polite">
      <h2>Connect your Picsart account</h2>
      <p>Approve this code on the Picsart page. Check the code on the Picsart page matches this one before you approve.</p>
      <div className="device-code-row">
        <code ref={code} className="device-code" aria-label={`Sign-in code ${pending.userCode}`}>
          {pending.userCode.split('-').map((part, index) => <Fragment key={index}>{index ? <>-<wbr /></> : null}{part}</Fragment>)}
        </code>
        <button className="secondary" onClick={() => {
          // Clipboard access can be blocked in embedded dashboards; fall back to a selected code.
          const manual = () => { selectCode(); setCopy('manual'); };
          if (!navigator.clipboard) return manual();
          navigator.clipboard.writeText(pending.userCode).then(() => setCopy('copied'), manual);
        }}>{copy === 'copied' ? 'Copied' : 'Copy code'}</button>
      </div>
      {copy === 'manual' && <small>The code is selected. Press Ctrl+C or ⌘C to copy it.</small>}
      <p>
        <a className="device-open" href={pending.verificationUriComplete ?? pending.verificationUri} target="_blank" rel="noopener noreferrer">Open Picsart</a>
        {' '}or go to{' '}
        <a href={pending.verificationUri} target="_blank" rel="noopener noreferrer">{pending.verificationUri.replace(/^https:\/\//, '')}</a>
        {' '}and enter the code.
      </p>
      <p role="status">
        {pending.finishing ? 'Approved. Finishing sign-in…'
          : left > 0 ? `Waiting for approval. The code expires in ${countdown(left)}.`
          : 'Checking whether the code was approved…'}
      </p>
      {/* Once approved, the tokens are spent and cancelling would only lose the sign-in. */}
      {!pending.finishing && <button className="secondary" disabled={busy} onClick={() => onCancel(pending.attemptId)}>Cancel</button>}
    </section>
  );
}
