// ============================================================
// SupplySarthi — Decoupled REST API Client
// ============================================================

/**
 * Modern REST API client replacing google.script.run for Vercel SPA architecture.
 */

function api(action, payload, cb, errCb) {
  if (typeof markActivity === 'function') markActivity();
  if (typeof beginBusy === 'function') beginBusy('Please wait', 'Processing...');

  const p = payload || {};
  const requestBody = Object.assign({ action: action, payload: p }, p);

  fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8' // GAS doPost requires text/plain or no preflight CORS issues
    },
    body: JSON.stringify(requestBody)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('HTTP network error: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      if (typeof endBusy === 'function') endBusy();
      if (data && data.subscriptionExpired && action !== 'adminLogin' && action !== 'clientLogin') {
        if (window.APP && window.APP.role === 'client') {
          if (typeof showClientMaintenanceScreen === 'function') showClientMaintenanceScreen(data.settings);
          return;
        }
        if (typeof toast === 'function') toast('Subscription expired. Redirecting to subscription page...', true);
        setTimeout(function () { window.location.href = 'subscription.html'; }, 1200);
        return;
      }
      if (cb) cb(data);
    })
    .catch(err => {
      if (typeof endBusy === 'function') endBusy();
      if (typeof toast === 'function') toast('Error: ' + err.message, true);
      console.error('API Error (' + action + '):', err);
      if (errCb) errCb(err);
    });
}

function apiBg(action, payload, cb, errCb) {
  if (typeof markActivity === 'function') markActivity();

  const p = payload || {};
  const requestBody = Object.assign({ action: action, payload: p }, p);

  fetch(CONFIG.GAS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(requestBody)
  })
    .then(response => response.json())
    .then(data => {
      if (cb) cb(data);
    })
    .catch(err => {
      console.warn('Background sync warning (' + action + '):', err.message);
      if (errCb) {
        errCb(err);
      } else if (cb) {
        cb({ success: false, message: err.message });
      }
    });
}
