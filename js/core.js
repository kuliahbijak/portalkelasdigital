/* ==========================================================================
   PortalKelas Digital v2 — inti aplikasi klien (frontend statis GitHub Pages)
   Metode PRO (gas-pro-api + gas-scale-turbo):
   1. SPA murni: semua tampilan dirender dari state lokal; pindah menu = show/hide (0 ms).
   2. Optimistic UI + localStorage (SWR): tampil dari cache dulu, server menyusul.
   3. Komunikasi: fetch POST text/plain ke GAS /exec {action, args} → JSON (tanpa preflight CORS).
   4. Baca identik yang sedang berjalan ditumpangkan (dedupe) + epoch tulis (anti data basi).
   5. Respons "nq" → drain antrean: notifikasi WA/email terkirim dalam hitungan detik.
   6. Pengukur: Perf.table() / Perf.summary() di Console.
   ========================================================================== */
'use strict';
const CFG = window.APP_CONFIG || {};
const GAS_URL = String(CFG.GAS_URL || '').trim();
const KONFIG_OK = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/.test(GAS_URL) && !/GANTI|XXXX/.test(GAS_URL);
const BOOT = {};
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const S = {
  app: LS.get('pk_app', {}), katalog: LS.get('pk_katalog', []),
  token: LS.get('pk_tok', null), user: null, M: null, A: null,
  view: '', params: {}, hist: [], orders: LS.get('pk_orders', []),
  pwa: { canInstall: false, standalone: false, ios: false }, ui: {}, bukti: {}, sinkron: 0
};
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rp = n => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const angka = n => (Number(n) || 0).toLocaleString('id-ID');
const tgl = (iso, o) => { if (!iso) return '-'; const d = new Date(iso); return isNaN(d) ? '-' : d.toLocaleDateString('id-ID', o || { day: 'numeric', month: 'short', year: 'numeric' }); };
const jam = iso => iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
const tglJam = iso => iso ? tgl(iso) + ' • ' + jam(iso) : '-';
const durasi = m => { m = Math.round(Number(m) || 0); return m < 60 ? m + ' mnt' : Math.floor(m / 60) + ' jam' + (m % 60 ? ' ' + (m % 60) + ' mnt' : ''); };
const jamBelajar = m => { const h = (Number(m) || 0) / 60; return (h >= 10 ? Math.round(h) : Math.round(h * 10) / 10).toString().replace('.', ','); };
function relatif(iso) {
  if (!iso) return '-';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 0) { const f = -s; return f < 3600 ? Math.ceil(f / 60) + ' mnt lagi' : f < 86400 ? Math.ceil(f / 3600) + ' jam lagi' : Math.ceil(f / 86400) + ' hari lagi'; }
  if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' mnt lalu';
  if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; if (s < 2592000) return Math.floor(s / 86400) + ' hari lalu';
  return tgl(iso);
}
const inisial = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const hpTampil = v => { const s = String(v || ''); return s.indexOf('62') === 0 ? '0' + s.slice(2) : s; };
const uid = p => p + '-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const salin = o => JSON.parse(JSON.stringify(o));
function cari(teks, q) { if (!q) return true; teks = String(teks || '').toLowerCase(); return q.toLowerCase().split(/\s+/).every(w => teks.indexOf(w) > -1); }

/* ---------- Ikon SVG inline (tanpa CDN ikon → nol jeda muat) ---------- */
const ICON = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  grad: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  bar: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  play: '<polygon points="7 4 20 12 7 20 7 4"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkc: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  xc: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  chevL: '<polyline points="15 18 9 12 15 6"/>', chevR: '<polyline points="9 18 15 12 9 6"/>', chevD: '<polyline points="6 9 12 15 18 9"/>', chevU: '<polyline points="18 15 12 9 6 15"/>',
  arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', arrowL: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  filetext: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  mail: '<path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><polyline points="22 6 12 13 2 6"/>',
  msg: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  layout: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  tag: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  phoneDev: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
  merge: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  wallet: '<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  sort: '<path d="M3 6h18M6 12h12M10 18h4"/>',
  wa: '<path d="M3 21l1.65-4.9A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 10c.5 2 2 3.5 4 4l1.2-1.2 2 1-.4 1.6c-3.6.4-7.6-3.6-7.2-7.2L10.2 8l1 2z"/>',
  sparkle: '<path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9z"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'
};
const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n] || ICON.info}</svg>`;

/** Tema efektif: pilihan manual, atau mengikuti sistem. */
function temaGelap() { const a = document.documentElement.getAttribute('data-theme'); return a === 'dark' || (a !== 'light' && !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches)); }
/* ---------- Komunikasi server: fetch ke GAS REST API ---------- */
let NET = 0;
function net(on) {
  NET += on ? 1 : -1;
  const b = $('#netbar'); if (!b) return;
  if (NET > 0) { b.className = 'on'; } else { NET = 0; b.className = 'done'; setTimeout(() => { if (!NET) b.className = ''; }, 450); }
}
/** Pengukur: total (browser), server (ms dari GAS), jaringan = selisihnya. */
const Perf = {
  log: [],
  catat(aksi, total, server, cache) { this.log.push({ aksi, total, server, net: Math.max(0, total - (server || 0)), cache: cache ? '✓' : '', waktu: new Date().toLocaleTimeString('id-ID') }); if (this.log.length > 200) this.log.shift(); },
  table() { console.table(this.log.slice(-40)); },
  summary() {
    const g = {};
    this.log.forEach(r => { const x = g[r.aksi] = g[r.aksi] || { n: 0, total: 0, server: 0 }; x.n++; x.total += r.total; x.server += r.server || 0; });
    console.table(Object.keys(g).map(k => ({ aksi: k, kali: g[k].n, rata_total_ms: Math.round(g[k].total / g[k].n), rata_server_ms: Math.round(g[k].server / g[k].n) })));
  }
};
window.Perf = Perf;
/* Aksi baca-saja: boleh ditumpangkan & tidak menandai "baru saja diubah". */
const API_BACA = /^(bootstrap|ambilAntrean|crmDetail|lihatBukti|unduhMateri|cekPromo|cekPesanan|cekPerangkatWA|dataAdmin|statusSistem)$/;
const INFLIGHT = {};
let EPOCH_TULIS = 0;
/** Panggilan inti: POST {action,args} sebagai text/plain (tanpa preflight). Mengembalikan envelope mentah. */
async function kirimAPI(fn, args, opt) {
  if (!KONFIG_OK) throw new Error('Konfigurasi belum lengkap: isi GAS_URL di js/config.js dengan URL /exec Apps Script.');
  opt = opt || {};
  const t0 = performance.now();
  const ctrl = 'AbortController' in window ? new AbortController() : null;
  const batas = setTimeout(() => ctrl && ctrl.abort(), opt.timeout || 60000);
  let res;
  try {
    const r = await fetch(GAS_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: fn, args: args || [] }), signal: ctrl ? ctrl.signal : undefined });
    if (!r.ok) throw new Error('Server membalas HTTP ' + r.status + '.');
    const teks = await r.text();
    try { res = JSON.parse(teks); }
    catch (e) { throw new Error(/<html/i.test(teks) ? 'Server mengirim halaman, bukan data. Pastikan deployment Apps Script versi terbaru & akses "Siapa saja".' : 'Respons server tidak bisa dibaca.'); }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Server terlalu lama merespons. Coba lagi.');
    if (e instanceof TypeError) throw new Error(navigator.onLine ? 'Tidak bisa menghubungi server. Coba lagi sebentar.' : 'Anda sedang offline.');
    throw e;
  } finally { clearTimeout(batas); }
  Perf.catat(fn, Math.round(performance.now() - t0), res && res.ms, res && res.data && res.data.cached);
  if (res && res.nq > 0) jadwalDrain();
  return res;
}
function api(fn, ...args) {
  const baca = API_BACA.test(fn);
  const kunci = baca ? EPOCH_TULIS + '|' + fn + '|' + JSON.stringify(args) : '';
  if (baca && INFLIGHT[kunci]) return INFLIGHT[kunci];           // permintaan identik menumpang
  if (!baca) { EPOCH_TULIS++; S.mutasi = (S.mutasi || 0) + 1; }
  net(true);
  const p = kirimAPI(fn, args).then(r => {
    if (!r) throw new Error('Respons kosong dari server. Coba lagi.');
    if (!r.success) {
      if (r.code === 'SESI_HABIS') { sesiHabis(); throw new Error('Sesi Anda berakhir. Silakan masuk lagi.'); }
      throw new Error(r.message || 'Terjadi kesalahan.');
    }
    return r.data;
  }).finally(() => {
    net(false);
    if (!baca) { S.mutasi--; S.mutasiT = Date.now(); }
    if (kunci) delete INFLIGHT[kunci];
  });
  if (kunci) INFLIGHT[kunci] = p;
  return p;
}
/** Notifikasi baru diantrekan → minta server mengirim sekarang (debounce, ulang maks. 3x bila masih ada sisa). */
let DRAIN_T = null, DRAIN_N = 0;
function jadwalDrain(ulang) {
  if (!ulang) DRAIN_N = 0;
  clearTimeout(DRAIN_T);
  DRAIN_T = setTimeout(() => {
    kirimAPI('drain', []).then(r => { if (r && r.success && r.data && r.data.sisa > 0 && ++DRAIN_N < 3) jadwalDrain(true); }).catch(() => { });
  }, ulang ? 6000 : 400);
}
/** Warmup server (gas-scale-turbo 4.7): GET ?w=… mode no-cors, maks. 1x per 4 menit per lingkup. */
function hangatkan(lingkup) {
  if (!KONFIG_OK) return;
  try {
    const k = 'pk_warm_' + lingkup, t = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - t < 240000) return;
    sessionStorage.setItem(k, String(Date.now()));
  } catch (e) { }
  fetch(GAS_URL + '?w=' + lingkup, { mode: 'no-cors' }).catch(() => { });
}
/** Aksi optimistik: ubah UI dulu, kirim di latar, kembalikan bila gagal. */
function optimis({ ubah, kirim, balik, sukses, pesanGagal }) {
  try { ubah && ubah(); } catch (e) { console.error(e); }
  rerender();
  return kirim().then(r => { sukses && sukses(r); rerender(); return r; })
    .catch(e => { try { balik && balik(); } catch (x) { } rerender(); toast((pesanGagal ? pesanGagal + ': ' : '') + e.message, 'err'); throw e; });
}

/* ---------- Token & sesi ---------- */
function infoToken(t) {
  try {
    const b = String(t).split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b + '==='.slice((b.length + 3) % 4));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    const p = JSON.parse(new TextDecoder().decode(bytes));
    return p && p.x > Date.now() ? p : null;
  } catch (e) { return null; }
}
function setSesi(token, user) {
  S.token = token; S.user = user;
  if (token) LS.set('pk_tok', token); else LS.del('pk_tok');
}
function kunciCache() { return S.user ? 'pk_boot_' + S.user.id : ''; }
function simpanCache() {
  if (!S.user) return;
  const d = S.user.peran === 'member' ? S.M : S.A;
  if (d && !LS.set(kunciCache(), d)) { /* kuota localStorage penuh → abaikan */ }
}
function sesiHabis() {
  if (!S.user) return;
  LS.del(kunciCache());
  setSesi(null, null); S.M = null; S.A = null;
  toast('Sesi berakhir. Silakan masuk kembali.', 'info');
  go('login', {}, { noHist: true });
}

/* ---------- Toast ---------- */
function toast(msg, tipe, opt) {
  tipe = tipe || 'ok'; opt = opt || {};
  const el = document.createElement('div');
  el.className = 'toast ' + tipe;
  el.innerHTML = ic(tipe === 'err' ? 'alert' : tipe === 'info' ? 'info' : 'checkc') + `<span class="grow">${esc(msg)}</span>` + (opt.undo ? `<button type="button">${esc(opt.undoLabel || 'Urungkan')}</button>` : '');
  if (opt.undo) el.querySelector('button').onclick = () => { opt.undo(); el.remove(); };
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, opt.ms || (tipe === 'err' ? 6000 : 3200));
}

/* ---------- Modal, drawer, konfirmasi ---------- */
function modal(o) {
  o = o || {};
  const w = document.createElement('div');
  w.className = 'modal-bg' + (o.drawer ? ' drawer' : '');
  w.innerHTML = `<div class="modal ${o.size || ''}" role="dialog" aria-modal="true" aria-label="${esc(o.title || '')}">
    <div class="modal-h"><div class="grow">${o.titleHtml || `<h3>${esc(o.title || '')}</h3>`}</div><button type="button" class="x-btn" data-act="tutupModal" aria-label="Tutup">${ic('x', 'sm')}</button></div>
    <div class="modal-b">${o.body || ''}</div>${o.foot ? `<div class="modal-f">${o.foot}</div>` : ''}</div>`;
  $('#modals').appendChild(w);
  w.addEventListener('mousedown', e => { if (e.target === w) tutupModal(w); });
  w._tutup = o.onClose; w._fokus = document.activeElement;
  document.body.style.overflow = 'hidden';
  setTimeout(() => { const f = w.querySelector('[autofocus]') || w.querySelector('.modal-b input:not([type=hidden]):not([type=checkbox]), .modal-b textarea, .modal-b select') || w.querySelector('.x-btn'); f && f.focus(); }, 40);
  return w;
}
function tutupModal(w) {
  w = w || $('#modals').lastElementChild; if (!w) return;
  w.remove();
  if (!$('#modals').children.length) document.body.style.overflow = '';
  w._tutup && w._tutup();
  w._fokus && w._fokus.focus && w._fokus.focus();
}
function konfirmasi(pesan, o) {
  o = o || {};
  return new Promise(res => {
    let jawab = false;
    const w = modal({ title: o.title || 'Konfirmasi', size: 'sm', body: `<p style="font-size:14px">${pesan}</p>`, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn ${o.danger ? 'danger' : 'pri'}" data-k="ya">${esc(o.ok || 'Ya, lanjutkan')}</button>`, onClose: () => res(jawab) });
    w.querySelector('[data-k=ya]').onclick = () => { jawab = true; tutupModal(w); };
  });
}
function tanya(judul, o) {
  o = o || {};
  return new Promise(res => {
    let nilai = null;
    const inp = o.multiline ? `<textarea class="inp" id="tanya-in" placeholder="${esc(o.placeholder || '')}">${esc(o.nilai || '')}</textarea>` : `<input class="inp" id="tanya-in" placeholder="${esc(o.placeholder || '')}" value="${esc(o.nilai || '')}">`;
    const w = modal({ title: judul, size: 'sm', body: (o.pesan ? `<p class="muted mb16">${o.pesan}</p>` : '') + inp, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn ${o.danger ? 'danger' : 'pri'}" data-k="ok">${esc(o.ok || 'Simpan')}</button>`, onClose: () => res(nilai) });
    const ok = () => { nilai = w.querySelector('#tanya-in').value.trim(); tutupModal(w); };
    w.querySelector('[data-k=ok]').onclick = ok;
    if (!o.multiline) w.querySelector('#tanya-in').addEventListener('keydown', e => { if (e.key === 'Enter') ok(); });
  });
}

/* ---------- Router SPA (tanpa URL, tanpa reload) ---------- */
const VIEWS = {}, ACT = {}, INP = {}, CHG = {}, SUB = {}, CHROME = {};
function landing() { return !S.user ? 'katalog' : S.user.peran === 'member' ? 'beranda' : 'a-ringkasan'; }
function seksi(name) {
  let s = document.getElementById('v-' + name);
  if (!s) { s = document.createElement('section'); s.className = 'view'; s.id = 'v-' + name; s.setAttribute('aria-label', (VIEWS[name] || {}).title || name); $('#views').appendChild(s); }
  return s;
}
function go(name, params, opt) {
  params = params || {}; opt = opt || {};
  const v = VIEWS[name];
  if (!v) return go(landing(), {}, opt);
  if (v.area === 'mem' && !(S.user && S.user.peran === 'member')) return go(S.user ? landing() : 'login', {}, opt);
  if (v.area === 'adm' && !(S.user && S.user.peran !== 'member')) return go(S.user ? landing() : 'login', {}, opt);
  if (v.roles && v.roles.indexOf(S.user.peran) < 0) return go(landing(), {}, opt);
  if (S.view && VIEWS[S.view] && VIEWS[S.view].leave) VIEWS[S.view].leave();
  const dorong = S.view && !opt.noHist && S.view !== name;
  if (dorong) { S.hist.push([S.view, S.params]); if (S.hist.length > 30) S.hist.shift(); }
  S.view = name; S.params = params;
  $$('.view.on').forEach(x => x.classList.remove('on'));
  seksi(name).classList.add('on');
  const sk = $('#boot-sk'); if (sk) sk.remove();
  renderChrome();
  render(name);
  if (!opt.keepScroll) window.scrollTo(0, 0);
  document.title = (v.title || '') + ' · ' + (S.app.NAMA_PORTAL || 'PortalKelas');
  LS.set('pk_view_' + (S.user ? S.user.id : 'pub'), [name, params]);
  if (dorong) riwayatDorong(); else riwayatGanti();
  tutupNavMobile();
}
/* ---------- Riwayat & tautan: #tampilan atau #tampilan/ID (tombol Kembali HP berfungsi) ---------- */
let RIWAYAT_I = 0, ABAIKAN_POP = false;
function hashDari(name, params) { return '#' + name + (params && params.id ? '/' + encodeURIComponent(params.id) : ''); }
function bacaHash() {
  const h = decodeURIComponent((location.hash || '').slice(1));
  if (!h) return null;
  const [v, id] = h.split('/');
  return VIEWS[v] ? [v, id ? { id } : {}] : null;
}
function riwayatDorong() {
  if (window.__TANPA_HASH) return;
  try { RIWAYAT_I++; history.pushState({ i: RIWAYAT_I }, '', hashDari(S.view, S.params)); } catch (e) { }
}
function riwayatGanti() { if (window.__TANPA_HASH) return; try { history.replaceState({ i: RIWAYAT_I }, '', hashDari(S.view, S.params)); } catch (e) { } }
function pasangRiwayat() {
  if (window.__TANPA_HASH) return;
  try { history.replaceState({ i: 0 }, '', hashDari(S.view, S.params)); } catch (e) { }
  window.addEventListener('popstate', e => {
    const i = (e.state && e.state.i) || 0;
    while ($('#modals').children.length) tutupModal();
    if (i < RIWAYAT_I) { RIWAYAT_I = i; kembali(); }
    else { RIWAYAT_I = i; const h = bacaHash(); if (h) go(h[0], h[1], { noHist: true }); }
  });
}
function render(name) {
  name = name || S.view;
  const v = VIEWS[name]; if (!v) return;
  const s = seksi(name);
  try { s.innerHTML = v.render(S.params || {}) || ''; if (v.after) v.after(s, S.params || {}); }
  catch (e) { console.error(e); s.innerHTML = `<div class="card pad empty"><div class="ico">${ic('alert', 'lg')}</div><h3>Tampilan gagal dimuat</h3><p>${esc(e.message)}</p></div>`; }
}
/** Render ulang tampilan aktif tanpa kehilangan posisi gulir (dipanggil setelah data berubah). */
function rerender(paksa) {
  const v = VIEWS[S.view];
  renderChrome();
  if (!v) return;
  const live = typeof v.live === 'function' ? v.live() : v.live;
  if (live === false && !paksa) return;
  const y = window.scrollY;
  const ae = document.activeElement, aid = ae && ae.id, sel = ae && ae.selectionStart;
  render();
  window.scrollTo(0, y);
  if (aid) { const el = document.getElementById(aid); if (el) { el.focus(); try { if (sel != null) el.setSelectionRange(sel, sel); } catch (e) { } } }
}
function kembali() { const h = S.hist.pop(); if (h) go(h[0], h[1], { noHist: true }); else go(landing(), {}, { noHist: true }); }
/* Tombol "kembali" di dalam app memakai riwayat browser agar sinkron dengan tombol Kembali HP. */
function kembaliApp() { if (RIWAYAT_I > 0 && S.hist.length) history.back(); else kembali(); }
function renderChrome() {
  const area = !S.user ? 'pub' : S.user.peran === 'member' ? 'mem' : 'adm';
  document.body.className = 'shell-' + area;
  const c = CHROME[area] ? CHROME[area]() : {};
  const set = (id, html) => { const el = document.getElementById(id); if (el && el._h !== html) { el.innerHTML = html || ''; el._h = html; } };
  set('rail', c.rail); set('side', c.side); set('topbar', c.top); set('bnav', c.bnav);
}
function tutupNavMobile() { const s = $('#side'); if (s) s.classList.remove('buka'); $('#scrim').classList.remove('on'); }

/* ---------- Delegasi event (satu listener untuk seluruh app) ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (!t || t.disabled) return;
  if (t.tagName === 'TR' && e.target.closest('td[data-stop], a, input, label')) return;   // klik checkbox/tautan di baris tabel
  const fn = ACT[t.dataset.act];
  if (fn) { e.preventDefault(); fn(t, e); }
});
document.addEventListener('input', e => { const t = e.target.closest('[data-in]'); if (t && INP[t.dataset.in]) INP[t.dataset.in](t, e); });
document.addEventListener('change', e => { const t = e.target.closest('[data-chg]'); if (t && CHG[t.dataset.chg]) CHG[t.dataset.chg](t, e); });
document.addEventListener('submit', e => { const f = e.target.closest('form[data-sub]'); if (f) { e.preventDefault(); SUB[f.dataset.sub] && SUB[f.dataset.sub](f, e); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('#modals').children.length) tutupModal(); else tutupNavMobile(); }
  if (e.key === 'Enter' && e.target.matches('[data-enter]')) { const fn = ACT[e.target.dataset.enter]; if (fn) { e.preventDefault(); fn(e.target, e); } }
});
$('#scrim').addEventListener('click', tutupNavMobile);
ACT.go = t => go(t.dataset.v, t.dataset.p ? JSON.parse(t.dataset.p) : {});
ACT.kembali = () => kembaliApp();
ACT.tutupModal = t => tutupModal(t.closest('.modal-bg'));
ACT.navMobile = () => { $('#side').classList.add('buka'); $('#scrim').classList.add('on'); };
ACT.tema = () => {
  const gelap = !temaGelap();
  document.documentElement.setAttribute('data-theme', gelap ? 'dark' : 'light');
  LS.set('pk_theme', gelap ? 'dark' : 'light');
  rerender(true);
};
ACT.acc = t => t.closest('.acc').classList.toggle('open');
ACT.salinTeks = t => salinKeClipboard(t.dataset.teks, t.dataset.pesan || 'Disalin');
ACT.scrollKiri = t => { const c = document.getElementById(t.dataset.target); if (c) c.scrollBy({ left: -c.clientWidth * .8, behavior: 'smooth' }); };
ACT.scrollKanan = t => { const c = document.getElementById(t.dataset.target); if (c) c.scrollBy({ left: c.clientWidth * .8, behavior: 'smooth' }); };
function salinKeClipboard(teks, pesan) {
  const ok = () => toast(pesan || 'Disalin ke clipboard');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(teks).then(ok).catch(() => salinLama(teks, ok));
  else salinLama(teks, ok);
}
function salinLama(teks, ok) { const ta = document.createElement('textarea'); ta.value = teks; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Tidak bisa menyalin otomatis', 'err'); } ta.remove(); }
function formObj(f) {
  const o = {};
  $$('[name]', f).forEach(el => {
    if (el.type === 'checkbox') o[el.name] = el.checked;
    else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
    else if (el.type !== 'file') o[el.name] = el.value.trim();
  });
  return o;
}
function tombolMuat(btn, on, teks) {
  if (!btn) return;
  if (on) { btn._h = btn.innerHTML; btn.classList.add('loading'); btn.innerHTML = `<span class="spin"></span>${esc(teks || 'Memproses…')}`; }
  else { btn.classList.remove('loading'); if (btn._h) btn.innerHTML = btn._h; }
}

/* ---------- PWA native (gas-pwa-github): service worker + tombol Pasang Aplikasi ---------- */
let PROMPT_PASANG = null;
function initPWA() {
  S.pwa.standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  S.pwa.ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  S.pwa.canInstall = !S.pwa.standalone && S.pwa.ios;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); PROMPT_PASANG = e; S.pwa.canInstall = true; renderChrome(); if (VIEWS[S.view] && VIEWS[S.view].pwa) rerender(); });
  window.addEventListener('appinstalled', () => { PROMPT_PASANG = null; S.pwa.canInstall = false; S.pwa.standalone = true; toast('Aplikasi terpasang di layar utama', 'ok'); rerender(); });
  if (!window.__TANPA_SW && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing; if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Versi baru tersedia — muat ulang untuk memakai.', 'info', { ms: 8000, undo: () => location.reload(), undoLabel: 'Muat ulang' }); });
      });
    }).catch(() => { }));
  }
}
async function pasangApp() {
  if (PROMPT_PASANG) {
    PROMPT_PASANG.prompt();
    const pilih = await PROMPT_PASANG.userChoice.catch(() => ({}));
    if (pilih && pilih.outcome === 'accepted') S.pwa.canInstall = false;
    PROMPT_PASANG = null; rerender(); return;
  }
  const url = location.origin + location.pathname;
  modal({
    title: 'Pasang aplikasi di HP', body: `<div class="col g12">
      <p>Pasang ${esc(S.app.NAMA_PORTAL || 'PortalKelas')} di layar utama agar terbuka layar penuh seperti aplikasi, lebih cepat, dan tetap tampil saat sinyal lemah.</p>
      <div class="rek"><div class="trunc"><div class="xs muted">Alamat aplikasi</div><b class="trunc">${esc(url)}</b></div><button class="btn soft sm" data-act="salinTeks" data-teks="${esc(url)}">${ic('copy', 'sm')}Salin</button></div>
      <div class="card pad-s"><b>Android (Chrome)</b><ol class="small" style="margin:6px 0 0;padding-left:18px"><li>Buka alamat di atas di Chrome.</li><li>Menu ⋮ › <b>Instal aplikasi</b> / <b>Tambahkan ke layar utama</b>.</li></ol></div>
      <div class="card pad-s"><b>iPhone (Safari)</b><ol class="small" style="margin:6px 0 0;padding-left:18px"><li>Buka alamat di atas di Safari.</li><li>Ketuk ikon <b>Bagikan</b> › <b>Tambah ke Layar Utama</b>.</li></ol></div></div>`
  });
}
ACT.pasangApp = () => pasangApp();
