/* ==========================================================================
   INISIALISASI — tampilan pertama dari cache lokal (< 100 ms), server menyusul
   Urutan:
   1. index.html sudah menembakkan POST bootstrap SEBELUM file JS selesai dimuat (window.__BOOTP).
   2. Token lokal didekode tanpa server → cache localStorage dirender langsung (SWR).
   3. Hasil bootstrap tiba → data disegarkan diam-diam (tidak menimpa perubahan yang baru dikirim).
   ========================================================================== */
function layarSetup(judul, pesan, langkah) {
  const sk = $('#boot-sk'); if (sk) sk.remove();
  $$('.view.on').forEach(x => x.classList.remove('on'));
  const s = seksi('setup'); s.classList.add('on');
  s.innerHTML = `<div class="setup-box card pad-l col g16">
    <div class="row g12">${brandMark()}<div><h2>${esc(judul)}</h2><p class="small muted">${esc(pesan)}</p></div></div>
    <ol class="small" style="margin:0;padding-left:18px;line-height:1.8">${langkah.map(l => `<li>${l}</li>`).join('')}</ol>
    <button class="btn sec" style="align-self:flex-start" onclick="location.reload()">${ic('refresh', 'sm')}Muat ulang</button></div>`;
}
const LANGKAH_SETUP = ['Buka editor Apps Script proyek backend.', 'Pilih fungsi <code class="k">setupAppEnvironment</code> lalu klik <b>Jalankan</b> dan izinkan akses.', 'Catat email & sandi Superadmin di log eksekusi.', 'Terapkan → Kelola deployment → ✏️ Edit → <b>Versi baru</b>, lalu muat ulang halaman ini.'];
const LANGKAH_KONFIG = ['Deploy Apps Script sebagai <b>Aplikasi web</b> (Jalankan sebagai: Saya, Akses: Siapa saja) dan salin URL yang berakhiran <code class="k">/exec</code>.', 'Buka file <code class="k">js/config.js</code> di repository GitHub, isi <code class="k">GAS_URL</code> dengan URL tersebut.', 'Simpan & push, tunggu 1–2 menit, lalu muat ulang (Ctrl+Shift+R).'];

/** Terapkan hasil bootstrap (dari boot awal maupun penyegaran latar). */
function terapkanBoot(r, mulai, tokAwal, opt) {
  S.memuat = false; S.bootSelesai = Date.now();
  S.app = r.app || S.app; LS.set('pk_app', S.app);
  if (r.katalog) { S.katalog = r.katalog; LS.set('pk_katalog', r.katalog); }
  if (tokAwal !== S.token) return;                        // pengguna login/keluar saat permintaan berjalan
  if (r.sesiHabis) { if (S.user) sesiHabis(); else setSesi(null, null); rerender(); return; }
  if (!r.user) { rerender(); return; }
  const ganti = !S.user || S.user.id !== r.user.id || S.user.peran !== r.user.peran;
  S.user = Object.assign(S.user || {}, r.user);
  if (r.token) setSesi(r.token, S.user);
  if (!(S.mutasi > 0) && !(S.mutasiT > mulai)) {          // jangan timpa perubahan optimistik yang baru dikirim
    if (r.user.peran === 'member') S.M = r.boot; else S.A = r.boot;
    simpanCache();
  }
  S.sinkron = Date.now();
  if (ganti) go(landing(), {}, { noHist: true }); else rerender();
  if (r.user.wajibGanti && opt && opt.awal) setTimeout(() => modalSandi(true), 600);
}

let SEGAR_JALAN = false;
function segarkan(opt) {
  opt = opt || {};
  if (SEGAR_JALAN) return Promise.resolve();
  SEGAR_JALAN = true;
  const mulai = Date.now(), tokAwal = S.token;
  // Boot awal memakai permintaan yang sudah ditembakkan index.html (hemat 1 eksekusi & ±1 detik)
  let p;
  if (opt.awal && window.__BOOTP && window.__BOOT_TOK === (S.token || '')) {
    const t0 = performance.now();
    p = window.__BOOTP.then(r => {
      if (!r) throw new Error('awal-gagal');
      Perf.catat('bootstrap (awal)', Math.round(performance.now() - t0 + (window.__BOOT_T0 ? t0 - window.__BOOT_T0 : 0)), r.ms, false);
      if (!r.success) { if (r.code === 'SESI_HABIS') sesiHabis(); throw new Error(r.message || 'Gagal memuat data.'); }
      return r.data;
    }).catch(e => e.message === 'awal-gagal' ? api('bootstrap', S.token || '') : Promise.reject(e));
  } else p = api('bootstrap', S.token || '');
  window.__BOOTP = null;
  return p.then(r => { SEGAR_JALAN = false; terapkanBoot(r, mulai, tokAwal, opt); })
    .catch(e => {
      SEGAR_JALAN = false; S.memuat = false; S.bootSelesai = Date.now();
      if (/belum di-setup/i.test(e.message)) return layarSetup('Database belum siap', 'Backend Apps Script belum di-setup.', LANGKAH_SETUP);
      if (opt.awal && !(S.katalog && S.katalog.length) && !(S.M || S.A)) { rerender(); toast(e.message, 'err', { ms: 8000 }); }
    });
}

/** Penanda aktivitas pengguna untuk polling adaptif (gas-scale-turbo 4.8). */
const Activity = {
  at: Date.now(), last: {},
  init() { ['pointerdown', 'keydown', 'wheel', 'touchstart', 'focus'].forEach(ev => addEventListener(ev, () => { this.at = Date.now(); }, { passive: true })); },
  idle() { return Date.now() - this.at > 120000; },
  due(key, aktifMs, idleMs) {
    if (document.visibilityState !== 'visible') return false;
    if (Date.now() - (this.last[key] || 0) < (this.idle() ? idleMs : aktifMs) - 500) return false;
    this.last[key] = Date.now(); return true;
  }
};

function mulaiApp() {
  if (!KONFIG_OK) return layarSetup('Konfigurasi belum lengkap', 'Alamat backend (GAS_URL) belum diisi di js/config.js.', LANGKAH_KONFIG);
  S.memuat = !(S.katalog && S.katalog.length);
  // 1) Sesi dari token lokal + cache data → render instan
  const p = S.token && infoToken(S.token);
  if (p) {
    S.user = { id: p.u, peran: p.r, nama: p.n, email: p.e, wajibGanti: !!p.w };
    const c = LS.get(kunciCache(), null);
    if (S.user.peran === 'member') S.M = c; else S.A = c;
  } else if (S.token) setSesi(null, null);
  // 2) Tujuan awal: tautan berhenti langganan > tautan #tampilan > tampilan terakhir > beranda peran
  const q = new URLSearchParams(location.search);
  const unsub = q.get('unsub');
  if (unsub) {
    try { history.replaceState(null, '', location.pathname); } catch (e) { }
    go('berhenti', { tok: unsub }, { noHist: true });
  } else {
    const h = bacaHash();
    const last = LS.get('pk_view_' + (S.user ? S.user.id : 'pub'), null);
    const boleh = x => x && VIEWS[x[0]] && (S.user ? VIEWS[x[0]].area !== 'pub' || x[0] === 'berhenti' : ['pub', 'any'].indexOf(VIEWS[x[0]].area) > -1 && x[0] !== 'login');
    const tuju = boleh(h) ? h : boleh(last) ? last : [landing(), {}];
    go(tuju[0], tuju[1] || {}, { noHist: true });
  }
  pasangRiwayat();
  initPWA();
  Activity.init();
  segarkan({ awal: true });
}

/* Penyegaran latar adaptif: admin tiap 2 mnt (aktif) / 10 mnt (diam); member saat kembali ke tab > 5 mnt. */
setInterval(() => {
  if (!S.user || S.user.peran === 'member' || $('#modals').children.length || document.visibilityState !== 'visible') return;
  if (Date.now() - (S.sinkron || 0) >= (Activity.idle() ? 600000 : 120000)) segarkan();
}, 15000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !S.user) return;
  const batas = S.user.peran === 'member' ? 300000 : 60000;
  if (Date.now() - (S.sinkron || 0) > batas) segarkan();
});
window.addEventListener('online', () => { toast('Kembali online', 'ok'); segarkan(); });
window.addEventListener('offline', () => toast('Koneksi terputus — tampilan tetap bisa dibuka, perubahan dikirim saat online.', 'info', { ms: 5000 }));
window.addEventListener('error', e => { if (e && e.message && !/ResizeObserver|Script error/.test(e.message)) console.error('[PortalKelas]', e.message); });

mulaiApp();
