/* ==========================================================================
   DASHBOARD ADMIN (1/3): navigasi, ringkasan, produk, kurikulum & materi
   ========================================================================== */
const SA = () => S.user && S.user.peran === 'superadmin';
const prodMap = () => { const o = {}; ((S.A && S.A.produk) || []).forEach(p => { o[p.ID_Produk] = p; }); return o; };
const memMap = () => { const o = {}; ((S.A && S.A.member) || []).forEach(m => { o[m.id] = m; }); return o; };
function upsertArr(arr, rows, key) { rows.forEach(r => { const i = arr.findIndex(x => x[key] === r[key]); if (i > -1) arr[i] = Object.assign({}, arr[i], r); else arr.push(r); }); }
function pendingVerif() { return ((S.A && S.A.transaksi) || []).filter(t => t.status === 'Menunggu' && t.bukti).length; }
const MENU_ADM = [
  ['Utama', [['a-ringkasan', 'layout', 'Ringkasan']]],
  ['Katalog', [['a-produk', 'video', 'Produk Kursus', 1], ['a-kurikulum', 'book', 'Kurikulum & Materi', 1]]],
  ['Pelanggan', [['a-member', 'users', 'Member & CRM'], ['a-transaksi', 'receipt', 'Verifikasi Transaksi']]],
  ['Komunikasi', [['a-notif', 'send', 'Notifikasi Otomatis'], ['a-broadcast', 'megaphone', 'Broadcast Kampanye', 1]]],
  ['Analitik', [['a-laporan', 'pie', 'Laporan & Analitik']]],
  ['Sistem', [['a-pengaturan', 'settings', 'Pengaturan Sistem', 1]]]
];
CHROME.adm = () => {
  const v = S.view, pv = pendingVerif(), sa = SA();
  const nav = MENU_ADM.map(g => { const it = g[1].filter(x => sa || !x[3]); return it.length ? `<div class="side-sec">${g[0]}</div>` + it.map(x => `<button class="side-link ${v === x[0] ? 'on' : ''}" data-act="go" data-v="${x[0]}">${ic(x[1], 'sm')}<span>${x[2]}</span>${x[0] === 'a-transaksi' && pv ? `<span class="cnt">${pv}</span>` : ''}</button>`).join('') : ''; }).join('');
  const gelap = temaGelap();
  return {
    side: `<div class="side-head">${brandMark('sm')}<div style="min-width:0"><b class="trunc" style="display:block">${esc(S.app.NAMA_PORTAL || 'PortalKelas')}</b><span class="xs muted">${esc(S.app.NAMA_ALT || 'LMS')} Admin</span></div></div>
      <div class="side-status"><span class="row g4"><span style="width:8px;height:8px;border-radius:50%;background:var(--ok)"></span>${S.A ? 'Tersinkron ' + relatif(S.sinkron || S.A.t) : 'Memuat…'}</span><span class="muted">v${esc(S.app.APP_VERSION || '1')}</span></div>
      <nav class="side-nav">${nav}</nav>
      <div class="side-foot"><div class="side-user">${avatar(S.user.nama, 'sm')}<div class="grow" style="min-width:0"><b class="small trunc" style="display:block">${esc(S.user.nama)}</b><span class="xs muted">${sa ? 'Superadmin' : 'Staf'}</span></div><button class="btn ghost icon xs" data-act="keluar" aria-label="Keluar" title="Keluar">${ic('logout', 'sm')}</button></div></div>`,
    top: `<div class="top-in"><button class="icon-btn hide-d" data-act="navMobile" aria-label="Buka menu">${ic('menu')}</button>
      <div class="search" style="max-width:420px"><span class="sr">Cari</span>${ic('search')}<input id="cari-adm" type="search" autocomplete="off" placeholder="Cari member, order, kelas…" data-in="cariAdmin"><div id="cari-pop"></div></div>
      <span class="grow hide-m"></span>
      ${pv ? `<button class="chip hide-m" style="background:var(--warn-bg);color:var(--warn-t);border-color:transparent" data-act="go" data-v="a-transaksi">${ic('clock', 'sm')}${pv} Perlu Verifikasi</button>` : ''}
      <button class="icon-btn hide-m" data-act="tema" aria-label="Ganti tema">${ic(gelap ? 'sun' : 'moon')}</button>
      <button class="icon-btn" data-act="segarkanAdmin" aria-label="Segarkan data" title="Segarkan data">${ic('refresh')}</button>
      <button class="user-pill hide-m" data-act="gantiSandi" title="Ganti sandi">${avatar(S.user.nama, 'sm')}<span style="text-align:left"><div class="nm">${esc(S.user.nama)}</div><div class="rl">${sa ? 'Superadmin' : 'Staf'}</div></span></button></div>`,
    bnav: [['a-ringkasan', 'layout', 'Ringkasan'], ['a-transaksi', 'receipt', 'Transaksi'], ['a-member', 'users', 'Member'], ['a-laporan', 'pie', 'Laporan']].map(x => `<button class="bnav-btn ${v === x[0] ? 'on' : ''}" data-act="go" data-v="${x[0]}">${ic(x[1])}${x[2]}${x[0] === 'a-transaksi' && pv ? `<span class="cnt">${pv}</span>` : ''}</button>`).join('') + `<button class="bnav-btn" data-act="navMobile">${ic('menu')}Menu</button>`
  };
};
/* --- Pencarian global admin (lokal, instan) --- */
INP.cariAdmin = debounce(t => {
  const q = t.value.trim(), pop = $('#cari-pop');
  if (!pop) return;
  if (q.length < 2 || !S.A) { pop.innerHTML = ''; return; }
  const m = S.A.member.filter(x => cari(x.nama + ' ' + x.email + ' ' + x.wa, q)).slice(0, 5);
  const o = S.A.transaksi.filter(x => cari(x.id + ' ' + x.namaProduk, q)).slice(0, 4);
  const p = S.A.produk.filter(x => cari(x.Nama + ' ' + x.Kategori, q)).slice(0, 3);
  pop.innerHTML = (m.length + o.length + p.length) ? `<div class="search-pop">${m.map(x => `<button data-act="bukaMember" data-id="${x.id}">${avatar(x.nama, 'xs')}<span class="grow trunc"><b>${esc(x.nama)}</b> <span class="muted xs">${esc(x.email)}</span></span><span class="xs muted">Member</span></button>`).join('')}${o.map(x => `<button data-act="bukaTrx" data-id="${x.id}"><span class="ftype ft-Video" style="width:26px;height:26px">${ic('receipt', 'xs')}</span><span class="grow trunc"><b>${esc(x.id)}</b> <span class="muted xs">${esc(x.namaProduk)}</span></span>${pillTrx(x.status)}</button>`).join('')}${p.map(x => `<button data-act="editProduk" data-id="${x.ID_Produk}"><span class="ftype ft-PDF" style="width:26px;height:26px">${ic('video', 'xs')}</span><span class="grow trunc"><b>${esc(x.Nama)}</b></span><span class="xs muted">Kelas</span></button>`).join('')}</div>` : `<div class="search-pop"><div class="small muted" style="padding:10px">Tidak ada hasil untuk “${esc(q)}”.</div></div>`;
}, 120);
document.addEventListener('click', e => { if (!e.target.closest('.search')) { const p = $('#cari-pop'); if (p) p.innerHTML = ''; } });
ACT.bukaTrx = t => { S.ui.trxSel = t.dataset.id; S.ui.trxStatus = ''; go('a-transaksi'); };
ACT.segarkanAdmin = t => {
  if (t) t.classList.add('loading');
  return api('dataAdmin', S.token, { segar: true }).then(d => { S.A = d; S.sinkron = Date.now(); simpanCache(); rerender(); toast('Data diperbarui'); })
    .catch(e => toast(e.message, 'err')).finally(() => { if (t) t.classList.remove('loading'); });
};

/* ---------------- Ringkasan ---------------- */
function kpi(o) {
  return `<div class="card kpi ${o.act ? 'klik' : ''}" ${o.act ? `data-act="go" data-v="${o.act}"` : ''}><i class="glow" style="background:${o.glow}"></i><div class="row between top"><div><div class="lab">${o.lab}</div><div class="val">${o.val}</div></div><span class="ico ${o.cls}">${ic(o.ikon)}</span></div><div class="sub">${o.sub || ''}</div></div>`;
}
function bulanKey(iso) { return iso ? String(new Date(new Date(iso).getTime() + 7 * 36e5).toISOString()).slice(0, 7) : ''; }
function statAdmin() {
  const A = S.A, now = Date.now(), bln = bulanKey(new Date().toISOString());
  const d = new Date(); d.setMonth(d.getMonth() - 1); const blnLalu = bulanKey(d.toISOString());
  const lunas = A.transaksi.filter(t => t.status === 'Terverifikasi');
  const pend = m => lunas.filter(t => bulanKey(t.diverifikasi || t.dibuat) === m).reduce((a, t) => a + t.nominal, 0);
  const aksesAktif = A.akses.filter(a => a.status === 'Aktif' && (!a.berakhir || new Date(a.berakhir) > now));
  const memAktif = new Set(aksesAktif.map(a => a.member));
  const menunggu = A.transaksi.filter(t => t.status === 'Menunggu');
  const prog = A.progres || [];
  const rata = prog.length ? Math.round(prog.reduce((a, r) => a + r.persen, 0) / prog.length) : 0;
  return { lunas, pendIni: pend(bln), pendLalu: pend(blnLalu), memAktif, menunggu, rata, aksesAktif, prog };
}
VIEWS['a-ringkasan'] = {
  area: 'adm', title: 'Ringkasan',
  render() {
    if (!S.A) return `<div class="kpi4">${skeleton(4, 120)}</div>`;
    const s = statAdmin(), A = S.A;
    const naik = s.pendLalu ? Math.round((s.pendIni - s.pendLalu) / s.pendLalu * 100) : (s.pendIni ? 100 : 0);
    const bukti = s.menunggu.filter(t => t.bukti);
    const fun = funnel();
    const tl = A.transaksi.slice().sort((a, b) => new Date(b.dibuat) - new Date(a.dibuat)).slice(0, 6);
    const q = A.antreanRingkas || {};
    return `<div class="page-h"><div><div class="crumb">Admin ${ic('chevR', 'xs')}<b>Ringkasan</b></div><h1>Halo, ${esc(S.user.nama.split(' ')[0])} 👋</h1><p>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
      <div class="row g8"><button class="btn sec" data-act="segarkanAdmin">${ic('refresh', 'sm')}Segarkan</button>${SA() ? `<button class="btn pri" data-act="editProduk">${ic('plus', 'sm')}Kelas Baru</button>` : ''}</div></div>
    <div class="kpi4 mb16">
      ${kpi({ lab: 'Pendapatan Bulan Ini', val: rp(s.pendIni).replace('Rp ', 'Rp&nbsp;'), ikon: 'wallet', cls: 'bg-lav', glow: 'rgba(108,60,233,.25)', sub: `<span class="muted">vs bulan lalu</span><span class="badge ${naik >= 0 ? 'bg-ok' : 'bg-err'}">${naik >= 0 ? '▲' : '▼'} ${Math.abs(naik)}%</span>`, act: 'a-laporan' })}
      ${kpi({ lab: 'Member Aktif', val: angka(s.memAktif.size), ikon: 'users', cls: 'bg-ok', glow: 'rgba(16,185,129,.25)', sub: `<span class="muted">${angka(A.member.length)} kontak total</span>`, act: 'a-member' })}
      ${kpi({ lab: 'Menunggu Verifikasi', val: bukti.length + '<small class="c-warn">transaksi</small>', ikon: 'clock', cls: 'bg-warn', glow: 'rgba(245,158,11,.3)', sub: `<span class="b">${rp(bukti.reduce((a, t) => a + t.nominal, 0))}</span><span class="badge bg-warn">${s.menunggu.length - bukti.length} belum unggah</span>`, act: 'a-transaksi' })}
      ${kpi({ lab: 'Rata-rata Progres', val: s.rata + '<small>%</small>', ikon: 'target', cls: 'bg-info', glow: 'rgba(59,130,246,.22)', sub: `<span class="muted">${s.prog.filter(r => r.persen === 100).length} kelas dituntaskan</span>`, act: 'a-laporan' })}
    </div>
    <div class="adm-grid2 w21 mb16"><div class="card chart-card"><div class="card-h"><h3>Pendapatan 12 bulan</h3><button class="btn ghost sm" data-act="go" data-v="a-laporan">Detail ${ic('arrowR', 'xs')}</button></div><div style="height:240px"><canvas id="ch-pend" aria-label="Grafik pendapatan per bulan"></canvas></div></div>
      <div class="insight"><div class="row g8">${ic('sparkle')}<b>Insight Otomatis</b></div><ul>${insight(s).map(x => `<li>${x}</li>`).join('')}</ul></div></div>
    <div class="adm-grid2"><div class="card pad"><div class="card-h"><h3>Funnel konversi</h3><span class="xs muted">semua waktu</span></div>${fun.map(f => `<div class="funnel-row"><span class="small b">${f[0]}</span><div><div class="fb" style="width:${fun[0][1] ? Math.max(2, f[1] / fun[0][1] * 100) : 0}%"></div></div><span class="small mono right">${angka(f[1])}</span></div>`).join('')}</div>
      <div class="card pad"><div class="card-h"><h3>Transaksi terbaru</h3><button class="btn ghost sm" data-act="go" data-v="a-transaksi">Semua ${ic('arrowR', 'xs')}</button></div>
        ${tl.map(t => `<button class="dl-row" style="width:100%;text-align:left" data-act="bukaTrx" data-id="${t.id}">${avatar((memMap()[t.member] || {}).nama, 'sm soft')}<div class="grow" style="min-width:0"><b class="small trunc" style="display:block">${esc((memMap()[t.member] || {}).nama || '-')}</b><div class="xs muted trunc">${esc(t.namaProduk)} · ${relatif(t.dibuat)}</div></div><div class="right"><b class="small">${rp(t.nominal)}</b><div>${pillTrx(t.status)}</div></div></button>`).join('') || kosong('receipt', 'Belum ada transaksi')}
        <div class="row between small muted mt12" style="padding:0 4px"><span>Antrean notifikasi</span><span class="row g8"><span class="badge bg-warn">${q.Menunggu || 0} menunggu</span><span class="badge bg-ok">${q.Terkirim || 0} terkirim</span>${q.Gagal ? `<span class="badge bg-err">${q.Gagal} gagal</span>` : ''}</span></div></div></div>`;
  },
  after() { grafikPendapatan('ch-pend', 12); }
};
function funnel() {
  const A = S.A, now = Date.now();
  const order = new Set(A.transaksi.map(t => t.member));
  const bayar = new Set(A.transaksi.filter(t => t.status === 'Terverifikasi').map(t => t.member));
  const aktif = new Set(A.akses.filter(a => a.status === 'Aktif' && (!a.berakhir || new Date(a.berakhir) > now)).map(a => a.member));
  const tuntas = new Set((A.progres || []).filter(r => r.persen === 100).map(r => r.m));
  return [['Leads', A.member.length], ['Order', order.size], ['Bayar', bayar.size], ['Aktif', aktif.size], ['Tuntas', tuntas.size]];
}
function insight(s) {
  const A = S.A, out = [], now = Date.now();
  const naik = s.pendLalu ? Math.round((s.pendIni - s.pendLalu) / s.pendLalu * 100) : null;
  out.push(naik == null ? `Pendapatan bulan ini <b>${rp(s.pendIni)}</b>.` : `Pendapatan bulan ini <b>${rp(s.pendIni)}</b>, ${naik >= 0 ? 'naik' : 'turun'} <b>${Math.abs(naik)}%</b> dibanding bulan lalu.`);
  const bukti = s.menunggu.filter(t => t.bukti);
  if (bukti.length) { const tua = bukti.reduce((a, t) => Math.min(a, new Date(t.dibuat).getTime()), now); out.push(`<b>${bukti.length} bukti bayar</b> menunggu verifikasi — terlama ${relatif(tua)}. Target SLA aktivasi &lt; 5 menit.`); }
  const exp = A.transaksi.filter(t => (t.status === 'Kedaluwarsa' || (t.status === 'Menunggu' && !t.bukti && new Date(t.batas) < now)) && now - new Date(t.dibuat) < 30 * 864e5);
  if (exp.length) out.push(`<b>${exp.length} abandoned lead</b> dalam 30 hari terakhir. Pertimbangkan broadcast ke label <i>Needs Follow-up</i>.`);
  const non = A.member.filter(m => /Non-Aktif/.test(m.label)).length;
  if (non) out.push(`<b>${non} member aktif</b> tidak belajar &gt; ${S.A.pengaturan && S.A.pengaturan.nilai && S.A.pengaturan.nilai.CRM_NONAKTIF_HARI || 14} hari — nudge otomatis berjalan di H+7/14/30.`);
  const per = {};
  (A.progres || []).forEach(r => { (per[r.p] = per[r.p] || []).push(r.persen); });
  const pm = prodMap(), terendah = Object.keys(per).map(p => [p, per[p].reduce((a, b) => a + b, 0) / per[p].length]).sort((a, b) => a[1] - b[1])[0];
  if (terendah && pm[terendah[0]]) out.push(`Penyelesaian terendah: <b>${esc(pm[terendah[0]].Nama)}</b> (rata-rata ${Math.round(terendah[1])}%). Cek modul awal yang mungkin terlalu berat.`);
  const q = A.antreanRingkas || {};
  if (q.Gagal) out.push(`<b>${q.Gagal} notifikasi gagal</b> terkirim. Buka Notifikasi › Antrean untuk mengulang.`);
  if (!out.length) out.push('Belum cukup data untuk insight. Mulai dengan menerbitkan kelas pertama.');
  return out;
}
function grafikPendapatan(id, n) {
  if (!S.A) return;
  const lab = [], val = [];
  for (let i = n - 1; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const k = bulanKey(d.toISOString()); lab.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })); val.push(S.A.transaksi.filter(t => t.status === 'Terverifikasi' && bulanKey(t.diverifikasi || t.dibuat) === k).reduce((a, t) => a + t.nominal, 0)); }
  gambarChart(id, { type: 'bar', data: { labels: lab, datasets: [{ label: 'Pendapatan', data: val, backgroundColor: '#6C3CE9', borderRadius: 8, maxBarThickness: 34 }] }, options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => rp(c.raw) } } }, scales: { y: { ticks: { callback: v => v >= 1e6 ? (v / 1e6) + 'jt' : v >= 1e3 ? (v / 1e3) + 'rb' : v }, grid: { color: cssVar('--line') } }, x: { grid: { display: false } } } } }).catch(() => { });
}

/* ---------------- Produk kursus ---------------- */
function keKatalog(r) {
  const mods = S.A.kurikulum.filter(m => m.ID_Produk === r.ID_Produk && m.Status !== 'Draf').sort((a, b) => a.Urutan - b.Urutan);
  let jv = 0, tm = 0, jm = 0;
  const modul = mods.map(m => { const mt = S.A.materi.filter(x => x.ID_Modul === m.ID_Modul).sort((a, b) => a.Urutan - b.Urutan); mt.forEach(x => { jm++; if (x.Tipe === 'Video') jv++; tm += Number(x.Durasi_Menit) || 0; }); return { id: m.ID_Modul, judul: m.Judul_Modul, desk: m.Deskripsi, materi: mt.map(x => ({ j: x.Judul, t: x.Tipe, d: Number(x.Durasi_Menit) || 0 })) }; });
  return { id: r.ID_Produk, nama: r.Nama, slug: r.Slug, desk: r.Deskripsi, harga: Number(r.Harga) || 0, coret: Number(r.Harga_Coret) || 0, kategori: r.Kategori || 'Umum', thumb: r.Thumbnail_URL || '', instruktur: r.Instruktur || '', jabatan: r.Jabatan_Instruktur || '', rating: Number(r.Rating) || 0, ulasan: Number(r.Jumlah_Ulasan) || 0, fasilitas: String(r.Fasilitas || '').split(';').map(s => s.trim()).filter(Boolean), unggulan: /^ya$/i.test(r.Unggulan), durasiAkses: Number(r.Durasi_Akses_Hari) || 0, bundling: r.Bundling_ID || '', modul, jmlVideo: jv, jmlMateri: jm, totalMenit: tm };
}
function sinkronKatalog() { if (!S.A) return; S.katalog = S.A.produk.filter(p => p.Status === 'Publik').map(keKatalog); LS.set('pk_katalog', S.katalog); }
VIEWS['a-produk'] = {
  area: 'adm', title: 'Produk Kursus', roles: ['superadmin'],
  render() {
    if (!S.A) return skeleton(3, 200);
    const f = S.ui.pStatus || '', q = S.ui.pQ || '';
    const sales = {}, mem = {};
    S.A.transaksi.forEach(t => { if (t.status === 'Terverifikasi') sales[t.produk] = (sales[t.produk] || 0) + t.nominal; });
    S.A.akses.forEach(a => { if (a.status === 'Aktif') mem[a.produk] = (mem[a.produk] || 0) + 1; });
    const L = S.A.produk.filter(p => (!f || p.Status === f) && cari(p.Nama + ' ' + p.Kategori + ' ' + p.Instruktur, q));
    const cnt = s => S.A.produk.filter(p => !s || p.Status === s).length;
    return `<div class="page-h"><div><div class="crumb">Katalog ${ic('chevR', 'xs')}<b>Produk Kursus</b></div><h1>Produk Kursus</h1><p>Kelola kelas, harga, status publikasi, dan bundling.</p></div><button class="btn pri" data-act="editProduk">${ic('plus', 'sm')}Tambah Kelas</button></div>
      <div class="toolbar mb16"><div class="search" style="max-width:340px"><span class="sr">Cari kelas</span>${ic('search')}<input id="cari-prod" type="search" placeholder="Cari kelas…" value="${esc(q)}" data-in="cariProduk"></div>
        <div class="seg">${['', 'Publik', 'Privat', 'Draf'].map(s => `<button class="${f === s ? 'on' : ''}" data-act="pStatus" data-s="${s}">${s || 'Semua'} (${cnt(s)})</button>`).join('')}</div></div>
      ${L.length ? `<div class="course-grid">${L.map(p => { const k = keKatalog(p); return `<article class="card course">${thumb(k, { tl: `<span class="pill ${p.Status === 'Publik' ? 'bg-ok' : p.Status === 'Draf' ? 'bg-grey' : 'bg-warn'}">${esc(p.Status)}</span>`, tr: p.Unggulan === 'Ya' ? `<span class="glass xs b">★ Unggulan</span>` : '' })}
        <div class="meta">${badgeKat(p.Kategori)}${bintang(p.Rating)}</div><h3 class="clamp2">${esc(p.Nama)}</h3>
        <div class="row wrap g8 xs muted"><span>${k.modul.length} modul</span>·<span>${k.jmlMateri} materi</span>·<span>${Number(p.Durasi_Akses_Hari) ? p.Durasi_Akses_Hari + ' hari' : 'selamanya'}</span></div>
        <div class="foot"><div class="row between"><div><span class="price">${Number(p.Harga) ? rp(p.Harga) : 'Gratis'}</span>${Number(p.Harga_Coret) > Number(p.Harga) ? ` <span class="coret">${rp(p.Harga_Coret)}</span>` : ''}</div></div>
          <div class="row between xs muted"><span>${ic('users', 'xs')} ${mem[p.ID_Produk] || 0} member aktif</span><span>${rp(sales[p.ID_Produk] || 0)}</span></div>
          <div class="row g4"><button class="btn soft sm grow" data-act="editProduk" data-id="${p.ID_Produk}">${ic('edit', 'sm')}Edit</button><button class="btn sec sm" data-act="kurikulumDari" data-id="${p.ID_Produk}">${ic('layers', 'sm')}Kurikulum</button><button class="btn ghost icon sm" data-act="menuProduk" data-id="${p.ID_Produk}" aria-label="Aksi lain">${ic('more', 'sm')}</button></div></div></article>`; }).join('')}</div>` : `<div class="card">${kosong('video', 'Belum ada kelas', '', '<button class="btn pri" data-act="editProduk">Tambah kelas pertama</button>')}</div>`}`;
  }
};
INP.cariProduk = debounce(t => { S.ui.pQ = t.value; rerender(); }, 150);
ACT.pStatus = t => { S.ui.pStatus = t.dataset.s; render(); };
ACT.kurikulumDari = t => { S.ui.kProd = t.dataset.id; go('a-kurikulum'); };
ACT.menuProduk = t => {
  const p = prodMap()[t.dataset.id]; if (!p) return;
  const w = modal({ title: p.Nama, size: 'sm', body: `<div class="col g8"><button class="btn sec block" data-k="dup">${ic('copy', 'sm')}Duplikat kelas</button><button class="btn sec block" data-k="lihat">${ic('eye', 'sm')}Lihat di katalog</button><button class="btn danger block" data-k="hapus">${ic('trash', 'sm')}Hapus kelas</button></div>` });
  w.querySelector('[data-k=dup]').onclick = () => { tutupModal(w); duplikatProduk(p); };
  w.querySelector('[data-k=lihat]').onclick = () => { tutupModal(w); go('detail', { id: p.ID_Produk }); };
  w.querySelector('[data-k=hapus]').onclick = () => { tutupModal(w); hapusBaris('Produk', 'produk', 'ID_Produk', p.ID_Produk, p.Nama); };
};
function duplikatProduk(p) {
  const id = uid('PRD'), baru = Object.assign({}, p, { ID_Produk: id, Nama: p.Nama + ' (Salinan)', Status: 'Draf' });
  delete baru.Dibuat_Pada;
  const mods = S.A.kurikulum.filter(m => m.ID_Produk === p.ID_Produk), petaMod = {};
  const modBaru = mods.map(m => { const nid = uid('MOD'); petaMod[m.ID_Modul] = nid; return Object.assign({}, m, { ID_Modul: nid, ID_Produk: id }); });
  modBaru.forEach(m => { if (m.Prasyarat_ID_Modul) m.Prasyarat_ID_Modul = petaMod[m.Prasyarat_ID_Modul] || ''; });
  const mtrBaru = S.A.materi.filter(x => petaMod[x.ID_Modul]).map(x => Object.assign({}, x, { ID_Materi: uid('MTR'), ID_Modul: petaMod[x.ID_Modul] }));
  optimis({
    ubah: () => { S.A.produk.push(baru); S.A.kurikulum.push(...modBaru); S.A.materi.push(...mtrBaru); },
    kirim: () => api('simpanData', S.token, 'Produk', [baru]).then(() => modBaru.length && api('simpanData', S.token, 'Kurikulum', modBaru)).then(() => mtrBaru.length && api('simpanData', S.token, 'Materi', mtrBaru)),
    sukses: () => { simpanCache(); toast('Kelas diduplikat sebagai Draf'); },
    balik: () => { S.A.produk = S.A.produk.filter(x => x.ID_Produk !== id); S.A.kurikulum = S.A.kurikulum.filter(x => x.ID_Produk !== id); S.A.materi = S.A.materi.filter(x => !mtrBaru.some(y => y.ID_Materi === x.ID_Materi)); },
    pesanGagal: 'Duplikat gagal'
  }).catch(() => { });
}
/** Hapus satu baris master dengan konfirmasi + optimistic. */
function hapusBaris(tabel, kunciA, key, id, nama) {
  konfirmasi(`Hapus <b>${esc(nama)}</b>? Tindakan ini tidak bisa dibatalkan.`, { ok: 'Hapus', danger: true }).then(ya => {
    if (!ya) return;
    const arr = S.A[kunciA], i = arr.findIndex(x => x[key] === id), lama = arr[i];
    const anak = tabel === 'Kurikulum' ? S.A.materi.filter(x => x.ID_Modul === id) : [];
    optimis({
      ubah: () => { arr.splice(i, 1); if (anak.length) S.A.materi = S.A.materi.filter(x => x.ID_Modul !== id); if (tabel === 'Produk' || tabel === 'Kurikulum' || tabel === 'Materi') sinkronKatalog(); },
      kirim: () => api('hapusData', S.token, tabel, [id]),
      sukses: () => { simpanCache(); toast(nama + ' dihapus'); },
      balik: () => { arr.splice(i, 0, lama); if (anak.length) S.A.materi.push(...anak); sinkronKatalog(); },
      pesanGagal: 'Tidak bisa dihapus'
    }).catch(() => { });
  });
}
ACT.editProduk = t => {
  const id = t && t.dataset.id, p = id ? prodMap()[id] : null;
  const v = p || { ID_Produk: uid('PRD'), Status: 'Draf', Durasi_Akses_Hari: 0, Unggulan: 'Tidak' };
  const prodLain = S.A.produk.filter(x => x.ID_Produk !== v.ID_Produk);
  const bund = String(v.Bundling_ID || '').split(/[,;\s]+/).filter(Boolean);
  const w = modal({
    title: p ? 'Edit Kelas' : 'Tambah Kelas', drawer: true,
    body: `<form id="f-prod" class="form-grid two">
      <div class="field span2"><label for="pr-nama">Nama kelas <span class="req">*</span></label><input class="inp" id="pr-nama" name="Nama" required value="${esc(v.Nama || '')}"></div>
      <div class="field"><label for="pr-kat">Kategori</label><input class="inp" id="pr-kat" name="Kategori" list="dl-kat" value="${esc(v.Kategori || '')}" placeholder="Frontend, Design, Marketing…"><datalist id="dl-kat">${[...new Set(S.A.produk.map(x => x.Kategori).filter(Boolean))].map(k => `<option value="${esc(k)}">`).join('')}</datalist></div>
      <div class="field"><label for="pr-status">Status</label><select class="inp" id="pr-status" name="Status">${['Publik', 'Privat', 'Draf'].map(s => `<option ${v.Status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div class="field"><label for="pr-harga">Harga jual (Rp)</label><input class="inp" id="pr-harga" name="Harga" type="number" min="0" step="1000" value="${esc(v.Harga || 0)}"></div>
      <div class="field"><label for="pr-coret">Harga coret (Rp)</label><input class="inp" id="pr-coret" name="Harga_Coret" type="number" min="0" step="1000" value="${esc(v.Harga_Coret || '')}"></div>
      <div class="field"><label for="pr-ins">Instruktur</label><input class="inp" id="pr-ins" name="Instruktur" value="${esc(v.Instruktur || '')}"></div>
      <div class="field"><label for="pr-jab">Jabatan instruktur</label><input class="inp" id="pr-jab" name="Jabatan_Instruktur" value="${esc(v.Jabatan_Instruktur || '')}"></div>
      <div class="field"><label for="pr-durasi">Durasi akses (hari)</label><input class="inp" id="pr-durasi" name="Durasi_Akses_Hari" type="number" min="0" value="${esc(v.Durasi_Akses_Hari || 0)}"><span class="hint">0 = akses selamanya</span></div>
      <div class="field"><label for="pr-rating">Rating & jumlah ulasan</label><div class="row"><input class="inp" id="pr-rating" name="Rating" type="number" step="0.1" min="0" max="5" value="${esc(v.Rating || '')}" placeholder="4.9"><input class="inp" name="Jumlah_Ulasan" type="number" min="0" value="${esc(v.Jumlah_Ulasan || '')}" placeholder="320" aria-label="Jumlah ulasan"></div></div>
      <div class="field span2"><label for="pr-desk">Deskripsi</label><textarea class="inp" id="pr-desk" name="Deskripsi">${esc(v.Deskripsi || '')}</textarea></div>
      <div class="field span2"><label for="pr-fas">Fasilitas (pisahkan dengan titik koma ;)</label><input class="inp" id="pr-fas" name="Fasilitas" value="${esc(v.Fasilitas || '')}" placeholder="Akses selamanya;Sertifikat;Grup diskusi"></div>
      <div class="field span2"><label>Thumbnail</label><div class="row g12"><div style="width:120px;flex:none" id="pr-prev">${thumb({ nama: v.Nama || 'Kelas', kategori: v.Kategori, thumb: v.Thumbnail_URL })}</div><div class="grow col g8"><input class="inp" name="Thumbnail_URL" id="pr-thumb" value="${esc(v.Thumbnail_URL || '')}" placeholder="URL gambar (opsional)"><label class="btn sec sm" style="cursor:pointer;align-self:flex-start">${ic('upload', 'sm')}Unggah gambar<input type="file" accept="image/*" class="sr" data-chg="unggahThumb"></label></div></div></div>
      <div class="field span2"><label>Bundling (kelas yang ikut aktif saat kelas ini dibeli)</label><div class="col g4" style="max-height:140px;overflow:auto">${prodLain.map(x => `<label class="check"><input type="checkbox" name="b_${esc(x.ID_Produk)}" ${bund.indexOf(x.ID_Produk) > -1 ? 'checked' : ''}><span>${esc(x.Nama)}</span></label>`).join('') || '<span class="xs muted">Belum ada kelas lain.</span>'}</div></div>
      <label class="switch span2"><input type="checkbox" name="Unggulan" ${v.Unggulan === 'Ya' ? 'checked' : ''}>Tandai sebagai kelas unggulan</label></form>`,
    foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="simpan">${ic('check', 'sm')}Simpan</button>`
  });
  w.querySelector('[data-k=simpan]').onclick = () => {
    const o = formObj(w.querySelector('#f-prod'));
    if (!o.Nama) return toast('Nama kelas wajib diisi', 'err');
    const row = { ID_Produk: v.ID_Produk, Nama: o.Nama, Kategori: o.Kategori, Status: o.Status, Harga: Number(o.Harga) || 0, Harga_Coret: Number(o.Harga_Coret) || 0, Instruktur: o.Instruktur, Jabatan_Instruktur: o.Jabatan_Instruktur, Durasi_Akses_Hari: Number(o.Durasi_Akses_Hari) || 0, Rating: o.Rating, Jumlah_Ulasan: o.Jumlah_Ulasan, Deskripsi: o.Deskripsi, Fasilitas: o.Fasilitas, Thumbnail_URL: o.Thumbnail_URL, Unggulan: o.Unggulan ? 'Ya' : 'Tidak', Bundling_ID: Object.keys(o).filter(k => k.indexOf('b_') === 0 && o[k]).map(k => k.slice(2)).join(',') };
    const lama = p ? Object.assign({}, p) : null;
    tutupModal(w);
    optimis({
      ubah: () => { upsertArr(S.A.produk, [row], 'ID_Produk'); sinkronKatalog(); },
      kirim: () => api('simpanData', S.token, 'Produk', [row]),
      sukses: r => { upsertArr(S.A.produk, r.rows, 'ID_Produk'); sinkronKatalog(); simpanCache(); toast(p ? 'Kelas diperbarui' : 'Kelas ditambahkan'); },
      balik: () => { if (lama) upsertArr(S.A.produk, [lama], 'ID_Produk'); else S.A.produk = S.A.produk.filter(x => x.ID_Produk !== row.ID_Produk); sinkronKatalog(); },
      pesanGagal: 'Gagal menyimpan kelas'
    }).catch(() => { });
  };
};
CHG.unggahThumb = t => {
  const f = t.files[0]; if (!f) return;
  const lbl = t.closest('label'); tombolMuat(lbl, true, 'Mengunggah…');
  bacaFile(f, { kompres: true, maxPx: 1280, maxMB: 5, tipe: /^image\// }).then(file => api('unggahBerkas', S.token, 'thumbnail', '', { nama: file.nama, mime: file.mime, data: file.data }))
    .then(r => { tombolMuat(lbl, false); const i = $('#pr-thumb'); i.value = r.url; $('#pr-prev').innerHTML = thumb({ nama: ($('#pr-nama') || {}).value, thumb: r.url }); toast('Thumbnail terunggah'); })
    .catch(e => { tombolMuat(lbl, false); toast(e.message, 'err'); });
};

/* ---------------- Kurikulum & materi ---------------- */
VIEWS['a-kurikulum'] = {
  area: 'adm', title: 'Kurikulum & Materi', roles: ['superadmin'],
  render() {
    if (!S.A) return skeleton(4, 80);
    if (!S.A.produk.length) return `<div class="card">${kosong('layers', 'Belum ada kelas', 'Buat kelas terlebih dahulu.', '<button class="btn pri" data-act="editProduk">Tambah kelas</button>')}</div>`;
    const pid = S.ui.kProd && prodMap()[S.ui.kProd] ? S.ui.kProd : S.A.produk[0].ID_Produk;
    S.ui.kProd = pid;
    const p = prodMap()[pid];
    const mods = S.A.kurikulum.filter(m => m.ID_Produk === pid).sort((a, b) => a.Urutan - b.Urutan);
    const totM = S.A.materi.filter(x => mods.some(m => m.ID_Modul === x.ID_Modul));
    return `<div class="page-h"><div><div class="crumb">Katalog ${ic('chevR', 'xs')}<b>Kurikulum & Materi</b></div><h1>Kurikulum & Materi</h1><p>Susun learning path: urutan modul, prasyarat, dan materi multi-format.</p></div>
      <div class="row g8"><select class="inp pill-inp" style="width:auto;max-width:320px" data-chg="pilihProdKur" aria-label="Pilih kelas">${S.A.produk.map(x => `<option value="${x.ID_Produk}" ${x.ID_Produk === pid ? 'selected' : ''}>${esc(x.Nama)}</option>`).join('')}</select><button class="btn pri" data-act="editModul">${ic('plus', 'sm')}Modul</button></div></div>
      <div class="card pad-s row g12 mb16"><div style="width:84px;flex:none">${thumb(keKatalog(p))}</div><div class="grow"><b>${esc(p.Nama)}</b><div class="xs muted">${mods.length} modul · ${totM.length} materi · ${durasi(totM.reduce((a, x) => a + (Number(x.Durasi_Menit) || 0), 0))}</div></div><span class="pill ${p.Status === 'Publik' ? 'bg-ok' : 'bg-grey'}">${esc(p.Status)}</span></div>
      ${mods.length ? mods.map((m, i) => {
        const mt = S.A.materi.filter(x => x.ID_Modul === m.ID_Modul).sort((a, b) => a.Urutan - b.Urutan);
        const pra = mods.find(x => x.ID_Modul === m.Prasyarat_ID_Modul);
        return `<div class="mini-mod"><div class="mini-mod-h"><span class="mod-h"><span class="n">${i + 1}</span></span><div class="grow" style="min-width:180px"><b>${esc(m.Judul_Modul)}</b><div class="xs muted">${pra ? `${ic('lock', 'xs')} Prasyarat: ${esc(pra.Judul_Modul)}` : 'Tanpa prasyarat (langsung terbuka)'}${m.Status === 'Draf' ? ' · <span class="c-warn b">Draf</span>' : ''}</div></div>
          <div class="row g4"><button class="btn ghost icon xs" data-act="geserModul" data-id="${m.ID_Modul}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan">${ic('chevU', 'sm')}</button><button class="btn ghost icon xs" data-act="geserModul" data-id="${m.ID_Modul}" data-d="1" ${i === mods.length - 1 ? 'disabled' : ''} aria-label="Turunkan">${ic('chevD', 'sm')}</button>
          <button class="btn soft xs" data-act="editMateri" data-mod="${m.ID_Modul}">${ic('plus', 'xs')}Materi</button><button class="btn ghost icon xs" data-act="editModul" data-id="${m.ID_Modul}" aria-label="Edit modul">${ic('edit', 'sm')}</button><button class="btn ghost icon xs" data-act="hapusModul" data-id="${m.ID_Modul}" aria-label="Hapus modul">${ic('trash', 'sm')}</button></div></div>
          ${mt.map((x, j) => `<div class="mini-mtr"><span class="ftype ft-${esc(x.Tipe)}" style="width:32px;height:32px">${ic(ikonTipe(x.Tipe), 'sm')}</span><div class="grow" style="min-width:0"><div class="small b trunc">${esc(x.Judul)}</div><div class="xs muted trunc">${esc(x.Tipe)}${x.Durasi_Menit ? ' · ' + x.Durasi_Menit + ' mnt' : ''} · ${x.URL_atau_FileID ? esc(potong(x.URL_atau_FileID, 40)) : '<span class="c-warn">sumber belum diisi</span>'}</div></div>
            <label class="switch xs" title="Wajib untuk membuka modul berikutnya"><input type="checkbox" data-chg="wajibMateri" data-id="${x.ID_Materi}" ${/^ya$/i.test(x.Wajib) ? 'checked' : ''}><span class="hide-m">Wajib</span></label>
            <button class="btn ghost icon xs" data-act="geserMateri" data-id="${x.ID_Materi}" data-d="-1" ${j === 0 ? 'disabled' : ''} aria-label="Naikkan">${ic('chevU', 'sm')}</button><button class="btn ghost icon xs" data-act="geserMateri" data-id="${x.ID_Materi}" data-d="1" ${j === mt.length - 1 ? 'disabled' : ''} aria-label="Turunkan">${ic('chevD', 'sm')}</button>
            <button class="btn ghost icon xs" data-act="editMateri" data-id="${x.ID_Materi}" aria-label="Edit materi">${ic('edit', 'sm')}</button><button class="btn ghost icon xs" data-act="hapusMateri" data-id="${x.ID_Materi}" aria-label="Hapus materi">${ic('trash', 'sm')}</button></div>`).join('') || `<div class="mini-mtr muted small">Belum ada materi. <button class="c-pri b" data-act="editMateri" data-mod="${m.ID_Modul}">Tambah materi</button></div>`}</div>`;
      }).join('') : `<div class="card">${kosong('layers', 'Belum ada modul', 'Modul tersusun berurutan; modul dengan prasyarat terkunci sampai modul sebelumnya selesai.', '<button class="btn pri" data-act="editModul">Tambah modul pertama</button>')}</div>`}`;
  }
};
CHG.pilihProdKur = t => { S.ui.kProd = t.value; render(); };
function simpanMaster(tabel, kunciA, key, rows, lamaRows, pesan) {
  return optimis({
    ubah: () => { upsertArr(S.A[kunciA], rows, key); sinkronKatalog(); },
    kirim: () => api('simpanData', S.token, tabel, rows),
    sukses: r => { upsertArr(S.A[kunciA], r.rows, key); sinkronKatalog(); simpanCache(); if (pesan) toast(pesan); },
    balik: () => { const baru = rows.filter(r => !lamaRows.some(l => l[key] === r[key])).map(r => r[key]); S.A[kunciA] = S.A[kunciA].filter(x => baru.indexOf(x[key]) < 0); upsertArr(S.A[kunciA], lamaRows, key); sinkronKatalog(); },
    pesanGagal: 'Gagal menyimpan'
  }).catch(() => { });
}
ACT.editModul = t => {
  const id = t && t.dataset.id, m = id ? S.A.kurikulum.find(x => x.ID_Modul === id) : null, pid = S.ui.kProd;
  const mods = S.A.kurikulum.filter(x => x.ID_Produk === pid && x.ID_Modul !== id).sort((a, b) => a.Urutan - b.Urutan);
  const v = m || { ID_Modul: uid('MOD'), ID_Produk: pid, Urutan: (mods.length ? Math.max(...mods.map(x => Number(x.Urutan) || 0)) : 0) + 1, Status: 'Publik', Prasyarat_ID_Modul: mods.length ? mods[mods.length - 1].ID_Modul : '' };
  const w = modal({
    title: m ? 'Edit Modul' : 'Tambah Modul', body: `<form id="f-mod" class="col g12"><div class="field"><label for="md-j">Judul modul</label><input class="inp" id="md-j" name="Judul_Modul" required value="${esc(v.Judul_Modul || '')}" placeholder="Modul 1: Pengenalan"></div>
      <div class="field"><label for="md-d">Deskripsi</label><textarea class="inp" id="md-d" name="Deskripsi" style="min-height:80px">${esc(v.Deskripsi || '')}</textarea></div>
      <div class="field"><label for="md-p">Prasyarat (modul yang harus selesai dulu)</label><select class="inp" id="md-p" name="Prasyarat_ID_Modul"><option value="">— Tanpa prasyarat —</option>${mods.map(x => `<option value="${x.ID_Modul}" ${v.Prasyarat_ID_Modul === x.ID_Modul ? 'selected' : ''}>${esc(x.Judul_Modul)}</option>`).join('')}</select></div>
      <label class="switch"><input type="checkbox" name="publik" ${v.Status !== 'Draf' ? 'checked' : ''}>Tampilkan ke member (nonaktif = Draf)</label></form>`,
    foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Simpan</button>`
  });
  w.querySelector('[data-k=ok]').onclick = () => {
    const o = formObj(w.querySelector('#f-mod'));
    if (!o.Judul_Modul) return toast('Judul modul wajib diisi', 'err');
    const row = { ID_Modul: v.ID_Modul, ID_Produk: v.ID_Produk, Urutan: v.Urutan, Judul_Modul: o.Judul_Modul, Deskripsi: o.Deskripsi, Prasyarat_ID_Modul: o.Prasyarat_ID_Modul, Status: o.publik ? 'Publik' : 'Draf' };
    tutupModal(w);
    simpanMaster('Kurikulum', 'kurikulum', 'ID_Modul', [row], m ? [Object.assign({}, m)] : [], m ? 'Modul diperbarui' : 'Modul ditambahkan');
  };
};
ACT.hapusModul = t => { const m = S.A.kurikulum.find(x => x.ID_Modul === t.dataset.id); if (m) hapusBaris('Kurikulum', 'kurikulum', 'ID_Modul', m.ID_Modul, m.Judul_Modul + ' beserta materinya'); };
ACT.hapusMateri = t => { const x = S.A.materi.find(z => z.ID_Materi === t.dataset.id); if (x) hapusBaris('Materi', 'materi', 'ID_Materi', x.ID_Materi, x.Judul); };
function geser(tabel, kunciA, key, grupKey, id, d) {
  const arr = S.A[kunciA], it = arr.find(x => x[key] === id);
  const grup = arr.filter(x => x[grupKey] === it[grupKey]).sort((a, b) => a.Urutan - b.Urutan);
  const i = grup.indexOf(it), j = i + d; if (j < 0 || j >= grup.length) return;
  const lama = grup.map(x => Object.assign({}, x));
  [grup[i], grup[j]] = [grup[j], grup[i]];
  const rows = grup.map((x, n) => ({ [key]: x[key], Urutan: n + 1 }));
  simpanMaster(tabel, kunciA, key, rows, lama.map(x => ({ [key]: x[key], Urutan: x.Urutan })));
}
ACT.geserModul = t => geser('Kurikulum', 'kurikulum', 'ID_Modul', 'ID_Produk', t.dataset.id, Number(t.dataset.d));
ACT.geserMateri = t => geser('Materi', 'materi', 'ID_Materi', 'ID_Modul', t.dataset.id, Number(t.dataset.d));
CHG.wajibMateri = t => { const x = S.A.materi.find(z => z.ID_Materi === t.dataset.id); simpanMaster('Materi', 'materi', 'ID_Materi', [{ ID_Materi: x.ID_Materi, Wajib: t.checked ? 'Ya' : 'Tidak' }], [{ ID_Materi: x.ID_Materi, Wajib: x.Wajib }]); };
ACT.editMateri = t => {
  const id = t.dataset.id, x = id ? S.A.materi.find(z => z.ID_Materi === id) : null;
  const mod = x ? x.ID_Modul : t.dataset.mod;
  const sib = S.A.materi.filter(z => z.ID_Modul === mod);
  const v = x || { ID_Materi: uid('MTR'), ID_Modul: mod, Tipe: 'Video', Wajib: 'Ya', Urutan: (sib.length ? Math.max(...sib.map(z => Number(z.Urutan) || 0)) : 0) + 1 };
  const w = modal({
    title: x ? 'Edit Materi' : 'Tambah Materi', body: `<form id="f-mtr" class="form-grid two">
      <div class="field"><label for="mt-t">Tipe materi</label><select class="inp" id="mt-t" name="Tipe">${['Video', 'PDF', 'DOCX', 'ZIP', 'Tautan'].map(s => `<option ${v.Tipe === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div class="field"><label for="mt-d">Durasi (menit)</label><input class="inp" id="mt-d" name="Durasi_Menit" type="number" min="0" value="${esc(v.Durasi_Menit || '')}"></div>
      <div class="field span2"><label for="mt-j">Judul materi</label><input class="inp" id="mt-j" name="Judul" required value="${esc(v.Judul || '')}"></div>
      <div class="field span2"><label for="mt-u">URL video/tautan atau ID berkas Drive</label><input class="inp" id="mt-u" name="URL_atau_FileID" value="${esc(v.URL_atau_FileID || '')}" placeholder="https://youtu.be/… (disarankan unlisted) atau link Drive"><span class="hint">Berkas PDF/DOCX/ZIP diunggah ke Drive privat; member mengunduh lewat aplikasi setelah akses diverifikasi.</span>
        <label class="btn sec sm mt8" style="cursor:pointer;align-self:flex-start">${ic('upload', 'sm')}Unggah berkas ke Drive<input type="file" class="sr" data-chg="unggahMateri"></label></div>
      <label class="switch span2"><input type="checkbox" name="Wajib" ${/^ya$/i.test(v.Wajib) ? 'checked' : ''}>Wajib diselesaikan untuk membuka modul berikutnya</label>
      ${x ? '' : '<label class="check span2"><input type="checkbox" name="umumkan"><span>Umumkan materi baru ke member aktif (WA & Email, hanya yang setuju info)</span></label>'}</form>`,
    foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Simpan</button>`
  });
  w.querySelector('[data-k=ok]').onclick = () => {
    const o = formObj(w.querySelector('#f-mtr'));
    if (!o.Judul) return toast('Judul materi wajib diisi', 'err');
    const row = { ID_Materi: v.ID_Materi, ID_Modul: v.ID_Modul, Urutan: v.Urutan, Tipe: o.Tipe, Judul: o.Judul, URL_atau_FileID: o.URL_atau_FileID, Durasi_Menit: Number(o.Durasi_Menit) || 0, Wajib: o.Wajib ? 'Ya' : 'Tidak' };
    if (o.umumkan) row._umumkan = true;
    tutupModal(w);
    simpanMaster('Materi', 'materi', 'ID_Materi', [row], x ? [Object.assign({}, x)] : [], x ? 'Materi diperbarui' : (o.umumkan ? 'Materi ditambahkan & diumumkan' : 'Materi ditambahkan'));
  };
};
CHG.unggahMateri = t => {
  const f = t.files[0]; if (!f) return;
  if (f.size > 25 * 1048576) return toast('Maksimal 25 MB. Unggah langsung ke Drive lalu tempel tautannya.', 'err');
  const lbl = t.closest('label'); tombolMuat(lbl, true, 'Mengunggah ' + Math.round(f.size / 1024) + ' KB…');
  bacaFile(f).then(file => api('unggahBerkas', S.token, 'materi', S.ui.kProd, { nama: file.nama, mime: file.mime, data: file.data }))
    .then(r => { tombolMuat(lbl, false); $('#mt-u').value = r.fileId; const tp = $('#mt-t'); if (tp && ['PDF', 'DOCX', 'ZIP'].indexOf(r.tipe) > -1) tp.value = r.tipe; const j = $('#mt-j'); if (j && !j.value) j.value = r.nama.replace(/\.\w+$/, ''); toast('Berkas tersimpan di Drive (privat)'); })
    .catch(e => { tombolMuat(lbl, false); toast(e.message, 'err'); });
};
