import type {DeviceLoginStatus, PendingDevice} from '../../shared/types';
export type DeviceView =
  | ({kind: 'pending'; deadline: number; finishing?: boolean} & PendingDevice)
  | {kind: 'ended'; status: 'denied' | 'expired' | 'error'; message: string; attemptId?: string};
/** The deadline comes from the server's remaining time, so a skewed browser clock cannot shorten it. */
export function pendingView(device: PendingDevice & {finishing?: boolean}, now = Date.now()): DeviceView {
  const {finishing, ...rest} = device;
  return {kind: 'pending', ...rest, deadline: now + device.expiresIn, ...(finishing ? {finishing} : {})};
}
/**
 * Applies a sign-in answer to the panel. A newer attempt started in another tab is adopted; answers for
 * an older attempt, and late answers for an attempt that already ended, are dropped. `undefined` closes
 * the panel: the attempt is gone on the server, because another tab finished or cancelled it.
 */
export function applyDeviceStatus(view: DeviceView | undefined, status: DeviceLoginStatus, now = Date.now()): DeviceView | 'connected' | undefined {
  if (view?.attemptId && status.attemptId && status.attemptId !== view.attemptId) {
    // The account is connected whichever attempt did it.
    if (status.status === 'connected') return 'connected';
    // Another tab replaced this code: follow the newer one. An older answer arriving late is dropped.
    if (status.status === 'pending' && view.kind === 'pending' && status.expiresAt > view.expiresAt) return pendingView(status, now);
    return view;
  }
  if (view?.kind === 'ended' && status.attemptId === view.attemptId) return view;
  if (status.status === 'connected') return 'connected';
  if (status.status === 'pending') return pendingView(status, now);
  if (!status.attemptId) return undefined;
  return {kind: 'ended', status: status.status, message: status.message, attemptId: status.attemptId};
}
export function countdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
