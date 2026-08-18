// ============================================================
// SupplySarthi — Decoupled REST API Client
// Supporting Multi-Supplier Central Registry & Dynamic Routing
// ============================================================

/**
 * Global active supplier API target URL for buyer requests
 */
window.CURRENT_SUPPLIER_API_URL = null;

/**
 * Resolves the appropriate target Google Apps Script URL for a given API action
 */
function getGasUrl(action) {
  // Actions that MUST go to the Master Central Registry
  const centralActions = ['GET_CUSTOMER_SUPPLIERS', 'LINK_CUSTOMER_TO_SUPPLIER', 'REGISTER_SUPPLIER'];
  if (centralActions.indexOf(action) > -1) {
    return (CONFIG && CONFIG.CENTRAL_REGISTRY_URL) ? CONFIG.CENTRAL_REGISTRY_URL : CONFIG.GAS_URL;
  }

  // If active supplier is set (e.g. buyer selected a supplier), route to that supplier's endpoint
  if (window.CURRENT_SUPPLIER_API_URL) {
    return window.CURRENT_SUPPLIER_API_URL;
  }

  // Default fallback URL
  return (CONFIG && CONFIG.GAS_URL) ? CONFIG.GAS_URL : '';
}

/**
 * Modern REST API client replacing google.script.run for Vercel SPA architecture.
 */
function api(action, payload, cb, errCb) {
  if (typeof markActivity === 'function') markActivity();
  if (typeof beginBusy === 'function') beginBusy('Please wait', 'Processing...');

  const p = payload || {};
  const requestBody = Object.assign({ action: action, payload: p }, p);
  const targetUrl = getGasUrl(action);

  fetch(targetUrl, {
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
  const targetUrl = getGasUrl(action);

  fetch(targetUrl, {
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
