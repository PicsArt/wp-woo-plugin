/* Refresh only the current WordPress user's consented account state. */
(async function () {
  const status = document.querySelector('#picsart-plugin-status span');
  const link = document.getElementById('picsart-plugin-connect');
  const notice = document.getElementById('picsart-onboarding-notice');
  if ((!status || !link) && !notice) return;
  const config = window.picsartPluginRow;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(config.url, {headers: {'X-WP-Nonce': config.nonce}, credentials: 'same-origin', signal: controller.signal});
    if (!response.ok) throw new Error('Account status unavailable');
    const data = await response.json();
    if (typeof data.auth?.authenticated !== 'boolean') throw new Error('Missing account status');
    const reconnect = data.auth.requiresReconnect || data.auth.requiresSessionReset;
    if (notice) notice.hidden = data.auth.authenticated && !reconnect;
    if (status && link) {
    status.textContent = reconnect ? config.reconnect : data.auth.authenticated ? config.connected : config.disconnected;
    link.textContent = reconnect ? config.reconnect : data.auth.authenticated ? config.manage : config.connect;
    if (data.auth.authenticated && !reconnect) link.href = config.settings;
    }
  } catch (_) {
    if (status) status.textContent = config.unavailable;
  } finally { clearTimeout(timeout); }
})();
