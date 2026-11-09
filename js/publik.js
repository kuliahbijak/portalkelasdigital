/* ==========================================================================
   PORTAL PUBLIK: katalog, detail kelas, checkout, pembayaran, cek pesanan, login
   ========================================================================== */
function brandMark(cls) {
  const logo = S.app.LOGO_URL;
  return `<span class="brand-mark ${cls || ''}">${logo ? `<img src="${esc(logo)}" alt="">` : esc((S.app.NAMA_PORTAL || 'P').trim()[0])}</span>`;
}
function inputCari(ph, inName) {
  return `<label class="search"><span class="sr">Cari</span>${ic('search')}<input id="cari-top" type="search" autocomplete="off" placeholder="${esc(ph)}" data-in="${inName}" data-enter="cariEnter"><button class="search-tune" data-act="go" data-v="katalog" aria-label="Filter kelas">${ic('sliders', 'sm')}</button></label>`;
}
CHROME.pub = () => {
  const v = S.view;
  const tab = (id, ikon, label) => `<button class="top-tab ${v === id ? 'on' : ''}" data-act="go" data-v="${id}">${ic(ikon, 'sm')}${label}</button>`;
  return {
    top: `<div class="top-in"><button class="top-brand" data-act="go" data-v="katalog">${brandMark('sm')}<span class="hide-m">${esc(S.app.NAMA_PORTAL || 'PortalKelas')}<small>${esc(S.app.NAMA_ALT || '')}</small></span></button>
      ${inputCari('Cari kelas, topik, atau instruktur…', 'cariKatalog')}<span class="grow hide-m"></span>
      <div class="top-tabs">${tab('katalog', 'grad', 'Katalog')}${tab('cek', 'receipt', 'Cek Pesanan')}</div>
      <button class="btn pri hide-m" data-act="go" data-v="login">${ic('login', 'sm')}Masuk</button></div>`,
    bnav: `<button class="bnav-btn ${v === 'katalog' || v === 'detail' ? 'on' : ''}" data-act="go" data-v="katalog">${ic('grad')}Katalog</button>
      <button class="bnav-btn ${v === 'cek' || v === 'bayar' ? 'on' : ''}" data-act="go" data-v="cek">${ic('receipt')}Pesanan${S.orders.filter(o => o.order.status === 'Menunggu').length ? `<span class="cnt">${S.orders.filter(o => o.order.status === 'Menunggu').length}</span>` : ''}</button>
      <button class="bnav-btn ${v === 'login' ? 'on' : ''}" data-act="go" data-v="login">${ic('login')}Masuk</button>`
  };
};
const cariKatalogDeb = debounce(() => { if (S.view === 'katalog') gridKatalog(); }, 120);
INP.cariKatalog = t => { S.ui.q = t.value; if (S.view !== 'katalog') { go('katalog'); const el = $('#cari-top'); if (el) { el.value = S.ui.q; el.focus(); } } else cariKatalogDeb(); };
ACT.cariEnter = () => { if (S.view !== 'katalog') go('katalog'); };

/* ---------------- Kartu katalog ---------------- */
function milikSaya(pid) { return S.M && S.M.kelas && S.M.kelas.find(k => k.id === pid && k.akses.status === 'Aktif'); }
function kartuKatalog(p, kompak) {
  const punya = milikSaya(p.id);
  const hemat = p.coret > p.harga && p.harga > 0 ? Math.round((1 - p.harga / p.coret) * 100) : 0;
  const tl = `<span class="badge up ${kat(p.kategori)[1]}" style="backdrop-filter:blur(6px)">${esc(p.kategori)}</span>`;
  const tr = p.rating ? `<span class="glass">${bintang(p.rating, p.ulasan)}</span>` : '';
  const bl = `<span class="row g4">${ic('video', 'xs')} ${p.jmlVideo || 0} Video</span><span class="row g4">${ic('clock', 'xs')} ${jamBelajar(p.totalMenit)} Jam</span>`;
  if (kompak) {
    return `<article class="card hov course">${thumb(p, { tr: `<span class="bm">${ic('bookmark', 'xs')}</span>` })}
      <div class="meta">${badgeKat(p.kategori)}${bintang(p.rating)}</div>
      <h3 class="clamp2"><button data-act="go" data-v="detail" data-p='${JSON.stringify({ id: p.id })}' style="text-align:left">${esc(p.nama)}</button></h3>
      <div class="foot"><div class="row between"><div><div class="xs muted">Biaya</div><b>${p.harga ? rp(p.harga) : 'Gratis'}</b></div>
      ${punya ? `<button class="btn soft sm" data-act="belajar" data-id="${p.id}">Lanjut</button>` : `<button class="btn pri sm" data-act="beli" data-id="${p.id}">Ambil Kelas</button>`}</div></div></article>`;
  }
  return `<article class="card hov course">
    ${thumb(p, { cls: 'v169', tl, tr, bl })}
    <h3 class="clamp2"><button data-act="go" data-v="detail" data-p='${JSON.stringify({ id: p.id })}' style="text-align:left">${esc(p.nama)}</button></h3>
    <div class="inst">${avatar(p.instruktur, 'xs soft')}<div class="col g4" style="gap:0;min-width:0"><b class="small trunc">${esc(p.instruktur || '-')}</b><span class="xs muted trunc">${esc(p.jabatan || '')}</span></div></div>
    <div class="foot">
      <div class="harga-row"><span class="price">${p.harga ? rp(p.harga) : 'Gratis'}</span>${p.coret > p.harga ? `<span class="coret">${rp(p.coret)}</span>` : ''}${hemat ? `<span class="badge bg-ok">Hemat ${hemat}%</span>` : ''}</div>
      <div class="row">${punya ? `<button class="btn soft grow" data-act="belajar" data-id="${p.id}">${ic('play', 'sm fill')}Lanjut Belajar</button>` : `<button class="btn pri grow" data-act="beli" data-id="${p.id}">Beli Sekarang ${ic('arrowR', 'sm')}</button>`}
      <button class="btn sec icon" data-act="go" data-v="detail" data-p='${JSON.stringify({ id: p.id })}' aria-label="Lihat silabus">${ic('book', 'sm')}</button></div>
    </div></article>`;
}
ACT.beli = t => go('checkout', { id: t.dataset.id });

/* ---------------- Katalog ---------------- */
VIEWS.katalog = {
  area: 'any', title: 'Katalog Kelas',
  render() {
    if (!S.katalog.length && S.memuat) return `<div class="page-h"><div><h1>Katalog Kelas</h1><p>Memuat kelas…</p></div></div><div class="course-grid">${Array.from({ length: 4 }, () => '<div class="card"><div class="sk" style="aspect-ratio:16/10;border-radius:16px"></div><div class="pad col g8"><div class="sk" style="height:16px;width:80%"></div><div class="sk" style="height:12px;width:50%"></div><div class="sk" style="height:20px;width:40%"></div></div></div>').join('')}</div>`;
    const kats = {};
    S.katalog.forEach(p => { kats[p.kategori] = (kats[p.kategori] || 0) + 1; });
    const k = S.ui.kat || '';
    const chip = (v, l, n) => `<button class="chip ${k === v ? 'on' : ''}" data-act="filterKat" data-k="${esc(v)}">${esc(l)} <span class="n">${n}</span></button>`;
    return `${S.app.PROMO_BANNER ? `<div class="promo-strip"><div class="row g12"><span class="brand-mark sm" style="box-shadow:none">${ic('tag', 'sm')}</span><div><b>${esc(S.app.PROMO_BANNER)}</b><div class="small muted">Masukkan kode promo di halaman checkout.</div></div></div></div>` : ''}
      <div class="page-h"><div><div class="crumb">${esc(S.app.NAMA_PORTAL)} ${ic('chevR', 'xs')} <b>Katalog</b></div><h1>Katalog Kelas</h1><p>Kelas terstruktur dengan learning path, materi unduhan, dan akses otomatis setelah pembayaran.</p></div>
        <label class="row small muted">Urutkan <select class="inp pill-inp" style="width:auto;min-height:38px" data-chg="urutKatalog">
          ${[['populer', 'Paling Populer'], ['rating', 'Rating Tertinggi'], ['murah', 'Harga Terendah'], ['baru', 'Terbaru']].map(o => `<option value="${o[0]}" ${(S.ui.urut || 'populer') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></label></div>
      <div class="chips mb16">${chip('', 'Semua Kategori', S.katalog.length)}${Object.keys(kats).sort().map(x => chip(x, x, kats[x])).join('')}</div>
      <div id="katalog-grid"></div>
      <div class="card trust"><div class="row g12">${brandMark('sm')}<div><b>Akses Terkelola & Update Gratis</b><div class="small muted">Setiap kelas memberi akses dashboard belajar, learning path, dan materi unduhan.</div></div></div>
        <div class="ti">${ic('zap', 'c-ok')}Aktivasi &lt; 5 Menit</div><div class="ti">${ic('award', 'c-pri')}Sertifikat Digital</div><div class="ti">${ic('users', 'c-warn')}Grup Diskusi</div></div>`;
  },
  after() { gridKatalog(); }
};
function gridKatalog() {
  const el = $('#katalog-grid'); if (!el) return;
  const q = S.ui.q || '', k = S.ui.kat || '', u = S.ui.urut || 'populer';
  let L = S.katalog.filter(p => (!k || p.kategori === k) && cari(p.nama + ' ' + p.kategori + ' ' + p.instruktur + ' ' + p.desk, q));
  L = L.slice().sort((a, b) => u === 'murah' ? a.harga - b.harga : u === 'rating' ? b.rating - a.rating : u === 'baru' ? 0 : (b.unggulan - a.unggulan) || (b.ulasan - a.ulasan));
  el.innerHTML = L.length ? `<div class="course-grid">${L.map(p => kartuKatalog(p)).join('')}</div>` : kosong('search', 'Kelas tidak ditemukan', q ? `Tidak ada kelas yang cocok dengan “${esc(q)}”.` : 'Belum ada kelas yang dipublikasikan.', q ? '<button class="btn soft sm" data-act="resetCari">Hapus pencarian</button>' : '');
}
ACT.filterKat = t => { S.ui.kat = t.dataset.k; render(); };
CHG.urutKatalog = t => { S.ui.urut = t.value; gridKatalog(); };
ACT.resetCari = () => { S.ui.q = ''; const el = $('#cari-top'); if (el) el.value = ''; gridKatalog(); };

/* ---------------- Detail kelas ---------------- */
VIEWS.detail = {
  area: 'any', title: 'Detail Kelas',
  render(p) {
    const k = S.katalog.find(x => x.id === p.id);
    if (!k) return kosong('search', 'Kelas tidak ditemukan', 'Kelas mungkin sudah tidak dipublikasikan.', '<button class="btn pri" data-act="go" data-v="katalog">Lihat katalog</button>');
    const punya = milikSaya(k.id);
    const hemat = k.coret > k.harga && k.harga ? Math.round((1 - k.harga / k.coret) * 100) : 0;
    return `<button class="btn ghost sm mb8" data-act="kembali">${ic('arrowL', 'sm')}Kembali</button>
    <div class="detail"><div class="col g24">
      <div class="card pad-s">${thumb(k, { cls: 'v169', tl: `<span class="badge up ${kat(k.kategori)[1]}">${esc(k.kategori)}</span>`, tr: k.rating ? `<span class="glass">${bintang(k.rating, k.ulasan)}</span>` : '' })}</div>
      <div class="col g12"><h1>${esc(k.nama)}</h1>
        <div class="row wrap g12 small muted"><span class="row g4">${ic('layers', 'sm')}${k.modul.length} modul</span><span class="row g4">${ic('video', 'sm')}${k.jmlVideo} video</span><span class="row g4">${ic('file', 'sm')}${k.jmlMateri} materi</span><span class="row g4">${ic('clock', 'sm')}${durasi(k.totalMenit)}</span><span class="row g4">${ic('calendar', 'sm')}${k.durasiAkses ? 'Akses ' + k.durasiAkses + ' hari' : 'Akses selamanya'}</span></div>
        <p style="white-space:pre-line">${esc(k.desk || '')}</p>
        <div class="row g12 card pad-s" style="margin-top:6px">${avatar(k.instruktur, 'lg')}<div><div class="xs muted">Instruktur</div><b>${esc(k.instruktur || '-')}</b><div class="small muted">${esc(k.jabatan || '')}</div></div></div></div>
      ${k.fasilitas.length ? `<div class="card pad"><h3 class="mb8">Fasilitas yang didapat</h3><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">${k.fasilitas.map(f => `<div class="row small">${ic('checkc', 'sm c-ok')}${esc(f)}</div>`).join('')}</div></div>` : ''}
      <div><div class="sec-h"><div><h2>Silabus & Learning Path</h2><p>Modul dibuka berurutan setelah prasyarat selesai.</p></div></div>
        ${k.modul.map((m, i) => `<div class="acc ${i === 0 ? 'open' : ''}"><button class="acc-h" data-act="acc" aria-expanded="${i === 0}"><span class="mod-h"><span class="n">${i + 1}</span><span>${esc(m.judul)}<div class="xs muted" style="font-weight:500">${m.materi.length} materi</div></span></span>${ic('chevD', 'sm chev')}</button>
          <div class="acc-b">${m.materi.map(x => `<div class="li-mtr"><span class="tico">${ic(ikonTipe(x.t), 'sm')}</span><span class="grow">${esc(x.j)}</span>${x.d ? `<span class="xs muted">${x.d} mnt</span>` : `<span class="badge bg-grey">${esc(x.t)}</span>`}${punya ? '' : ic('lock', 'xs muted')}</div>`).join('') || '<div class="li-mtr muted">Materi segera hadir</div>'}</div></div>`).join('') || kosong('layers', 'Silabus belum tersedia')}</div>
    </div>
    <aside class="sticky"><div class="card pad-l col g16">
      <div><div class="row g8" style="align-items:baseline"><span class="course price" style="font-size:28px;font-weight:800;color:var(--primary-t)">${k.harga ? rp(k.harga) : 'Gratis'}</span>${k.coret > k.harga ? `<span class="coret muted" style="text-decoration:line-through">${rp(k.coret)}</span>` : ''}</div>${hemat ? `<span class="badge bg-ok mt8">Hemat ${hemat}%</span>` : ''}</div>
      ${punya ? `<button class="btn pri lg block" data-act="belajar" data-id="${k.id}">${ic('play', 'sm fill')}Lanjut Belajar</button>` : `<button class="btn pri lg block" data-act="beli" data-id="${k.id}">${ic('bag', 'sm')}Beli Kelas Ini</button>`}
      <div class="col g8 small">${['Akses aktif < 5 menit setelah verifikasi', 'Learning path terstruktur & progres otomatis', 'Kuitansi PDF dikirim ke email'].map(t => `<div class="row">${ic('check', 'sm c-ok')}${t}</div>`).join('')}</div>
      ${S.app.WA_ADMIN ? `<a class="btn sec block" href="https://wa.me/${esc(S.app.WA_ADMIN)}?text=${encodeURIComponent('Halo admin, saya ingin bertanya tentang kelas ' + k.nama)}" target="_blank" rel="noopener">${ic('wa', 'sm')}Tanya Admin</a>` : ''}
    </div></aside></div>`;
  }
};

/* ---------------- Checkout ---------------- */
VIEWS.checkout = {
  area: 'any', title: 'Checkout', live: false,
  render(p) {
    const k = S.katalog.find(x => x.id === p.id);
    if (!k) return kosong('bag', 'Kelas tidak ditemukan', '', '<button class="btn pri" data-act="go" data-v="katalog">Kembali ke katalog</button>');
    if (milikSaya(k.id)) return kosong('checkc', 'Anda sudah memiliki kelas ini', '', `<button class="btn pri" data-act="belajar" data-id="${k.id}">Lanjut belajar</button>`);
    const f = Object.assign({}, LS.get('pk_checkout', {}), S.M ? { nama: S.M.profil.nama, email: S.M.profil.email, wa: hpTampil(S.M.profil.wa) } : {});
    const pr = S.ui.promo && S.ui.promo.id === k.id ? S.ui.promo : null;
    const pot = pr ? pr.potongan : 0;
    const qris = !!S.app.QRIS_URL, metode = S.ui.metode || 'Transfer Bank';
    return `<div class="card pad-s row between wrap mb16"><div class="row g12"><button class="arrow-btn" data-act="kembali" aria-label="Kembali">${ic('arrowL', 'sm')}</button><div><div class="xs c-pri b" style="letter-spacing:.06em">LANGKAH 1 DARI 2</div><h2>Formulir Pendaftaran & Pembayaran</h2></div></div>
      <div class="steps hide-m"><span class="st on"><i>1</i>Data diri</span><span class="ln"></span><span class="st"><i>2</i>Bayar & unggah bukti</span></div></div>
    <form class="checkout" data-sub="buatOrder" novalidate><input type="hidden" name="idProduk" value="${esc(k.id)}">
      <div class="col g16">
        <div class="card pad-l"><div class="row g12 mb16"><span class="num-badge">1</span><h3>Data Diri & Akun Belajar</h3></div>
          <div class="form-grid">
            <div class="field"><label for="co-nama">Nama lengkap sesuai sertifikat <span class="req">*</span></label><div class="inp-ic">${ic('user', 'sm')}<input class="inp" id="co-nama" name="nama" required minlength="3" autocomplete="name" placeholder="Contoh: Dimas Arya Perkasa" value="${esc(f.nama || '')}"></div></div>
            <div class="field"><label for="co-email">Email aktif <span class="req">*</span></label><div class="inp-ic">${ic('mail', 'sm')}<input class="inp" id="co-email" name="email" type="email" required autocomplete="email" inputmode="email" placeholder="nama@email.com" value="${esc(f.email || '')}" ${S.M ? 'readonly' : ''}></div><span class="hint">${ic('info', 'xs')}Detail login, invoice, dan kuitansi dikirim ke email ini.</span></div>
            <div class="field"><label for="co-wa">Nomor WhatsApp aktif <span class="req">*</span></label><div class="inp-ic">${ic('phone', 'sm')}<input class="inp" id="co-wa" name="wa" type="tel" required autocomplete="tel" inputmode="tel" placeholder="0812xxxxxxxx" value="${esc(f.wa || '')}"></div></div>
            <label class="check"><input type="checkbox" name="optIn" ${f.optIn ? 'checked' : ''}><span>Saya setuju menerima info promo, voucher, dan tips belajar via WhatsApp & Email. <span class="muted">(Opsional — bisa berhenti kapan saja)</span></span></label>
          </div></div>
        <div class="card pad-l"><div class="row g12 mb16"><span class="num-badge">2</span><h3>Pilih Metode Pembayaran</h3></div>
          <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
            <button type="button" class="pay-opt ${metode !== 'QRIS' ? 'on' : ''}" data-act="pilihMetode" data-m="Transfer Bank"><span class="logo">${esc(((S.app.REKENING && safeJSON(S.app.REKENING)[0]) || {}).bank || 'BANK')}</span><span><b class="small">Transfer Bank</b><div class="xs muted">Verifikasi cepat dengan kode unik</div></span></button>
            ${qris ? `<button type="button" class="pay-opt ${metode === 'QRIS' ? 'on' : ''}" data-act="pilihMetode" data-m="QRIS"><span class="logo">${ic('qr')}</span><span><b class="small">QRIS</b><div class="xs muted">GoPay, OVO, DANA, ShopeePay</div></span></button>` : ''}
          </div><input type="hidden" name="metode" value="${esc(metode)}">
          <p class="small muted mt12 row">${ic('shield', 'sm c-ok')}Instruksi transfer & nominal tepat muncul setelah pesanan dibuat.</p></div>
      </div>
      <aside class="sticky col g16"><div class="card pad-l">
        <h3 class="mb16">Ringkasan Pesanan</h3>
        <div class="row g12 card pad-s" style="box-shadow:none;background:var(--lav-2)"><div style="width:72px;flex:none">${thumb(k)}</div><div class="grow"><span class="xs b c-pri">${esc(k.kategori).toUpperCase()}</span><div class="small b clamp2">${esc(k.nama)}</div><div class="xs muted">Instruktur: ${esc(k.instruktur || '-')}</div></div></div>
        <div class="field mt16"><label for="co-promo">Kode promo</label><div class="row"><input class="inp" id="co-promo" name="kodePromo" style="text-transform:uppercase" placeholder="Contoh: PROMOEDU" value="${esc(pr ? pr.kode : '')}" data-enter="terapkanPromo"><button type="button" class="btn soft" data-act="terapkanPromo" data-id="${k.id}">Terapkan</button></div>${pr ? `<span class="hint c-ok b">${ic('check', 'xs')}${esc(pr.pesan)}</span>` : ''}</div>
        <div class="mt16" style="border-top:1px solid var(--line);padding-top:12px">
          <div class="sum-line"><span>Harga kelas</span><span>${rp(k.coret > k.harga ? k.coret : k.harga)}</span></div>
          ${k.coret > k.harga ? `<div class="sum-line"><span>Diskon harga</span><span class="c-ok">− ${rp(k.coret - k.harga)}</span></div>` : ''}
          ${pot ? `<div class="sum-line"><span>Kode promo ${esc(pr.kode)}</span><span class="c-ok">− ${rp(pot)}</span></div>` : ''}
          <div class="sum-line"><span>Kode unik verifikasi</span><span class="c-pri b">+ 1–999</span></div>
          <div class="sum-line" style="border-top:1px solid var(--line);margin-top:8px;padding-top:12px"><b>Total (perkiraan)</b><b class="c-pri" style="font-size:20px">${rp(Math.max(0, k.harga - pot))}</b></div></div>
        <button class="btn pri lg block mt16" type="submit">${ic('checkc', 'sm')}Buat Pesanan</button>
        <p class="xs muted center mt8">Dengan memesan Anda menyetujui syarat & ketentuan ${esc(S.app.NAMA_PORTAL)}.</p></div>
        ${S.app.WA_ADMIN ? `<div class="card pad row g12"><span class="brand-mark sm">${ic('msg', 'sm')}</span><div class="grow"><b class="small">Butuh bantuan transaksi?</b><div class="xs muted">Admin siap membantu via WhatsApp.</div></div><a class="btn sec sm" target="_blank" rel="noopener" href="https://wa.me/${esc(S.app.WA_ADMIN)}">Hubungi</a></div>` : ''}
      </aside></form>`;
  }
};
function safeJSON(s, d) { try { return typeof s === 'string' ? JSON.parse(s) : (s || d); } catch (e) { return d || []; } }
ACT.pilihMetode = t => { S.ui.metode = t.dataset.m; $$('.pay-opt').forEach(b => b.classList.toggle('on', b === t)); const h = $('input[name=metode]'); if (h) h.value = t.dataset.m; };
ACT.terapkanPromo = t => {
  const kode = ($('#co-promo') || {}).value || '';
  const id = t.dataset.id || ($('input[name=idProduk]') || {}).value;
  if (!kode.trim()) { S.ui.promo = null; return render(); }
  const b = t.tagName === 'BUTTON' ? t : $('[data-act=terapkanPromo]');
  simpanDraftCheckout(); tombolMuat(b, true, 'Cek…');
  api('cekPromo', kode.trim(), id).then(r => { S.ui.promo = Object.assign({ id: id }, r); toast(r.pesan); render(); })
    .catch(e => { tombolMuat(b, false); S.ui.promo = null; toast(e.message, 'err'); });
};
function simpanDraftCheckout() { const f = $('form[data-sub=buatOrder]'); if (f) { const o = formObj(f); LS.set('pk_checkout', { nama: o.nama, email: o.email, wa: o.wa, optIn: o.optIn }); } }
SUB.buatOrder = (f) => {
  const o = formObj(f);
  const err = [];
  if (o.nama.length < 3) err.push(['co-nama', 'Nama minimal 3 huruf']);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(o.email)) err.push(['co-email', 'Format email tidak valid']);
  if (!/^(\+?62|0)8\d{7,12}$/.test(o.wa.replace(/[\s-]/g, ''))) err.push(['co-wa', 'Nomor WA tidak valid, contoh 0812xxxxxxx']);
  $$('.err-msg', f).forEach(x => x.remove()); $$('.invalid', f).forEach(x => x.classList.remove('invalid'));
  if (err.length) { err.forEach(([id, m]) => { const el = document.getElementById(id); el.classList.add('invalid'); el.closest('.field').insertAdjacentHTML('beforeend', `<span class="err-msg">${m}</span>`); }); document.getElementById(err[0][0]).focus(); return; }
  simpanDraftCheckout();
  const btn = f.querySelector('[type=submit]');
  tombolMuat(btn, true, 'Membuat pesanan…');
  api('buatOrder', o).then(r => {
    simpanPesanan(r);
    if (S.M) { const t = S.M.transaksi || (S.M.transaksi = []); if (!t.find(x => x.id === r.order.id)) t.unshift(r.order); simpanCache(); }
    S.ui.promo = null;
    toast(r.sudahAda ? 'Anda masih punya pesanan aktif untuk kelas ini.' : 'Pesanan dibuat! Silakan selesaikan pembayaran.', r.sudahAda ? 'info' : 'ok');
    go('bayar', { id: r.order.id });
  }).catch(e => { tombolMuat(btn, false); toast(e.message, 'err'); });
};
function simpanPesanan(r) {
  const i = S.orders.findIndex(x => x.order.id === r.order.id);
  const ent = { order: r.order, orderToken: r.orderToken, email: r.email, nama: r.nama, rekening: r.rekening, qris: r.qris };
  if (i > -1) S.orders[i] = Object.assign(S.orders[i], ent); else S.orders.unshift(ent);
  S.orders = S.orders.slice(0, 20);
  LS.set('pk_orders', S.orders);
}

/* ---------------- Pembayaran & unggah bukti ---------------- */
function cariPesanan(id) {
  const e = S.orders.find(x => x.order.id === id);
  if (e) return e;
  const t = S.M && (S.M.transaksi || []).find(x => x.id === id);
  return t ? { order: t, orderToken: '', email: S.M.profil.email, nama: S.M.profil.nama, rekening: safeJSON(S.app.REKENING, []), qris: S.app.QRIS_URL } : null;
}
VIEWS.bayar = {
  area: 'any', title: 'Pembayaran',
  render(p) {
    const e = cariPesanan(p.id);
    if (!e) return kosong('receipt', 'Pesanan tidak ditemukan di perangkat ini', 'Gunakan menu Cek Pesanan dengan nomor order & email.', '<button class="btn pri" data-act="go" data-v="cek">Cek Pesanan</button>');
    const o = e.order, st = o.status;
    const angkaStr = angka(o.nominal), tiga = angkaStr.slice(-3), depan = angkaStr.slice(0, -3);
    const prev = S.bukti[o.id];
    const kepala = `<div class="card pad-s row between wrap mb16"><div class="row g12"><button class="arrow-btn" data-act="kembali" aria-label="Kembali">${ic('arrowL', 'sm')}</button><div><div class="xs c-pri b" style="letter-spacing:.06em">LANGKAH 2 DARI 2</div><h2>Pembayaran ${esc(o.id)}</h2></div></div>
      ${st === 'Menunggu' ? `<span class="countdown">${ic('clock', 'sm')}Batas bayar: <span data-cd="${esc(o.batas)}">--:--:--</span></span>` : pillTrx(st)}</div>`;
    if (st === 'Terverifikasi') {
      return kepala + `<div class="card pad-l center col g12" style="align-items:center;max-width:620px;margin:0 auto"><div class="empty" style="padding:10px"><div class="ico" style="background:var(--ok-bg);color:var(--ok-t)">${ic('checkc', 'lg')}</div></div>
        <h1>Pembayaran terverifikasi 🎉</h1><p class="muted">Akses kelas <b>${esc(o.namaProduk)}</b> sudah aktif. ${S.user ? '' : 'Kode aktivasi telah dikirim ke WhatsApp & email Anda. Masuk dengan email + kode tersebut.'}</p>
        ${S.user ? `<button class="btn pri lg" data-act="belajar" data-id="${o.produk}">${ic('play', 'sm fill')}Mulai Belajar</button>` : `<button class="btn pri lg" data-act="go" data-v="login" data-p='${JSON.stringify({ email: e.email })}'>${ic('login', 'sm')}Masuk ke Dashboard</button>`}</div>`;
    }
    if (st !== 'Menunggu') {
      return kepala + `<div class="card pad-l center" style="max-width:620px;margin:0 auto">${kosong('alert', 'Pesanan ' + st.toLowerCase(), esc(o.catatan || 'Silakan buat pesanan baru atau hubungi admin.'), `<button class="btn pri" data-act="beli" data-id="${o.produk}">Pesan ulang</button>`)}</div>`;
    }
    const rek = (e.rekening && e.rekening.length ? e.rekening : safeJSON(S.app.REKENING, []));
    return kepala + `<div class="checkout"><div class="col g16">
      <div class="amount-box"><div class="small" style="opacity:.85">Total yang harus dibayar (tepat hingga 3 digit terakhir)</div>
        <div class="row between wrap mt8"><div class="big">Rp ${esc(depan)}<em>${esc(tiga)}</em></div><button class="btn white sm" data-act="salinTeks" data-teks="${o.nominal}" data-pesan="Nominal disalin">${ic('copy', 'sm')}Salin nominal</button></div>
        <div class="xs mt8" style="opacity:.8">3 digit terakhir adalah kode unik agar pembayaran Anda dikenali otomatis.</div></div>
      ${o.metode === 'QRIS' && (e.qris || S.app.QRIS_URL) ? `<div class="card pad-l center col g12" style="align-items:center"><h3>Pindai QRIS</h3><img src="${esc(e.qris || S.app.QRIS_URL)}" alt="Kode QRIS pembayaran" style="width:220px;border-radius:16px;border:1px solid var(--line)"><p class="small muted">Masukkan nominal ${rp(o.nominal)} di aplikasi e-wallet Anda.</p></div>` :
        `<div class="card pad-l col g12"><h3>Transfer ke rekening berikut</h3>${rek.map(r => `<div class="rek"><div><div class="xs muted">${esc(r.bank)} · a.n. ${esc(r.atasNama)}</div><div class="no">${esc(String(r.norek).replace(/(\d{4})(?=\d)/g, '$1 '))}</div></div><button class="btn soft sm" data-act="salinTeks" data-teks="${esc(r.norek)}" data-pesan="Nomor rekening disalin">${ic('copy', 'sm')}Salin</button></div>`).join('') || '<p class="muted">Rekening belum diatur admin.</p>'}</div>`}
      <div class="card pad-l col g12"><h3>Unggah bukti transfer</h3>
        ${o.bukti || prev ? `<div class="row g12 card pad-s" style="background:var(--ok-bg);border-color:transparent;box-shadow:none">${prev ? `<img src="${prev}" alt="Pratinjau bukti" style="width:64px;height:64px;object-fit:cover;border-radius:12px">` : `<span class="brand-mark sm" style="background:var(--ok)">${ic('check', 'sm')}</span>`}<div class="grow"><b class="c-ok">Bukti terkirim</b><div class="small muted">Admin memverifikasi dalam ± 5 menit pada jam kerja. Anda akan menerima WA & email.</div></div><label class="btn sec sm" style="cursor:pointer">Ganti<input type="file" accept="image/png,image/jpeg,application/pdf" class="sr" data-chg="unggahBukti" data-id="${esc(o.id)}"></label></div>` :
        `<label class="drop" tabindex="0"><span class="ico">${ic('upload')}</span><b class="c-pri">Pilih foto/PDF bukti transfer</b><span class="xs muted">JPG, PNG, atau PDF • maks ${esc(S.app.MAX_BUKTI_MB || 5)} MB • foto dikompres otomatis</span><input type="file" accept="image/png,image/jpeg,application/pdf" class="sr" data-chg="unggahBukti" data-id="${esc(o.id)}"></label>`}
        <button class="btn sec" data-act="cekStatus" data-id="${esc(o.id)}">${ic('refresh', 'sm')}Cek status pembayaran</button></div>
    </div>
    <aside class="sticky col g16"><div class="card pad-l"><h3 class="mb16">Rincian Pesanan</h3>
      <div class="sum-line"><span>No. Order</span><b>${esc(o.id)}</b></div><div class="sum-line"><span>Kelas</span><b class="right" style="max-width:60%">${esc(o.namaProduk)}</b></div>
      <div class="sum-line"><span>Harga</span><span>${rp(o.harga)}</span></div>${o.potongan ? `<div class="sum-line"><span>Potongan ${esc(o.promo)}</span><span class="c-ok">− ${rp(o.potongan)}</span></div>` : ''}
      <div class="sum-line"><span>Kode unik</span><span class="c-pri b">+ ${rp(o.kodeUnik)}</span></div>
      <div class="sum-line" style="border-top:1px solid var(--line);margin-top:8px;padding-top:12px"><b>Total</b><b class="c-pri" style="font-size:20px">${rp(o.nominal)}</b></div>
      <div class="sum-line"><span>Atas nama</span><span>${esc(e.nama)}</span></div><div class="sum-line"><span>Email</span><span class="trunc">${esc(e.email)}</span></div></div>
      <div class="card pad small muted row top g12">${ic('info', 'sm c-pri')}<span>Simpan nomor order <b>${esc(o.id)}</b>. Anda bisa kembali ke halaman ini dari menu <b>Cek Pesanan</b>.</span></div></aside></div>`;
  }
};
CHG.unggahBukti = (t) => {
  const id = t.dataset.id, e = cariPesanan(id), f = t.files && t.files[0];
  if (!e || !f) return;
  bacaFile(f, { maxMB: Number(S.app.MAX_BUKTI_MB) || 5, kompres: true, tipe: /^(image\/(jpeg|png)|application\/pdf)$/ }).then(file => {
    const lama = { bukti: e.order.bukti, prev: S.bukti[id] };
    optimis({
      ubah: () => { e.order.bukti = true; S.bukti[id] = /^image/.test(file.mime) ? file.preview : ''; },
      kirim: () => api('unggahBukti', e.orderToken, id, { mime: file.mime, data: file.data }, S.token),
      sukses: () => { toast('Bukti bayar terkirim. Admin segera memverifikasi.'); LS.set('pk_orders', S.orders); simpanCache(); },
      balik: () => { e.order.bukti = lama.bukti; S.bukti[id] = lama.prev; },
      pesanGagal: 'Unggah gagal'
    }).catch(() => { });
  }).catch(err => toast(err.message, 'err'));
};
ACT.cekStatus = t => {
  const e = cariPesanan(t.dataset.id); if (!e) return;
  tombolMuat(t, true, 'Mengecek…');
  api('cekPesanan', e.order.id, e.email).then(r => {
    simpanPesanan(r);
    if (S.M) { const x = (S.M.transaksi || []).find(z => z.id === r.order.id); if (x) Object.assign(x, r.order); }
    toast('Status: ' + r.order.status, r.order.status === 'Terverifikasi' ? 'ok' : 'info'); render();
  }).catch(err => { tombolMuat(t, false); toast(err.message, 'err'); });
};
/* hitung mundur batas bayar — satu timer untuk semua elemen [data-cd] */
setInterval(() => {
  $$('[data-cd]').forEach(el => {
    const s = Math.max(0, Math.floor((new Date(el.dataset.cd).getTime() - Date.now()) / 1000));
    el.textContent = s ? [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':') : 'lewat batas';
  });
}, 1000);

/* ---------------- Cek pesanan ---------------- */
VIEWS.cek = {
  area: 'any', title: 'Cek Pesanan', live: false,
  render() {
    return `<div class="page-h"><div><h1>Cek Pesanan</h1><p>Lihat status pembayaran & unggah bukti dari perangkat mana pun.</p></div></div>
    <div class="adm-grid2"><form class="card pad-l col g16" data-sub="cekPesanan"><h3>Cari pesanan</h3>
      <div class="field"><label for="ck-id">Nomor order</label><input class="inp" id="ck-id" name="id" required placeholder="ORD-20261108-001" style="text-transform:uppercase"></div>
      <div class="field"><label for="ck-email">Email saat memesan</label><input class="inp" id="ck-email" name="email" type="email" required placeholder="nama@email.com"></div>
      <button class="btn pri" type="submit">${ic('search', 'sm')}Cek Status</button></form>
      <div class="card pad-l"><h3 class="mb16">Pesanan di perangkat ini</h3>${S.orders.length ? S.orders.map(e => `<button class="dl-row" style="width:100%;text-align:left" data-act="go" data-v="bayar" data-p='${JSON.stringify({ id: e.order.id })}'><span class="ftype ft-Video">${ic('receipt', 'sm')}</span><span class="grow"><b class="small">${esc(e.order.namaProduk)}</b><div class="xs muted">${esc(e.order.id)} · ${rp(e.order.nominal)}</div></span>${pillTrx(e.order.status)}</button>`).join('') : kosong('receipt', 'Belum ada pesanan', 'Pesanan yang Anda buat di perangkat ini akan muncul di sini.')}</div></div>`;
  }
};
SUB.cekPesanan = f => {
  const o = formObj(f), b = f.querySelector('[type=submit]');
  tombolMuat(b, true, 'Mencari…');
  api('cekPesanan', o.id.toUpperCase(), o.email).then(r => { simpanPesanan(r); go('bayar', { id: r.order.id }); })
    .catch(e => { tombolMuat(b, false); toast(e.message, 'err'); });
};

/* ---------------- Login ---------------- */
VIEWS.login = {
  area: 'pub', title: 'Masuk', live: false,
  render(p) {
    if (S.user) { setTimeout(() => go(landing(), {}, { noHist: true })); return ''; }
    hangatkan('admin');                     // siapkan cache server selagi pengguna mengetik (maks. 1x/4 mnt)
    return `<div class="login-wrap"><div class="card login-split"><div class="login-art"><div style="position:absolute;inset:0;opacity:.9">${ilustrasiHero()}</div><div style="position:relative"><h2 style="color:#fff;font-size:24px">Belajar terarah, progres terukur.</h2><p style="opacity:.85;margin-top:8px">Learning path bertahap, materi unduhan, dan statistik belajar harian dalam satu ruang.</p></div></div>
      <form class="login-card col g16" data-sub="login"><div class="row g12">${brandMark()}<div><h1 style="font-size:22px">Masuk</h1><p class="small muted">${esc(S.app.NAMA_PORTAL)} · ${esc(S.app.NAMA_ALT || '')}</p></div></div>
        <div class="field"><label for="lg-email">Email</label><div class="inp-ic">${ic('mail', 'sm')}<input class="inp" id="lg-email" name="email" type="email" required autocomplete="username" inputmode="email" placeholder="nama@email.com" value="${esc(p.email || LS.get('pk_last_email', ''))}"></div></div>
        <div class="field"><label for="lg-pw">Sandi atau kode aktivasi</label><div class="inp-ic">${ic('key', 'sm')}<input class="inp" id="lg-pw" name="rahasia" type="password" required autocomplete="current-password" placeholder="Sandi / kode 6 huruf dari WA & email" style="padding-right:48px"><button type="button" class="btn ghost icon sm" style="position:absolute;right:4px;top:5px" data-act="lihatSandi" aria-label="Tampilkan sandi">${ic('eye', 'sm')}</button></div>
          <span class="hint">Pembeli baru: gunakan <b>kode aktivasi</b> yang dikirim setelah pembayaran terverifikasi.</span></div>
        <button class="btn pri lg block" type="submit">${ic('login', 'sm')}Masuk</button>
        <div class="row between wrap small"><button type="button" class="c-pri b" data-act="lupaSandi">Lupa sandi / minta kode login</button><button type="button" class="muted" data-act="go" data-v="katalog">Lihat katalog</button></div></form></div></div>`;
  }
};
ACT.lihatSandi = () => { const i = $('#lg-pw'); if (i) i.type = i.type === 'password' ? 'text' : 'password'; };
ACT.lupaSandi = () => {
  tanya('Kirim kode login', { pesan: 'Masukkan email akun Anda. Kode login sekali pakai akan dikirim ke WhatsApp & email.', placeholder: 'nama@email.com', nilai: ($('#lg-email') || {}).value || '', ok: 'Kirim kode' }).then(email => {
    if (!email) return;
    api('lupaSandi', email).then(m => toast(m, 'info', { ms: 6000 })).catch(e => toast(e.message, 'err'));
  });
};
SUB.login = f => {
  const o = formObj(f), b = f.querySelector('[type=submit]');
  tombolMuat(b, true, 'Memeriksa…');
  LS.set('pk_last_email', o.email);
  api('login', o.email, o.rahasia, location.origin + location.pathname).then(r => masuk(r)).catch(e => { tombolMuat(b, false); toast(e.message, 'err'); const p = $('#lg-pw'); if (p) { p.select(); p.classList.add('invalid'); } });
};
function masuk(r) {
  setSesi(r.token, r.user);
  if (r.user.peran === 'member') S.M = r.boot; else S.A = r.boot;
  S.sinkron = Date.now();
  simpanCache();
  toast('Selamat datang, ' + r.user.nama.split(' ')[0] + '!');
  const last = LS.get('pk_view_' + r.user.id, null);
  go(last && VIEWS[last[0]] && VIEWS[last[0]].area !== 'pub' ? last[0] : landing(), last ? last[1] : {}, { noHist: true });
  if (r.user.wajibGanti) setTimeout(() => modalSandi(true), 400);
}
function modalSandi(wajib) {
  const w = modal({
    title: wajib ? 'Buat sandi baru' : 'Ganti sandi', size: 'sm',
    body: `<form class="col g12" id="f-sandi">${wajib ? '<p class="small muted">Anda masuk memakai kode aktivasi. Buat sandi agar bisa masuk kapan saja.</p>' : `<div class="field"><label for="sd-lama">Sandi lama</label><input class="inp" id="sd-lama" type="password" autocomplete="current-password" required></div>`}
      <div class="field"><label for="sd-baru">Sandi baru (min. 8 karakter)</label><input class="inp" id="sd-baru" type="password" autocomplete="new-password" minlength="8" required></div>
      <div class="field"><label for="sd-ulang">Ulangi sandi baru</label><input class="inp" id="sd-ulang" type="password" autocomplete="new-password" required></div></form>`,
    foot: `${wajib ? '<button class="btn ghost" data-act="tutupModal">Nanti saja</button>' : '<button class="btn sec" data-act="tutupModal">Batal</button>'}<button class="btn pri" data-k="ok">Simpan sandi</button>`
  });
  w.querySelector('[data-k=ok]').onclick = ev => {
    const baru = w.querySelector('#sd-baru').value, ulang = w.querySelector('#sd-ulang').value, lama = (w.querySelector('#sd-lama') || {}).value || '';
    if (baru.length < 8) return toast('Sandi minimal 8 karakter', 'err');
    if (baru !== ulang) return toast('Ulangi sandi tidak sama', 'err');
    tombolMuat(ev.currentTarget, true, 'Menyimpan…');
    api('gantiSandi', S.token, lama, baru).then(r => { setSesi(r.token, Object.assign(S.user, { wajibGanti: false })); if (S.M) S.M.profil.punyaSandi = true; tutupModal(w); toast('Sandi tersimpan.'); })
      .catch(e => { tombolMuat(ev.currentTarget, false); toast(e.message, 'err'); });
  };
}
ACT.gantiSandi = () => modalSandi(false);
ACT.keluar = () => konfirmasi('Keluar dari akun ini?', { ok: 'Keluar' }).then(ya => {
  if (!ya) return;
  flushBelajar && flushBelajar();
  LS.del(kunciCache()); setSesi(null, null); S.M = null; S.A = null; S.hist = [];
  go('katalog', {}, { noHist: true });
  toast('Anda telah keluar.', 'info');
});

/* ---------- Berhenti langganan promosi (tautan di WA/email: ?unsub=TOKEN) ---------- */
VIEWS.berhenti = {
  area: 'any', title: 'Berhenti Langganan', live: false,
  render(p) {
    const st = S.ui.berhenti || {};
    return `<div class="login-wrap"><div class="card pad-l col g16" style="max-width:480px;margin:0 auto;text-align:center;align-items:center">
      <span class="brand-mark lg" aria-hidden="true">${ic(st.ok ? 'checkc' : 'mail')}</span>
      <h1 style="font-size:22px">${st.ok ? 'Berhasil berhenti berlangganan' : 'Berhenti menerima info promosi?'}</h1>
      <p class="muted">${st.ok ? 'Anda tidak akan menerima pesan promosi lagi. Notifikasi penting (pembayaran, akses kelas) tetap dikirim.' : 'Pesan promosi dan broadcast tidak akan dikirim lagi ke WhatsApp & email Anda. Notifikasi transaksi tetap dikirim.'}</p>
      ${st.err ? `<p class="small c-err">${esc(st.err)}</p>` : ''}
      ${st.ok ? `<button class="btn pri" data-act="go" data-v="katalog">Lihat katalog kelas</button>` : `<div class="row g8 wrap" style="justify-content:center"><button class="btn sec" data-act="go" data-v="katalog">Batal</button><button class="btn pri" data-act="konfirmBerhenti">Ya, berhenti berlangganan</button></div>`}</div></div>`;
  }
};
ACT.konfirmBerhenti = t => {
  tombolMuat(t, true, 'Memproses…');
  api('berhentiLangganan', S.params.tok).then(() => { S.ui.berhenti = { ok: true }; render(); })
    .catch(e => { S.ui.berhenti = { err: e.message }; render(); });
};
