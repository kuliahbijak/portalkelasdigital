/* ==========================================================================
   DASHBOARD MEMBER (LMS): beranda, kelas, ruang belajar, unduhan, progres,
   pesan, profil & pengaturan. Semua dirender dari S.M (cache lokal + bootstrap).
   ========================================================================== */
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
function notifBaru() {
  if (!S.M) return 0;
  const seen = LS.get('pk_seen_' + S.user.id, 0);
  return (S.M.notif || []).filter(n => new Date(n.waktu).getTime() > seen).length + (S.M.transaksi || []).filter(t => t.status === 'Menunggu' && !t.bukti).length;
}
CHROME.mem = () => {
  const v = S.view, n = notifBaru();
  const r = (id, ikon, label, extra) => `<button class="rail-btn tip ${v === id || (extra && extra.indexOf(v) > -1) ? 'on' : ''}" data-act="go" data-v="${id}" data-tip="${label}" aria-label="${label}">${ic(ikon)}${id === 'pesan' && n ? '<span class="dot"></span>' : ''}</button>`;
  const b = (id, ikon, label, extra) => `<button class="bnav-btn ${v === id || (extra && extra.indexOf(v) > -1) ? 'on' : ''}" data-act="go" data-v="${id}">${ic(ikon)}${label}</button>`;
  const nm = S.user.nama || '';
  return {
    rail: `<button data-act="go" data-v="beranda" aria-label="Beranda">${brandMark()}</button>
      <nav>${r('beranda', 'home', 'Beranda')}${r('kelas', 'grad', 'Kelas Saya', ['belajar'])}${r('unduhan', 'inbox', 'Materi & Unduhan')}${r('progres', 'grid', 'Progres Belajar')}${r('profil', 'user', 'Profil')}${r('pesan', 'mail', 'Pesan & Notifikasi')}${r('pengaturan', 'settings', 'Pengaturan')}</nav>
      <button class="rail-btn keluar tip" data-act="keluar" data-tip="Keluar" aria-label="Keluar">${ic('logout')}</button>`,
    top: `<div class="top-in">${inputCari('Cari kelas, topik, atau instruktur…', 'cariKatalog')}<span class="grow hide-m"></span>
      <button class="icon-btn" data-act="go" data-v="pesan" aria-label="Notifikasi">${ic('bell')}${n ? '<span class="badge-dot"></span>' : ''}</button>
      <button class="user-pill" data-act="go" data-v="profil"><span class="avatar sm">${esc(inisial(nm))}<span class="on-dot"></span></span><span class="hide-m" style="text-align:left"><div class="nm">${esc(nm)}</div><div class="rl">${esc((S.M && S.M.profil.status === 'Aktif') ? 'Member Aktif' : 'Member')}</div></span></button></div>`,
    bnav: b('beranda', 'home', 'Beranda') + b('kelas', 'grad', 'Kelas', ['belajar']) + b('unduhan', 'inbox', 'Unduhan') + b('progres', 'grid', 'Progres') + b('profil', 'user', 'Profil', ['pesan', 'pengaturan'])
  };
};
function kelasSaya() { return (S.M && S.M.kelas) || []; }
function kelasAktif() { return kelasSaya().filter(k => k.akses.status === 'Aktif'); }
function materiBerikut(k) {
  for (const m of k.modul) { if (m.terkunci) continue; for (const x of m.materi) if (!x.selesai) return { m, x }; }
  const m0 = k.modul.find(m => !m.terkunci) || k.modul[0];
  return m0 && m0.materi[0] ? { m: m0, x: m0.materi[0] } : null;
}
ACT.belajar = t => { const id = t.dataset.id; if (!S.M || !kelasSaya().find(k => k.id === id)) return go('detail', { id }); go('belajar', { id, m: t.dataset.m || '' }); };

function kartuKelasSaya(k) {
  const exp = k.akses.status !== 'Aktif';
  return `<article class="card hov course">
    ${thumb(k, { tr: `<span class="bm">${ic('bookmark', 'xs')}</span>` })}
    <div class="meta">${badgeKat(k.kategori)}${bintang(k.rating)}</div>
    <h3 class="clamp2">${esc(k.nama)}</h3>
    <div class="foot">
      <div class="row between small"><span class="muted">${exp ? 'Akses ' + esc(k.akses.status.toLowerCase()) : 'Progres Belajar'}</span><b class="c-pri">${k.persen}%</b></div>
      ${bar(k.persen, k.persen === 100 ? 'ok' : '')}
      <div class="row between"><div class="inst">${avatar(k.instruktur, 'xs')}<span class="trunc">${esc(k.instruktur || '-')}</span></div>
        ${exp ? `<button class="btn soft xs" data-act="beli" data-id="${k.id}">Perpanjang</button>` : `<button class="round-btn" data-act="belajar" data-id="${k.id}" aria-label="Lanjut belajar ${esc(k.nama)}">${ic('play', 'sm fill')}</button>`}</div>
    </div></article>`;
}

/* ---------------- Beranda ---------------- */
VIEWS.beranda = {
  area: 'mem', title: 'Beranda',
  render() {
    if (!S.M) return `<div class="dash"><div class="col g16"><div class="sk" style="height:220px;border-radius:26px"></div>${skeleton(2, 260)}</div><div>${skeleton(4, 90)}</div></div>`;
    const K = kelasSaya(), aktif = kelasAktif();
    const lanjut = aktif.slice().sort((a, b) => b.terakhirWaktu - a.terakhirWaktu).find(k => k.persen < 100) || aktif[0];
    const pop = S.katalog.filter(p => !milikSaya(p.id)).sort((a, b) => b.ulasan - a.ulasan);
    const pending = (S.M.transaksi || []).filter(t => t.status === 'Menunggu');
    const st = S.M.statistik || {};
    return `<div class="dash"><div class="col g24" style="min-width:0">
      <section class="hero"><div class="col g12"><span class="eyebrow">Online Course</span><h1>${esc(S.app.TAGLINE || 'Tingkatkan skill digitalmu')}</h1><p>${esc(S.app.HERO_SUB || '')}</p>
        <div class="row wrap g8 mt8">${lanjut ? `<button class="btn white" data-act="belajar" data-id="${lanjut.id}">${lanjut.persen ? 'Lanjut Belajar' : 'Mulai Belajar'} <span class="round-btn" style="width:22px;height:22px;box-shadow:none">${ic('play', 'xs fill')}</span></button>` : `<button class="btn white" data-act="go" data-v="katalog">Jelajahi Kelas ${ic('arrowR', 'sm')}</button>`}
        ${lanjut ? `<span class="small" style="opacity:.85">${esc(potong(lanjut.nama, 38))} · ${lanjut.persen}%</span>` : ''}</div></div>
        <div class="hero-art">${S.app.HERO_GAMBAR ? `<img src="${esc(S.app.HERO_GAMBAR)}" alt="">` : ilustrasiHero()}</div></section>
      ${pending.map(t => `<div class="card pad-s row between wrap" style="border-color:var(--warn)"><div class="row g12"><span class="ftype ft-ZIP">${ic('clock', 'sm')}</span><div><b class="small">Selesaikan pembayaran ${esc(t.namaProduk)}</b><div class="xs muted">${esc(t.id)} · ${rp(t.nominal)} · ${t.bukti ? 'bukti terkirim, menunggu verifikasi' : 'batas ' + relatif(t.batas)}</div></div></div><button class="btn ${t.bukti ? 'sec' : 'pri'} sm" data-act="go" data-v="bayar" data-p='${JSON.stringify({ id: t.id })}'>${t.bukti ? 'Lihat status' : 'Bayar & unggah bukti'}</button></div>`).join('')}
      <section><div class="sec-h"><div><h2>Kelas Saya</h2><p>Lanjutkan progres pembelajaran terakhirmu</p></div>${K.length > 2 ? `<div class="row g8"><button class="arrow-btn" data-act="scrollKiri" data-target="car-saya" aria-label="Geser kiri">${ic('chevL', 'sm')}</button><button class="arrow-btn" data-act="scrollKanan" data-target="car-saya" aria-label="Geser kanan">${ic('chevR', 'sm')}</button></div>` : ''}</div>
        ${K.length ? `<div class="carousel" id="car-saya">${K.map(kartuKelasSaya).join('')}</div>` : `<div class="card">${kosong('grad', 'Belum ada kelas', 'Pilih kelas pertama Anda dari katalog. Akses aktif < 5 menit setelah pembayaran terverifikasi.', '<button class="btn pri" data-act="go" data-v="katalog">Lihat Katalog</button>')}</div>`}</section>
      ${pop.length ? `<section><div class="sec-h"><div><h2>Kelas Populer & Rekomendasi</h2><p>Tingkatkan keahlian baru dengan kurikulum terhangat</p></div><div class="row g8"><button class="arrow-btn" data-act="scrollKiri" data-target="car-pop" aria-label="Geser kiri">${ic('chevL', 'sm')}</button><button class="arrow-btn" data-act="scrollKanan" data-target="car-pop" aria-label="Geser kanan">${ic('chevR', 'sm')}</button></div></div>
        <div class="carousel" id="car-pop">${pop.map(p => kartuKatalog(p, true)).join('')}</div></section>` : ''}
    </div>
    <aside class="col g16">
      <div class="stat4">
        <div class="card stat-tile">${ring(st.total ? st.selesai / st.total * 100 : 0, st.selesai || 0, '/' + (st.total || 0))}<div><div class="t1">Kelas</div><div class="t2">Selesai</div></div></div>
        <div class="card stat-tile">${ring(st.total ? st.berjalan / st.total * 100 : 0, st.berjalan || 0, '/' + (st.total || 0), '#8B5CF6')}<div><div class="t1">Kelas</div><div class="t2">Berjalan</div></div></div>
        <div class="card stat-tile">${ring(Math.min(100, (st.menit || 0) / 60 / 60 * 100), jamBelajar(st.menit), 'jam')}<div><div class="t1">Waktu</div><div class="t2">Belajar</div></div></div>
        <div class="card stat-tile">${ring(Math.min(100, (st.streak || 0) / 7 * 100), st.streak || 0, 'hari', '#F59E0B')}<div><div class="t1">Streak</div><div class="t2">Konsistensi</div></div></div>
      </div>
      <div class="card chart-card" id="kartu-stat">${kartuStatistik()}</div>
      <div class="promo-card">${ilustrasiMegafon()}<h3>${esc(S.app.PROMO_UPSELL_JUDUL || 'Belajar Tanpa Batas!')}</h3><p>${esc(S.app.PROMO_UPSELL_TEKS || '')}</p>
        <button class="btn pri" data-act="${S.app.PROMO_UPSELL_PRODUK ? 'go' : 'go'}" data-v="${S.app.PROMO_UPSELL_PRODUK ? 'detail' : 'katalog'}" data-p='${JSON.stringify({ id: S.app.PROMO_UPSELL_PRODUK || '' })}'>${S.app.PROMO_UPSELL_PRODUK ? 'Lihat Penawaran' : 'Upgrade Pro'}</button></div>
    </aside></div>`;
  }
};
function kartuStatistik() {
  const ui = S.ui.stat || (S.ui.stat = { tab: 'jam', per: 7 });
  const st = (S.M && S.M.statistik) || { harian: [] };
  const h = (st.harian || []).slice(-ui.per);
  const isi = ui.tab === 'jam'
    ? grafikGaris(h.map(d => ({ l: ui.per === 7 ? HARI[new Date(d.t + 'T00:00:00').getDay()] : d.t.slice(8), v: Math.round(d.m / 6) / 10 })), { fmt: v => String(v).replace('.', ',') + 'h', fmtY: v => String(Math.round(v * 10) / 10).replace('.', ',') + 'h', aria: 'Jam belajar per hari' })
    : `<div class="col g12">${kelasSaya().map(k => `<div><div class="row between small"><span class="trunc">${esc(k.nama)}</span><b class="c-pri">${k.persen}%</b></div>${bar(k.persen, k.persen === 100 ? 'ok' : '')}</div>`).join('') || '<p class="muted small">Belum ada kelas.</p>'}</div>`;
  const total = h.reduce((a, d) => a + d.m, 0);
  return `<div class="card-h"><h3>Statistik Belajar</h3><select class="inp pill-inp" style="width:auto;min-height:32px;padding:4px 30px 4px 12px;font-size:12px;background-color:var(--primary);color:#fff;border-color:var(--primary)" data-chg="periodeStat" aria-label="Periode"><option value="7" ${ui.per === 7 ? 'selected' : ''}>Mingguan</option><option value="30" ${ui.per === 30 ? 'selected' : ''}>Bulanan</option></select></div>
    <div class="tabs" style="margin-bottom:10px"><button class="${ui.tab === 'jam' ? 'on' : ''}" data-act="tabStat" data-t="jam">Jam Belajar</button><button class="${ui.tab === 'kelas' ? 'on' : ''}" data-act="tabStat" data-t="kelas">Kelas Saya</button></div>
    ${isi}${ui.tab === 'jam' ? `<p class="xs muted mt8">Total ${durasi(total)} dalam ${ui.per} hari terakhir.</p>` : ''}`;
}
ACT.tabStat = t => { S.ui.stat.tab = t.dataset.t; const c = $('#kartu-stat'); if (c) c.innerHTML = kartuStatistik(); };
CHG.periodeStat = t => { S.ui.stat.per = Number(t.value); const c = $('#kartu-stat'); if (c) c.innerHTML = kartuStatistik(); };

/* ---------------- Kelas Saya ---------------- */
VIEWS.kelas = {
  area: 'mem', title: 'Kelas Saya',
  render() {
    if (!S.M) return skeleton(3, 220);
    const f = S.ui.fKelas || 'semua';
    const K = kelasSaya().filter(k => f === 'semua' || (f === 'jalan' && k.akses.status === 'Aktif' && k.persen < 100) || (f === 'selesai' && k.persen === 100) || (f === 'habis' && k.akses.status !== 'Aktif'));
    const seg = (id, l) => `<button class="${f === id ? 'on' : ''}" data-act="fKelas" data-f="${id}">${l}</button>`;
    return `<div class="page-h"><div><h1>Kelas Saya</h1><p>${kelasSaya().length} kelas · ${kelasAktif().length} aktif</p></div><div class="seg">${seg('semua', 'Semua')}${seg('jalan', 'Berjalan')}${seg('selesai', 'Selesai')}${seg('habis', 'Kedaluwarsa')}</div></div>
      ${K.length ? `<div class="course-grid">${K.map(kartuKelasSaya).join('')}</div>` : `<div class="card">${kosong('grad', 'Tidak ada kelas di sini', '', '<button class="btn pri" data-act="go" data-v="katalog">Jelajahi katalog</button>')}</div>`}`;
  }
};
ACT.fKelas = t => { S.ui.fKelas = t.dataset.f; render(); };

/* ---------------- Ruang belajar (learning path) ---------------- */
function embedVideo(url) {
  if (!url) return '';
  let m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0&modestbranding=1';
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/); if (m) return 'https://player.vimeo.com/video/' + m[1];
  m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/); if (m) return 'https://drive.google.com/file/d/' + m[1] + '/preview';
  return '';
}
function cariMateri(k, mid) { for (const m of k.modul) for (const x of m.materi) if (x.id === mid) return { m, x }; return null; }
function urutanMateri(k) { const out = []; k.modul.forEach(m => m.materi.forEach(x => out.push({ m, x }))); return out; }
VIEWS.belajar = {
  area: 'mem', title: 'Ruang Belajar',
  render(p) {
    if (!S.M) return skeleton(2, 300);
    const k = kelasSaya().find(x => x.id === p.id);
    if (!k) return kosong('grad', 'Kelas tidak ditemukan', '', '<button class="btn pri" data-act="go" data-v="kelas">Kelas Saya</button>');
    let cur = p.m ? cariMateri(k, p.m) : null;
    if (!cur || cur.m.terkunci) cur = materiBerikut(k);
    if (cur) S.params.m = cur.x.id;
    const aktif = k.akses.status === 'Aktif';
    const daftar = urutanMateri(k), idx = cur ? daftar.findIndex(d => d.x.id === cur.x.id) : -1;
    const prev = daftar[idx - 1], next = daftar[idx + 1];
    let player = '';
    if (!aktif) player = `<div class="player"><div class="ph"><div class="col g12" style="align-items:center">${ic('lock', 'lg')}<h3 style="color:#fff">Akses kelas ${esc(k.akses.status.toLowerCase())}</h3><p class="small" style="opacity:.8">Perpanjang akses untuk melanjutkan. Progres Anda tetap tersimpan.</p><button class="btn white" data-act="beli" data-id="${k.id}">Perpanjang Akses</button></div></div></div>`;
    else if (cur) {
      const x = cur.x;
      if (x.tipe === 'Video') {
        const src = embedVideo(x.url);
        player = `<div class="player">${src ? `<iframe src="${esc(src)}" title="${esc(x.judul)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>` : `<div class="ph"><div class="col g8" style="align-items:center">${x.memuat ? '<span class="spin" style="width:28px;height:28px"></span><b>Membuka modul…</b>' : `<span class="brand-mark">${ic('video')}</span><b>Video belum tersedia</b><span class="small" style="opacity:.75">${x.url ? 'Format tautan video tidak dikenali.' : 'Admin belum menautkan video untuk materi ini.'}</span>${x.url ? `<a class="btn white sm" href="${esc(x.url)}" target="_blank" rel="noopener">Buka tautan</a>` : ''}`}</div></div>`}</div>`;
      } else {
        const lbl = { PDF: 'Dokumen PDF', DOCX: 'Dokumen Word', ZIP: 'Arsip ZIP', Tautan: 'Tautan Referensi' }[x.tipe] || 'Materi';
        player = `<div class="doc-card"><span class="big-ic">${ic(ikonTipe(x.tipe), 'lg')}</span><div class="grow"><div class="xs b c-pri">${lbl.toUpperCase()}</div><h2>${esc(x.judul)}</h2><p class="small muted mt8">${x.tipe === 'Tautan' ? 'Buka tautan di tab baru, lalu kembali ke sini untuk menandai selesai.' : 'Unduh atau pratinjau materi ini. Berkas dikirim aman setelah akses Anda diverifikasi.'}</p>
          <div class="row wrap g8 mt12">${x.tipe === 'Tautan' ? (x.url ? `<a class="btn pri" href="${esc(x.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka tautan</a>` : '<span class="muted small">Tautan belum diisi.</span>') : x.url && !x.berkas ? `<a class="btn pri" href="${esc(x.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka materi</a>` : `${x.tipe === 'PDF' ? `<button class="btn soft" data-act="unduhMtr" data-id="${x.id}" data-lihat="1">${ic('eye', 'sm')}Pratinjau</button>` : ''}<button class="btn pri" data-act="unduhMtr" data-id="${x.id}">${ic('download', 'sm')}Unduh</button>`}</div></div></div>`;
      }
    }
    return `<div class="row between wrap mb16"><div><div class="crumb"><button data-act="go" data-v="kelas">Kelas Saya</button>${ic('chevR', 'xs')}<b>${esc(potong(k.nama, 50))}</b></div><h1>${esc(k.nama)}</h1></div>
      <div class="row g12 card pad-s">${ring(k.persen, k.persen + '%')}<div><b class="small">${k.selesaiMateri} dari ${k.totalMateri} materi</b><div class="xs muted">${k.akses.berakhir ? 'Akses s.d. ' + tgl(k.akses.berakhir) : 'Akses selamanya'}</div></div></div></div>
    <div class="learn"><div class="col g16">
      ${player}
      ${cur ? `<div class="card pad row between wrap g12"><div class="grow"><div class="xs muted">${esc(cur.m.judul)}</div><h2>${esc(cur.x.judul)}</h2><div class="row g12 xs muted mt8"><span class="row g4">${ic(ikonTipe(cur.x.tipe), 'xs')}${esc(cur.x.tipe)}</span>${cur.x.durasi ? `<span class="row g4">${ic('clock', 'xs')}${cur.x.durasi} mnt</span>` : ''}${cur.x.wajib ? '<span class="badge bg-lav">Wajib</span>' : '<span class="badge bg-grey">Opsional</span>'}</div></div>
        ${aktif ? `<button class="btn ${cur.x.selesai ? 'ok' : 'pri'}" data-act="tandai" data-pid="${k.id}" data-mid="${cur.x.id}">${ic(cur.x.selesai ? 'checkc' : 'check', 'sm')}${cur.x.selesai ? 'Sudah Selesai' : 'Tandai Selesai'}</button>` : ''}</div>
      <div class="row between"><button class="btn sec" ${prev && !prev.m.terkunci ? `data-act="pilihMtr" data-pid="${k.id}" data-mid="${prev.x.id}"` : 'disabled'}>${ic('chevL', 'sm')}Sebelumnya</button><button class="btn sec" ${next && !next.m.terkunci ? `data-act="pilihMtr" data-pid="${k.id}" data-mid="${next.x.id}"` : 'disabled'}>Berikutnya${ic('chevR', 'sm')}</button></div>` : kosong('layers', 'Kurikulum belum tersedia', 'Instruktur sedang menyiapkan materi.')}
    </div>
    <aside class="sticky col g12"><div class="card pad-s"><div class="row between" style="padding:6px 8px"><h3>Learning Path</h3><span class="xs muted">${k.modul.length} modul</span></div>
      ${k.modul.map((m, i) => {
        const buka = cur && cur.m.id === m.id;
        return `<div class="acc ${buka ? 'open' : ''}" style="margin-top:8px"><button class="acc-h" data-act="acc"><span class="mod-h"><span class="n ${m.selesai ? 'ok' : m.terkunci ? 'lock' : ''}">${m.selesai ? ic('check', 'xs') : m.terkunci ? ic('lock', 'xs') : i + 1}</span><span><span class="small">${esc(m.judul)}</span><div class="xs muted" style="font-weight:500">${m.materi.filter(x => x.selesai).length}/${m.materi.length} selesai${m.terkunci ? ' · terkunci' : ''}</div></span></span>${ic('chevD', 'sm chev')}</button>
          <div class="acc-b">${m.terkunci ? `<div class="li-mtr locked small">${ic('lock', 'sm')}Selesaikan materi wajib modul sebelumnya untuk membuka.</div>` : ''}${m.materi.map(x => `<button class="li-mtr ${x.selesai ? 'done' : ''} ${cur && cur.x.id === x.id ? 'on' : ''} ${m.terkunci ? 'locked' : ''}" ${m.terkunci || !aktif ? 'disabled' : `data-act="pilihMtr" data-pid="${k.id}" data-mid="${x.id}"`}><span class="tico">${ic(x.selesai ? 'check' : ikonTipe(x.tipe), 'sm')}</span><span class="grow small">${esc(x.judul)}</span>${x.durasi ? `<span class="xs muted">${x.durasi}m</span>` : ''}</button>`).join('')}</div></div>`;
      }).join('')}</div></aside></div>`;
  },
  after(s, p) { if (p.m) mulaiTimer(p.m); },
  leave() { mulaiTimer(null); flushBelajar(); }
};
ACT.pilihMtr = t => { S.params.m = t.dataset.mid; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
function hitungUlangKelas(k) {
  let total = 0, done = 0;
  const sel = {};
  k.modul.forEach(m => { const w = m.materi.filter(x => x.wajib); const tg = w.length ? w : m.materi; sel[m.id] = tg.length > 0 && tg.every(x => x.selesai); m.selesai = sel[m.id]; m.materi.forEach(x => { total++; if (x.selesai) done++; }); });
  k.modul.forEach(m => { const kunci = !!(m.prasyarat && !sel[m.prasyarat]); if (m.terkunci && !kunci) m.materi.forEach(x => { if (!x.url && !x.berkas) x.memuat = true; }); m.terkunci = kunci; });
  k.totalMateri = total; k.selesaiMateri = done; k.persen = total ? Math.round(done * 100 / total) : 0;
}
function hitungStatistik() {
  const st = S.M.statistik, a = kelasAktif();
  st.total = a.length; st.selesai = a.filter(k => k.persen === 100).length; st.berjalan = a.filter(k => k.persen < 100).length;
}
ACT.tandai = t => {
  const k = kelasSaya().find(x => x.id === t.dataset.pid); if (!k) return;
  const c = cariMateri(k, t.dataset.mid); if (!c) return;
  const sebelum = salin(k), stSebelum = salin(S.M.statistik);
  const nilai = !c.x.selesai, menit = ambilMenit(c.x.id);
  const persenAwal = k.persen;
  optimis({
    ubah: () => {
      c.x.selesai = nilai; k.terakhirWaktu = Date.now(); hitungUlangKelas(k); hitungStatistik();
      if (nilai) { const nx = materiBerikut(k); if (nx && nx.x.id !== c.x.id && !nx.x.selesai) S.params.m = nx.x.id; }
    },
    kirim: () => api('tandaiSelesai', S.token, c.x.id, nilai, menit),
    sukses: r => {
      const i = S.M.kelas.findIndex(x => x.id === k.id);
      if (i > -1 && r.kelas) S.M.kelas[i] = r.kelas;
      if (r.statistik) S.M.statistik = r.statistik;
      simpanCache();
      if (nilai && r.kelas && r.kelas.persen === 100 && persenAwal < 100) setTimeout(() => modal({ title: 'Selamat! 🎓', size: 'sm', body: `<div class="center col g12" style="align-items:center">${ring(100, '100%')}<h2>Kelas tuntas!</h2><p class="muted">Anda telah menyelesaikan seluruh materi <b>${esc(k.nama)}</b>.</p></div>`, foot: `<button class="btn pri" data-act="tutupModal">Mantap!</button>` }), 200);
    },
    balik: () => { const i = S.M.kelas.findIndex(x => x.id === k.id); S.M.kelas[i] = sebelum; S.M.statistik = stSebelum; if (menit) BELAJAR.pending[c.x.id] = (BELAJAR.pending[c.x.id] || 0) + menit; },
    pesanGagal: 'Progres gagal disimpan'
  }).catch(() => { });
  if (nilai) toast('Materi ditandai selesai', 'ok', { ms: 1800 });
};

/* ---------- Pencatat waktu belajar (heartbeat 1 menit, kirim batch) ---------- */
const BELAJAR = { mid: null, pending: {}, kirim: 0 };
function mulaiTimer(mid) { BELAJAR.mid = mid; }
function ambilMenit(mid) { const m = BELAJAR.pending[mid] || 0; delete BELAJAR.pending[mid]; return m; }
function flushBelajar() {
  if (!S.token || !S.M) return;
  const e = Object.keys(BELAJAR.pending).filter(k => BELAJAR.pending[k] > 0).map(k => ({ id: k, m: BELAJAR.pending[k] }));
  if (!e.length) return;
  BELAJAR.pending = {}; BELAJAR.kirim = Date.now();
  api('catatWaktu', S.token, e).catch(() => e.forEach(x => { BELAJAR.pending[x.id] = (BELAJAR.pending[x.id] || 0) + x.m; }));
}
setInterval(() => {
  if (S.view !== 'belajar' || !BELAJAR.mid || document.visibilityState !== 'visible' || !S.M) return;
  BELAJAR.pending[BELAJAR.mid] = (BELAJAR.pending[BELAJAR.mid] || 0) + 1;
  const st = S.M.statistik; st.menit = (st.menit || 0) + 1;
  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const h = (st.harian || []).find(d => d.t === today); if (h) h.m++;
  const tot = Object.values(BELAJAR.pending).reduce((a, b) => a + b, 0);
  if (tot >= 3 || Date.now() - BELAJAR.kirim > 180000) flushBelajar();
}, 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { flushBelajar(); simpanCache(); } });
window.addEventListener('pagehide', () => { flushBelajar(); simpanCache(); });

/* ---------------- Materi & Unduhan ---------------- */
VIEWS.unduhan = {
  area: 'mem', title: 'Materi & Unduhan',
  render() {
    if (!S.M) return skeleton(5, 64);
    const f = S.ui.fTipe || '', q = S.ui.qUnduh || '';
    const tipe = ['PDF', 'DOCX', 'ZIP', 'Tautan'];
    const blok = kelasSaya().map(k => {
      const rows = [];
      k.modul.forEach(m => m.materi.forEach(x => { if (x.tipe !== 'Video' && (!f || x.tipe === f) && cari(x.judul + ' ' + m.judul, q)) rows.push({ m, x }); }));
      if (!rows.length) return '';
      const aktif = k.akses.status === 'Aktif';
      return `<div class="card mb16"><div class="row g12" style="padding:14px 16px;border-bottom:1px solid var(--line)"><div style="width:56px">${thumb(k)}</div><div class="grow"><b class="small">${esc(k.nama)}</b><div class="xs muted">${rows.length} berkas/tautan</div></div></div>
        ${rows.map(({ m, x }) => { const kunci = m.terkunci || !aktif; return `<div class="dl-row"><span class="ftype ft-${esc(x.tipe)}">${x.tipe === 'Tautan' ? ic('link', 'sm') : esc(x.tipe)}</span><div class="grow"><div class="small b">${esc(x.judul)}</div><div class="xs muted">${esc(m.judul)}${x.selesai ? ' · <span class="c-ok">selesai</span>' : ''}</div></div>
          ${kunci ? `<span class="badge bg-grey">${ic('lock', 'xs')}Terkunci</span>` : x.tipe === 'Tautan' || (x.url && !x.berkas) ? (x.url ? `<a class="btn soft sm" href="${esc(x.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka</a>` : '<span class="xs muted">belum ada</span>') : `${x.tipe === 'PDF' ? `<button class="btn ghost icon sm" data-act="unduhMtr" data-id="${x.id}" data-lihat="1" aria-label="Pratinjau">${ic('eye', 'sm')}</button>` : ''}<button class="btn soft sm" data-act="unduhMtr" data-id="${x.id}">${ic('download', 'sm')}<span class="hide-m">Unduh</span></button>`}</div>`; }).join('')}</div>`;
    }).join('');
    return `<div class="page-h"><div><h1>Materi & Unduhan</h1><p>Pusat unduhan multi-format dari semua kelas Anda.</p></div></div>
      <div class="toolbar mb16"><div class="search" style="max-width:360px"><span class="sr">Cari materi</span>${ic('search')}<input id="cari-unduh" type="search" placeholder="Cari judul materi…" value="${esc(q)}" data-in="cariUnduh"></div>
      <div class="chips"><button class="chip ${!f ? 'on' : ''}" data-act="fTipe" data-t="">Semua</button>${tipe.map(t => `<button class="chip ${f === t ? 'on' : ''}" data-act="fTipe" data-t="${t}">${t}</button>`).join('')}</div></div>
      ${blok || `<div class="card">${kosong('inbox', 'Belum ada berkas', 'Berkas PDF, DOCX, ZIP, dan tautan dari kelas Anda akan tampil di sini.')}</div>`}`;
  }
};
ACT.fTipe = t => { S.ui.fTipe = t.dataset.t; render(); };
INP.cariUnduh = debounce(t => { S.ui.qUnduh = t.value; render(); }, 200);
ACT.unduhMtr = t => {
  const lihat = !!t.dataset.lihat;
  tombolMuat(t, true, lihat ? '' : 'Menyiapkan…');
  api('unduhMateri', S.token, t.dataset.id).then(r => {
    tombolMuat(t, false);
    if (r.url) return modal({ title: 'Tautan materi', size: 'sm', body: `<p class="small">Materi ini berupa tautan eksternal.</p>`, foot: `<a class="btn pri" href="${esc(r.url)}" target="_blank" rel="noopener">${ic('ext', 'sm')}Buka tautan</a>` });
    unduhB64(r, lihat);
    if (!lihat) toast('Unduhan dimulai: ' + r.nama);
  }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); });
};

/* ---------------- Progres ---------------- */
VIEWS.progres = {
  area: 'mem', title: 'Progres Belajar',
  render() {
    if (!S.M) return skeleton(3, 160);
    const st = S.M.statistik, K = kelasSaya();
    const totalMtr = K.reduce((a, k) => a + k.selesaiMateri, 0);
    const h = st.harian || [];
    const lv = m => m <= 0 ? '' : m < 15 ? 'l1' : m < 45 ? 'l2' : m < 90 ? 'l3' : 'l4';
    const kpi = (ikon, warna, val, lab) => `<div class="card kpi"><div class="row between"><span class="lab">${lab}</span><span class="ico ${warna}">${ic(ikon)}</span></div><div class="val">${val}</div></div>`;
    return `<div class="page-h"><div><h1>Progres Belajar</h1><p>Pantau konsistensi dan capaian Anda.</p></div></div>
      <div class="kpi4 mb16">${kpi('clock', 'bg-lav', jamBelajar(st.menit) + '<small>jam</small>', 'Total Jam Belajar')}${kpi('checkc', 'bg-ok', angka(totalMtr) + '<small>materi</small>', 'Materi Selesai')}${kpi('award', 'bg-info', (st.selesai || 0) + '<small>/ ' + (st.total || 0) + ' kelas</small>', 'Kelas Tuntas')}${kpi('flame', 'bg-warn', (st.streak || 0) + '<small>hari</small>', 'Daily Streak')}</div>
      <div class="adm-grid2 w21"><div class="card chart-card"><div class="card-h"><h3>Jam belajar 30 hari terakhir</h3></div>${grafikGaris(h.slice(-30).map(d => ({ l: d.t.slice(8) + '/' + d.t.slice(5, 7), v: Math.round(d.m / 6) / 10 })), { fmt: v => String(v).replace('.', ',') + 'h', fmtY: v => String(Math.round(v * 10) / 10).replace('.', ',') + 'h', aria: 'Jam belajar 30 hari' })}</div>
        <div class="card pad"><div class="card-h"><h3>Kalender konsistensi</h3><span class="xs muted">60 hari</span></div><div class="heat">${h.map(d => `<i class="${lv(d.m)}" title="${esc(d.t)}: ${d.m} menit"></i>`).join('')}</div>
          <div class="row g4 xs muted mt12">Sedikit <i style="width:12px;height:12px;border-radius:3px;background:var(--lav-2)"></i><i style="width:12px;height:12px;border-radius:3px;background:var(--lav-3)"></i><i style="width:12px;height:12px;border-radius:3px;background:#B9A3FF"></i><i style="width:12px;height:12px;border-radius:3px;background:#8B5CF6"></i><i style="width:12px;height:12px;border-radius:3px;background:var(--deep)"></i> Banyak</div></div></div>
      <div class="sec-h mt24"><h2>Progres per kelas</h2></div>
      ${K.map(k => `<div class="card pad mb16"><div class="row between wrap g12"><div class="row g12" style="min-width:0">${ring(k.persen, k.persen + '%')}<div style="min-width:0"><b class="clamp2">${esc(k.nama)}</b><div class="xs muted">${k.selesaiMateri}/${k.totalMateri} materi · ${durasi(k.menit)} belajar${k.terakhirWaktu ? ' · terakhir ' + relatif(k.terakhirWaktu) : ''}</div></div></div><button class="btn soft sm" data-act="belajar" data-id="${k.id}">${ic('play', 'sm fill')}Buka</button></div>
        <div class="grid mt12" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">${k.modul.map((m, i) => { const d = m.materi.filter(x => x.selesai).length, p = m.materi.length ? d / m.materi.length * 100 : 0; return `<div class="card pad-s" style="box-shadow:none"><div class="row between xs"><b class="trunc">Modul ${i + 1}</b>${m.terkunci ? ic('lock', 'xs muted') : m.selesai ? ic('checkc', 'xs c-ok') : ''}</div><div class="xs muted trunc mb8">${esc(m.judul)}</div>${bar(p, m.selesai ? 'ok thin' : 'thin')}</div>`; }).join('')}</div></div>`).join('') || `<div class="card">${kosong('grid', 'Belum ada progres', 'Mulai kelas pertama Anda.')}</div>`}`;
  }
};

/* ---------------- Pesan & Notifikasi ---------------- */
VIEWS.pesan = {
  area: 'mem', title: 'Pesan & Notifikasi',
  render() {
    if (!S.M) return skeleton(5, 64);
    setTimeout(() => { LS.set('pk_seen_' + S.user.id, Date.now()); renderChrome(); }, 1500);
    const item = [];
    (S.M.transaksi || []).filter(t => t.status === 'Menunggu').forEach(t => item.push({ ikon: 'clock', cls: 'bg-warn', judul: t.bukti ? 'Pembayaran sedang diverifikasi' : 'Selesaikan pembayaran', teks: `${t.namaProduk} · ${t.id} · ${rp(t.nominal)}`, aksi: `<button class="btn soft xs" data-act="go" data-v="bayar" data-p='${JSON.stringify({ id: t.id })}'>Buka</button>`, w: t.dibuat }));
    kelasSaya().filter(k => k.akses.berakhir && k.akses.status === 'Aktif' && new Date(k.akses.berakhir) - Date.now() < 7 * 864e5).forEach(k => item.push({ ikon: 'alert', cls: 'bg-err', judul: 'Akses segera berakhir', teks: `${k.nama} · ${tgl(k.akses.berakhir)}`, aksi: `<button class="btn soft xs" data-act="beli" data-id="${k.id}">Perpanjang</button>`, w: Date.now() }));
    if (!S.M.profil.punyaSandi) item.push({ ikon: 'key', cls: 'bg-info', judul: 'Buat sandi akun', teks: 'Agar bisa masuk tanpa kode aktivasi.', aksi: '<button class="btn soft xs" data-act="gantiSandiBaru">Buat sandi</button>', w: Date.now() });
    const ev = { PEMBAYARAN_TERVERIFIKASI: ['checkc', 'bg-ok'], ORDER_DIBUAT: ['receipt', 'bg-lav'], KELAS_TUNTAS: ['award', 'bg-info'], MATERI_BARU: ['book', 'bg-lav'], NUDGE_H7: ['flame', 'bg-warn'], AKSES_H7: ['alert', 'bg-warn'], AKSES_H1: ['alert', 'bg-err'], PEMBAYARAN_DITOLAK: ['xc', 'bg-err'] };
    (S.M.notif || []).forEach(n => { const e = ev[n.event] || ['bell', 'bg-lav']; item.push({ ikon: e[0], cls: e[1], judul: n.ringkas || n.event, teks: (n.kanal === 'WA' ? 'WhatsApp' : 'Email') + ' · ' + relatif(n.waktu), w: n.waktu }); });
    return `<div class="page-h"><div><h1>Pesan & Notifikasi</h1><p>Pemberitahuan akun, pembayaran, dan kelas.</p></div></div>
      <div class="card">${item.length ? item.map(i => `<div class="notif-item"><span class="ni ${i.cls}">${ic(i.ikon, 'sm')}</span><div class="grow"><b class="small">${esc(i.judul)}</b><div class="xs muted">${esc(i.teks)}</div></div>${i.aksi || ''}</div>`).join('') : kosong('bell', 'Belum ada notifikasi', 'Pesan WhatsApp & email yang kami kirim akan tercatat di sini.')}</div>`;
  }
};
ACT.gantiSandiBaru = () => modalSandi(true);

/* ---------------- Profil ---------------- */
VIEWS.profil = {
  area: 'mem', title: 'Profil', live: false,
  render() {
    if (!S.M) return skeleton(3, 160);
    const p = S.M.profil;
    return `<div class="page-h"><div><h1>Profil Saya</h1><p>Data akun, riwayat transaksi, dan kuitansi.</p></div><button class="btn sec" data-act="go" data-v="pengaturan">${ic('settings', 'sm')}Pengaturan</button></div>
      <div class="adm-grid2"><form class="card pad-l col g16" data-sub="simpanProfil"><div class="row g12">${avatar(p.nama, 'lg')}<div><h2>${esc(p.nama)}</h2><div class="small muted">${esc(p.email)}</div><div class="mt8">${pillAkun(p.status)}</div></div></div>
        <div class="field"><label for="pf-nama">Nama lengkap</label><input class="inp" id="pf-nama" name="nama" value="${esc(p.nama)}" required minlength="3"></div>
        <div class="field"><label for="pf-wa">Nomor WhatsApp</label><input class="inp" id="pf-wa" name="wa" type="tel" value="${esc(hpTampil(p.wa))}"></div>
        <div class="field"><label>Email</label><input class="inp" value="${esc(p.email)}" disabled><span class="hint">Hubungi admin untuk mengganti email akun.</span></div>
        <div class="row wrap g8"><button class="btn pri" type="submit">${ic('check', 'sm')}Simpan Profil</button><button class="btn sec" type="button" data-act="${p.punyaSandi ? 'gantiSandi' : 'gantiSandiBaru'}">${ic('key', 'sm')}${p.punyaSandi ? 'Ganti sandi' : 'Buat sandi'}</button></div></form>
      <div class="card pad-l"><h3 class="mb16">Riwayat Transaksi</h3>${(S.M.transaksi || []).length ? S.M.transaksi.map(t => `<div class="dl-row"><span class="ftype ft-Video">${ic('receipt', 'sm')}</span><div class="grow"><b class="small clamp2">${esc(t.namaProduk)}</b><div class="xs muted">${esc(t.id)} · ${tgl(t.dibuat)} · ${rp(t.nominal)}</div></div>${pillTrx(t.status)}
        ${t.status === 'Terverifikasi' ? `<button class="btn ghost icon sm" data-act="kuitansi" data-id="${t.id}" aria-label="Unduh kuitansi">${ic('download', 'sm')}</button>` : t.status === 'Menunggu' ? `<button class="btn soft xs" data-act="go" data-v="bayar" data-p='${JSON.stringify({ id: t.id })}'>Bayar</button>` : ''}</div>`).join('') : kosong('receipt', 'Belum ada transaksi')}</div></div>`;
  }
};
SUB.simpanProfil = f => {
  const o = formObj(f), p = S.M.profil, lama = { nama: p.nama, wa: p.wa };
  if (o.nama.length < 3) return toast('Nama minimal 3 huruf', 'err');
  if (o.wa && !/^(\+?62|0)8\d{7,12}$/.test(o.wa.replace(/[\s-]/g, ''))) return toast('Nomor WhatsApp tidak valid', 'err');
  optimis({
    ubah: () => { p.nama = o.nama; S.user.nama = o.nama; },
    kirim: () => api('simpanProfil', S.token, { nama: o.nama, wa: o.wa }),
    sukses: r => { S.M.profil = r.profil; simpanCache(); toast('Profil tersimpan'); },
    balik: () => { p.nama = lama.nama; p.wa = lama.wa; S.user.nama = lama.nama; }, pesanGagal: 'Profil gagal disimpan'
  }).catch(() => { });
};
ACT.kuitansi = t => { tombolMuat(t, true, ''); api('unduhKuitansi', S.token, t.dataset.id).then(r => { tombolMuat(t, false); unduhB64(r, true); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };

/* ---------------- Pengaturan member ---------------- */
VIEWS.pengaturan = {
  area: 'mem', title: 'Pengaturan', pwa: true,
  render() {
    if (!S.M) return skeleton(3, 120);
    const o = S.M.optin, gelap = temaGelap();
    return `<div class="page-h"><div><h1>Pengaturan</h1><p>Preferensi notifikasi, tampilan, dan aplikasi.</p></div></div>
      <div class="adm-grid2"><div class="card pad-l col g16"><h3>Preferensi notifikasi</h3><p class="small muted">Info akun, pembayaran, dan pengingat akses selalu dikirim. Pilihan di bawah hanya untuk info promosi & tips.</p>
        <label class="switch"><input type="checkbox" data-chg="optin" data-k="waPromosi" ${o.waPromosi ? 'checked' : ''}>Info promo & tips via WhatsApp</label>
        <label class="switch"><input type="checkbox" data-chg="optin" data-k="emailPromosi" ${o.emailPromosi ? 'checked' : ''}>Info promo & tips via Email</label></div>
      <div class="card pad-l col g16"><h3>Tampilan</h3><label class="switch"><input type="checkbox" data-act="tema" ${gelap ? 'checked' : ''}>Mode gelap</label>
        <h3 class="mt8">Aplikasi di HP</h3><p class="small muted">Pasang ${esc(S.app.NAMA_PORTAL)} di layar utama agar terbuka layar penuh tanpa bilah browser.</p>
        ${S.pwa.standalone ? `<span class="badge bg-ok" style="align-self:flex-start">${ic('checkc', 'xs')}Sudah terpasang sebagai aplikasi</span>` : `<button class="btn pri" data-act="pasangApp">${ic('phoneDev', 'sm')}${S.pwa.canInstall && !S.pwa.ios ? 'Pasang Aplikasi Sekarang' : 'Cara Pasang di HP'}</button>`}
        <div class="row between small muted mt8"><span>Versi ${esc(S.app.APP_VERSION || '')}</span><button class="c-err b" data-act="keluar">Keluar dari akun</button></div></div></div>`;
  }
};
CHG.optin = t => {
  const k = t.dataset.k, v = t.checked, o = S.M.optin, lama = o[k];
  const body = {}; body[k] = v;
  optimis({ ubah: () => { o[k] = v; }, kirim: () => api('simpanProfil', S.token, body), sukses: () => { simpanCache(); toast(v ? 'Langganan info diaktifkan' : 'Berhenti berlangganan info promosi'); }, balik: () => { o[k] = lama; }, pesanGagal: 'Gagal menyimpan' }).catch(() => { });
};
