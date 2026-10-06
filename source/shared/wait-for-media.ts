/** Wait for an existing import; never resubmit an ambiguous import. */
export async function waitForMedia(
  readStatus: () => Promise<string | undefined>,
  pause: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 2000)),
  attempts = 30,
): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const status = await readStatus();
    if (status === 'SAVED' || status === 'ATTACHED') return;
    if (status !== 'IMPORTING') {
      throw new Error('WordPress has not confirmed this copy. Check the result status before trying again. Your original video is retained.');
    }
    if (attempt < attempts - 1) await pause();
  }
  throw new Error('WordPress is still processing this video. When it is ready, choose Add to product listing again. The existing import will be reused.');
}
