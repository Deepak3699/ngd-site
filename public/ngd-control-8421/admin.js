/* ==========================================================================
   NGD Admin · dashboard for the enquiry responses
   --------------------------------------------------------------------------
   - hidden-path aware: every API call is built from the URL it was served on,
     so the same files work at /admin, /ngd-control-8241 or any ADMIN_PATH.
   - team logins, assignment, worklog (activity) and the black & white
     (dark / light) theme.
   ========================================================================== */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- API base ----------------------------------------------------
   The dashboard can be served from /admin OR from a secret ADMIN_PATH
   (/ngd-control-8241/). The API itself always lives at /api/*, one level up
   from the dashboard, so we resolve it once and remember the winner. */
let API_BASE = '';

const API = {
  get session() { return `${API_BASE}/admin/session`; },
  get login() { return `${API_BASE}/admin/login`; },
  get logout() { return `${API_BASE}/admin/logout`; },
  get leads() { return `${API_BASE}/admin/leads`; },
  get stats() { return `${API_BASE}/admin/stats`; },
  get activity() { return `${API_BASE}/admin/activity`; },
  get export() { return `${API_BASE}/admin/export`; },
  get health() { return `${API_BASE}/health`; },
};

async function resolveApiBase() {
  const candidates = [
    new URL('../api', window.location.href).href.replace(/\/+$/, ''), // sibling of the secret folder
    `${window.location.origin}/api`,                                   // site root (usual case)
  ];
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/admin/session`, { credentials: 'same-origin' });
      // any real API answer counts — 200 signed out, 401 when a login is required
      if (res.ok || res.status === 401 || res.status === 403) {
        API_BASE = base;
        return true;
      }
    } catch { /* try the next candidate */ }
  }
  API_BASE = candidates[1];
  return false;
}

/* ---------- state -------------------------------------------------------- */
const state = {
  session: null,
  leads: [],
  total: 0,
  page: 1,
  limit: 25,
  counts: { all: 0, student: 0, client: 0, new: 0, contacted: 0, won: 0, unassigned: 0, mine: 0, today: 0 },
  filters: { category: 'all', status: 'all', source: 'all', assignee: 'all', q: '', sort: 'newest' },
  stats: null,
  activity: [],
  detail: null,
  detailEvents: [],
  selected: new Set(),
  auto: false,
  autoTimer: null,
  open: true, // login disabled
  contact: null,
  notifications: null,
  user: null,
  lastSeenId: null,
};

/* ---------- helpers ------------------------------------------------------ */
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '—';
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} d ago`;
  return fmtDate(iso);
}

function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

function digitsOnly(v) {
  return String(v || '').replace(/[^\d+]/g, '').replace(/\+/g, '');
}

function waLink(phone, text) {
  const num = digitsOnly(phone);
  if (!num) return '';
  return `https://wa.me/${num.replace(/^0+/, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

function timeAgoShort(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '—';
  return diff < 60_000 ? 'now' : relTime(iso).replace(' ago', '');
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    const err = new Error(data?.error?.message || data?.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data || {};
}

function toast(message, kind = 'ok') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span>${kind === 'ok' ? '✓' : '⚠'}</span><span>${esc(message)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/* ---------- theme: black & white ---------------------------------------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('ngd.theme', theme); } catch { /* private mode */ }
  const label = $('#themeLabel');
  if (label) label.textContent = theme === 'light' ? 'Dark' : 'Light';
}

function toggleTheme() {
  const now = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(now);
  toast(now === 'light' ? 'Light mode on' : 'Dark mode on');
}

/* ---------- login -------------------------------------------------------- */
async function boot() {
  const reached = await resolveApiBase();
  if (!reached) toast('API not reachable — is the site running?', 'warn');

  try {
    const s = await api(API.session);
    state.session = s;
    state.open = Boolean(s.open);
    state.user = s.user || null;
    state.contact = s.contact || null;
    state.notifications = s.notifications || null;
  } catch (err) {
    toast('Could not reach the API — is the server running?', 'warn');
  }

  const needsLogin = state.session && !state.session.open && !state.session.authed;
  if (needsLogin) {
    $('#loginScreen').classList.remove('hidden');
    $('#app').classList.add('hidden');
    const userField = $('#loginUser');
    if ((state.session.team || []).length <= 1) {
      userField.value = state.session.team?.[0]?.username || 'admin';
      userField.closest('.field').style.display = 'none';
    }
    $('#loginBtn').addEventListener('click', doLogin);
    $('#loginForm').addEventListener('submit', (e) => { e.preventDefault(); doLogin(); });
    $('#loginPass').focus();
    return;
  }

  $('#loginScreen').classList.add('hidden');
  $('#app').classList.remove('hidden');
  renderSessionChrome();
  wire();
  await refreshAll();
  if (state.auto) startAuto();
}

async function doLogin() {
  const err = $('#loginError');
  const btn = $('#loginBtn');
  err.classList.add('hidden');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    await api(API.login, {
      method: 'POST',
      body: { username: $('#loginUser').value.trim(), password: $('#loginPass').value },
    });
    window.location.reload();
  } catch (e) {
    err.textContent = e.message || 'Sign in failed.';
    err.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Sign in';
    $('#loginPass').select();
  }
}

async function doLogout() {
  try { await api(API.logout, { method: 'POST', body: {} }); } catch { /* ignore */ }
  window.location.reload();
}

/* ---------- session chrome (topbar chips + notices) --------------------- */
function renderSessionChrome() {
  const s = state.session || {};

  // db badge
  const mode = s.dbMode?.mode || s.dbMode || 'unknown';
  $('#dbBadgeText').textContent = mode === 'neon' ? 'Neon DB' : `${mode} store`;
  $('#dbBadge').title = mode === 'neon' ? 'Connected to Neon Postgres' : 'Local dev file store (.dev-data/store.json)';

  if (s.authed && s.user) {
    $('#userName').textContent = s.user.name || s.user.username;
    $('#userAvatar').textContent = initials(s.user.name || s.user.username);
    $('#userBadge').title = `${s.user.role === 'admin' ? 'Admin' : 'Team member'} · ${s.user.username}`;
    $('#logoutBtn').classList.remove('hidden');
    $('#logoutBtn').onclick = doLogout;
  } else {
    $('#userName').textContent = 'Open access';
    $('#userAvatar').textContent = '∞';
    $('#userBadge').title = 'No login configured — anyone with the link can read this';
    $('#logoutBtn').classList.add('hidden');
  }

  if (state.open) $('#openNotice').classList.remove('hidden');

  // notifications (shape comes from api/_notify.js → notificationStatus())
  const n = state.notifications || {};
  const channels = [
    {
      label: 'Email alert',
      live: Boolean(n.email?.on),
      detail: n.email?.to,
      hint: 'RESEND_API_KEY + NOTIFY_FROM (+ optional NOTIFY_EMAIL)',
    },
    {
      label: n.whatsapp?.channel === 'meta-cloud-api'
        ? 'WhatsApp · Meta Cloud API'
        : n.whatsapp?.channel === 'callmebot'
          ? 'WhatsApp · CallMeBot'
          : 'WhatsApp alert',
      live: Boolean(n.whatsapp?.on),
      detail: n.whatsapp?.to,
      hint: 'WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + ALERT_WHATSAPP_TO, or CALLMEBOT_PHONE + CALLMEBOT_APIKEY',
    },
    {
      label: 'Webhook',
      live: Boolean(n.webhook?.on),
      detail: null,
      hint: 'NOTIFY_WEBHOOK (Slack / Discord / Zapier / Make)',
    },
  ];
  const activeCount = channels.filter((c) => c.live).length;
  $('#alertBadge').innerHTML = activeCount
    ? `<span class="dot"></span>${activeCount} alert${activeCount > 1 ? 's' : ''} on`
    : '<span class="dot" style="background:#F59E0B"></span>no alerts yet';
  $('#alertBadge').title = activeCount
    ? `Live: ${channels.filter((c) => c.live).map((c) => c.label).join(', ')}`
    : 'No alert channel configured — new enquiries only show up here';

  $('#channels').innerHTML = channels
    .map((c) => `<span class="channel ${c.live ? 'on' : 'off'}" title="${esc(c.hint)}">${c.live ? '●' : '○'} ${esc(c.label)}${c.detail ? ` · ${esc(c.detail)}` : ''}</span>`)
    .join('');
  $('#channelHint').innerHTML = activeCount
    ? 'New enquiries are pushed to the channels marked green. Open any row and use 💬 to reply on WhatsApp in one click.'
    : "No alert channel is configured yet, so new enquiries land here quietly. Add <code>RESEND_API_KEY</code> (email) or <code>CALLMEBOT_APIKEY</code> (free WhatsApp) in your Vercel environment and alerts start flowing.";
}

function renderDbNotice(health) {
  if (!health) return;
  const bad = health.database && health.database.ok === false;
  if (!bad) { $('#dbNotice').classList.add('hidden'); return; }
  $('#dbNoticeText').innerHTML = `Database problem: <code>${esc(health.database.error || 'not reachable')}</code>. Submissions may not be saved — check <code>DATABASE_URL</code>.`;
  $('#dbNotice').classList.remove('hidden');
}

/* ---------- wiring ------------------------------------------------------ */
function wire() {
  $('#themeBtn').onclick = toggleTheme;

  $$('.tab').forEach((tab) => {
    tab.onclick = () => {
      $$('.tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      state.filters.category = tab.dataset.category;
      state.page = 1;
      loadLeads();
    };
  });

  let searchTimer;
  $('#searchInput').oninput = (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filters.q = e.target.value.trim();
      state.page = 1;
      loadLeads();
    }, 280);
  };

  $('#assigneeFilter').onchange = (e) => {
    state.filters.assignee = e.target.value;
    state.page = 1;
    loadLeads();
  };
  $('#statusFilter').onchange = (e) => {
    state.filters.status = e.target.value;
    state.page = 1;
    loadLeads();
  };
  $('#sourceFilter').onchange = (e) => {
    state.filters.source = e.target.value;
    state.page = 1;
    loadLeads();
  };
  $('#sortFilter').onchange = (e) => {
    state.filters.sort = e.target.value;
    state.page = 1;
    loadLeads();
  };

  $('#prevBtn').onclick = () => { if (state.page > 1) { state.page -= 1; loadLeads(); } };
  $('#nextBtn').onclick = () => {
    if (state.page * state.limit < state.total) { state.page += 1; loadLeads(); }
  };

  $('#checkAll').onchange = (e) => {
    state.selected.clear();
    if (e.target.checked) state.leads.forEach((l) => state.selected.add(Number(l.id)));
    renderRows();
  };

  $('#autoBtn').onclick = () => {
    state.auto = !state.auto;
    $('#autoBtn').textContent = `Auto-refresh: ${state.auto ? 'on' : 'off'}`;
    $('#autoBtn').setAttribute('aria-pressed', String(state.auto));
    if (state.auto) startAuto(); else stopAuto();
  };

  $('#exportBtn').onclick = () => {
    window.location.href = API.export;
  };

  $$('[data-bulk]').forEach((btn) => {
    btn.onclick = () => bulk(btn.dataset.bulk);
  });

  $('#drawerClose').onclick = closeDrawer;
  $('#drawerBackdrop').onclick = closeDrawer;
  const activityRefresh = $('#activityRefresh');
  if (activityRefresh) activityRefresh.onclick = () => loadActivity();
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // row actions live inside re-rendered markup → delegate
  $('#tableBody').addEventListener('click', onRowClick);
  $('#cardList').addEventListener('click', onRowClick);
  $('#tableBody').addEventListener('change', onRowChange);
  $('#cardList').addEventListener('change', onRowChange);
  $('#drawerBody').addEventListener('click', onDrawerClick);
}

function startAuto() {
  stopAuto();
  state.autoTimer = setInterval(() => refreshAll(true), 30_000);
}

function stopAuto() {
  if (state.autoTimer) clearInterval(state.autoTimer);
  state.autoTimer = null;
}

/* ---------- data -------------------------------------------------------- */
async function refreshAll(quiet = false) {
  await Promise.all([loadLeads(quiet), loadStats(), loadActivity()]);
  loadHealth();
}

async function loadHealth() {
  try {
    renderDbNotice(await api(API.health));
  } catch { /* health is best-effort */ }
}

function queryString() {
  const f = state.filters;
  const params = new URLSearchParams({
    category: f.category,
    status: f.status,
    source: f.source,
    assignee: f.assignee,
    sort: f.sort,
    page: String(state.page),
    limit: String(state.limit),
  });
  if (f.q) params.set('q', f.q);
  return params.toString();
}

async function loadLeads(quiet = false) {
  try {
    const data = await api(`${API.leads}?${queryString()}`);
    const incoming = data.items || [];
    const newest = incoming[0];

    // gentle nudge when a brand new one arrives on auto-refresh
    if (quiet && newest && state.lastSeenId != null && Number(newest.id) > state.lastSeenId) {
      toast('New response arrived', 'ok');
      flashRow(Number(newest.id));
    }
    if (newest) state.lastSeenId = Math.max(state.lastSeenId || 0, ...incoming.map((l) => Number(l.id)));

    state.leads = incoming;
    state.total = data.total || 0;
    state.counts = { ...state.counts, ...(data.counts || {}) };
    renderRows();
  } catch (err) {
    if (err.status === 401) { toast('Session expired — sign in again', 'warn'); setTimeout(() => window.location.reload(), 1200); return; }
    if (!quiet) toast(err.message, 'warn');
  }
}

async function loadStats() {
  try {
    const data = await api(`${API.stats}?days=14`);
    state.stats = data.stats || null;
    renderStats();
  } catch { /* stats are decorative */ }
}

async function loadActivity() {
  try {
    const data = await api(`${API.activity}?limit=12`);
    state.activity = data.events || [];
    renderActivityPanel();
  } catch { /* non-fatal */ }
}

function flashRow(id) {
  const el = document.querySelector(`tr[data-id="${id}"], .lead-card[data-id="${id}"]`);
  if (!el) return;
  el.classList.add('is-new');
  setTimeout(() => el.classList.remove('is-new'), 6000);
}

/* ---------- stats ------------------------------------------------------- */
function renderStats() {
  const c = state.counts;
  const cards = [
    { key: 'new', label: 'New', value: c.new || 0, hint: 'Not answered yet' },
    { key: 'today', label: 'Today', value: c.today || 0, hint: 'Last 24 hours' },
    { key: '__category:student', label: 'Students', value: c.student || 0, hint: 'Student enquiries' },
    { key: '__category:client', label: 'Business / other', value: c.client || 0, hint: 'Client projects' },
    { key: 'contacted', label: 'In progress', value: c.contacted || 0, hint: 'Contacted' },
    { key: 'won', label: 'Won', value: c.won || 0, hint: 'Converted' },
    { key: '__assignee:mine', label: 'Assigned to me', value: c.mine || 0, hint: 'Owner: you' },
    { key: '__assignee:unassigned', label: 'Unassigned', value: c.unassigned || 0, hint: 'Nobody owns these' },
  ];

  $('#statGrid').innerHTML = cards
    .map(
      (card) => `
      <button class="stat" data-key="${esc(card.key)}" title="${esc(card.hint)}">
        <span class="label">${esc(card.label)}</span>
        <span class="value">${card.value}</span>
        <span class="sub">${esc(card.hint)}</span>
      </button>`
    )
    .join('');

  $('#countAll').textContent = c.all ?? state.total;
  $('#countStudents').textContent = c.student || 0;
  $('#countClients').textContent = c.client || 0;

  $$('#statGrid .stat').forEach((el) => {
    el.onclick = () => {
      const key = el.dataset.key;
      state.page = 1;
      if (key.startsWith('__category:')) {
        const cat = key.split(':')[1];
        state.filters.status = 'all';
        $$('.tab').forEach((t) => t.classList.toggle('is-active', t.dataset.category === cat));
        state.filters.category = cat;
      } else if (key.startsWith('__assignee:')) {
        state.filters.assignee = key.split(':')[1];
        $('#assigneeFilter').value = state.filters.assignee;
      } else {
        state.filters.status = key === 'today' ? 'all' : key;
        $('#statusFilter').value = state.filters.status;
      }
      loadLeads();
    };
  });

  // 14-day chart
  const series = state.stats?.series || [];
  const max = Math.max(1, ...series.map((d) => (d.student || 0) + (d.client || 0)));
  $('#chart').innerHTML = series.length
    ? series
      .map((d) => {
        const day = d.day.slice(8) + '/' + d.day.slice(5, 7);
        return `<div class="chart-col" title="${d.day}: ${d.student} student, ${d.client} other">
          <div class="chart-bar student" style="height:${((d.student || 0) / max) * 100}%"></div>
          <div class="chart-bar client" style="height:${((d.client || 0) / max) * 100}%"></div>
          <span class="chart-day">${day}</span>
        </div>`;
      })
      .join('')
    : '<div class="empty">No data yet</div>';
  $('#chartX').innerHTML = '';

  // needs breakdown
  const needs = state.stats?.needs || [];
  const maxNeed = Math.max(1, ...needs.map((n) => n.count));
  $('#breakdownNeeds').innerHTML = needs.length
    ? needs
      .map(
        (n) => `
        <div class="breakdown-row">
          <div class="breakdown-top"><span>${esc(n.label)}</span><span>${n.count}</span></div>
          <div class="breakdown-track">
            <span class="breakdown-fill" style="width:${(n.count / maxNeed) * 100}%"></span>
          </div>
        </div>`
      )
      .join('')
    : '<div class="empty">Nothing yet</div>';
}

function renderActivityPanel() {
  const panel = $('#activityPanel');
  if (!panel) return;
  panel.innerHTML = state.activity.length
    ? `<div class="timeline">${state.activity.map(eventRow).join('')}</div>`
    : '<div class="empty">No team activity yet.</div>';
}

function eventRow(e) {
  const who = e.actor_name || e.actor || 'System';
  const action = String(e.action || 'update').replace(/_/g, ' ');
  return `<div class="tl-item">
    <span class="tl-dot">${esc(initials(who)[0] || '·')}</span>
    <span class="tl-body"><b>${esc(who)}</b> ${esc(action)}${e.detail ? ` — ${esc(e.detail)}` : ''}
      <span class="when">${esc(relTime(e.created_at))}${e.lead_id ? ` · response #${esc(e.lead_id)}` : ''}</span>
    </span>
  </div>`;
}

/* ---------- table ------------------------------------------------------- */
const STATUS_LABEL = { new: 'New', contacted: 'Contacted', won: 'Won', lost: 'Lost', archived: 'Archived' };

function needCell(lead) {
  return lead.category === 'student'
    ? [lead.student_need, lead.college].filter(Boolean).join(' · ') || '—'
    : [lead.client_need, lead.company].filter(Boolean).join(' · ') || '—';
}

function ownerCell(lead) {
  const member = (state.session?.team || []).find((m) => m.username === lead.assigned_to);
  if (!lead.assigned_to) {
    return `<span class="owner is-empty"><span class="avatar">?</span>Nobody</span>`;
  }
  const name = member?.name || lead.assigned_to;
  const mine = lead.assigned_to === state.user?.username;
  return `<span class="owner" title="Assigned ${esc(lead.assigned_at ? relTime(lead.assigned_at) : '')}">
    <span class="avatar">${esc(initials(name))}</span>${esc(name)}${mine ? ' · you' : ''}</span>`;
}

function statusOptions(current) {
  return Object.entries(STATUS_LABEL)
    .map(([v, l]) => `<option value="${v}" ${v === current ? 'selected' : ''}>${l}</option>`)
    .join('');
}

function replyButtons(lead) {
  const msg = state.contact?.whatsappMessage || '';
  const hi = lead.category === 'student'
    ? `Hi ${lead.name}, thanks for reaching out to NextGenDev Solutions about ${lead.student_need || 'your project'}!`
    : `Hi ${lead.name}, thanks for contacting NextGenDev Solutions about ${lead.client_need || 'your project'}!`;
  const link = waLink(lead.phone, `${hi}${msg ? ` ${msg}` : ''}`);
  const mail = lead.email
    ? `<a class="icon-btn" href="mailto:${esc(lead.email)}?subject=${encodeURIComponent('Re: your enquiry at NextGenDev Solutions')}" title="Reply by email">✉</a>`
    : '';
  const wa = link
    ? `<a class="icon-btn" href="${link}" target="_blank" rel="noopener" title="Reply on WhatsApp">💬</a>`
    : '';
  return `${wa}${mail}`;
}

function renderRows() {
  const body = $('#tableBody');
  if (!state.leads.length) {
    body.innerHTML = `<tr><td colspan="9"><div class="empty"><strong>Nothing here yet</strong>Responses land here the moment someone submits the form.</div></td></tr>`;
    $('#cardList').innerHTML = '';
    $('#pagerInfo').textContent = '0 responses';
    $('#prevBtn').disabled = true;
    $('#nextBtn').disabled = true;
    return;
  }

  body.innerHTML = state.leads.map((l) => `
    <tr data-id="${esc(l.id)}" class="${l.status === 'new' ? 'is-new' : ''}">
      <td><input type="checkbox" data-check="${esc(l.id)}" ${state.selected.has(Number(l.id)) ? 'checked' : ''} /></td>
      <td><span title="${esc(fmtDate(l.created_at))}">${esc(relTime(l.created_at))}</span><br><span class="who"><span class="line">#${esc(l.id)}</span></span></td>
      <td>
        <div class="who">
          <div class="name">${esc(l.name)}</div>
          <div class="email"><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></div>
          <div class="line">${esc(l.phone || '—')}</div>
        </div>
      </td>
      <td><span class="tag ${l.category === 'student' ? 'tag-student' : 'tag-client'}">${l.category === 'student' ? '🎓 Student' : '🏢 Business / other'}</span></td>
      <td style="max-width:220px"><span class="muted">${esc(needCell(l))}</span></td>
      <td>${ownerCell(l)}</td>
      <td style="max-width:280px"><div class="msg">${esc(l.message || '—')}</div></td>
      <td>
        <select class="status-select" data-status="${esc(l.id)}">${statusOptions(l.status || 'new')}</select>
        <div class="muted" style="font-size:11px;margin-top:4px">${esc(l.source_section === 'footer-quick' ? 'footer quick form' : 'contact form')}</div>
      </td>
      <td>
        <div class="row-actions">
          ${replyButtons(l)}
          <button class="icon-btn" data-open="${esc(l.id)}" title="Open full details">↵</button>
          ${state.user?.role === 'admin' ? `<button class="icon-btn danger" data-del="${esc(l.id)}" title="Delete">🗑</button>` : ''}
        </div>
      </td>
    </tr>`).join('');

  // mobile cards
  $('#cardList').innerHTML = state.leads.map((l) => `
    <article class="lead-card ${l.status === 'new' ? 'is-new' : ''}" data-id="${esc(l.id)}">
      <header>
        <div class="who">
          <div class="name">${esc(l.name)}</div>
          <div class="email">${esc(l.email)}</div>
        </div>
        <span class="tag ${l.category === 'student' ? 'tag-student' : 'tag-client'}">${l.category === 'student' ? '🎓' : '🏢'}</span>
      </header>
      <p class="muted" style="margin:8px 0"><b>${esc(needCell(l))}</b></p>
      <p class="msg">${esc(l.message || '—')}</p>
      <div class="card-foot">
        <span class="muted">${esc(relTime(l.created_at))} · ${esc(ownerCell(l).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())}</span>
        <div class="row-actions">
          ${replyButtons(l)}
          <select class="status-select" data-status="${esc(l.id)}">${statusOptions(l.status || 'new')}</select>
          <button class="icon-btn" data-open="${esc(l.id)}">↵</button>
        </div>
      </div>
    </article>`).join('');

  const from = (state.page - 1) * state.limit + 1;
  const to = Math.min(state.page * state.limit, state.total);
  $('#pagerInfo').textContent = `${from}–${to} of ${state.total} response${state.total === 1 ? '' : 's'}`;
  $('#prevBtn').disabled = state.page <= 1;
  $('#nextBtn').disabled = state.page * state.limit >= state.total;

  renderBulk();
}

function renderBulk() {
  const bar = $('#bulkBar');
  const n = state.selected.size;
  if (!n) { bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  bar.style.display = 'flex';
  $('#bulkCount').textContent = `${n} selected`;
}

function onRowChange(e) {
  const id = e.target.dataset?.check;
  if (!id) return;
  if (e.target.checked) state.selected.add(Number(id)); else state.selected.delete(Number(id));
  renderBulk();
}

function onRowClick(e) {
  const openBtn = e.target.closest('[data-open]');
  if (openBtn) return openDrawer(Number(openBtn.dataset.open));

  const delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    const id = Number(delBtn.dataset.del);
    if (confirm(`Delete response #${id}? This cannot be undone.`)) removeLead(id);
    return;
  }
}

async function onStatusChange(e) {
  const sel = e.target.closest('[data-status]');
  if (!sel) return;
  const id = Number(sel.dataset.status);
  try {
    await api(API.leads, { method: 'PATCH', body: { id, status: sel.value } });
    const lead = state.leads.find((l) => Number(l.id) === id);
    if (lead) lead.status = sel.value;
    toast(`#${id} → ${STATUS_LABEL[sel.value]}`);
    loadStats();
    loadActivity();
  } catch (err) {
    toast(err.message, 'warn');
    loadLeads(true);
  }
}

async function removeLead(id) {
  try {
    await api(`${API.leads}?id=${id}`, { method: 'DELETE' });
    toast(`Deleted #${id}`);
    state.selected.delete(id);
    loadLeads();
    loadStats();
  } catch (err) {
    toast(err.message, 'warn');
  }
}

async function bulk(action) {
  const ids = Array.from(state.selected);
  if (!ids.length) return;
  if (action === 'delete') {
    if (!confirm(`Delete ${ids.length} response${ids.length > 1 ? 's' : ''}? This cannot be undone.`)) return;
    for (const id of ids) await removeLead(id);
    state.selected.clear();
    return;
  }
  const patch = action === 'assign-me' ? { assignedTo: 'me' }
    : action === 'contacted' ? { status: 'contacted' }
      : action === 'won' ? { status: 'won' }
        : { status: 'archived' };

  let done = 0;
  for (const id of ids) {
    try {
      await api(API.leads, { method: 'PATCH', body: { id, ...patch } });
      done += 1;
    } catch (err) { toast(`#${id}: ${err.message}`, 'warn'); }
  }
  toast(`${done} updated`);
  state.selected.clear();
  $('#checkAll').checked = false;
  loadLeads();
  loadStats();
  loadActivity();
}

/* ---------- drawer ----------------------------------------------------- */
function dataRow(label, value, href) {
  if (!value) return '';
  const body = href
    ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(value)}</a>`
    : esc(value);
  return `<div class="data-row"><span class="k">${esc(label)}</span><span>${body}</span></div>`;
}

async function openDrawer(id) {
  const drawer = $('#drawer');
  $('#drawerName').textContent = 'Loading…';
  $('#drawerMeta').textContent = '';
  $('#drawerBody').innerHTML = '<div class="empty">Loading…</div>';
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  $('#drawerBackdrop').classList.add('show');

  let item = state.leads.find((l) => Number(l.id) === id) || null;
  let events = [];
  try {
    const data = await api(`${API.leads}?id=${id}&events=1`);
    item = data.item || item;
    events = data.events || [];
  } catch { /* fall back to the row we already have */ }

  if (!item) {
    $('#drawerName').textContent = 'Not found';
    return;
  }

  state.detail = item;
  state.detailEvents = events;

  const isStudent = item.category === 'student';
  const member = (state.session?.team || []).find((m) => m.username === item.assigned_to);
  const ownerSelect = `
    <select class="input" id="drawerOwner" aria-label="Assign owner">
      <option value="">👤 Unassigned</option>
      <option value="me" ${item.assigned_to === state.user?.username ? 'selected' : ''}>⭐ Assign to me</option>
      ${(state.session?.team || []).map((m) => `<option value="${esc(m.username)}" ${m.username === item.assigned_to ? 'selected' : ''}>${esc(m.name)} (@${esc(m.username)})</option>`).join('')}
    </select>`;

  const waMsg = `Hi ${item.name}, thanks for reaching out to NextGenDev Solutions about ${isStudent ? item.student_need || 'your project' : item.client_need || 'your project'}!${state.contact?.whatsappMessage ? ` ${state.contact.whatsappMessage}` : ''}`;
  const waHref = waLink(item.phone, waMsg);

  $('#drawerName').textContent = item.name;
  $('#drawerMeta').innerHTML = `<span class="tag ${isStudent ? 'tag-student' : 'tag-client'}">${isStudent ? '🎓 Student' : '🏢 Business / other'}</span>
    <span class="muted"> · #${esc(item.id)} · ${esc(fmtDate(item.created_at))}</span>`;

  $('#drawerBody').innerHTML = `
    <div class="drawer-section">
      <h3>Quick reply</h3>
      <div class="chips">
        ${waHref ? `<a class="chip-link" href="${waHref}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ''}
        ${item.email ? `<a class="chip-link" href="mailto:${esc(item.email)}?subject=${encodeURIComponent('Re: your enquiry at NextGenDev Solutions')}">✉ Email</a>` : ''}
        ${item.phone ? `<a class="chip-link" href="tel:${esc(item.phone)}">📞 Call</a>` : ''}
        ${item.email ? `<button class="chip-link" id="copyEmail" data-email="${esc(item.email)}">⧉ Copy email</button>` : ''}
      </div>
      <div class="templates">
        ${[
          ['thanks', 'Thanks for reaching out!'],
          ['call', 'Can we jump on a quick call?'],
          ['quote', 'I have put together a quote for you.'],
          ['student', 'Here is what our student plan covers.'],
        ].map(([tplId, label]) => `<button class="tpl" data-tpl="${tplId}">${label}</button>`).join('')}
      </div>
    </div>

    <div class="drawer-section">
      <h3>Contact</h3>
      ${dataRow('Email', item.email, `mailto:${item.email}`)}
      ${dataRow('Phone', item.phone, item.phone ? `tel:${item.phone}` : '')}
      ${isStudent ? dataRow('College', item.college) : dataRow('Company', item.company)}
      ${isStudent ? dataRow('Course', item.course) : dataRow('Role', item.role)}
      ${isStudent ? dataRow('Study year', item.study_year) : dataRow('Industry', item.industry)}
      ${isStudent ? dataRow('Needs', item.student_need) : dataRow('Needs', item.client_need)}
      ${!isStudent ? dataRow('Budget', item.budget) : ''}
      ${!isStudent ? dataRow('Timeline', item.timeline) : ''}
      ${!isStudent ? dataRow('Website', item.website, item.website ? (item.website.startsWith('http') ? item.website : `https://${item.website}`) : '') : ''}
      ${dataRow('Source', item.source_section === 'footer-quick' ? 'Footer quick form' : 'Contact form')}
      ${dataRow('Reference', item.ref)}
    </div>

    <div class="drawer-section">
      <h3>Message</h3>
      <div class="bubble">${esc(item.message || '—')}</div>
    </div>

    <div class="drawer-section">
      <h3>Care &amp; ownership</h3>
      <div class="field">
        <label for="drawerStatus">Status</label>
        <select class="input" id="drawerStatus">${statusOptions(item.status || 'new')}</select>
      </div>
      <div class="field">
        <label for="drawerOwner">Assigned to</label>
        ${ownerSelect}
      </div>
      <div class="field">
        <label for="drawerNote">Private note (team only)</label>
        <textarea class="input" id="drawerNote" rows="4" placeholder="What did you agree on? Next step?">${esc(item.admin_note || '')}</textarea>
      </div>
      <div class="chips">
        <button class="btn btn-primary btn-sm" id="saveDetail">Save changes</button>
        ${state.user?.role === 'admin' ? `<button class="btn btn-danger btn-sm" id="deleteDetail">Delete</button>` : ''}
      </div>
      ${member ? `<p class="muted" style="margin-top:10px;font-size:12px">Owned by <b>${esc(member.name)}</b>${item.assigned_at ? ` since ${esc(fmtDate(item.assigned_at))}` : ''}.</p>` : ''}
    </div>

    <div class="drawer-section">
      <h3>Activity</h3>
      <div class="timeline" id="detailTimeline">
        ${events.length ? events.map(eventRow).join('') : '<div class="empty">No activity recorded yet.</div>'}
      </div>
    </div>`;

  $('#drawerBody').scrollTop = 0;
}

function closeDrawer() {
  const drawer = $('#drawer');
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  $('#drawerBackdrop').classList.remove('show');
}

async function onDrawerClick(e) {
  const copyBtn = e.target.closest('#copyEmail');
  if (copyBtn) {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.email);
      toast('Email copied');
    } catch { toast('Copy failed — select it manually', 'warn'); }
    return;
  }

  const tpl = e.target.closest('[data-tpl]');
  if (tpl) {
    $$('.tpl', $('#drawerBody')).forEach((t) => t.classList.remove('is-active'));
    tpl.classList.add('is-active');
    toast('Template picked — details below stay the same, copy it into your reply');
    return;
  }

  if (e.target.closest('#saveDetail')) return saveDetail();
  if (e.target.closest('#deleteDetail')) {
    const id = state.detail?.id;
    if (id && confirm(`Delete response #${id}? This cannot be undone.`)) {
      await removeLead(id);
      closeDrawer();
    }
  }
}

async function saveDetail() {
  const item = state.detail;
  if (!item) return;
  const status = $('#drawerStatus').value;
  const assignedTo = $('#drawerOwner').value;
  const adminNote = $('#drawerNote').value;

  const patch = { id: item.id };
  if (status !== (item.status || 'new')) patch.status = status;
  if (assignedTo) patch.assignedTo = assignedTo;
  if (adminNote !== (item.admin_note || '')) patch.adminNote = adminNote;

  if (Object.keys(patch).length === 1) { toast('Nothing changed'); return; }

  const btn = $('#saveDetail');
  btn.disabled = true;
  btn.textContent = 'Saving…';
  try {
    await api(API.leads, { method: 'PATCH', body: patch });
    toast('Saved');
    await Promise.all([loadLeads(true), loadStats(), loadActivity()]);
    await openDrawer(item.id);
  } catch (err) {
    toast(err.message, 'warn');
    btn.disabled = false;
    btn.textContent = 'Save changes';
  }
}

/* ---------- status selects (delegated change) --------------------------- */
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-status]')) onStatusChange(e);
});

/* ---------- go --------------------------------------------------------- */
applyTheme(document.documentElement.getAttribute('data-theme') || 'dark');
boot();
