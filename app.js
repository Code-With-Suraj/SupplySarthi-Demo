// ============================================================
// SupplySarthi — Frontend Application Logic
// ============================================================

var APP = {
  role: null,
  clientId: null,
  clientName: null,
  allClients: [],
  allItems: [],
  cart: {},
  deliveryOrderId: null,
  subscriptionInfo: null,
  pagers: {},
  listPagers: {},
  subBannerDismissed: false
};

// ===== UTILITIES =====
function fmt(val) {
  var num = parseFloat(val) || 0;
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dStr) {
  if (!dStr) return '-';
  try {
    var d = new Date(dStr);
    if (isNaN(d.getTime())) return String(dStr);
    var day = ('0' + d.getDate()).slice(-2);
    var month = ('0' + (d.getMonth() + 1)).slice(-2);
    var yr = d.getFullYear();
    return day + '/' + month + '/' + yr;
  } catch (e) { return String(dStr); }
}

function sBadge(status) {
  var st = String(status || '').toLowerCase();
  var cls = 'bo';
  if (st === 'delivered' || st === 'paid' || st === 'accepted' || st === 'resolved' || st === 'closed' || st === 'approved') cls = 'bg';
  else if (st === 'pending' || st === 'unpaid' || st === 'in review' || st === 'open') cls = 'bo';
  else if (st === 'cancelled' || st === 'denied' || st === 'rejected') cls = 'bgr';
  return '<span class="badge ' + cls + '">' + (status || 'Pending') + '</span>';
}

function getEmoji(name) {
  var n = String(name || '').toLowerCase();
  if (n.indexOf('milk') > -1 || n.indexOf('doodh') > -1) return '🥛';
  if (n.indexOf('paneer') > -1) return '🧀';
  if (n.indexOf('butter') > -1 || n.indexOf('makkhan') > -1) return '🧈';
  if (n.indexOf('curd') > -1 || n.indexOf('dahi') > -1) return '🥣';
  if (n.indexOf('ghee') > -1) return '🪔';
  if (n.indexOf('bread') > -1) return '🍞';
  if (n.indexOf('egg') > -1) return '🥚';
  if (n.indexOf('vegetable') > -1 || n.indexOf('sabzi') > -1) return '🥬';
  if (n.indexOf('fruit') > -1) return '🍎';
  return '📦';
}

function itemImageHtml_(base64, sizePx) {
  var sz = sizePx || 40;
  if (!base64 || !String(base64).trim()) return '';
  return '<img src="' + base64 + '" style="width:' + sz + 'px;height:' + sz + 'px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">';
}

function toast(msg, isErr) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  setTimeout(function () { t.className = 'toast'; }, 3000);
}

function beginBusy(title, subtitle) {
  var el = document.getElementById('busyOverlay');
  if (!el) return;
  if (title) document.getElementById('busyTitle').textContent = title;
  if (subtitle) document.getElementById('busySubtitle').textContent = subtitle;
  el.classList.add('show');
}

function endBusy() {
  var el = document.getElementById('busyOverlay');
  if (el) el.classList.remove('show');
}

function openModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ===== STATE & CODE HELPERS =====
var INDIA_STATES_ = [
  { code: '01', name: 'Jammu and Kashmir' }, { code: '02', name: 'Himachal Pradesh' }, { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' }, { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' }, { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' }, { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' }, { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' }, { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' }, { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' }, { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' }, { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' }, { code: '29', name: 'Karnataka' }, { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' }, { code: '32', name: 'Kerala' }, { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' }, { code: '35', name: 'Andaman and Nicobar Islands' }, { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' }, { code: '38', name: 'Ladakh' }, { code: '97', name: 'Other Territory' }
];

function getStateCode_(stateName) {
  var s = String(stateName || '').toLowerCase().trim();
  if (!s) return '';
  for (var i = 0; i < INDIA_STATES_.length; i++) {
    if (INDIA_STATES_[i].name.toLowerCase() === s) return INDIA_STATES_[i].code;
  }
  return '';
}

function buildStateOptionsHTML_() {
  var html = '<option value="">-- Select State --</option>';
  INDIA_STATES_.forEach(function (st) {
    html += '<option value="' + st.name + '">' + st.name + ' (' + st.code + ')</option>';
  });
  return html;
}

function setStateSelectValue_(selectId, val) {
  var el = document.getElementById(selectId);
  if (!el) return;
  var target = String(val || '').trim().toLowerCase();
  for (var i = 0; i < el.options.length; i++) {
    if (el.options[i].value.trim().toLowerCase() === target) {
      el.selectedIndex = i;
      return;
    }
  }
  el.value = '';
}

function populateAllStateDropdowns_() {
  var optionsHTML = buildStateOptionsHTML_();
  ['cState', 'sState', 'stBizState'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var current = String(el.value || '').trim();
    el.innerHTML = optionsHTML;
    setStateSelectValue_(id, current);
  });
}

function syncStateCode_(stateElId, codeElId, force) {
  var sEl = document.getElementById(stateElId);
  var cEl = document.getElementById(codeElId);
  if (!sEl || !cEl) return;
  var stateVal = String(sEl.value || '').trim();
  if (!stateVal) { cEl.value = ''; cEl.setAttribute('data-manual', '0'); return; }
  if (!force && cEl.getAttribute('data-manual') === '1') return;
  var code = getStateCode_(stateVal);
  if (code) { cEl.value = code; cEl.setAttribute('data-manual', '0'); }
}

function bindStateCodeAutoFill_(stateElId, codeElId) {
  var sEl = document.getElementById(stateElId);
  var cEl = document.getElementById(codeElId);
  if (!sEl || !cEl) return;
  if (!cEl.getAttribute('data-manual')) cEl.setAttribute('data-manual', '0');
  cEl.addEventListener('input', function () { cEl.setAttribute('data-manual', '1'); });
  sEl.addEventListener('input', function () { syncStateCode_(stateElId, codeElId, false); });
  sEl.addEventListener('change', function () { syncStateCode_(stateElId, codeElId, false); });
  sEl.addEventListener('blur', function () { syncStateCode_(stateElId, codeElId, false); });
}

// ===== PAGER & SEARCH SYSTEM =====
function normQ_(q) { return String(q || '').toLowerCase().trim(); }

function rowSearchText_(row) {
  if (row === null || row === undefined) return '';
  if (typeof row === 'string' || typeof row === 'number' || typeof row === 'boolean') return String(row).toLowerCase();
  try {
    var parts = [];
    for (var k in row) {
      if (!Object.prototype.hasOwnProperty.call(row, k)) continue;
      var v = row[k];
      if (v === null || v === undefined) continue;
      parts.push(String(v));
    }
    return parts.join(' ').toLowerCase();
  } catch (e) {
    try { return JSON.stringify(row).toLowerCase(); } catch (e2) { return ''; }
  }
}

function ensurePager_(tbodyId) {
  if (!APP.pagers) APP.pagers = {};
  if (!APP.pagers[tbodyId]) APP.pagers[tbodyId] = { tbodyId: tbodyId, pagerId: null, page: 1, pageSize: 10, query: '', data: [], renderRow: null, emptyHtml: '', columns: 1 };
  return APP.pagers[tbodyId];
}

function registerTbodyPager_(tbodyId, pagerId, columns, renderRow, emptyHtml) {
  var st = ensurePager_(tbodyId);
  st.pagerId = pagerId;
  st.columns = columns || st.columns || 1;
  st.renderRow = renderRow;
  st.emptyHtml = emptyHtml || st.emptyHtml || '';
}

function setPagerData_(tbodyId, data) {
  var st = ensurePager_(tbodyId);
  st.data = data || [];
  st.page = 1;
  renderPager_(tbodyId);
}

function setPagerQuery_(tbodyId, q) {
  var st = ensurePager_(tbodyId);
  st.query = String(q || '');
  st.page = 1;
  renderPager_(tbodyId);
}

function pagerGoto(tbodyId, page) {
  var st = ensurePager_(tbodyId);
  st.page = Math.max(1, parseInt(page, 10) || 1);
  renderPager_(tbodyId);
}

function renderPager_(tbodyId) {
  var st = ensurePager_(tbodyId);
  var tb = document.getElementById(st.tbodyId);
  if (!tb || !st.renderRow) return;

  var q = normQ_(st.query);
  var all = st.data || [];
  var filtered = q ? all.filter(function (x) { return rowSearchText_(x).indexOf(q) > -1; }) : all.slice();

  var total = filtered.length;
  var pageSize = st.pageSize || 10;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (st.page > totalPages) st.page = totalPages;

  var startIdx = (st.page - 1) * pageSize;
  var endIdx = Math.min(total, startIdx + pageSize);
  var pageRows = filtered.slice(startIdx, endIdx);

  if (!total) {
    tb.innerHTML = st.emptyHtml || ('<tr><td colspan="' + (st.columns || 1) + '" class="empty">No data</td></tr>');
  } else {
    tb.innerHTML = pageRows.map(st.renderRow).join('');
  }

  var pagerEl = st.pagerId ? document.getElementById(st.pagerId) : null;
  if (!pagerEl) return;
  if (!total) { pagerEl.innerHTML = ''; return; }

  var btns = [];
  var prevDisabled = st.page <= 1 ? 'disabled' : '';
  var nextDisabled = st.page >= totalPages ? 'disabled' : '';

  btns.push('<button class="btn btn-s btn-sm" ' + prevDisabled + ' onclick="pagerGoto(\'' + st.tbodyId + '\',' + (st.page - 1) + ')">Prev</button>');

  var startPage = Math.max(1, st.page - 2);
  var endPage = Math.min(totalPages, st.page + 2);
  if (startPage > 1) {
    btns.push('<button class="btn btn-s btn-sm" onclick="pagerGoto(\'' + st.tbodyId + '\',1)">1</button>');
    if (startPage > 2) btns.push('<span style="padding:0 4px;">…</span>');
  }
  for (var p = startPage; p <= endPage; p++) {
    var cls = p === st.page ? 'btn btn-p btn-sm' : 'btn btn-s btn-sm';
    btns.push('<button class="' + cls + '" onclick="pagerGoto(\'' + st.tbodyId + '\',' + p + ')">' + p + '</button>');
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) btns.push('<span style="padding:0 4px;">…</span>');
    btns.push('<button class="btn btn-s btn-sm" onclick="pagerGoto(\'' + st.tbodyId + '\',' + totalPages + ')">' + totalPages + '</button>');
  }

  btns.push('<button class="btn btn-s btn-sm" ' + nextDisabled + ' onclick="pagerGoto(\'' + st.tbodyId + '\',' + (st.page + 1) + ')">Next</button>');

  pagerEl.innerHTML =
    '<div>Showing <strong>' + (startIdx + 1) + '</strong>–<strong>' + endIdx + '</strong> of <strong>' + total + '</strong></div>' +
    '<div class="pager-btns">' + btns.join('') + '</div>';
}

function ensureListPager_(key) {
  if (!APP.listPagers) APP.listPagers = {};
  if (!APP.listPagers[key]) APP.listPagers[key] = { key: key, containerId: null, pagerId: null, page: 1, pageSize: 10, query: '', data: [], renderItem: null, emptyHtml: '' };
  return APP.listPagers[key];
}

function registerListPager_(key, containerId, pagerId, renderItem, emptyHtml) {
  var st = ensureListPager_(key);
  st.containerId = containerId;
  st.pagerId = pagerId;
  st.renderItem = renderItem;
  st.emptyHtml = emptyHtml || st.emptyHtml || '';
}

function setListPagerEmptyHtml_(key, emptyHtml) {
  var st = ensureListPager_(key);
  st.emptyHtml = emptyHtml || st.emptyHtml || '';
}

function setListPagerData_(key, data) {
  var st = ensureListPager_(key);
  st.data = data || [];
  st.page = 1;
  renderListPager_(key);
}

function setListPagerQuery_(key, q) {
  var st = ensureListPager_(key);
  st.query = String(q || '');
  st.page = 1;
  renderListPager_(key);
}

function listPagerGoto(key, page) {
  var st = ensureListPager_(key);
  st.page = Math.max(1, parseInt(page, 10) || 1);
  renderListPager_(key);
}

function renderListPager_(key) {
  var st = ensureListPager_(key);
  var el = st.containerId ? document.getElementById(st.containerId) : null;
  if (!el || !st.renderItem) return;

  var q = normQ_(st.query);
  var all = st.data || [];
  var filtered = q ? all.filter(function (x) { return rowSearchText_(x).indexOf(q) > -1; }) : all.slice();

  var total = filtered.length;
  var pageSize = st.pageSize || 10;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (st.page > totalPages) st.page = totalPages;

  var startIdx = (st.page - 1) * pageSize;
  var endIdx = Math.min(total, startIdx + pageSize);
  var pageRows = filtered.slice(startIdx, endIdx);

  if (!total) {
    el.innerHTML = st.emptyHtml || '';
  } else {
    el.innerHTML = pageRows.map(st.renderItem).join('');
  }

  var pagerEl = st.pagerId ? document.getElementById(st.pagerId) : null;
  if (!pagerEl) return;
  if (!total) { pagerEl.innerHTML = ''; return; }

  var btns = [];
  var prevDisabled = st.page <= 1 ? 'disabled' : '';
  var nextDisabled = st.page >= totalPages ? 'disabled' : '';

  btns.push('<button class="btn btn-s btn-sm" ' + prevDisabled + ' onclick="listPagerGoto(\'' + st.key + '\',' + (st.page - 1) + ')">Prev</button>');

  var startPage = Math.max(1, st.page - 2);
  var endPage = Math.min(totalPages, st.page + 2);
  if (startPage > 1) {
    btns.push('<button class="btn btn-s btn-sm" onclick="listPagerGoto(\'' + st.key + '\',1)">1</button>');
    if (startPage > 2) btns.push('<span style="padding:0 4px;">…</span>');
  }
  for (var p = startPage; p <= endPage; p++) {
    var cls = p === st.page ? 'btn btn-p btn-sm' : 'btn btn-s btn-sm';
    btns.push('<button class="' + cls + '" onclick="listPagerGoto(\'' + st.key + '\',' + p + ')">' + p + '</button>');
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) btns.push('<span style="padding:0 4px;">…</span>');
    btns.push('<button class="btn btn-s btn-sm" onclick="listPagerGoto(\'' + st.key + '\',' + totalPages + ')">' + totalPages + '</button>');
  }

  btns.push('<button class="btn btn-s btn-sm" ' + nextDisabled + ' onclick="listPagerGoto(\'' + st.key + '\',' + (st.page + 1) + ')">Next</button>');

  pagerEl.innerHTML =
    '<div>Showing <strong>' + (startIdx + 1) + '</strong>–<strong>' + endIdx + '</strong> of <strong>' + total + '</strong></div>' +
    '<div class="pager-btns">' + btns.join('') + '</div>';
}

function renderAdminClientRow_(c) {
  var bal = parseFloat(c.Balance) || 0;
  return '<tr><td>' + c.ClientID + '</td><td><strong>' + c.ClientName + '</strong><br><small style="color:var(--muted);">' + (c.Email || '') + '</small></td><td>' + c.Phone + '</td>' +
    '<td><span class="badge bb">' + c.BillingType + '</span></td>' +
    '<td><span class="badge ' + (c.Status === 'Active' ? 'bg' : 'bgr') + '">' + c.Status + '</span></td>' +
    '<td><strong style="color:' + (bal > 0 ? 'var(--accent2)' : 'var(--green-mid)') + '">\u20b9' + fmt(bal) + '</strong></td>' +
    '<td style="white-space:nowrap;">' +
    '<button class="btn btn-s btn-sm btn-ico" title="Manage Sites" onclick="openSitesModal(\'' + c.ClientID + '\',\'' + (c.ClientName || '').replace(/'/g, '\\x27') + '\')"><i class="fa fa-building"></i></button> ' +
    '<button class="btn btn-s btn-sm btn-ico" onclick="editClient(this)" data-c=\'' + JSON.stringify(c).replace(/'/g, '&#39;') + '\' ><i class="fa fa-edit"></i></button>' +
    '</td></tr>';
}

function renderAdminItemRow_(i) {
  var gst = parseFloat(i.GSTPercent) || 0;
  return '<tr><td>' + i.ItemID + '</td><td><strong>' + i.ItemName + '</strong></td><td>' + (i.HSN || '-') + '</td><td>' + i.Unit + '</td><td>\u20b9' + fmt(i.DefaultPrice) + '</td>' +
    '<td>' + (gst ? (gst.toFixed(2) + '%') : '-') + '</td>' +
    '<td><span class="badge ' + (i.Status === 'Active' ? 'bg' : 'bgr') + '">' + i.Status + '</span></td>' +
    '<td><button class="btn btn-s btn-sm btn-ico" onclick="editItem(this)" data-i=\'' + JSON.stringify(i).replace(/'/g, "&#39;") + '\' ><i class="fa fa-edit"></i></button></td></tr>';
}

function renderAdminInvoiceRow_(i) {
  var safe = JSON.stringify(i).replace(/'/g, "&#39;");
  return '<tr><td><strong>' + i.InvoiceID + '</strong></td><td>' + clientName(i.ClientID) + '</td>' +
    '<td>' + fmtDate(i.StartDate) + ' \u2013 ' + fmtDate(i.EndDate) + '</td>' +
    '<td><strong>\u20b9' + fmt(i.TotalAmount) + '</strong></td>' +
    '<td><span class="badge ' + (i.Status === 'Unpaid' ? 'bo' : 'bg') + '">' + i.Status + '</span></td>' +
    '<td style="white-space:nowrap;">' +
    '<button class="btn btn-s btn-sm btn-ico" onclick="openInvoiceEdit(this)" data-i=\'' + safe + '\'><i class="fa fa-pen"></i></button> ' +
    '<button class="btn btn-s btn-sm" onclick="printInvoice(\'' + i.InvoiceID + '\')"><i class="fa fa-print"></i> Print</button>' +
    '<button class="btn btn-sm" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;margin-left:4px;" onclick="openNoteFromInvoice(\'' + i.InvoiceID + '\',\'' + i.ClientID + '\',\'CreditNote\')"><i class="fa fa-arrow-down"></i> CN</button>' +
    '<button class="btn btn-sm" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;margin-left:4px;" onclick="openNoteFromInvoice(\'' + i.InvoiceID + '\',\'' + i.ClientID + '\',\'DebitNote\')"><i class="fa fa-arrow-up"></i> DN</button>' +
    '</td></tr>';
}

function renderAdminPaymentRow_(p) {
  return '<tr><td>' + p.PaymentID + '</td><td>' + clientName(p.ClientID) + '</td><td>' + fmtDate(p.Date) + '</td>' +
    '<td><strong style="color:var(--green-mid)">\u20b9' + fmt(p.Amount) + '</strong></td>' +
    '<td><span class="badge bb">' + p.Mode + '</span></td><td>' + (p.Notes || '-') + '</td></tr>';
}

function renderClientOrderHistoryItem_(o) {
  var siteLookup = {};
  (APP.clientSites || []).forEach(function (s) { siteLookup[s.SiteID] = s.CompanyName; });
  var siteLabel = o.SiteID && siteLookup[o.SiteID] ? '<div style="font-size:10px;color:var(--green-mid);font-weight:600;"><i class="fa fa-building"></i> ' + siteLookup[o.SiteID] + '</div>' : '';
  return '<div class="order-row" onclick="viewCOrder(\'' + o.OrderID + '\')">' +
    '<div><div class="order-id">#' + o.OrderID + '</div>' + siteLabel + '<div class="order-dt">Delivery: ' + fmtDate(o.DeliveryDate) + '</div></div>' +
    '<div style="display:flex;align-items:center;gap:6px;">' + sBadge(o.Status) + '<i class="fa fa-chevron-right" style="color:var(--muted);font-size:10px;"></i></div>' +
    '</div>';
}

function renderClientInvoiceItem_(i) {
  var ledger = APP.cInvoicesLedger || [];
  var siteLookup = {};
  (APP.clientSites || []).forEach(function (s) { siteLookup[s.SiteID] = s.CompanyName; });
  var tag = 'Against Invoice #' + i.InvoiceID;
  var linkedNotes = (ledger || []).filter(function (e) {
    var t = String(e.Type || '');
    return (t === 'CreditNote' || t === 'DebitNote') && String(e.Notes || '').indexOf(tag) > -1;
  });
  var noteButtons = linkedNotes.map(function (n) {
    var isCredit = n.Type === 'CreditNote';
    return '<button class="btn btn-sm" style="background:' + (isCredit ? '#eff6ff' : '#fef2f2') + ';color:' + (isCredit ? '#1d4ed8' : '#b91c1c') + ';border:1px solid ' + (isCredit ? '#bfdbfe' : '#fecaca') + ';margin-top:4px;width:100%;" onclick="printNote(\'' + n.EntryID + '\')">' +
      '<i class="fa fa-download"></i> ' + (isCredit ? 'Credit Note' : 'Debit Note') + ' \u20b9' + fmt(n.Amount) + '</button>';
  }).join('');
  var siteText = '';
  if (i.ShipToName && String(i.ShipToName).trim()) siteText = String(i.ShipToName).trim();
  else if (i.SiteID && siteLookup[i.SiteID]) siteText = siteLookup[i.SiteID];
  else if (i.SiteID) siteText = i.SiteID;
  var siteLine = siteText
    ? '<div style="font-size:10px;color:var(--green-mid);font-weight:600;"><i class="fa fa-building"></i> ' + siteText + '</div>'
    : '<div style="font-size:10px;color:var(--muted);font-weight:600;"><i class="fa fa-building"></i> N/A</div>';
  return '<div class="inv-row" style="flex-wrap:wrap;gap:6px;"><div style="flex:1;min-width:0;">' +
    '<div style="font-weight:700;font-size:13px;">#' + i.InvoiceID + '</div>' +
    '<div style="font-size:11px;color:var(--muted);">' + fmtDate(i.StartDate) + ' \u2013 ' + fmtDate(i.EndDate) + '</div>' +
    siteLine +
    noteButtons +
    '</div><div style="text-align:right;">' +
    '<div style="font-weight:800;color:var(--green-mid)">\u20b9' + fmt(i.TotalAmount) + '</div>' +
    '<div style="margin-top:3px;">' + (i.Status === 'Unpaid' ? '<span class="badge bo">Unpaid</span>' : '<span class="badge bg">Paid</span>') + '</div>' +
    '<button class="btn btn-s btn-sm" style="margin-top:4px;" onclick="printInvoice(\'' + i.InvoiceID + '\')"><i class="fa fa-print"></i> Download</button>' +
    '</div></div>';
}

function renderClientLedgerItem_(e) {
  if (e.Type === 'Opening Balance') {
    return '<div class="ledger-entry" style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      '<div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:#f8fafc;flex:0 0 auto;border:1px solid #cbd5e1;">' +
      '<i class="fa fa-clock-rotate-left" style="font-size:12px;color:#475569;"></i>' +
      '</div>' +
      '<div>' +
      '<div style="font-size:13px;font-weight:700;color:var(--text);">' + e.Type + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:1px;">' + fmtDate(e.Date) + '</div>' +
      '</div>' +
      '</div>' +
      '<div style="text-align:right;">' +
      '<div style="font-size:14px;font-weight:800;color:var(--muted);">-</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:1px;">Bal: \u20b9' + fmt(e.Balance) + '</div>' +
      '</div>' +
      '</div>';
  }
  var isCr = e.Type === 'Payment' || e.Type === 'CreditNote';
  var typeIcon = isCr ? 'fa-arrow-down' : 'fa-arrow-up';
  var typeColor = isCr ? 'var(--green-mid)' : '#c53030';
  return '<div class="ledger-entry" style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">' +
    '<div style="display:flex;align-items:center;gap:10px;">' +
    '<div style="width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:' + (isCr ? '#dcfce7' : '#fef2f2') + ';flex:0 0 auto;">' +
    '<i class="fa ' + typeIcon + '" style="font-size:12px;color:' + typeColor + ';"></i>' +
    '</div>' +
    '<div>' +
    '<div style="font-size:13px;font-weight:700;color:var(--text);">' + e.Type + (e.ReferenceID ? ' <span style="font-size:10px;color:var(--muted);font-weight:400;">#' + e.ReferenceID + '</span>' : '') + '</div>' +
    '<div style="font-size:11px;color:var(--muted);margin-top:1px;">' + fmtDate(e.Date) + (e.Notes ? ' \u00b7 ' + e.Notes : '') + '</div>' +
    '</div>' +
    '</div>' +
    '<div style="text-align:right;">' +
    '<div style="font-size:14px;font-weight:800;color:' + typeColor + ';">' + (isCr ? '\u2212' : '+') + '\u20b9' + fmt(e.Amount) + '</div>' +
    '<div style="font-size:11px;color:var(--muted);margin-top:1px;">Bal: \u20b9' + fmt(e.Balance) + '</div>' +
    '</div>' +
    '</div>';
}

function initPaging_() {
  registerTbodyPager_('clientsTbody', 'clientsPager', 7, renderAdminClientRow_, '<tr><td colspan="7" class="empty">No clients yet</td></tr>');
  registerTbodyPager_('itemsTbody', 'itemsPager', 8, renderAdminItemRow_, '<tr><td colspan="8" class="empty">No items yet</td></tr>');
  registerTbodyPager_('invoicesTbody', 'invoicesPager', 6, renderAdminInvoiceRow_, '<tr><td colspan="6" class="empty">No invoices</td></tr>');
  registerTbodyPager_('paymentsTbody', 'paymentsPager', 6, renderAdminPaymentRow_, '<tr><td colspan="6" class="empty">No payments</td></tr>');

  registerListPager_('cOrderHistory', 'cOrderHistory', 'cOrderHistoryPager', renderClientOrderHistoryItem_, '<div class="empty"><i class="fa fa-box-open"></i>No orders yet</div>');
  registerListPager_('cInvoices', 'cInvoices', 'cInvoicesPager', renderClientInvoiceItem_, '<div class="empty"><i class="fa fa-file-invoice"></i>No invoices</div>');
  registerListPager_('cLedger', 'cLedger', 'cLedgerPager', renderClientLedgerItem_, '<div class="empty" style="padding:24px;"><i class="fa fa-book"></i> No entries found</div>');
}

function filterTbl(tbodyId, q) {
  if (APP.pagers && APP.pagers[tbodyId] && APP.pagers[tbodyId].renderRow) { setPagerQuery_(tbodyId, q); return; }
  var body = document.getElementById(tbodyId);
  if (!body) return;
  var rows = body.querySelectorAll('tr'), ql = normQ_(q);
  rows.forEach(function (r) { r.style.display = r.textContent.toLowerCase().includes(ql) ? '' : 'none'; });
}

function fillClientDropdowns() {
  var ids = ['pClientId', 'cnClient', 'miClient', 'pricingClient', 'ledgerClient', 'invClient'];
  ids.forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    var hasEmpty = id === 'pricingClient' || id === 'ledgerClient' || id === 'invClient';
    var emptyLabel = id === 'invClient' ? 'All Clients' : 'Select Client';
    el.innerHTML = (hasEmpty ? '<option value="">' + emptyLabel + '</option>' : '') +
      APP.allClients.map(function (c) { return '<option value="' + c.ClientID + '">' + c.ClientName + '</option>'; }).join('');
  });
  if (typeof syncInvoiceGenBtn === 'function') syncInvoiceGenBtn();
}

function printHTML(html) { var w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(function () { w.print(); }, 500); }

function printHTMLAsync(action, payload, cacheKey) {
  var w = window.open('', '_blank');
  var loadingHtml = '<html><head><title>Loading...</title><style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0fdf4; color: #052e16; } .spinner { border: 4px solid rgba(22, 163, 74, 0.1); border-top: 4px solid #16a34a; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .container { text-align: center; }</style></head><body><div class="container"><div class="spinner"></div><div style="font-weight:600;">Generating Document...</div></div></body></html>';
  w.document.write(loadingHtml);
  w.document.close();

  APP.printCache = APP.printCache || {};
  if (APP.printCache[cacheKey]) {
    w.document.open();
    w.document.write(APP.printCache[cacheKey]);
    w.document.close();
    setTimeout(function () { w.print(); }, 500);
    return;
  }

  apiBg(action, payload, function (html) {
    APP.printCache[cacheKey] = html;
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(function () { w.print(); }, 500);
  }, function (e) {
    w.document.open();
    w.document.write('<p style="color:red; font-family:sans-serif; text-align:center; margin-top:50px;">Error generating document: ' + e.message + '</p>');
    w.document.close();
  });
}

// ===== LOGIN =====
function getLoginPageParam() {
  try {
    var search = window.location.search || '';
    var hash = window.location.hash || '';
    var params = new URLSearchParams(search);
    var p = params.get('page') || params.get('mode') || params.get('role') || params.get('tab');
    if (!p && hash) {
      hash = hash.toLowerCase();
      if (hash.indexOf('admin') > -1 || hash.indexOf('supplier') > -1) return 'admin';
      if (hash.indexOf('client') > -1 || hash.indexOf('customer') > -1) return 'client';
    }
    p = String(p || '').toLowerCase().trim();
    if (p === 'admin' || p === 'supplier' || p === 'suppliers') return 'admin';
    if (p === 'client' || p === 'clients' || p === 'customer' || p === 'customers') return 'client';
    if (p === 'subscriptionexpired') return 'subscriptionExpired';
  } catch (e) { }
  return null;
}

function setLoginMode(mode) {
  var tabRow = document.querySelector('#loginScreen .tab-row');
  if (tabRow) tabRow.style.display = (mode === 'admin' || mode === 'client') ? 'none' : '';
  var kicker = document.getElementById('loginFormKicker');
  if (kicker) {
    if (mode === 'admin') kicker.textContent = 'Supplier Login';
    else if (mode === 'client') kicker.textContent = 'Client Login';
    else kicker.textContent = 'Sign in';
  }
}

function applyLoginPageParam() {
  var mode = getLoginPageParam();
  if (mode === 'subscriptionExpired') {
    window.location.href = 'subscription.html';
    return;
  }
  if (mode === 'admin' || mode === 'client') {
    setLoginMode(mode);
    loginTab(mode);
  } else {
    setLoginMode(null);
    loginTab('admin');
  }
}

function loginTab(tab) {
  var targetTab = (tab === 'client' || tab === 'clients' || tab === 'customer' || tab === 'customers') ? 'client' : 'admin';
  var box = document.getElementById('loginBox');
  if (box) {
    box.classList.toggle('mode-admin', targetTab === 'admin');
    box.classList.toggle('mode-client', targetTab === 'client');
  }

  var heroTitle = document.getElementById('loginHeroTitle');
  var heroSub = document.getElementById('loginHeroSub');
  if (targetTab === 'client') {
    if (heroTitle) heroTitle.textContent = 'Client Portal';
    if (heroSub) heroSub.textContent = 'Login to place orders, track deliveries, and download invoices.';
  } else {
    if (heroTitle) heroTitle.textContent = 'Supplier Console';
    if (heroSub) heroSub.textContent = 'Secure login to manage orders, invoicing, delivery, and reports.';
  }

  document.querySelectorAll('.tab-btn').forEach(function (b, i) { b.classList.toggle('active', (targetTab === 'admin' && i === 0) || (targetTab === 'client' && i === 1)); });
  
  var lfAdmin = document.getElementById('lf-admin');
  var lfClient = document.getElementById('lf-client');
  if (lfAdmin) {
    if (targetTab === 'admin') lfAdmin.classList.add('active');
    else lfAdmin.classList.remove('active');
  }
  if (lfClient) {
    if (targetTab === 'client') lfClient.classList.add('active');
    else lfClient.classList.remove('active');
  }

  var adminErr = document.getElementById('adminErr');
  var clientErr = document.getElementById('clientErr');
  if (adminErr) adminErr.style.display = 'none';
  if (clientErr) clientErr.style.display = 'none';
}

function showErr(id, msg) { var e = document.getElementById(id); e.textContent = msg; e.style.display = 'block'; }

function doAdminLogin() {
  var pass = document.getElementById('adminPass').value;
  if (!pass) { showErr('adminErr', 'Please enter password'); return; }
  var btn = document.getElementById('adminLoginBtn');
  btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;margin:0 auto;"></div>';
  api('adminLogin', { password: pass }, function (r) {
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Login as Supplier';
    if (r && r.success) {
      APP.role = 'admin';
      startSession({ role: 'admin' });
      showScreen('adminScreen');
      bootstrapAdminData();
    } else if (r && r.subscriptionExpired) {
      showErr('adminErr', '⚠️ Subscription expired! Redirecting to plans page...');
      setTimeout(function () { window.location.href = 'subscription.html'; }, 1000);
    } else {
      showErr('adminErr', r ? (r.message || 'Invalid password') : 'Login failed');
    }
  }, function () {
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Login as Supplier';
  });
}

function doClientLogin() {
  var phone = document.getElementById('clientPhone').value;
  var pass = document.getElementById('clientPass').value;
  if (!phone || !pass) { showErr('clientErr', 'Fill all fields'); return; }
  var btn = document.getElementById('clientLoginBtn');
  btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:18px;height:18px;margin:0 auto;"></div>';
  api('clientLogin', { phone: phone, password: pass }, function (r) {
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Login to Portal';
    if (r && r.success) {
      APP.role = 'client';
      APP.clientId = r.clientId;
      APP.clientName = r.clientName;
      document.getElementById('cNavUser').textContent = r.clientName || '';
      var cDeskUser = document.getElementById('cNavUserDesk');
      if (cDeskUser) cDeskUser.textContent = r.clientName || '';
      startSession({ role: 'client', clientId: r.clientId, clientName: r.clientName });
      showScreen('clientScreen');
      bootstrapClientData();
    } else if (r && (r.subscriptionExpired || r.isMaintenance)) {
      showClientMaintenanceScreen(r.settings);
    } else {
      showErr('clientErr', r ? (r.message || 'Invalid credentials') : 'Login failed');
    }
  }, function () {
    btn.disabled = false; btn.innerHTML = '<i class="fa fa-arrow-right-to-bracket"></i> Login to Portal';
  });
}

// ===== SESSION MANAGEMENT =====
var SESSION_BASE_KEY = 'SupplySarthiSession';
var SESSION_TIMEOUT_MS = 30 * 60 * 1000;
var SESSION_CHECK_MS = 15 * 1000;
var sessionCheckTimer = null;
var activityThrottleTimer = null;

function getSession(role) {
  try {
    var r = role || APP.role;
    if (!r) return null;
    return JSON.parse(localStorage.getItem(SESSION_BASE_KEY + '_' + r) || 'null');
  } catch (e) { return null; }
}

function saveSession(s) {
  try {
    if (!s || !s.role) return;
    localStorage.setItem(SESSION_BASE_KEY + '_' + s.role, JSON.stringify(s));
  } catch (e) { }
}

function clearSession(role) {
  try {
    var r = role || APP.role;
    if (!r) return;
    localStorage.removeItem(SESSION_BASE_KEY + '_' + r);
  } catch (e) { }
}

function markActivity() {
  if (activityThrottleTimer) return;
  activityThrottleTimer = setTimeout(function () { activityThrottleTimer = null; }, 1000);
  var s = getSession();
  if (!s) return;
  s.lastActivityAt = Date.now();
  saveSession(s);
}

function startSession(data) {
  var now = Date.now();
  var s = {
    role: data.role,
    clientId: data.clientId || null,
    clientName: data.clientName || null,
    loginAt: now,
    lastActivityAt: now
  };
  saveSession(s);
  startSessionMonitor();
}

function stopSessionMonitor() {
  if (sessionCheckTimer) clearInterval(sessionCheckTimer);
  sessionCheckTimer = null;
}

function startSessionMonitor() {
  stopSessionMonitor();
  sessionCheckTimer = setInterval(function () {
    var s = getSession();
    if (!s) return;
    var last = s.lastActivityAt || s.loginAt || 0;
    if (!last) return;
    if (Date.now() - last >= SESSION_TIMEOUT_MS) {
      doLogout(true);
      toast('Session expired. Please login again.', true);
    }
  }, SESSION_CHECK_MS);
}

function restoreSession() {
  var urlRole = getLoginPageParam();
  var s = getSession(urlRole);
  if (!s && !urlRole) {
    s = getSession('admin') || getSession('client');
  }
  if (!s || !s.role) return false;

  var last = s.lastActivityAt || s.loginAt || 0;
  if (!last || (Date.now() - last >= SESSION_TIMEOUT_MS)) {
    clearSession(s.role);
    return false;
  }

  if (urlRole && s.role !== urlRole) {
    return false;
  }

  APP.role = s.role;
  if (s.role === 'admin') {
    showScreen('adminScreen');
    bootstrapAdminData();
  } else if (s.role === 'client' && s.clientId) {
    APP.clientId = s.clientId;
    APP.clientName = s.clientName;
    document.getElementById('cNavUser').textContent = s.clientName || '';
    var cDeskUser = document.getElementById('cNavUserDesk');
    if (cDeskUser) cDeskUser.textContent = s.clientName || '';
    showScreen('clientScreen');
    bootstrapClientData();
  } else {
    clearSession(s.role);
    return false;
  }
  startSessionMonitor();
  return true;
}

function doLogout(silent) {
  stopSessionMonitor();
  clearSession();
  APP = { role: null, clientId: null, clientName: null, allClients: [], allItems: [], cart: {}, deliveryOrderId: null, subscriptionInfo: null };
  showScreen('loginScreen');
  document.getElementById('adminPass').value = '';
  document.getElementById('clientPhone').value = '';
  document.getElementById('clientPass').value = '';
  var banner = document.getElementById('subBanner');
  if (banner) banner.classList.remove('visible');
  var spacer = document.getElementById('subBannerSpacer');
  if (spacer) spacer.style.height = '0';
  applyLoginPageParam();
  if (!silent) toast('Logged out');
}

// ===== SUBSCRIPTION BANNER LOGIC =====
function goSubscriptionPage() {
  window.location.href = 'subscription.html';
}

function checkAndShowSubBanner() {
  api('getSubscriptionInfo', {}, function (info) {
    APP.subscriptionInfo = info || null;
    if (!info) return;

    info.currentClientCount = info.currentClientCount || 0;
    info.currentMonthOrderCount = info.currentMonthOrderCount || 0;

    if (APP.subBannerDismissed) return;

    var banner = document.getElementById('subBanner');
    var spacer = document.getElementById('subBannerSpacer');
    var icon = document.getElementById('subBannerIcon');
    var title = document.getElementById('subBannerTitle');
    var badge = document.getElementById('subBannerBadge');
    var sub = document.getElementById('subBannerSub');
    var btnText = document.getElementById('subBannerDismissText');

    if (!banner || !spacer) return;
    if (APP.role === 'client') {
      banner.classList.remove('visible');
      spacer.style.height = '0';
      return;
    }
    banner.className = '';

    var state = null;
    if (info.isNewTrial) state = 'newTrial';
    else if (info.isExpired) state = 'expired';
    else if (info.isExpiringSoon) state = 'warning';
    else if (info.plan && info.plan.toLowerCase() === 'starter' && info.currentClientCount >= info.clientLimit) state = 'info';

    if (state === 'newTrial') {
      banner.classList.add('sub-info');
      icon.textContent = '🎉';
      title.textContent = '14-Day Free Trial Activated!';
      badge.textContent = 'Welcome';
      sub.textContent = 'Your 14-day free trial has automatically started (Expires: ' + (info.expiryDate || '14 Days') + '). Enjoy full access to SupplySarthi!';
      btnText.textContent = 'Explore Dashboard';
      showBanner();
    } else if (state === 'expired') {
      banner.classList.add('sub-expired');
      icon.textContent = '❌';
      title.textContent = 'Subscription Expired';
      badge.textContent = 'Action Required';
      sub.textContent = 'Your ' + info.plan + ' plan has expired. Please renew now to maintain uninterrupted access.';
      btnText.textContent = 'Renew Now 👑';
      showBanner();
    } else if (state === 'warning') {
      banner.classList.add('sub-warning');
      icon.textContent = '⚡';
      title.textContent = 'Subscription Expiring Soon!';
      var dLeft = (info.daysLeft === null || info.daysLeft === undefined) ? 0 : info.daysLeft;
      badge.textContent = dLeft + ' Days Left';
      var daysText = (dLeft === 0) ? 'today' : 'in ' + dLeft + ' day(s)';
      sub.textContent = 'Your ' + info.plan + ' plan expires ' + daysText + ' (Expiry: ' + (info.expiryDate || 'Soon') + '). Renew now to avoid service disruption.';
      btnText.textContent = 'Renew Now 👑';
      showBanner();
    } else if (state === 'info') {
      banner.classList.add('sub-info');
      icon.textContent = 'ℹ️';
      title.textContent = 'Client Limit Reached';
      badge.textContent = 'Limit Reached';
      sub.textContent = 'You have reached the maximum active clients (' + info.clientLimit + ') for the Starter plan.';
      btnText.textContent = 'Upgrade Plan 👑';
      showBanner();
    }

    function showBanner() {
      banner.classList.add('visible');
      setTimeout(function () { spacer.style.height = banner.offsetHeight + 'px'; }, 50);
    }
  });
}

function dismissSubBanner() {
  var banner = document.getElementById('subBanner');
  var spacer = document.getElementById('subBannerSpacer');
  if (banner) banner.classList.remove('visible');
  if (spacer) spacer.style.height = '0';
  APP.subBannerDismissed = true;
}

function refreshPortal() {
  markActivity();
  if (APP.role === 'admin') refreshAdmin();
  else if (APP.role === 'client') refreshClient();
  else toast('Please login first', true);
}

function refreshAdmin() {
  loadAllClients();
  loadAllItems();
  loadAdminDashboard();
  var active = document.querySelector('.apage.active');
  var p = active ? (active.id || '').replace('ap-', '') : 'dashboard';
  if (p === 'orders') loadOrders();
  else if (p === 'demand') loadDemand();
  else if (p === 'delivery') loadDelivery();
  else if (p === 'clients') loadClients();
  else if (p === 'items') loadItems();
  else if (p === 'pricing') loadPricing();
  else if (p === 'invoices') loadInvoices();
  else if (p === 'payments') loadPayments();
  else if (p === 'ledger') loadLedger();
  else if (p === 'reports') loadOutstanding();
  else if (p === 'issues') loadAdminIssues();
  toast('Data refreshed');
}

function refreshClient() {
  loadCDashboard();
  loadCItems();
  var active = document.querySelector('.c-page.active');
  var p = active ? (active.id || '').replace('cp-', '') : 'home';
  if (p === 'history') loadCOrders();
  else if (p === 'invoices') loadCInvoices();
  else if (p === 'ledger') loadCLedger();
  else if (p === 'issues') loadClientIssues();
  toast('Data refreshed');
}

// ===== ADMIN NAVIGATION & LOADERS =====
function aPage(p) {
  document.querySelectorAll('.apage').forEach(function (x) { x.classList.remove('active'); });
  document.querySelectorAll('.nav-a').forEach(function (x) { x.classList.remove('active'); });
  var target = document.getElementById('ap-' + p);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-a').forEach(function (x) {
    if (x.getAttribute('onclick') && x.getAttribute('onclick').indexOf("'" + p + "'") > -1) x.classList.add('active');
  });
  var titles = {
    dashboard: 'Dashboard', orders: 'Orders', demand: 'Demand Planner', delivery: 'Delivery',
    clients: 'Clients', items: 'Items', pricing: 'Client Pricing', invoices: 'Invoices',
    payments: 'Payments', ledger: 'Ledger', reports: 'Reports', settings: 'Settings',
    issues: 'Issues & Complaints'
  };
  var ttlEl = document.getElementById('aPageTitle');
  if (ttlEl) ttlEl.textContent = titles[p] || p;
  if (p === 'orders') loadOrders();
  else if (p === 'demand') loadDemand();
  else if (p === 'delivery') loadDelivery();
  else if (p === 'clients') loadClients();
  else if (p === 'items') loadItems();
  else if (p === 'invoices') loadInvoices();
  else if (p === 'payments') loadPayments();
  else if (p === 'reports') loadOutstanding();
  else if (p === 'settings') loadSettings();
  else if (p === 'issues') loadAdminIssues();
  if (window.innerWidth < 640) toggleSidebar();
}

function toggleSidebar() {
  var sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
}

function showClientMaintenanceScreen(settings) {
  var overlay = document.getElementById('clientMaintenanceOverlay');
  if (!overlay) return;

  var s = settings || APP.businessSettings || {};
  var bizName = s.BusinessName || 'SupplySarthi Partner';
  var phone = s.BusinessPhone || '';
  var address = s.BusinessAddress || '';

  var elName = document.getElementById('maintBizName');
  var elPhone = document.getElementById('maintBizPhone');
  var elAddr = document.getElementById('maintBizAddr');

  if (elName) elName.textContent = bizName;
  if (elPhone) elPhone.innerHTML = phone ? '<i class="fa fa-phone" style="margin-right:6px;"></i> Call: <a href="tel:' + phone + '" style="color:#6ee7b7;text-decoration:none;font-weight:700;">' + phone + '</a>' : '<i class="fa fa-phone" style="margin-right:6px;"></i>Please contact administrator';
  if (elAddr) elAddr.innerHTML = address ? '<i class="fa fa-location-dot" style="margin-right:6px;"></i>' + address : '<i class="fa fa-location-dot" style="margin-right:6px;"></i>System Maintenance in Progress';

  overlay.style.display = 'flex';
}

function renderClientSupplierBizCard(settings) {
  if (!settings) return;
  var container = document.getElementById('clientSupplierBizCardContainer');
  if (!container) return;

  var bizName = settings.BusinessName || 'SupplySarthi Partner';
  var phone = settings.BusinessPhone || '';
  var address = settings.BusinessAddress || '';
  var gstin = settings.GSTIN || '';
  var state = settings.BusinessState || '';

  var storeName = document.getElementById('ecomStoreName');
  if (storeName && bizName) {
    storeName.innerHTML = '<i class="fa fa-store" style="color:var(--green-mid);margin-right:8px;"></i>' + bizName + ' Catalog';
  }

  container.innerHTML =
    '<div class="card" style="background:linear-gradient(135deg, rgba(5, 46, 22, 0.95), rgba(15, 76, 43, 0.95));color:#ffffff;border-radius:18px;padding:20px;box-shadow:0 10px 25px rgba(5, 46, 22, 0.25);border:1px solid rgba(255,255,255,0.15);position:relative;overflow:hidden;">' +
    '<div style="position:absolute;top:-20px;right:-20px;width:120px;height:120px;background:rgba(34,197,94,0.1);border-radius:50%;pointer-events:none;"></div>' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;position:relative;z-index:2;">' +
      '<div>' +
        '<div style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#86efac;background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:20px;backdrop-filter:blur(6px);margin-bottom:8px;">' +
          '<i class="fa fa-shield-halved" style="color:#4ade80;"></i> Verified Supplier' +
        '</div>' +
        '<div style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">' + bizName + '</div>' +
        (address ? '<div style="font-size:13px;color:#dcfce7;margin-top:6px;display:flex;align-items:center;gap:6px;"><i class="fa fa-location-dot" style="color:#4ade80;"></i> ' + address + (state ? ', ' + state : '') + '</div>' : '') +
        '<div style="font-size:12px;color:#93c5fd;margin-top:8px;display:flex;gap:16px;flex-wrap:wrap;">' +
          (gstin ? '<span><i class="fa fa-id-card"></i> GSTIN: <strong style="color:#ffffff;">' + gstin + '</strong></span>' : '') +
          (phone ? '<span><i class="fa fa-phone"></i> Contact: <strong style="color:#ffffff;">' + phone + '</strong></span>' : '') +
        '</div>' +
      '</div>' +
      (phone ? '<div><a href="tel:' + phone + '" class="btn btn-sm" style="background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;border:none;border-radius:12px;padding:10px 16px;font-weight:800;font-size:13px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(16,185,129,0.3);"><i class="fa fa-phone"></i> Call Supplier</a></div>' : '') +
    '</div>' +
    '</div>';
}

function applyBusinessSettings_(settings) {
  if (!settings) return;
  APP.businessSettings = settings;

  var bizName = settings.BusinessName || 'SupplySarthi';
  var bizPhone = settings.BusinessPhone || '';
  var bizAddress = settings.BusinessAddress || '';
  var gstin = settings.GSTIN || '';

  renderClientSupplierBizCard(settings);

  var sbText = document.querySelector('.sb-text');
  if (sbText) sbText.textContent = bizName;

  var cBrandNames = document.querySelectorAll('.brand-name');
  cBrandNames.forEach(function (el) {
    if (el.closest('.login-brand')) return;
    el.textContent = bizName;
  });

  var dashPage = document.getElementById('ap-dashboard');
  if (dashPage) {
    var bizCard = document.getElementById('adminBizInfoCard');
    if (!bizCard) {
      bizCard = document.createElement('div');
      bizCard.id = 'adminBizInfoCard';
      bizCard.className = 'card';
      bizCard.style.cssText = 'background:linear-gradient(135deg,#052e16,#14532d);color:#ffffff;border-radius:14px;padding:16px;margin-bottom:16px;box-shadow:0 4px 15px rgba(20,83,45,0.2);';
      var statGrid = dashPage.querySelector('.stat-grid');
      if (statGrid) dashPage.insertBefore(bizCard, statGrid);
      else dashPage.prepend(bizCard);
    }
    bizCard.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">' +
      '<div>' +
      '<div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#86efac;font-weight:800;"><i class="fa fa-building-flag" style="margin-right:6px;"></i>Registered Business</div>' +
      '<div style="font-size:20px;font-weight:900;color:#ffffff;margin-top:2px;">' + bizName + '</div>' +
      '<div style="font-size:12px;color:#bbf7d0;margin-top:4px;display:flex;gap:14px;flex-wrap:wrap;">' +
      (gstin ? '<span><i class="fa fa-id-card"></i> GSTIN: <strong>' + gstin + '</strong></span>' : '') +
      (bizPhone ? '<span><i class="fa fa-phone"></i> Phone: <strong>' + bizPhone + '</strong></span>' : '') +
      (settings.AuthorizedSignatoryName ? '<span><i class="fa fa-signature"></i> Signatory: <strong>' + settings.AuthorizedSignatoryName + '</strong></span>' : '') +
      '</div>' +
      (bizAddress ? '<div style="font-size:12px;color:#86efac;margin-top:4px;"><i class="fa fa-location-dot"></i> ' + bizAddress + '</div>' : '') +
      '</div>' +
      '<div><button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:#ffffff;border:1px solid rgba(255,255,255,0.3);" onclick="aPage(\'settings\')"><i class="fa fa-gear"></i> Settings</button></div>' +
      '</div>';
  }
}

function bootstrapAdminData(cb) {
  api('getInitialAdminData', {}, function (r) {
    if (r) {
      if (r.clients) {
        APP.allClients = (r.clients && r.clients.clients) || (Array.isArray(r.clients) ? r.clients : []);
        fillClientDropdowns();
      }
      if (r.items) {
        APP.allItems = (r.items && r.items.items) || (Array.isArray(r.items) ? r.items : []);
      }
      if (r.dashboard) {
        renderAdminDashboard_(r.dashboard);
      }
      if (r.settings) {
        applyBusinessSettings_(r.settings);
      }
      if (r.subscriptionInfo) {
        APP.subscriptionInfo = r.subscriptionInfo;
        checkAndShowSubBanner();
      }
    } else {
      loadAllClients();
      loadAllItems();
      loadAdminDashboard();
    }
    if (cb) cb();
  });
}

function bootstrapClientData(cb) {
  if (!APP.clientId) { if (cb) cb(); return; }
  api('getInitialClientData', { clientId: APP.clientId }, function (r) {
    if (r) {
      if (r.subscriptionBlocked || r.subscriptionExpired || r.isMaintenance) {
        showClientMaintenanceScreen(r.settings);
        if (cb) cb();
        return;
      }
      if (r.settings) {
        applyBusinessSettings_(r.settings);
      }
      if (r.dashboard) {
        APP.clientBalance = r.dashboard.balance || 0;
        var balEl = document.getElementById('cBal');
        if (balEl) balEl.textContent = '₹' + fmt(r.dashboard.balance || 0);
        var totOrd = document.getElementById('cTotalOrders');
        if (totOrd) totOrd.textContent = r.dashboard.totalOrders || 0;
        var lastInv = document.getElementById('cLastInv');
        if (lastInv) lastInv.textContent = '₹' + fmt(r.dashboard.lastInvoice || 0);

        var el = document.getElementById('cRecentOrders');
        if (el && r.dashboard.recentOrders) {
          if (!r.dashboard.recentOrders.length) el.innerHTML = '<div class="empty">No recent orders</div>';
          else el.innerHTML = r.dashboard.recentOrders.map(renderClientOrderHistoryItem_).join('');
        }
      }
      if (r.items) {
        var items = (r.items && r.items.items) || (Array.isArray(r.items) ? r.items : []);
        APP.clientItems = items;
        renderCItems(items);
        initQuickDelDates_();
      }
      if (r.sites) {
        APP.clientSites = Array.isArray(r.sites) ? r.sites : (r.sites.sites || []);
        renderCSitesDropdownAndList_(APP.clientSites);
      }
      if (r.creditInfo) {
        var limit = parseFloat(r.creditInfo.creditLimit) || 0;
        var balance = parseFloat(r.creditInfo.balance || APP.clientBalance || 0);
        APP.clientCreditLimit = limit;
        var dVal = document.getElementById('cCreditValDesk');
        var mVal = document.getElementById('cCreditValMobile');
        var dChip = document.getElementById('cCreditChipDesk');
        var mChip = document.getElementById('cCreditChipMobile');
        if (dVal) dVal.textContent = '₹' + fmt(limit);
        if (mVal) mVal.textContent = '₹' + fmt(limit);
        if (dChip) dChip.style.display = 'flex';
        if (mChip) mChip.style.display = 'flex';
        updateCreditDashboardCard_(limit, balance);
      }
    } else {
      loadCDashboard();
      loadCItems();
      loadCSites();
      loadClientCreditInfo();
    }
    if (cb) cb();
  });
}

function loadAllClients(cb) {
  api('getClients', {}, function (r) {
    APP.allClients = (r && r.clients) || (Array.isArray(r) ? r : []);
    fillClientDropdowns();
    if (cb) cb();
  });
}

function loadAllItems(cb) {
  api('getItems', {}, function (r) {
    APP.allItems = (r && r.items) || (Array.isArray(r) ? r : []);
    if (cb) cb();
  });
}

function clientName(cid) {
  for (var i = 0; i < APP.allClients.length; i++) {
    if (APP.allClients[i].ClientID === cid) return APP.allClients[i].ClientName;
  }
  return cid || '-';
}

function renderAdminDashboard_(r) {
  if (!r) return;
  document.getElementById('d-orders').textContent = r.todayOrders || 0;
  document.getElementById('d-pending').textContent = r.pendingDeliveries || 0;
  document.getElementById('d-sales').textContent = '₹' + fmt(r.todaySales || 0);
  document.getElementById('d-out').textContent = '₹' + fmt(r.totalOutstanding || 0);

  var pb = document.getElementById('pendingBadge');
  if (pb) { pb.textContent = r.pendingCount || 0; pb.style.display = (r.pendingCount > 0) ? 'inline-block' : 'none'; }

  var tbody = document.getElementById('dashTbody');
  if (tbody && r.recentOrders) {
    if (!r.recentOrders.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No orders today</td></tr>';
    } else {
      tbody.innerHTML = r.recentOrders.map(function (o) {
        return '<tr><td>' + o.OrderID + '</td><td>' + clientName(o.ClientID) + '</td><td>' + fmtDate(o.DeliveryDate) + '</td><td>' + sBadge(o.Status) + '</td><td><button class="btn btn-s btn-sm" onclick="viewOrderDetail(\'' + o.OrderID + '\')">View</button></td></tr>';
      }).join('');
    }
  }
}

function loadAdminDashboard(cb) {
  api('getAdminDashboard', {}, function (r) {
    renderAdminDashboard_(r);
    if (cb) cb();
  });
}

function loadOrders() {
  var status = document.getElementById('orderStatusFilter').value;
  api('getOrders', { status: status }, function (r) {
    var tbody = document.getElementById('ordersTbody');
    if (!tbody) return;
    if (!r || !r.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty">No orders found</td></tr>'; return; }
    tbody.innerHTML = r.map(function (o) {
      return '<tr><td><strong>' + o.OrderID + '</strong></td><td>' + clientName(o.ClientID) + '</td><td>' + fmtDate(o.OrderDate) + '</td><td>' + fmtDate(o.DeliveryDate) + '</td><td>' + sBadge(o.Status) + '</td><td><button class="btn btn-s btn-sm" onclick="viewOrderDetail(\'' + o.OrderID + '\')"><i class="fa fa-eye"></i> View</button></td></tr>';
    }).join('');
  });
}

function viewOrderDetail(orderId) {
  api('getOrderWithItems', { orderId: orderId }, function (r) {
    if (!r) return;
    var itemsHtml = (r.items || []).map(function (i) {
      return '<tr><td>' + i.ItemName + '</td><td>' + i.OrderedQty + ' ' + i.Unit + '</td><td>₹' + fmt(i.Price) + '</td><td>₹' + fmt(i.Total) + '</td></tr>';
    }).join('');

    var html = '<div style="margin-bottom:12px;"><strong>Order ID:</strong> ' + r.OrderID + ' | <strong>Client:</strong> ' + clientName(r.ClientID) + ' | <strong>Status:</strong> ' + sBadge(r.Status) + '</div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>' + itemsHtml + '</tbody></table></div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">' +
      (r.Status === 'Pending' ? '<button class="btn btn-p" onclick="updateOrderStatus(\'' + r.OrderID + '\',\'Accepted\')">Accept</button><button class="btn btn-s" style="background:#fee2e2;color:#991b1b;" onclick="updateOrderStatus(\'' + r.OrderID + '\',\'Denied\')">Deny</button>' : '') +
      '</div>';
    document.getElementById('orderDetailContent').innerHTML = html;
    openModal('orderDetailModal');
  });
}

function updateOrderStatus(orderId, status) {
  api('updateOrderStatus', { orderId: orderId, status: status }, function (r) {
    toast('Order updated to ' + status);
    closeModal('orderDetailModal');
    loadOrders();
    loadAdminDashboard();
  });
}

function loadDemand() {
  var dt = document.getElementById('demandDate').value || new Date().toISOString().split('T')[0];
  api('getDemandPlanning', { deliveryDate: dt }, function (r) {
    var el = document.getElementById('demandList');
    if (!el) return;
    if (!r || !r.length) { el.innerHTML = '<div class="empty"><i class="fa fa-check-circle"></i>No deliveries scheduled for this date</div>'; return; }
    el.innerHTML = r.map(function (i) {
      return '<div class="demand-card"><div class="demand-ttl">' + i.ItemName + '</div><div class="demand-qty">' + i.TotalQty + ' ' + i.Unit + '</div></div>';
    }).join('');
  });
}

function loadDelivery() {
  api('getPendingDeliveries', {}, function (r) {
    var tbody = document.getElementById('deliveryTbody');
    if (!tbody) return;
    if (!r || !r.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">No pending deliveries</td></tr>'; return; }
    tbody.innerHTML = r.map(function (o) {
      return '<tr><td>' + o.OrderID + '</td><td>' + clientName(o.ClientID) + '</td><td>' + fmtDate(o.DeliveryDate) + '</td><td><button class="btn btn-p btn-sm" onclick="openDeliveryModal(\'' + o.OrderID + '\')">Fulfill</button></td></tr>';
    }).join('');
  });
}

function openDeliveryModal(orderId) {
  APP.deliveryOrderId = orderId;
  api('getOrderWithItems', { orderId: orderId }, function (r) {
    if (!r) return;
    var rows = (r.items || []).map(function (i) {
      return '<tr><td>' + i.ItemName + '</td><td>' + i.OrderedQty + ' ' + i.Unit + '</td><td><input type="number" id="delQty_' + i.ItemID + '" value="' + i.OrderedQty + '" style="width:70px;padding:4px;" step="0.01"></td></tr>';
    }).join('');
    document.getElementById('delModalContent').innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Ordered</th><th>Delivered Qty</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    openModal('delModal');
  });
}

function submitDelivery() {
  if (!APP.deliveryOrderId) return;
  var items = [];
  var inputs = document.querySelectorAll('#delModalContent input[id^="delQty_"]');
  inputs.forEach(function (inp) {
    var itemId = inp.id.replace('delQty_', '');
    items.push({ itemID: itemId, deliveredQty: parseFloat(inp.value) || 0 });
  });
  api('fulfillDelivery', { orderId: APP.deliveryOrderId, items: items }, function (r) {
    toast('Delivery updated!');
    closeModal('delModal');
    loadDelivery();
    loadAdminDashboard();
  });
}

function loadClients() {
  loadAllClients(function () { setPagerData_('clientsTbody', APP.allClients); });
}

function openClientModal(c) {
  document.getElementById('cID').value = c ? c.ClientID : '';
  document.getElementById('cName').value = c ? c.ClientName : '';
  document.getElementById('cPhone').value = c ? c.Phone : '';
  document.getElementById('cEmail').value = c ? c.Email : '';
  document.getElementById('cPwd').value = c ? c.Password : '';
  document.getElementById('cAddr').value = c ? c.BillingAddress : '';
  setStateSelectValue_('cState', c ? c.State : '');
  document.getElementById('cStateCode').value = c ? c.StateCode : '';
  document.getElementById('cGSTIN').value = c ? c.GSTIN : '';
  document.getElementById('cBill').value = c ? c.BillingType : 'Monthly';
  document.getElementById('cLimit').value = c ? c.CreditLimit : '0';
  document.getElementById('cStat').value = c ? c.Status : 'Active';
  document.getElementById('clientModalTtl').textContent = c ? 'Edit Client' : 'Add Client';
  openModal('clientModal');
}

function editClient(btn) {
  var c = JSON.parse(btn.getAttribute('data-c'));
  openClientModal(c);
}

function saveClient() {
  var data = {
    clientID: document.getElementById('cID').value,
    clientName: document.getElementById('cName').value.trim(),
    phone: document.getElementById('cPhone').value.trim(),
    email: document.getElementById('cEmail').value.trim(),
    password: document.getElementById('cPwd').value.trim(),
    billingAddress: document.getElementById('cAddr').value.trim(),
    state: document.getElementById('cState').value.trim(),
    stateCode: document.getElementById('cStateCode').value.trim(),
    gstin: document.getElementById('cGSTIN').value.trim(),
    billingType: document.getElementById('cBill').value,
    creditLimit: parseFloat(document.getElementById('cLimit').value) || 0,
    status: document.getElementById('cStat').value
  };
  if (!data.clientName || !data.phone) { toast('Name & Phone are required', true); return; }
  api('saveClient', data, function (r) {
    toast('Client saved!');
    closeModal('clientModal');
    loadClients();
  });
}

// ===== CLIENT SITES MANAGEMENT MODAL =====
function openSitesModal(clientId, clientName) {
  var modal = document.getElementById('sitesModal');
  if (!modal) return;
  document.getElementById('sitesModalTitle').textContent = 'Manage Sites — ' + (clientName || clientId);
  document.getElementById('sitesModalSub').textContent = 'Client ID: ' + clientId;
  document.getElementById('siteClientIdHidden').value = clientId;
  resetSiteForm_();
  loadClientSitesModal_(clientId);
  openModal('sitesModal');
}

function resetSiteForm_() {
  document.getElementById('siteEditId').value = '';
  document.getElementById('sCompanyName').value = '';
  document.getElementById('sStat').value = 'Active';
  document.getElementById('sAddress').value = '';
  document.getElementById('sRespPerson').value = '';
  document.getElementById('sRespPhone').value = '';
  var stSel = document.getElementById('sState');
  if (stSel) stSel.value = '';
  document.getElementById('sStateCode').value = '';
  document.getElementById('siteFormTitle').textContent = 'Add New Site';
  document.getElementById('saveSiteBtnText').textContent = 'Save Site';
}

function loadClientSitesModal_(clientId) {
  var listEl = document.getElementById('sitesListEl');
  if (listEl) listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);"><i class="fa fa-spinner fa-spin"></i> Loading sites...</div>';
  api('getClientSites', { clientId: clientId }, function (r) {
    var sites = Array.isArray(r) ? r : (r && r.sites ? r.sites : []);
    APP.currentModalSites = sites;
    renderSitesList_(sites);
  });
}

function renderSitesList_(sites) {
  var listEl = document.getElementById('sitesListEl');
  if (!listEl) return;
  if (!sites || !sites.length) {
    listEl.innerHTML = '<div style="padding:16px;text-align:center;color:var(--muted);background:var(--bg);border-radius:10px;"><i class="fa fa-building-circle-exclamation" style="font-size:24px;margin-bottom:6px;display:block;"></i>No delivery sites registered for this client yet. Use the form below to add one.</div>';
    return;
  }
  var html = sites.map(function (s) {
    var safeData = JSON.stringify(s).replace(/'/g, '&#39;');
    return '<div class="card" style="padding:12px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);border-radius:10px;">' +
      '<div>' +
      '<div style="font-weight:700;font-size:14px;color:var(--text);">' + (s.CompanyName || 'Unnamed Site') + ' <span class="badge ' + (s.Status === 'Active' ? 'bg' : 'bgr') + '" style="font-size:10px;margin-left:6px;">' + (s.Status || 'Active') + '</span></div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:2px;"><i class="fa fa-location-dot"></i> ' + (s.Address || '-') + '</div>' +
      (s.ResponsiblePerson ? '<div style="font-size:11px;color:var(--green-mid);margin-top:2px;"><i class="fa fa-user"></i> ' + s.ResponsiblePerson + (s.ResponsiblePhone ? ' (' + s.ResponsiblePhone + ')' : '') + '</div>' : '') +
      '</div>' +
      '<div>' +
      '<button class="btn btn-s btn-sm btn-ico" title="Edit Site" onclick="editSite(this)" data-s=\'' + safeData + '\'><i class="fa fa-edit"></i></button>' +
      '</div></div>';
  }).join('');
  listEl.innerHTML = html;
}

function editSite(btn) {
  var s = JSON.parse(btn.getAttribute('data-s'));
  if (!s) return;
  document.getElementById('siteEditId').value = s.SiteID || '';
  document.getElementById('sCompanyName').value = s.CompanyName || '';
  document.getElementById('sStat').value = s.Status || 'Active';
  document.getElementById('sAddress').value = s.Address || '';
  document.getElementById('sRespPerson').value = s.ResponsiblePerson || '';
  document.getElementById('sRespPhone').value = s.ResponsiblePhone || '';
  if (s.State) setStateSelectValue_('sState', s.State);
  document.getElementById('sStateCode').value = s.StateCode || '';
  document.getElementById('siteFormTitle').textContent = 'Edit Site (' + s.SiteID + ')';
  document.getElementById('saveSiteBtnText').textContent = 'Update Site';
}

function saveSite() {
  var clientId = document.getElementById('siteClientIdHidden').value;
  var siteId = document.getElementById('siteEditId').value;
  var companyName = document.getElementById('sCompanyName').value.trim();
  var address = document.getElementById('sAddress').value.trim();
  if (!clientId) { toast('Client ID missing', true); return; }
  if (!companyName || !address) { toast('Company Name & Address are required', true); return; }

  var payload = {
    siteId: siteId,
    clientId: clientId,
    companyName: companyName,
    address: address,
    state: document.getElementById('sState').value.trim(),
    stateCode: document.getElementById('sStateCode').value.trim(),
    responsiblePerson: document.getElementById('sRespPerson').value.trim(),
    responsiblePhone: document.getElementById('sRespPhone').value.trim(),
    status: document.getElementById('sStat').value
  };

  var action = siteId ? 'updateClientSite' : 'addClientSite';
  api(action, payload, function (r) {
    if (r && r.success !== false) {
      toast(siteId ? 'Site updated!' : 'Site added!');
      resetSiteForm_();
      loadClientSitesModal_(clientId);
    } else {
      toast(r ? (r.message || 'Failed to save site') : 'Error saving site', true);
    }
  });
}

function openAddSiteFromOrder() {
  if (APP.role === 'client' && APP.clientId) {
    openSitesModal(APP.clientId, APP.clientName || 'My Business');
  } else {
    toast('Please login to manage sites', true);
  }
}

function loadItems() {
  loadAllItems(function () { setPagerData_('itemsTbody', APP.allItems); });
}

function openItemModal(i) {
  document.getElementById('iID').value = i ? i.ItemID : '';
  document.getElementById('iName').value = i ? i.ItemName : '';
  document.getElementById('iCat').value = i ? i.Category : '';
  document.getElementById('iUnit').value = i ? i.Unit : 'Kg';
  document.getElementById('iPrice').value = i ? i.DefaultPrice : '';
  document.getElementById('iHSN').value = i ? i.HSN : '';
  document.getElementById('iGST').value = i ? i.GSTPercent : '0';
  document.getElementById('iStat').value = i ? i.Status : 'Active';
  document.getElementById('iImgExisting').value = i ? (i.ImageBase64 || '') : '';
  document.getElementById('itemModalTtl').textContent = i ? 'Edit Item' : 'Add Item';
  openModal('itemModal');
}

function editItem(btn) {
  var i = JSON.parse(btn.getAttribute('data-i'));
  openItemModal(i);
}

function previewItemImage() {
  var inp = document.getElementById('iImg');
  var prev = document.getElementById('iImgPreview');
  if (inp.files && inp.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      prev.innerHTML = '<img src="' + e.target.result + '" style="max-height:80px;border-radius:6px;">';
      prev.style.display = 'block';
    };
    reader.readAsDataURL(inp.files[0]);
  }
}

function saveItem() {
  var data = {
    itemID: document.getElementById('iID').value,
    itemName: document.getElementById('iName').value.trim(),
    category: document.getElementById('iCat').value.trim(),
    unit: document.getElementById('iUnit').value,
    defaultPrice: parseFloat(document.getElementById('iPrice').value) || 0,
    hsn: document.getElementById('iHSN').value.trim(),
    gstPercent: parseFloat(document.getElementById('iGST').value) || 0,
    status: document.getElementById('iStat').value
  };
  if (!data.itemName) { toast('Item name is required', true); return; }

  var fileInput = document.getElementById('iImg');
  if (fileInput.files && fileInput.files[0]) {
    var reader = new FileReader();
    reader.onload = function (e) {
      data.imageBase64 = e.target.result;
      api('saveItem', data, function (r) {
        toast('Item saved!');
        closeModal('itemModal');
        loadItems();
      });
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    data.imageBase64 = document.getElementById('iImgExisting').value;
    api('saveItem', data, function (r) {
      toast('Item saved!');
      closeModal('itemModal');
      loadItems();
    });
  }
}

function loadPricing() {
  var cid = document.getElementById('pricingClient').value;
  var el = document.getElementById('pricingContent');
  if (!cid) { el.innerHTML = '<div class="empty"><i class="fa fa-tags"></i>Select a client</div>'; return; }
  api('getClientPricing', { clientId: cid }, function (r) {
    if (!r) return;
    var rows = (APP.allItems || []).map(function (item) {
      var custom = r[item.ItemID] !== undefined ? r[item.ItemID] : item.DefaultPrice;
      return '<tr><td>' + item.ItemName + '</td><td>₹' + fmt(item.DefaultPrice) + '</td><td><input type="number" step="0.01" id="pr_' + item.ItemID + '" value="' + custom + '" style="width:100px;padding:4px;"></td></tr>';
    }).join('');
    el.innerHTML = '<div class="tbl-wrap"><table><thead><tr><th>Item</th><th>Default Price</th><th>Custom Price</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<button class="btn btn-p" style="margin-top:12px;" onclick="savePricing(\'' + cid + '\')"><i class="fa fa-save"></i> Save Pricing</button>';
  });
}

function savePricing(cid) {
  var prices = {};
  APP.allItems.forEach(function (item) {
    var inp = document.getElementById('pr_' + item.ItemID);
    if (inp) prices[item.ItemID] = parseFloat(inp.value) || 0;
  });
  api('saveClientPricing', { clientId: cid, prices: prices }, function (r) {
    toast('Custom pricing saved!');
  });
}

function loadInvoices() {
  var cid = document.getElementById('invClient').value;
  api('getInvoices', { clientId: cid }, function (r) {
    setPagerData_('invoicesTbody', r || []);
  });
}

function syncInvoiceGenBtn() { }

function openInvoiceGenModal() {
  var cid = document.getElementById('invClient').value;
  if (!cid) { toast('Please select a client first', true); return; }
  document.getElementById('miClient').value = cid;
  onMiClientChange();
  openModal('miModal');
}

function onMiClientChange() {
  var cid = document.getElementById('miClient').value;
  if (!cid) return;
  api('getClientSites', { clientId: cid }, function (r) {
    var sel = document.getElementById('miSite');
    sel.innerHTML = '<option value="">-- Select Site --</option>' + (r || []).map(function (s) {
      return '<option value="' + s.SiteID + '">' + s.CompanyName + '</option>';
    }).join('');
  });
}

function onMiSiteChange() { }

function genInvoiceFromModal() {
  var cid = document.getElementById('miClient').value;
  var siteId = document.getElementById('miSite').value;
  var yr = parseInt(document.getElementById('miYear').value, 10);
  var mo = parseInt(document.getElementById('miMonth').value, 10);
  if (!cid) { toast('Select client', true); return; }

  api('generateMonthlyInvoice', { clientId: cid, siteId: siteId, year: yr, month: mo }, function (r) {
    if (r && r.success) {
      toast('Invoice generated: ' + r.invoiceId);
      closeModal('miModal');
      loadInvoices();
    } else {
      toast((r && r.message) || 'Failed to generate invoice', true);
    }
  });
}

function printInvoice(invId) {
  printHTMLAsync('getInvoiceHTML', { invoiceId: invId }, 'inv_' + invId);
}

function loadPayments() {
  api('getPayments', {}, function (r) {
    setPagerData_('paymentsTbody', r || []);
  });
}

function loadBalInModal() {
  var cid = document.getElementById('pClientId').value;
  if (!cid) return;
  api('getClientBalance', { clientId: cid }, function (r) {
    var el = document.getElementById('balInfo');
    el.style.display = 'block';
    el.textContent = 'Current Outstanding: ₹' + fmt(r ? r.balance : 0);
  });
}

function savePayment() {
  var cid = document.getElementById('pClientId').value;
  var amt = parseFloat(document.getElementById('pAmt').value) || 0;
  var mode = document.getElementById('pMode').value;
  var notes = document.getElementById('pNotes').value.trim();
  if (!cid || amt <= 0) { toast('Select client & enter valid amount', true); return; }
  api('recordPayment', { clientId: cid, amount: amt, mode: mode, notes: notes }, function (r) {
    toast('Payment recorded!');
    closeModal('payModal');
    loadPayments();
    loadAdminDashboard();
  });
}

function openNoteModal(type) {
  document.getElementById('cnType').value = type;
  document.getElementById('cnModalTitle').textContent = (type === 'CreditNote' ? 'Credit Note' : 'Debit Note');
  document.getElementById('cnSaveBtn').textContent = 'Save ' + (type === 'CreditNote' ? 'Credit Note' : 'Debit Note');
  openModal('cnModal');
}

function openNoteFromInvoice(invId, cid, type) {
  document.getElementById('cnInvoiceId').value = invId;
  document.getElementById('cnClient').value = cid;
  openNoteModal(type);
}

function loadCnBal() { }

function saveCNote() {
  var type = document.getElementById('cnType').value;
  var cid = document.getElementById('cnClient').value;
  var amt = parseFloat(document.getElementById('cnAmt').value) || 0;
  var reason = document.getElementById('cnReason').value.trim();
  var invId = document.getElementById('cnInvoiceId').value;
  if (!cid || amt <= 0) { toast('Select client & enter valid amount', true); return; }

  api('issueCreditDebitNote', { clientId: cid, type: type, amount: amt, notes: (invId ? ('Against Invoice #' + invId + ' - ') : '') + reason }, function (r) {
    toast(type + ' issued successfully!');
    closeModal('cnModal');
    loadLedger();
  });
}

function loadLedger() {
  var cid = document.getElementById('ledgerClient').value;
  if (!cid) return;
  var from = document.getElementById('ledgerFrom').value;
  var to = document.getElementById('ledgerTo').value;
  api('getLedger', { clientId: cid, startDate: from, endDate: to }, function (r) {
    var tbody = document.getElementById('ledgerTbody');
    if (!tbody) return;
    if (!r || !r.length) { tbody.innerHTML = '<tr><td colspan="8" class="empty">No ledger entries</td></tr>'; return; }
    tbody.innerHTML = r.map(function (l) {
      return '<tr><td>' + fmtDate(l.Date) + '</td><td>' + l.Type + '</td><td>' + (l.ReferenceID || '-') + '</td><td>₹' + fmt(l.Debit) + '</td><td>₹' + fmt(l.Credit) + '</td><td>₹' + fmt(l.Balance) + '</td><td>' + (l.Notes || '-') + '</td><td></td></tr>';
    }).join('');
  });
}

function downloadLedger() {
  var cid = document.getElementById('ledgerClient').value;
  if (!cid) { toast('Select a client first', true); return; }
  var from = document.getElementById('ledgerFrom').value;
  var to = document.getElementById('ledgerTo').value;
  printHTMLAsync('getLedgerHTML', { clientId: cid, startDate: from, endDate: to }, 'led_' + cid + '_' + from + '_' + to);
}

function loadOutstanding() {
  api('getOutstandingBalances', {}, function (r) {
    var tbody = document.getElementById('outstandingTbody');
    if (!tbody) return;
    if (!r || !r.length) { tbody.innerHTML = '<tr><td colspan="4" class="empty">No outstanding balances</td></tr>'; return; }
    tbody.innerHTML = r.map(function (c) {
      return '<tr><td>' + c.ClientName + '</td><td>' + c.Phone + '</td><td>' + c.BillingType + '</td><td><strong style="color:var(--accent2)">₹' + fmt(c.Balance) + '</strong></td></tr>';
    }).join('');
  });
}

function clearBalanceCache() {
  api('clearBalanceCache', {}, function () { toast('Balance cache cleared'); loadOutstanding(); });
}

function repairOrderData() {
  api('repairOrderData', {}, function () { toast('Order data repaired'); });
}

function loadSalesReport() {
  var from = document.getElementById('rptFrom').value;
  var to = document.getElementById('rptTo').value;
  api('getSalesReport', { startDate: from, endDate: to }, function (r) {
    var el = document.getElementById('salesRptContent');
    if (!el || !r) return;
    el.innerHTML = '<div style="font-size:16px;font-weight:700;margin-bottom:10px;">Total Sales: ₹' + fmt(r.totalSales) + '</div>' +
      '<div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Invoices</th><th>Total Sales</th></tr></thead><tbody>' +
      (r.daily || []).map(function (d) { return '<tr><td>' + fmtDate(d.Date) + '</td><td>' + d.Count + '</td><td>₹' + fmt(d.Amount) + '</td></tr>'; }).join('') +
      '</tbody></table></div>';
  });
}

function downloadTallyXML() {
  var from = document.getElementById('rptFrom').value;
  var to = document.getElementById('rptTo').value;
  api('getTallyXML', { startDate: from, endDate: to }, function (xml) {
    var blob = new Blob([xml], { type: 'text/xml' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Tally_Sales_' + (from || 'all') + '_to_' + (to || 'all') + '.xml';
    a.click();
  });
}

function loadSettings() {
  api('getSettings', {}, function (r) {
    if (!r) return;
    document.getElementById('stBizName').value = r.BusinessName || '';
    document.getElementById('stBizPhone').value = r.BusinessPhone || '';
    document.getElementById('stBizAddr').value = r.BusinessAddress || '';
    document.getElementById('stAuthSignName').value = r.AuthorizedSignatoryName || '';
    document.getElementById('stGSTIN').value = r.GSTIN || '';
    setStateSelectValue_('stBizState', r.BusinessState || '');
    document.getElementById('stBizStateCode').value = r.BusinessStateCode || '';
    document.getElementById('stReverseCharge').value = r.ReverseCharge || 'No';
    document.getElementById('stAdminEmail').value = r.AdminEmail || '';
    applyBusinessSettings_(r);
  });
}

function saveSettingsForm() {
  var data = {
    BusinessName: document.getElementById('stBizName').value.trim(),
    BusinessPhone: document.getElementById('stBizPhone').value.trim(),
    BusinessAddress: document.getElementById('stBizAddr').value.trim(),
    AuthorizedSignatoryName: document.getElementById('stAuthSignName').value.trim(),
    GSTIN: document.getElementById('stGSTIN').value.trim(),
    BusinessState: document.getElementById('stBizState').value.trim(),
    BusinessStateCode: document.getElementById('stBizStateCode').value.trim(),
    ReverseCharge: document.getElementById('stReverseCharge').value,
    AdminEmail: document.getElementById('stAdminEmail').value.trim()
  };
  var newPass = document.getElementById('stAdminPassword').value.trim();
  if (newPass) data.AdminPassword = newPass;

  api('saveSettings', data, function (r) {
    if (r && r.success) {
      toast('✅ Settings saved!');
      document.getElementById('stAdminPassword').value = '';
      applyBusinessSettings_(data);
    } else toast((r && r.message) || 'Error saving settings', true);
  });
}

// ===== CLIENT PORTAL FUNCTIONS =====
function cPage(p) {
  document.querySelectorAll('.c-page').forEach(function (x) { x.classList.remove('active'); });
  document.querySelectorAll('.cn-item, .bn-item').forEach(function (x) { x.classList.remove('active'); });
  var target = document.getElementById('cp-' + p);
  if (target) target.classList.add('active');
  var cn = document.getElementById('cn-' + p);
  if (cn) cn.classList.add('active');
  var bn = document.getElementById('bn-' + p);
  if (bn) bn.classList.add('active');

  if (p === 'order') initQuickDelDates_();
  else if (p === 'history') loadCOrders();
  else if (p === 'invoices') loadCInvoices();
  else if (p === 'ledger') loadCLedger();
  else if (p === 'issues') loadClientIssues();
}

function loadCDashboard() {
  api('getClientDashboard', { clientId: APP.clientId }, function (r) {
    if (!r) return;
    APP.clientBalance = r.balance || 0;
    var balEl = document.getElementById('cBal');
    if (balEl) balEl.textContent = '₹' + fmt(r.balance || 0);
    var totOrd = document.getElementById('cTotalOrders');
    if (totOrd) totOrd.textContent = r.totalOrders || 0;
    var lastInv = document.getElementById('cLastInv');
    if (lastInv) lastInv.textContent = '₹' + fmt(r.lastInvoice || 0);

    if (APP.clientCreditLimit !== undefined) {
      updateCreditDashboardCard_(APP.clientCreditLimit, APP.clientBalance);
    }

    var el = document.getElementById('cRecentOrders');
    if (el && r.recentOrders) {
      if (!r.recentOrders.length) el.innerHTML = '<div class="empty">No recent orders</div>';
      else el.innerHTML = r.recentOrders.map(renderClientOrderHistoryItem_).join('');
    }
  });
}

function initQuickDelDates_() {
  var t = new Date();
  t.setDate(t.getDate() + 1);
  var tISO = t.toISOString().split('T')[0];
  var tStr = t.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  var d = new Date();
  d.setDate(d.getDate() + 2);
  var dISO = d.toISOString().split('T')[0];
  var dStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

  APP.quickDates = {
    tomorrow: { iso: tISO, label: tStr },
    dayAfter: { iso: dISO, label: dStr }
  };

  var lblT = document.getElementById('lblTomorrowDate');
  if (lblT) lblT.textContent = tStr;
  var lblD = document.getElementById('lblDayAfterDate');
  if (lblD) lblD.textContent = dStr;

  setQuickDelDate('tomorrow');
}

function setQuickDelDate(type) {
  if (!APP.quickDates) initQuickDelDates_();
  var chipT = document.getElementById('chipTomorrow');
  var chipD = document.getElementById('chipDayAfter');
  var chipC = document.getElementById('chipCustom');
  var wrapC = document.getElementById('cCustomDateWrap');
  var dateInp = document.getElementById('cDelDate');
  var textEl = document.getElementById('cDelDateText');

  if (chipT) chipT.classList.remove('active');
  if (chipD) chipD.classList.remove('active');
  if (chipC) chipC.classList.remove('active');
  if (wrapC) wrapC.style.display = 'none';

  if (type === 'tomorrow') {
    if (chipT) chipT.classList.add('active');
    if (dateInp) dateInp.value = APP.quickDates.tomorrow.iso;
    if (textEl) textEl.innerHTML = '<i class="fa fa-bolt" style="color:#eab308;"></i> ' + APP.quickDates.tomorrow.label;
  } else if (type === 'dayAfter') {
    if (chipD) chipD.classList.add('active');
    if (dateInp) dateInp.value = APP.quickDates.dayAfter.iso;
    if (textEl) textEl.innerHTML = '<i class="fa fa-calendar-day" style="color:var(--green-mid);"></i> ' + APP.quickDates.dayAfter.label;
  } else if (type === 'custom') {
    if (chipC) chipC.classList.add('active');
    if (wrapC) wrapC.style.display = 'block';
    if (dateInp && !dateInp.value) dateInp.value = APP.quickDates.tomorrow.iso;
    if (textEl) textEl.innerHTML = '<i class="fa fa-calendar-days"></i> Custom Date';
  }
}

function onCustomDateChange() {
  var dateInp = document.getElementById('cDelDate');
  var textEl = document.getElementById('cDelDateText');
  if (dateInp && dateInp.value) {
    var dt = new Date(dateInp.value + 'T00:00:00');
    var str = dt.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    if (textEl) textEl.innerHTML = '<i class="fa fa-calendar-check"></i> ' + str;
  }
}

function loadCItems() {
  api('getItems', { clientId: APP.clientId }, function (r) {
    var items = (r && r.items) || (Array.isArray(r) ? r : []);
    APP.clientItems = items;
    renderCItems(items);
  });
}

function renderCItems(items) {
  var el = document.getElementById('cItemsList');
  var countEl = document.getElementById('ecomTotalItemsCount');
  if (countEl) countEl.innerHTML = '<i class="fa fa-boxes-stacked"></i> ' + (items ? items.length : 0) + ' Products Available';

  if (!el) return;
  if (!items || !items.length) { el.innerHTML = '<div class="empty" style="grid-column:1/-1;">No products found</div>'; return; }

  el.innerHTML = items.map(function (i) {
    var qty = (APP.cart[i.ItemID] ? APP.cart[i.ItemID].qty : 0);
    var inCart = qty > 0 ? ' in-cart' : '';
    var thumbHtml = i.ImageBase64 ? '<img src="data:image/jpeg;base64,' + i.ImageBase64 + '" alt="' + i.ItemName + '">' : '<div class="ecom-emoji-avatar">' + getEmoji(i.ItemName) + '</div>';

    var ctrlHtml = '';
    if (qty > 0) {
      ctrlHtml = '<div class="ecom-qty-pill">' +
        '<button type="button" class="ecom-qty-btn" onclick="changeQty(\'' + i.ItemID + '\', -1)">-</button>' +
        '<span class="ecom-qty-num" id="qi_' + i.ItemID + '">' + qty + '</span>' +
        '<button type="button" class="ecom-qty-btn" onclick="changeQty(\'' + i.ItemID + '\', 1)">+</button>' +
        '</div>';
    } else {
      ctrlHtml = '<button type="button" class="ecom-btn-add" onclick="changeQty(\'' + i.ItemID + '\', 1)"><i class="fa fa-plus"></i> ADD</button>';
    }

    return '<div class="ecom-card' + inCart + '" id="ic_' + i.ItemID + '">' +
      '<div>' +
      '<div class="ecom-thumb-box">' + thumbHtml + '</div>' +
      '<div class="ecom-item-title">' + i.ItemName + '</div>' +
      '<div class="ecom-price-pill">₹' + fmt(i.Price) + ' <span class="ecom-unit-label">/ ' + i.Unit + '</span></div>' +
      '</div>' +
      '<div>' + ctrlHtml + '</div>' +
      '</div>';
  }).join('');
}

function filterCItems() {
  var searchInp = document.getElementById('cItemSearch');
  var q = searchInp ? normQ_(searchInp.value) : '';
  var filtered = (APP.clientItems || []).filter(function (i) { return rowSearchText_(i).indexOf(q) > -1; });
  renderCItems(filtered);
}

function changeQty(itemId, delta) {
  var curr = (APP.cart[itemId] ? APP.cart[itemId].qty : 0);
  var next = Math.max(0, curr + delta);

  var item = (APP.clientItems || []).find(function (x) { return x.ItemID === itemId; });
  if (!item) return;

  if (next > 0) {
    APP.cart[itemId] = { qty: next, price: item.Price, name: item.ItemName, unit: item.Unit };
  } else {
    delete APP.cart[itemId];
  }

  filterCItems();
  updateCartBar();
}

function updateCartBar() {
  var bar = document.getElementById('cartBar');
  var countEl = document.getElementById('cartBadgeCount');
  var infoEl = document.getElementById('cartInfo');

  var keys = Object.keys(APP.cart);
  var totalItemsCount = 0;
  var totalPrice = 0;

  keys.forEach(function (k) {
    totalItemsCount += APP.cart[k].qty;
    totalPrice += APP.cart[k].qty * APP.cart[k].price;
  });

  if (!totalItemsCount) {
    if (bar) bar.classList.add('hidden');
    return;
  }

  if (countEl) countEl.textContent = totalItemsCount;
  if (infoEl) infoEl.textContent = keys.length + ' items • ₹' + fmt(totalPrice);
  if (bar) bar.classList.remove('hidden');
}

function renderCSitesDropdownAndList_(sites) {
  var list = document.getElementById('cSiteList');
  var filter = document.getElementById('cHistorySiteFilter');
  if (filter) {
    filter.innerHTML = '<option value="">All Sites</option>' + (sites || []).map(function (s) {
      return '<option value="' + s.SiteID + '">' + s.CompanyName + '</option>';
    }).join('');
  }
  if (!list) return;
  if (!sites || !sites.length) {
    list.innerHTML = '<div class="empty" style="grid-column:1/-1;">No delivery sites configured</div>';
    return;
  }

  if (!APP.selectedSiteId && sites.length > 0) {
    APP.selectedSiteId = sites[0].SiteID;
  }

  list.innerHTML = sites.map(function (s) {
    var isActive = (s.SiteID === APP.selectedSiteId) ? ' active' : '';
    var checkBadge = (s.SiteID === APP.selectedSiteId) ? '<i class="fa fa-circle-check" style="color:var(--green-bright);margin-left:auto;font-size:16px;"></i>' : '';
    return '<div class="site-radio-card-modern' + isActive + '" onclick="selectCSite(\'' + s.SiteID + '\')">' +
      '<div class="site-icon-box"><i class="fa fa-building-user"></i></div>' +
      '<div style="flex:1;min-width:0;">' +
      '<div style="font-size:13px;font-weight:800;color:var(--text);">' + s.CompanyName + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (s.Address || 'No address provided') + '</div>' +
      '</div>' +
      checkBadge +
      '</div>';
  }).join('');
}

function loadCSites() {
  api('getClientSites', { clientId: APP.clientId }, function (r) {
    APP.clientSites = r || [];
    renderCSitesDropdownAndList_(APP.clientSites);
  });
}

function selectCSite(siteId) {
  APP.selectedSiteId = siteId;
  renderCSitesDropdownAndList_(APP.clientSites || []);
}

function updateCreditDashboardCard_(limit, balance) {
  var container = document.getElementById('cCreditCardContainer');
  if (!container) return;

  var avail = Math.max(0, limit - balance);
  var pct = limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;

  var barColor = 'linear-gradient(90deg, #4ade80, #22c55e)';
  var statusBadge = '<span class="badge bg"><i class="fa fa-shield-check"></i> Healthy Credit</span>';
  if (pct >= 90) {
    barColor = 'linear-gradient(90deg, #f87171, #ef4444)';
    statusBadge = '<span class="badge bgr" style="background:#fef2f2;color:#dc2626;"><i class="fa fa-triangle-exclamation"></i> Limit Alert (' + pct + '%)</span>';
  } else if (pct >= 75) {
    barColor = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    statusBadge = '<span class="badge bgo" style="background:#fffbe6;color:#d97706;"><i class="fa fa-circle-exclamation"></i> Near Limit (' + pct + '%)</span>';
  }

  container.innerHTML =
    '<div class="balance-card" style="margin-bottom:16px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">' +
    '<div>' +
    '<div class="bal-lbl">Outstanding Balance</div>' +
    '<div class="bal-amt" id="cBal">₹' + fmt(balance) + '</div>' +
    '</div>' +
    '<div style="margin-top:4px;">' + statusBadge + '</div>' +
    '</div>' +
    '<div style="margin-top:14px;background:rgba(255,255,255,0.12);border-radius:12px;padding:12px;backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.15);">' +
    '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;opacity:0.9;font-weight:600;">' +
    '<span>Available Credit: <strong style="color:#86efac;">₹' + fmt(avail) + '</strong></span>' +
    '<span>Limit: ₹' + fmt(limit) + '</span>' +
    '</div>' +
    '<div style="height:8px;background:rgba(0,0,0,0.25);border-radius:99px;overflow:hidden;">' +
    '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:99px;transition:width 0.5s ease;"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:10px;margin-top:4px;opacity:0.7;">' +
    '<span>' + pct + '% Credit Utilized</span>' +
    '<span>' + (limit > 0 ? ('₹' + fmt(avail) + ' remaining') : 'No limit set') + '</span>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function loadClientCreditInfo() {
  api('getClientCreditInfo', { clientId: APP.clientId }, function (r) {
    if (!r) return;
    var limit = parseFloat(r.creditLimit) || 0;
    var balance = parseFloat(r.balance || APP.clientBalance || 0);
    APP.clientCreditLimit = limit;
    var dVal = document.getElementById('cCreditValDesk');
    var mVal = document.getElementById('cCreditValMobile');
    var dChip = document.getElementById('cCreditChipDesk');
    var mChip = document.getElementById('cCreditChipMobile');
    if (dVal) dVal.textContent = '₹' + fmt(limit);
    if (mVal) mVal.textContent = '₹' + fmt(limit);
    if (dChip) dChip.style.display = 'flex';
    if (mChip) mChip.style.display = 'flex';
    updateCreditDashboardCard_(limit, balance);
  });
}

function placeOrder() {
  var items = [];
  Object.keys(APP.cart).forEach(function (k) {
    items.push({ itemID: k, orderedQty: APP.cart[k].qty, price: APP.cart[k].price });
  });
  if (!items.length) { toast('Cart is empty', true); return; }
  var delDate = document.getElementById('cDelDate').value;
  if (!delDate) { toast('Please select delivery date', true); return; }

  api('placeOrder', { clientId: APP.clientId, siteId: APP.selectedSiteId, deliveryDate: delDate, items: items }, function (r) {
    if (r && r.success) {
      toast('🎉 Order placed successfully! ID: ' + r.orderId);
      APP.cart = {};
      updateCartBar();
      cPage('history');
    } else {
      toast('❌ ' + ((r && r.message) || 'Failed to place order'), true);
    }
  });
}

function loadCOrders() {
  var siteFilter = (document.getElementById('cHistorySiteFilter') && document.getElementById('cHistorySiteFilter').value) || '';
  api('getOrders', { clientId: APP.clientId }, function (r) {
    var orders = Array.isArray(r) ? r : [];
    if (siteFilter) orders = orders.filter(function (o) { return String(o.SiteID || '') === siteFilter; });
    setListPagerEmptyHtml_('cOrderHistory', '<div class="empty"><i class="fa fa-box-open"></i>No orders' + (siteFilter ? ' for selected site' : ' yet') + '</div>');
    setListPagerData_('cOrderHistory', orders);
  });
}

function viewCOrder(orderId) {
  api('getOrderWithItems', { orderId: orderId }, function (r) {
    if (!r) return;
    APP.currentCOrder = r;
    var rows = (r.items || []).map(function (i) {
      var thumb = i.ImageBase64 ? itemImageHtml_(i.ImageBase64, 32) : '<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:20px;">' + getEmoji(i.ItemName) + '</div>';
      return '<div class="odi-row"><div style="display:flex;gap:10px;align-items:center;">' + thumb + '<div><div style="font-weight:700;">' + i.ItemName + '</div><div style="font-size:11px;color:var(--muted);">' + (i.DeliveredQty || i.OrderedQty) + ' ' + i.Unit + ' × ₹' + fmt(i.Price) + '</div></div></div><div style="font-weight:700;color:var(--green-mid)">₹' + fmt(i.Total) + '</div></div>';
    }).join('');
    var total = (r.items || []).reduce(function (s, i) { return s + (parseFloat(i.Total) || 0); }, 0);
    document.getElementById('cOrderContent').innerHTML =
      '<div style="font-size:16px;font-weight:800;margin-bottom:10px;">Order #' + r.OrderID + '</div>' +
      '<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">' + sBadge(r.Status) + '<span style="font-size:12px;color:var(--muted);">Delivery: ' + fmtDate(r.DeliveryDate) + '</span></div>' +
      rows +
      '<div style="display:flex;justify-content:space-between;padding:11px;background:var(--green-dark);color:white;border-radius:9px;margin-top:10px;"><span style="font-weight:600;">Total</span><span style="font-weight:800;font-size:16px;">₹' + fmt(total) + '</span></div>' +
      '<button class="btn btn-s btn-full" style="margin-top:10px;" onclick="reorder(\'' + r.OrderID + '\')"><i class="fa fa-rotate-right"></i> Reorder This</button>' +
      (r.Status === 'Delivered' ? '<button class="btn btn-full" style="margin-top:8px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;padding:12px;font-weight:700;" onclick="closeModal(\'cOrderModal\');openReportIssueModal(\'' + r.OrderID + '\')"><i class="fa fa-triangle-exclamation"></i> Report an Issue</button>' : '');
    openModal('cOrderModal');
  });
}

function reorder(orderId) {
  api('getOrderWithItems', { orderId: orderId }, function (r) {
    if (!r) return;
    APP.cart = {};
    r.items.forEach(function (i) { APP.cart[i.ItemID] = { qty: parseFloat(i.OrderedQty), price: parseFloat(i.Price), name: i.ItemName, unit: i.Unit }; });
    closeModal('cOrderModal');
    toast('Items added to cart!');
    cPage('order');
    setTimeout(function () {
      Object.keys(APP.cart).forEach(function (id) {
        var inp = document.getElementById('qi_' + id); if (inp) inp.value = APP.cart[id].qty;
        var card = document.getElementById('ic_' + id); if (card) card.classList.add('in-cart');
      });
      updateCartBar();
    }, 100);
  });
}

function loadCInvoices() {
  api('getInvoices', { clientId: APP.clientId }, function (r) {
    setListPagerEmptyHtml_('cInvoices', '<div class="empty"><i class="fa fa-file-invoice"></i>No invoices</div>');
    if (!r || !r.length) { APP.cInvoicesLedger = []; setListPagerData_('cInvoices', []); return; }
    api('getLedger', { clientId: APP.clientId }, function (ledger) {
      APP.cInvoicesLedger = ledger || [];
      setListPagerData_('cInvoices', r || []);
    });
  });
}

function loadCLedger() {
  var from = (document.getElementById('cLedgerFrom') && document.getElementById('cLedgerFrom').value) || '';
  var to = (document.getElementById('cLedgerTo') && document.getElementById('cLedgerTo').value) || '';
  var payload = { clientId: APP.clientId };
  if (from) payload.startDate = from;
  if (to) payload.endDate = to;
  api('getLedger', payload, function (r) {
    setListPagerData_('cLedger', r || []);
  });
}

function cDownloadLedger() {
  var from = (document.getElementById('cLedgerFrom') && document.getElementById('cLedgerFrom').value) || '';
  var to = (document.getElementById('cLedgerTo') && document.getElementById('cLedgerTo').value) || '';
  var cacheKey = 'ledger_' + APP.clientId + '_' + from + '_' + to;
  printHTMLAsync('getLedgerHTML', { clientId: APP.clientId, startDate: from || null, endDate: to || null }, cacheKey);
}

// ===== ISSUES TICKET SYSTEM =====
function loadAdminIssues() {
  api('getIssues', {}, function (r) {
    var tbody = document.getElementById('issuesTbody');
    if (!tbody) return;
    var issues = Array.isArray(r) ? r : (r && r.issues) || [];
    if (!issues.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty">No issues reported</td></tr>'; return; }
    tbody.innerHTML = issues.map(function (iss) {
      return '<tr><td><strong>' + iss.IssueID + '</strong></td><td>#' + iss.OrderID + '</td><td>' + clientName(iss.ClientID) + '</td><td>' + iss.ItemName + '</td><td>' + iss.Qty + '</td><td>' + iss.IssueType + '</td><td>' + sBadge(iss.Status) + '</td><td>' + fmtDate(iss.CreatedAt) + '</td><td><button class="btn btn-s btn-sm" onclick="viewAdminIssueDetail(\'' + iss.IssueID + '\')">Manage</button></td></tr>';
    }).join('');
  });
}

function viewAdminIssueDetail(issueId) {
  api('getIssueDetails', { issueId: issueId }, function (iss) {
    if (!iss) return;
    APP.currentIssue = iss;
    document.getElementById('issDetailTitle').textContent = 'Issue #' + iss.IssueID;
    document.getElementById('issDetailSubtitle').textContent = 'Order #' + iss.OrderID + ' • Client: ' + clientName(iss.ClientID);
    document.getElementById('issDetailDesc').textContent = iss.Description || '-';
    openModal('issDetailModal');
  });
}

function confirmApproveIssue() {
  if (!APP.currentIssue) return;
  var remark = document.getElementById('issApproveRemark').value.trim();
  api('approveIssue', { issueId: APP.currentIssue.IssueID, remark: remark }, function (r) {
    toast('Issue Approved & Credit Note Generated!');
    closeModal('issApproveModal');
    closeModal('issDetailModal');
    loadAdminIssues();
  });
}

function confirmRejectIssue() {
  if (!APP.currentIssue) return;
  var remark = document.getElementById('issRejectRemark').value.trim();
  if (!remark) { toast('Please provide a rejection reason', true); return; }
  api('rejectIssue', { issueId: APP.currentIssue.IssueID, remark: remark }, function (r) {
    toast('Issue Rejected');
    closeModal('issRejectModal');
    closeModal('issDetailModal');
    loadAdminIssues();
  });
}

function loadClientIssues() {
  api('getIssues', { clientId: APP.clientId }, function (r) {
    var el = document.getElementById('clientIssuesList');
    if (!el) return;
    var issues = Array.isArray(r) ? r : (r && r.issues) || [];
    if (!issues.length) { el.innerHTML = '<div class="empty">No issues reported yet</div>'; return; }
    el.innerHTML = issues.map(function (iss) {
      return '<div class="order-row"><div><strong>#' + iss.IssueID + '</strong> - ' + iss.ItemName + '<div style="font-size:11px;color:var(--muted);">' + iss.IssueType + ' • Qty: ' + iss.Qty + '</div></div><div>' + sBadge(iss.Status) + '</div></div>';
    }).join('');
  });
}

function openReportIssueModal(orderId) {
  document.getElementById('riOrderId').textContent = orderId;
  api('getOrderWithItems', { orderId: orderId }, function (r) {
    if (!r) return;
    APP.riOrder = r;
    var sel = document.getElementById('riItem');
    sel.innerHTML = '<option value="">— Select Item —</option>' + (r.items || []).map(function (i) {
      return '<option value="' + i.ItemID + '" data-qty="' + (i.DeliveredQty || i.OrderedQty) + '" data-name="' + i.ItemName + '">' + i.ItemName + ' (' + (i.DeliveredQty || i.OrderedQty) + ' ' + i.Unit + ')</option>';
    }).join('');
    openModal('reportIssueModal');
  });
}

function riUpdateQtyMax() {
  var sel = document.getElementById('riItem');
  var opt = sel.options[sel.selectedIndex];
  var max = opt ? opt.getAttribute('data-qty') : '—';
  document.getElementById('riMaxQty').textContent = max || '—';
}

function submitReportIssue() {
  if (!APP.riOrder) return;
  var sel = document.getElementById('riItem');
  var itemId = sel.value;
  var opt = sel.options[sel.selectedIndex];
  var itemName = opt ? opt.getAttribute('data-name') : '';
  var qty = parseFloat(document.getElementById('riQty').value) || 0;
  var type = document.getElementById('riType').value;
  var desc = document.getElementById('riDesc').value.trim();

  if (!itemId || qty <= 0 || !type || !desc) { toast('Please fill all required fields', true); return; }

  var payload = {
    orderId: APP.riOrder.OrderID,
    clientId: APP.clientId,
    itemId: itemId,
    itemName: itemName,
    qty: qty,
    issueType: type,
    description: desc
  };

  api('createIssue', payload, function (r) {
    if (r && r.success) {
      toast('🚨 Issue reported successfully! Ticket: ' + r.issueId);
      closeModal('reportIssueModal');
      cPage('issues');
    } else {
      toast('❌ ' + ((r && r.message) || 'Failed to submit issue'), true);
    }
  });
}

// ===== FORGOT PASSWORD LOGIC =====
function openForgotPassword(type) {
  document.getElementById('resetType').value = type;
  document.getElementById('resetStep1').classList.add('active');
  document.getElementById('resetStep2').classList.remove('active');
  document.getElementById('resetStep3').classList.remove('active');
  document.getElementById('resetIdentifier').value = '';
  document.getElementById('resetErr1').style.display = 'none';
  document.getElementById('resetErr2').style.display = 'none';
  document.getElementById('resetErr3').style.display = 'none';

  if (type === 'admin') {
    document.getElementById('forgotModalTtl').textContent = 'Supplier Password Reset';
    document.getElementById('resetIdentifierLabel').textContent = 'Admin Recovery Email';
  } else {
    document.getElementById('forgotModalTtl').textContent = 'Client Password Reset';
    document.getElementById('resetIdentifierLabel').textContent = 'Registered Phone / Email';
  }
  openModal('forgotModal');
}

function closeForgotPassword() {
  closeModal('forgotModal');
}

function requestOTP() {
  var type = document.getElementById('resetType').value;
  var identifier = document.getElementById('resetIdentifier').value.trim();
  if (!identifier) { showErr('resetErr1', 'Please enter identifier'); return; }

  api('requestPasswordOTP', { userType: type, identifier: identifier }, function (r) {
    if (r && r.success) {
      document.getElementById('resetStep1').classList.remove('active');
      document.getElementById('resetStep2').classList.add('active');
      document.getElementById('resetSentEmail').textContent = r.maskedDestination || identifier;
    } else {
      showErr('resetErr1', r ? (r.message || 'Error requesting OTP') : 'Failed');
    }
  });
}

function goToStep3() {
  var otp = '';
  for (var i = 1; i <= 6; i++) {
    otp += (document.getElementById('otp' + i).value || '');
  }
  if (otp.length < 6) { showErr('resetErr2', 'Enter complete 6-digit OTP'); return; }
  APP.resetOtp = otp;
  document.getElementById('resetStep2').classList.remove('active');
  document.getElementById('resetStep3').classList.add('active');
}

function resetPasswordSubmit() {
  var type = document.getElementById('resetType').value;
  var identifier = document.getElementById('resetIdentifier').value.trim();
  var newPass = document.getElementById('resetNewPass').value.trim();
  var confirmPass = document.getElementById('resetConfirmPass').value.trim();

  if (!newPass) { showErr('resetErr3', 'Enter new password'); return; }
  if (newPass !== confirmPass) { showErr('resetErr3', 'Passwords do not match'); return; }

  api('resetPasswordWithOTP', { userType: type, identifier: identifier, otp: APP.resetOtp, newPassword: newPass }, function (r) {
    if (r && r.success) {
      toast('🎉 Password reset successfully!');
      closeForgotPassword();
    } else {
      showErr('resetErr3', r ? (r.message || 'Reset failed') : 'Error');
    }
  });
}

function moveToNextOtpInput(elem, index) {
  if (elem.value.length === 1 && index < 6) {
    var next = document.getElementById('otp' + (index + 1));
    if (next) next.focus();
  }
}

function handleOtpBackspace(event, index) {
  if (event.key === 'Backspace' && !event.target.value && index > 1) {
    var prev = document.getElementById('otp' + (index - 1));
    if (prev) prev.focus();
  }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
  populateAllStateDropdowns_();
  bindStateCodeAutoFill_('cState', 'cStateCode');
  bindStateCodeAutoFill_('sState', 'sStateCode');
  bindStateCodeAutoFill_('stBizState', 'stBizStateCode');
  initPaging_();

  // Hide loader
  var loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';

  // Restore active session if valid
  if (!restoreSession()) {
    showScreen('loginScreen');
    applyLoginPageParam();
  }
});
