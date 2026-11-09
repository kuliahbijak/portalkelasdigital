/* ==========================================================================
   DASHBOARD ADMIN (3/3): Notifikasi otomatis, Broadcast, Laporan, Pengaturan
   ========================================================================== */
const VAR_TPL = ['nama', 'produk', 'order', 'total', 'batas', 'rekening', 'link', 'email', 'portal', 'info_login', 'kode', 'alasan', 'tgl_berakhir', 'materi', 'hari', 'progres', 'kelas', 'unsub'];
function nilaiSet(k) { const p = S.A && S.A.pengaturan; return p && p.nilai ? (p.nilai[k] || '') : (S.app[k] || ''); }

/* ---------------- Notifikasi otomatis ---------------- */
function nUI() { return S.ui.notif || (S.ui.notif = { tab: 'antrean', status: '', kanal: '', data: null, memuat: false }); }
VIEWS['a-notif'] = {
  area: 'adm', title: 'Notifikasi Otomatis', live: () => nUI().tab !== 'konfig',
  render() {
    if (!S.A) return skeleton(4, 80);
    const u = nUI(), sa = SA();
    const tab = (id, l) => `<button class="${u.tab === id ? 'on' : ''}" data-act="nTab" data-t="${id}">${l}</button>`;
    let isi = '';
    if (u.tab === 'antrean' || u.tab === 'log') isi = isiAntrean(u);
    else if (u.tab === 'matriks') isi = isiMatriks();
    else isi = isiKonfig();
    return `<div class="page-h"><div><div class="crumb">Komunikasi ${ic('chevR', 'xs')}<b>Notifikasi Otomatis</b></div><h1>Notifikasi WhatsApp & Email</h1><p>Semua pesan masuk antrean dan dikirim bertahap oleh trigger tiap 1 menit (anti-timeout, percobaan ulang 3×).</p></div></div>
      <div class="tabs">${tab('antrean', 'Antrean')}${tab('log', 'Log Terkirim')}${sa ? tab('matriks', 'Matriks & Templat') + tab('konfig', 'Konfigurasi WA & Email') : ''}</div>${isi}`;
  },
  after() { const u = nUI(); if ((u.tab === 'antrean' || u.tab === 'log') && !u.data && !u.memuat) muatAntrean(); }
};
ACT.nTab = t => { const u = nUI(); u.tab = t.dataset.t; u.data = null; render(); };
function muatAntrean() {
  const u = nUI(); u.memuat = true;
  api('ambilAntrean', S.token, { log: u.tab === 'log', status: u.status, kanal: u.kanal }).then(r => { u.data = r; u.memuat = false; if (S.view === 'a-notif') rerender(); }).catch(e => { u.memuat = false; toast(e.message, 'err'); });
}
function isiAntrean(u) {
  const d = u.data, rk = (d && d.ringkas) || {}, log = u.tab === 'log';
  const kp = (s, l, cls, ikon) => `<div class="card kpi klik" data-act="nStatus" data-s="${s}" style="${u.status === s ? 'border-color:var(--primary)' : ''}"><div class="row between"><span class="lab">${l}</span><span class="ico ${cls}" style="width:34px;height:34px">${ic(ikon, 'sm')}</span></div><div class="val" style="font-size:24px">${angka(rk[s] || 0)}</div></div>`;
  return `${log ? '' : `<div class="kpi4 mb16">${kp('Menunggu', 'Menunggu', 'bg-warn', 'clock')}${kp('Terkirim', 'Terkirim', 'bg-ok', 'checkc')}${kp('Gagal', 'Gagal', 'bg-err', 'xc')}${kp('Batal', 'Dibatalkan', 'bg-grey', 'x')}</div>`}
    <div class="card pad"><div class="toolbar mb16"><div class="seg">${['', 'WA', 'EMAIL'].map(k => `<button class="${u.kanal === k ? 'on' : ''}" data-act="nKanal" data-k="${k}">${k || 'Semua kanal'}</button>`).join('')}</div>
      ${u.status ? `<span class="chip on" data-act="nStatus" data-s="">Status: ${esc(u.status)} ✕</span>` : ''}<span class="grow"></span>
      <button class="btn sec sm" data-act="nMuat">${ic('refresh', 'sm')}Muat ulang</button>${log ? '' : `<button class="btn soft sm" data-act="nProses">${ic('send', 'sm')}Proses sekarang</button>${SA() ? `<button class="btn sec sm" data-act="nUlangi">Ulangi yang gagal</button>` : ''}`}</div>
      ${!d ? skeleton(6, 44) : `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Kanal</th><th>Tujuan</th><th>Event</th><th>Pesan</th><th>Status</th></tr></thead><tbody>
        ${d.rows.map(r => `<tr class="klik" data-act="nLihat" data-i="${esc(r.ID_Antrean || r.ID_Log)}"><td class="nowrap xs">${tglJam(r.Dibuat_Pada || r.Waktu_Kirim)}</td><td><span class="badge ${r.Kanal === 'WA' ? 'bg-ok' : 'bg-info'}">${r.Kanal === 'WA' ? 'WhatsApp' : 'Email'}</span></td>
          <td class="small"><b>${esc(r.Nama_Penerima || '')}</b><div class="xs muted mono">${esc(r.Kanal === 'WA' ? hpTampil(r.Tujuan) : r.Tujuan)}</div></td><td><span class="xs b">${esc(r.Event || '')}</span>${r.Jenis === 'Promosi' ? ' <span class="badge bg-pink">promo</span>' : ''}</td>
          <td class="small" style="max-width:300px"><span class="clamp2">${esc(r.Subjek || r.Isi_Final || r.Ringkasan || '')}</span></td>
          <td class="nowrap">${pillNotif(r.Status)}${r.Percobaan ? `<div class="xs muted">percobaan ${r.Percobaan}</div>` : ''}${r.Pesan_Error ? `<div class="xs c-err" style="max-width:200px">${esc(potong(r.Pesan_Error, 60))}</div>` : ''}</td></tr>`).join('') || `<tr><td colspan="6">${kosong('inbox', 'Antrean kosong', 'Tidak ada pesan dengan filter ini.')}</td></tr>`}</tbody></table></div>`}</div>`;
}
function pillNotif(s) { return `<span class="pill ${{ Menunggu: 'bg-warn', Terkirim: 'bg-ok', Gagal: 'bg-err', Batal: 'bg-grey' }[s] || 'bg-lav'}">${esc(s)}</span>`; }
ACT.nStatus = t => { const u = nUI(); u.status = u.status === t.dataset.s ? '' : t.dataset.s; u.data = null; render(); };
ACT.nKanal = t => { const u = nUI(); u.kanal = t.dataset.k; u.data = null; render(); };
ACT.nMuat = () => { nUI().data = null; render(); };
ACT.nLihat = t => { const d = nUI().data, r = d && d.rows.find(x => (x.ID_Antrean || x.ID_Log) === t.dataset.i); if (!r) return; modal({ title: (r.Kanal === 'WA' ? 'WhatsApp' : 'Email') + ' · ' + (r.Event || ''), body: `<div class="col g12"><div class="small muted">Kepada ${esc(r.Nama_Penerima || '')} · ${esc(r.Tujuan)}</div>${r.Subjek ? `<b>${esc(r.Subjek)}</b>` : ''}<div class="wa-wrap"><div class="wa-bubble">${esc(r.Isi_Final || r.Ringkasan || '')}</div></div>${r.Pesan_Error ? `<p class="small c-err">${esc(r.Pesan_Error)}</p>` : ''}</div>` }); };
ACT.nProses = t => { tombolMuat(t, true, 'Memproses…'); api('prosesSekarang', S.token).then(r => { tombolMuat(t, false); toast(`Terkirim: ${r.wa || 0} WA, ${r.email || 0} email${r.gagal ? ', ' + r.gagal + ' gagal' : ''}${r.info ? ' (' + r.info + ')' : ''}`); nUI().data = null; render(); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
ACT.nUlangi = t => { tombolMuat(t, true, '…'); api('ulangiGagal', S.token).then(r => { tombolMuat(t, false); toast(r.diulang + ' pesan dijadwalkan ulang'); nUI().data = null; render(); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
function isiMatriks() {
  const T = S.A.template || [], ev = {};
  T.forEach(t => { (ev[t.Kode_Event] = ev[t.Kode_Event] || {})[t.Kanal] = t; });
  const waOn = nilaiSet('NOTIF_WA_AKTIF') === 'YA', emOn = nilaiSet('NOTIF_EMAIL_AKTIF') === 'YA';
  return `${!waOn || !emOn ? `<div class="card pad-s mb16 row g8" style="border-color:var(--warn)">${ic('alert', 'sm c-warn')}<span class="small">${!waOn ? 'Saklar utama WhatsApp <b>nonaktif</b>. ' : ''}${!emOn ? 'Saklar utama Email <b>nonaktif</b>. ' : ''}Atur di tab Konfigurasi.</span></div>` : ''}
    <div class="card pad"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kejadian (event)</th><th>Jenis</th><th class="center">WhatsApp</th><th class="center">Email</th><th></th></tr></thead><tbody>
    ${Object.keys(ev).map(k => { const e = ev[k], any = e.WA || e.EMAIL; return `<tr><td><b class="small">${esc(any.Label_Event || k)}</b><div class="xs muted mono">${esc(k)}</div></td><td><span class="badge ${any.Jenis === 'Promosi' ? 'bg-pink' : 'bg-info'}">${esc(any.Jenis)}</span></td>
      ${['WA', 'EMAIL'].map(kn => `<td class="center">${e[kn] ? `<label class="switch" style="justify-content:center"><input type="checkbox" data-chg="tplStatus" data-id="${e[kn].ID_Template}" ${e[kn].Status === 'Aktif' ? 'checked' : ''} ${(kn === 'WA' ? waOn : emOn) ? '' : 'disabled'} aria-label="${kn} ${esc(k)}"></label>` : '—'}</td>`).join('')}
      <td><button class="btn soft xs" data-act="editTpl" data-ev="${esc(k)}">${ic('edit', 'xs')}Templat</button></td></tr>`; }).join('')}</tbody></table></div>
    <p class="xs muted mt12">Pesan berjenis <b>Promosi</b> hanya dikirim ke kontak yang memberi persetujuan (opt-in) dan otomatis memuat tautan berhenti berlangganan.</p></div>`;
}
CHG.tplStatus = t => { const x = S.A.template.find(z => z.ID_Template === t.dataset.id); const lama = x.Status; optimis({ ubah: () => { x.Status = t.checked ? 'Aktif' : 'Nonaktif'; }, kirim: () => api('simpanData', S.token, 'Template_Notifikasi', [{ ID_Template: x.ID_Template, Status: x.Status }]), sukses: () => simpanCache(), balik: () => { x.Status = lama; }, pesanGagal: 'Gagal menyimpan' }).catch(() => { }); };
ACT.editTpl = t => {
  const ev = t.dataset.ev, T = S.A.template.filter(x => x.Kode_Event === ev);
  let kn = T.find(x => x.Status === 'Aktif') ? T.find(x => x.Status === 'Aktif').Kanal : T[0].Kanal;
  const w = modal({ title: 'Templat: ' + (T[0].Label_Event || ev), size: 'lg', body: '<div id="tpl-isi"></div>', foot: `<button class="btn sec" data-act="tutupModal">Tutup</button><button class="btn pri" data-k="ok">${ic('check', 'sm')}Simpan templat</button>` });
  const draf = {}; T.forEach(x => { draf[x.Kanal] = { Judul: x.Judul, Isi_Template: x.Isi_Template }; });
  const gambar = () => {
    const d = draf[kn], cth = { nama: 'Dimas', produk: 'Frontend React Modern', order: 'ORD-20261108-042', total: 'Rp 249.042', batas: '09 Nov 2026 14:22 WIB', rekening: '• BCA 8830192844 a.n. PortalKelas', link: S.app.PWA_URL || '(tautan aplikasi)', email: 'dimas@contoh.id', portal: S.app.NAMA_PORTAL, info_login: 'Kode aktivasi: *K7P2QX*', kode: 'K7P2QX', alasan: 'Nominal kurang', tgl_berakhir: '30 Nov 2026', materi: 'Hooks Lanjutan', hari: 7, progres: '42%', kelas: 'Frontend React', unsub: '(tautan berhenti)' };
    const prev = String(d.Isi_Template).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => cth[k] != null ? cth[k] : m);
    $('#tpl-isi', w).innerHTML = `<div class="seg mb16">${T.map(x => `<button class="${kn === x.Kanal ? 'on' : ''}" data-kn="${x.Kanal}">${x.Kanal === 'WA' ? 'WhatsApp' : 'Email'}</button>`).join('')}</div>
      <div class="adm-grid2"><div class="col g12">${kn === 'EMAIL' ? `<div class="field"><label for="tp-j">Subjek email</label><input class="inp" id="tp-j" value="${esc(d.Judul)}"></div>` : ''}
        <div class="field"><label for="tp-i">Isi pesan</label><textarea class="inp" id="tp-i" style="min-height:220px">${esc(d.Isi_Template)}</textarea><span class="hint">*teks* = tebal di WhatsApp & email.</span></div>
        <div class="row wrap g4">${VAR_TPL.map(v => `<button class="lbl-chip" data-var="${v}" style="cursor:pointer">{{${v}}}</button>`).join('')}</div></div>
      <div><div class="lbl mb8">Pratinjau</div>${kn === 'EMAIL' ? `<div class="card pad-s" style="box-shadow:none"><b class="small">${esc(String(d.Judul).replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => cth[k] != null ? cth[k] : m))}</b><div class="small mt8" style="white-space:pre-wrap">${esc(prev).replace(/\*([^*\n]+)\*/g, '<b>$1</b>')}</div></div>` : `<div class="wa-wrap"><div class="wa-bubble">${esc(prev).replace(/\*([^*\n]+)\*/g, '<b>$1</b>')}</div></div>`}</div></div>`;
    $$('[data-kn]', w).forEach(b => b.onclick = () => { simpanDraf(); kn = b.dataset.kn; gambar(); });
    $$('[data-var]', w).forEach(b => b.onclick = () => { const ta = $('#tp-i', w), v = '{{' + b.dataset.var + '}}', p = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, p) + v + ta.value.slice(p); ta.focus(); simpanDraf(); });
    $('#tp-i', w).oninput = debounce(() => { simpanDraf(); const pos = $('#tp-i', w).selectionStart; gambar(); const ta = $('#tp-i', w); ta.focus(); ta.setSelectionRange(pos, pos); }, 400);
  };
  const simpanDraf = () => { const d = draf[kn]; d.Isi_Template = $('#tp-i', w).value; const j = $('#tp-j', w); if (j) d.Judul = j.value; };
  gambar();
  w.querySelector('[data-k=ok]').onclick = ev2 => {
    simpanDraf();
    const rows = T.map(x => ({ ID_Template: x.ID_Template, Judul: draf[x.Kanal].Judul, Isi_Template: draf[x.Kanal].Isi_Template }));
    tombolMuat(ev2.currentTarget, true, 'Menyimpan…');
    api('simpanData', S.token, 'Template_Notifikasi', rows).then(r => { upsertArr(S.A.template, r.rows, 'ID_Template'); simpanCache(); tutupModal(w); toast('Templat tersimpan'); }).catch(e => { tombolMuat(ev2.currentTarget, false); toast(e.message, 'err'); });
  };
};
function isiKonfig() {
  const P = S.A.pengaturan || {}, v = k => nilaiSet(k);
  const jeda = v('WA_JEDA_DETIK') || '5', batch = v('WA_BATCH_DEFAULT') || '20';
  return `<form id="f-konfig" class="adm-grid2">
    <div class="card pad-l col g16"><div class="row between"><h3 class="row g8">${ic('wa', 'c-ok')}WhatsApp (Fonnte)</h3><label class="switch"><input type="checkbox" name="NOTIF_WA_AKTIF" ${v('NOTIF_WA_AKTIF') === 'YA' ? 'checked' : ''}>${v('NOTIF_WA_AKTIF') === 'YA' ? 'AKTIF' : 'NONAKTIF'}</label></div>
      <div class="field"><label for="kf-tok">Token Fonnte</label><input class="inp" id="kf-tok" name="FONNTE_TOKEN" type="password" autocomplete="off" placeholder="${P.adaToken ? esc(P.fonnteMask) + ' (tersimpan — kosongkan bila tidak diganti)' : 'Tempel token dari fonnte.com › Device'}"><span class="hint">${ic('shield', 'xs')}Disimpan di Script Properties, tidak pernah dikirim ke browser.</span></div>
      <div class="row wrap g8"><button type="button" class="btn sec sm" data-act="cekDevice">${ic('activity', 'sm')}Cek perangkat</button><input class="inp" id="kf-tesno" placeholder="08… nomor tes" style="width:160px;min-height:36px"><button type="button" class="btn sec sm" data-act="tesWA">Kirim tes WA</button></div><div id="kf-dev" class="small"></div>
      <div class="field"><label>Ukuran batch broadcast</label><div class="seg" id="kf-batch">${['10', '20', '50'].map(b => `<button type="button" class="${batch === b ? 'on' : ''}" data-b="${b}">${b} pesan</button>`).join('')}</div><input type="hidden" name="WA_BATCH_DEFAULT" value="${esc(batch)}"></div>
      <div class="field"><label for="kf-jeda">Jeda antarpesan (detik)</label><input class="inp" id="kf-jeda" name="WA_JEDA_DETIK" value="${esc(jeda)}" placeholder="5 atau 3-8 (acak)"><span class="hint">Jeda acak (mis. 3-8) membantu mencegah nomor diblokir WhatsApp.</span></div>
      <label class="switch"><input type="checkbox" name="WA_DETEKSI_OTOMATIS" ${v('WA_DETEKSI_OTOMATIS') === 'YA' ? 'checked' : ''}>Deteksi otomatis nomor kontak baru terdaftar WhatsApp</label></div>
    <div class="col g16"><div class="card pad-l col g16"><div class="row between"><h3 class="row g8">${ic('mail', 'c-pri')}Email</h3><label class="switch"><input type="checkbox" name="NOTIF_EMAIL_AKTIF" ${v('NOTIF_EMAIL_AKTIF') === 'YA' ? 'checked' : ''}>${v('NOTIF_EMAIL_AKTIF') === 'YA' ? 'AKTIF' : 'NONAKTIF'}</label></div>
      <div class="row between small"><span class="muted">Sisa kuota hari ini</span><b>${P.kuotaEmail == null ? '—' : angka(P.kuotaEmail) + ' email'}</b></div>
      <div class="field"><label for="kf-nm">Nama pengirim</label><input class="inp" id="kf-nm" name="EMAIL_NAMA_PENGIRIM" value="${esc(v('EMAIL_NAMA_PENGIRIM'))}"></div>
      <div class="field"><label for="kf-rep">Email balasan (reply-to)</label><input class="inp" id="kf-rep" name="EMAIL_KONTAK" type="email" value="${esc(v('EMAIL_KONTAK'))}"></div>
      <div class="row g8"><input class="inp" id="kf-tesem" type="email" placeholder="email tes" style="min-height:36px"><button type="button" class="btn sec sm" data-act="tesEmail">Kirim tes</button></div></div>
      <div class="card pad-l col g12"><h3>Status sistem</h3><div class="row between small"><span>Trigger antrean (1 menit)</span>${P.trigger && P.trigger.antrean ? '<span class="badge bg-ok">aktif</span>' : '<span class="badge bg-err">belum</span>'}</div><div class="row between small"><span>Trigger harian (06.00)</span>${P.trigger && P.trigger.harian ? '<span class="badge bg-ok">aktif</span>' : '<span class="badge bg-err">belum</span>'}</div>
        <div class="row between small"><span>WA admin (alert bukti bayar)</span><b>${esc(hpTampil(v('WA_ADMIN'))) || '<span class="c-warn">belum diisi</span>'}</b></div>
        <button type="button" class="btn pri" data-act="simpanKonfig">${ic('check', 'sm')}Simpan konfigurasi</button></div></div></form>`;
}
document.addEventListener('click', e => { const b = e.target.closest('#kf-batch [data-b]'); if (!b) return; $$('#kf-batch button').forEach(x => x.classList.toggle('on', x === b)); $('#f-konfig [name=WA_BATCH_DEFAULT]').value = b.dataset.b; });
ACT.simpanKonfig = t => {
  const o = formObj($('#f-konfig'));
  const body = { NOTIF_WA_AKTIF: o.NOTIF_WA_AKTIF ? 'YA' : 'TIDAK', NOTIF_EMAIL_AKTIF: o.NOTIF_EMAIL_AKTIF ? 'YA' : 'TIDAK', WA_DETEKSI_OTOMATIS: o.WA_DETEKSI_OTOMATIS ? 'YA' : 'TIDAK', WA_BATCH_DEFAULT: o.WA_BATCH_DEFAULT, WA_JEDA_DETIK: o.WA_JEDA_DETIK, EMAIL_NAMA_PENGIRIM: o.EMAIL_NAMA_PENGIRIM, EMAIL_KONTAK: o.EMAIL_KONTAK };
  if (o.FONNTE_TOKEN) body.FONNTE_TOKEN = o.FONNTE_TOKEN;
  tombolMuat(t, true, 'Menyimpan…');
  api('simpanPengaturan', S.token, body).then(r => { S.A.pengaturan = r; simpanCache(); toast('Konfigurasi tersimpan'); render(); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); });
};
ACT.cekDevice = t => { tombolMuat(t, true, 'Mengecek…'); api('cekPerangkatWA', S.token).then(r => { tombolMuat(t, false); $('#kf-dev').innerHTML = `<div class="card pad-s" style="box-shadow:none"><b>${esc(hpTampil(r.device))}</b> · ${r.status === 'connect' ? '<span class="badge bg-ok">terhubung</span>' : `<span class="badge bg-err">${esc(r.status)}</span>`} · paket ${esc(r.paket)} · kuota ${esc(r.kuota)} · berlaku s.d. ${esc(r.kedaluwarsa)}</div>`; }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
ACT.tesWA = t => { const n = $('#kf-tesno').value; if (!n) return toast('Isi nomor tes', 'err'); tombolMuat(t, true, '…'); api('tesWA', S.token, n).then(m => { tombolMuat(t, false); toast(m); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
ACT.tesEmail = t => { const n = $('#kf-tesem').value; if (!n) return toast('Isi email tes', 'err'); tombolMuat(t, true, '…'); api('tesEmail', S.token, n).then(m => { tombolMuat(t, false); toast(m); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };

/* ---------------- Broadcast / kampanye ---------------- */
function bcUI() { return S.ui.bc || (S.ui.bc = { kanal: 'WA', sumber: 'segmen', label: '', produk: '', pmin: 0, pmax: 100, status: '', hanyaWA: true, judul: '', subjek: '', pesan: 'Halo {{nama}} 👋\n\n', batch: Number(nilaiSet('WA_BATCH_DEFAULT')) || 20, jeda: nilaiSet('WA_JEDA_DETIK') || '5', jadwal: '', manual: [] }); }
function audiens() {
  const u = bcUI(), op = S.A.optin || {}, mm = memMap(), now = Date.now();
  let base;
  if (u.sumber === 'manual') base = u.manual.map(id => mm[id]).filter(Boolean);
  else base = S.A.member.filter(m => {
    if (m.status === 'Diblokir') return false;
    if (u.status && m.status !== u.status) return false;
    if (u.label && semuaLabel(m).indexOf(u.label) < 0) return false;
    if (u.produk) {
      if (!S.A.akses.some(a => a.member === m.id && a.produk === u.produk && a.status === 'Aktif' && (!a.berakhir || new Date(a.berakhir) > now))) return false;
      const r = (S.A.progres || []).find(x => x.m === m.id && x.p === u.produk), p = r ? r.persen : 0;
      if (p < u.pmin || p > u.pmax) return false;
    }
    return true;
  });
  const seen = {}, rows = [], ring = { total: base.length, ok: 0, tanpaIzin: 0, tidakValid: 0, ganda: 0, bukanWA: 0 };
  base.forEach(m => {
    const kontak = u.kanal === 'WA' ? m.wa : m.email, o = op[m.id] || {};
    let st = 'ok';
    if (!kontak || (u.kanal === 'WA' && !/^628\d{7,12}$/.test(kontak))) st = 'tidakValid';
    else if (u.kanal === 'WA' && u.hanyaWA && m.statusWA === 'Tidak Terdaftar') st = 'bukanWA';
    else if (!(u.kanal === 'WA' ? o.wp : o.ep)) st = 'tanpaIzin';
    else if (seen[kontak]) st = 'ganda';
    if (st === 'ok') seen[kontak] = 1;
    ring[st]++; rows.push({ m, st, kontak });
  });
  return { rows, ring, ids: rows.filter(r => r.st === 'ok').map(r => r.m.id) };
}
VIEWS['a-broadcast'] = {
  area: 'adm', title: 'Broadcast Kampanye', roles: ['superadmin'], live: false,
  render() {
    if (!S.A) return skeleton(4, 100);
    const u = bcUI(), au = audiens(), r = au.ring;
    const lbl = {}; S.A.member.forEach(m => semuaLabel(m).forEach(x => { if (!/^merged/.test(x)) lbl[x] = 1; }));
    const nBatch = Math.ceil(au.ids.length / u.batch), jd = String(u.jeda).split('-').map(Number), rataJ = jd.length > 1 ? (jd[0] + jd[1]) / 2 : jd[0] || 5;
    const est = Math.ceil(au.ids.length * rataJ / 60) + nBatch;
    const first = (au.rows.find(x => x.st === 'ok') || {}).m;
    const BC = (S.A.broadcast || []).slice().sort((a, b) => new Date(b.Dibuat_Pada) - new Date(a.Dibuat_Pada));
    return `<div class="page-h"><div><div class="crumb">Komunikasi ${ic('chevR', 'xs')}<b>Broadcast Kampanye</b></div><h1>Broadcast Kampanye</h1><p>Kirim WhatsApp/Email ke segmen CRM per batch 10/20/50 — penerima tanpa persetujuan otomatis dikeluarkan.</p></div></div>
    <div class="adm-grid2 mb16"><div class="card pad-l col g16"><h3>1. Pilih sasaran</h3>
      <div class="row wrap g8"><div class="seg"><button class="${u.kanal === 'WA' ? 'on' : ''}" data-act="bcSet" data-k="kanal" data-v="WA">WhatsApp</button><button class="${u.kanal === 'EMAIL' ? 'on' : ''}" data-act="bcSet" data-k="kanal" data-v="EMAIL">Email</button></div>
        <div class="seg"><button class="${u.sumber === 'segmen' ? 'on' : ''}" data-act="bcSet" data-k="sumber" data-v="segmen">Segmen CRM</button><button class="${u.sumber === 'manual' ? 'on' : ''}" data-act="bcSet" data-k="sumber" data-v="manual">Terpilih (${u.manual.length})</button></div></div>
      ${u.sumber === 'segmen' ? `<div class="form-grid two"><div class="field"><label>Label CRM</label><select class="inp" data-chg="bcF" data-k="label"><option value="">Semua kontak</option>${Object.keys(lbl).sort().map(x => `<option ${u.label === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>
        <div class="field"><label>Status akun</label><select class="inp" data-chg="bcF" data-k="status"><option value="">Semua</option>${['Lead', 'Aktif', 'Nonaktif'].map(s => `<option ${u.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field span2"><label>Pemilik kelas (akses aktif)</label><select class="inp" data-chg="bcF" data-k="produk"><option value="">— tidak difilter —</option>${S.A.produk.map(p => `<option value="${p.ID_Produk}" ${u.produk === p.ID_Produk ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select></div>
        ${u.produk ? `<div class="field span2"><label>Rentang progres kelas: ${u.pmin}% – ${u.pmax}%</label><div class="row g8"><input class="inp" type="number" min="0" max="100" value="${u.pmin}" data-chg="bcF" data-k="pmin" aria-label="Progres minimum"><input class="inp" type="number" min="0" max="100" value="${u.pmax}" data-chg="bcF" data-k="pmax" aria-label="Progres maksimum"></div></div>` : ''}</div>` : `<p class="small muted">${u.manual.length ? u.manual.length + ' kontak dipilih dari menu Member & CRM.' : 'Pilih kontak di menu Member & CRM lalu klik “Blast ke terpilih”.'}</p>`}
      ${u.kanal === 'WA' ? `<label class="check"><input type="checkbox" data-chg="bcCek" data-k="hanyaWA" ${u.hanyaWA ? 'checked' : ''}><span>Lewati nomor yang terdeteksi <b>bukan</b> WhatsApp</span></label>` : ''}
      <div class="row wrap g4"><span class="badge bg-lav">${angka(r.total)} kontak</span><span class="badge bg-ok">${angka(r.ok)} akan dikirimi</span><span class="badge bg-warn">${angka(r.tanpaIzin)} tanpa izin promo</span><span class="badge bg-grey">${angka(r.tidakValid)} kontak tidak valid</span>${r.ganda ? `<span class="badge bg-pink">${r.ganda} ganda</span>` : ''}${r.bukanWA ? `<span class="badge bg-err">${r.bukanWA} bukan WA</span>` : ''}</div>
      <div class="tbl-wrap" style="max-height:260px;overflow:auto"><table class="tbl"><thead><tr><th>Nama</th><th>${u.kanal === 'WA' ? 'Nomor' : 'Email'}</th><th>Status</th></tr></thead><tbody>${au.rows.slice(0, 60).map(x => `<tr style="${x.st !== 'ok' ? 'opacity:.55' : ''}"><td class="small">${esc(x.m.nama)}</td><td class="small mono">${esc(u.kanal === 'WA' ? hpTampil(x.kontak) : x.kontak || '—')} ${u.kanal === 'WA' && x.kontak ? waBadge(x.m.statusWA) : ''}</td><td class="xs">${{ ok: '<span class="c-ok b">dikirim</span>', tanpaIzin: 'tanpa izin', tidakValid: 'tidak valid', ganda: 'ganda', bukanWA: 'bukan WA' }[x.st]}</td></tr>`).join('') || `<tr><td colspan="3" class="muted small">Tidak ada kontak.</td></tr>`}</tbody></table></div>
      ${u.kanal === 'WA' && au.rows.some(x => !x.m.statusWA && x.kontak) ? `<button class="btn sec sm" data-act="bcDeteksi">${ic('wa', 'sm')}Deteksi nomor WA penerima</button>` : ''}</div>
    <div class="card pad-l col g16"><h3>2. Tulis pesan</h3>
      <div class="field"><label for="bc-judul">Judul kampanye (internal)</label><input class="inp" id="bc-judul" value="${esc(u.judul)}" data-in="bcTeks" data-k="judul" placeholder="Promo Desember — kelas lanjutan"></div>
      ${u.kanal === 'EMAIL' ? `<div class="field"><label for="bc-subj">Subjek email</label><input class="inp" id="bc-subj" value="${esc(u.subjek)}" data-in="bcTeks" data-k="subjek"></div>` : ''}
      <div class="row wrap g4">${['nama', 'email', 'kelas', 'portal', 'link'].map(v => `<button class="lbl-chip" style="cursor:pointer" data-act="bcVar" data-v="${v}">{{${v}}}</button>`).join('')}</div>
      <textarea class="inp" id="bc-pesan" style="min-height:150px" data-in="bcTeks" data-k="pesan">${esc(u.pesan)}</textarea>
      <div class="wa-wrap" id="bc-prev">${pratinjauBC(first)}</div>
      <h3>3. Batch, jeda & jadwal</h3>
      <div class="seg">${[10, 20, 50].map(b => `<button class="${u.batch === b ? 'on' : ''}" data-act="bcSet" data-k="batch" data-v="${b}">${b} / batch</button>`).join('')}</div>
      <div class="form-grid two"><div class="field"><label for="bc-jeda">Jeda antarpesan (detik)</label><input class="inp" id="bc-jeda" value="${esc(u.jeda)}" data-in="bcTeks" data-k="jeda" placeholder="3-8"></div><div class="field"><label for="bc-jadwal">Jadwal kirim (opsional)</label><input class="inp" id="bc-jadwal" type="datetime-local" value="${esc(u.jadwal)}" data-in="bcTeks" data-k="jadwal"></div></div>
      <p class="small muted" id="bc-est">${angka(au.ids.length)} penerima → ${nBatch} batch · ± ${est} menit (1 batch/menit oleh server, halaman boleh ditutup)</p>
      <button class="btn pri lg block" data-act="bcMulai" ${au.ids.length ? '' : 'disabled'}>${ic('send', 'sm')}${u.jadwal ? 'Jadwalkan' : 'Mulai'} Broadcast (${angka(au.ids.length)})</button></div></div>
    <div class="card pad"><div class="card-h"><h3>Riwayat & progres kampanye</h3><button class="btn ghost sm" data-act="segarkanAdmin">${ic('refresh', 'sm')}</button></div>
      ${BC.length ? BC.map(b => { const tot = Number(b.Total) || 0, sel = (Number(b.Terkirim) || 0) + (Number(b.Gagal) || 0), p = tot ? Math.round(sel / tot * 100) : 0, jalan = b.Status === 'Berjalan' || b.Status === 'Terjadwal'; return `<div class="dl-row"><span class="ftype ${b.Kanal === 'WA' ? 'ft-Tautan' : 'ft-DOCX'}">${ic(b.Kanal === 'WA' ? 'wa' : 'mail', 'sm')}</span><div class="grow" style="min-width:0"><div class="row between g8"><b class="small trunc">${esc(b.Judul)}</b><span class="pill ${b.Status === 'Selesai' ? 'bg-ok' : b.Status === 'Dihentikan' ? 'bg-grey' : b.Status === 'Terjadwal' ? 'bg-info' : 'bg-warn'}">${esc(b.Status)}</span></div>
        <div class="xs muted">${tglJam(b.Dibuat_Pada)} · batch ${esc(b.Ukuran_Batch)} · jeda ${esc(b.Jeda_Detik)}s · ${angka(b.Terkirim)} terkirim${Number(b.Gagal) ? ' · ' + b.Gagal + ' gagal' : ''}${Number(b.Dikeluarkan) ? ' · ' + b.Dikeluarkan + ' dikeluarkan' : ''}${b.Status === 'Terjadwal' ? ' · mulai ' + tglJam(b.Jadwal) : ''}</div><div class="row g8 mt8"><div class="grow">${bar(p, b.Status === 'Selesai' ? 'ok thin' : 'thin')}</div><span class="xs b">${sel}/${tot}</span></div></div>
        ${jalan ? `<div class="row g4"><button class="btn soft xs" data-act="bcProses" data-id="${b.ID_Broadcast}">${ic('send', 'xs')}Batch berikutnya</button><button class="btn danger xs" data-act="bcStop" data-id="${b.ID_Broadcast}">Hentikan</button></div>` : ''}</div>`; }).join('') : kosong('megaphone', 'Belum ada kampanye')}</div>`;
  }
};
function pratinjauBC(m) {
  const u = bcUI();
  const v = { nama: m ? m.nama : 'Kak', email: m ? m.email : 'email@contoh.id', kelas: m ? S.A.akses.filter(a => a.member === m.id && a.status === 'Aktif').map(a => (prodMap()[a.produk] || {}).Nama).join(', ') || '-' : '-', portal: S.app.NAMA_PORTAL, link: S.app.PWA_URL || '(tautan aplikasi)' };
  const t = String(u.pesan).replace(/\{\{\s*(\w+)\s*\}\}/g, (x, k) => v[k] != null ? v[k] : x) + (u.pesan.indexOf('{{unsub}}') < 0 ? '\n\nBerhenti menerima info promosi: (tautan otomatis)' : '');
  return `<div class="xs muted mb8">Pratinjau untuk ${esc(v.nama)}</div><div class="wa-bubble">${esc(t).replace(/\*([^*\n]+)\*/g, '<b>$1</b>')}</div>`;
}
ACT.bcSet = t => { const u = bcUI(), k = t.dataset.k; u[k] = k === 'batch' ? Number(t.dataset.v) : t.dataset.v; render(); };
CHG.bcF = t => { const u = bcUI(); u[t.dataset.k] = /^p(min|max)$/.test(t.dataset.k) ? Math.max(0, Math.min(100, Number(t.value) || 0)) : t.value; render(); };
CHG.bcCek = t => { bcUI()[t.dataset.k] = t.checked; render(); };
INP.bcTeks = t => {
  const u = bcUI(); u[t.dataset.k] = t.value;
  if (t.dataset.k === 'pesan') { const au = audiens(); $('#bc-prev').innerHTML = pratinjauBC((au.rows.find(x => x.st === 'ok') || {}).m); }
};
ACT.bcVar = t => { const ta = $('#bc-pesan'), v = '{{' + t.dataset.v + '}}', p = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, p) + v + ta.value.slice(p); bcUI().pesan = ta.value; ta.focus(); ta.setSelectionRange(p + v.length, p + v.length); INP.bcTeks(ta); };
ACT.bcDeteksi = () => deteksiWAMassal(audiens().rows.filter(x => !x.m.statusWA && x.kontak).map(x => x.m.id)).then(() => render());
ACT.bcMulai = async t => {
  const u = bcUI(), au = audiens();
  if (!u.judul.trim()) return toast('Isi judul kampanye', 'err');
  if (u.pesan.trim().length < 5) return toast('Isi pesan terlalu pendek', 'err');
  if (u.kanal === 'EMAIL' && !u.subjek.trim()) return toast('Isi subjek email', 'err');
  if (!(await konfirmasi(`Kirim <b>${esc(u.judul)}</b> ke <b>${angka(au.ids.length)} penerima</b> via ${u.kanal === 'WA' ? 'WhatsApp' : 'Email'}? ${au.ring.tanpaIzin + au.ring.tidakValid + au.ring.ganda + au.ring.bukanWA} kontak dikeluarkan otomatis.`, { ok: u.jadwal ? 'Jadwalkan' : 'Mulai kirim' }))) return;
  tombolMuat(t, true, 'Menyiapkan antrean…');
  api('buatBroadcast', S.token, { judul: u.judul, kanal: u.kanal, subjek: u.subjek, pesan: u.pesan, ukuranBatch: u.batch, jeda: u.jeda, jadwal: u.jadwal ? new Date(u.jadwal).toISOString() : '', penerima: au.ids, hanyaTerdaftarWA: u.hanyaWA, segmen: { label: u.label, produk: u.produk, status: u.status, sumber: u.sumber } })
    .then(r => {
      (S.A.broadcast = S.A.broadcast || []).push(r.broadcast); simpanCache();
      toast(`${r.total} pesan masuk antrean${r.broadcast.Status === 'Terjadwal' ? ' (terjadwal)' : ' — batch pertama dikirim server dalam ± 1 menit'}`);
      Object.assign(u, { judul: '', subjek: '', pesan: 'Halo {{nama}} 👋\n\n', manual: [], sumber: 'segmen', jadwal: '' });
      render();
    }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); });
};
ACT.bcProses = t => { tombolMuat(t, true, '…'); api('prosesBroadcast', S.token, t.dataset.id).then(r => { upsertArr(S.A.broadcast, [r.broadcast], 'ID_Broadcast'); simpanCache(); toast(`Batch terkirim: ${r.hasil.wa + r.hasil.email} pesan`); render(); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
ACT.bcStop = t => konfirmasi('Hentikan kampanye? Pesan yang belum terkirim dibatalkan.', { ok: 'Hentikan', danger: true }).then(ya => { if (!ya) return; tombolMuat(t, true, '…'); api('hentikanBroadcast', S.token, t.dataset.id).then(r => { upsertArr(S.A.broadcast, [r.broadcast], 'ID_Broadcast'); simpanCache(); toast(r.dibatalkan + ' pesan dibatalkan'); render(); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); });

/* ---------------- Laporan & analitik ---------------- */
function lapUI() { return S.ui.lap || (S.ui.lap = { bulan: 12, produk: '', tab: 'member', q: '', log: null }); }
VIEWS['a-laporan'] = {
  area: 'adm', title: 'Laporan & Analitik',
  render() {
    if (!S.A) return skeleton(4, 200);
    const u = lapUI(), fun = funnel();
    const tab = (id, l) => `<button class="${u.tab === id ? 'on' : ''}" data-act="lapTab" data-t="${id}">${l}</button>`;
    return `<div class="page-h"><div><div class="crumb">Analitik ${ic('chevR', 'xs')}<b>Laporan</b></div><h1>Laporan & Analitik</h1><p>Grafik dan tabel dihitung langsung di browser dari data terbaru — filter tanpa menunggu server.</p></div>
      <div class="row wrap g8"><select class="inp pill-inp" style="width:auto" data-chg="lapF" data-k="bulan" aria-label="Periode">${[3, 6, 12, 24].map(b => `<option value="${b}" ${u.bulan === b ? 'selected' : ''}>${b} bulan</option>`).join('')}</select><select class="inp pill-inp" style="width:auto;max-width:240px" data-chg="lapF" data-k="produk" aria-label="Kelas"><option value="">Semua kelas</option>${S.A.produk.map(p => `<option value="${p.ID_Produk}" ${u.produk === p.ID_Produk ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select></div></div>
    <div class="adm-grid2 mb16"><div class="card chart-card"><div class="card-h"><h3>Pendapatan per bulan</h3></div><div style="height:240px"><canvas id="ch-l-pend"></canvas></div></div>
      <div class="card chart-card"><div class="card-h"><h3>Member baru per bulan</h3></div><div style="height:240px"><canvas id="ch-l-mem"></canvas></div></div>
      <div class="card chart-card"><div class="card-h"><h3>Tingkat penyelesaian per kelas</h3></div><div style="height:240px"><canvas id="ch-l-sel"></canvas></div></div>
      <div class="card chart-card"><div class="card-h"><h3>Jam belajar mingguan (semua member)</h3></div><div style="height:240px"><canvas id="ch-l-jam"></canvas></div></div></div>
    <div class="card pad mb16"><div class="card-h"><h3>Funnel: leads → order → bayar → aktif → tuntas</h3></div>${fun.map((f, i) => `<div class="funnel-row"><span class="small b">${f[0]}</span><div><div class="fb" style="width:${fun[0][1] ? Math.max(2, f[1] / fun[0][1] * 100) : 0}%"></div></div><span class="small mono right">${angka(f[1])}${i ? ` <span class="xs muted">(${fun[i - 1][1] ? Math.round(f[1] / fun[i - 1][1] * 100) : 0}%)</span>` : ''}</span></div>`).join('')}</div>
    <div class="card pad"><div class="tabs">${tab('member', 'Daftar member')}${tab('transaksi', 'Transaksi')}${tab('progres', 'Progres per member')}${tab('log', 'Log notifikasi')}</div>
      <div class="toolbar mb16"><div class="search" style="max-width:320px"><span class="sr">Cari</span>${ic('search')}<input id="cari-lap" type="search" placeholder="Cari…" value="${esc(u.q)}" data-in="lapCari"></div><span class="grow"></span>${SA() ? tombolEkspor('eksporLap') : '<span class="xs muted">Ekspor khusus Superadmin</span>'}</div>
      <div id="lap-tabel">${tabelLap()}</div></div>`;
  },
  after() { grafikLaporan(); const u = lapUI(); if (u.tab === 'log' && !u.log) api('ambilAntrean', S.token, { log: true }).then(r => { u.log = r.rows; if (S.view === 'a-laporan') { const el = $('#lap-tabel'); if (el) el.innerHTML = tabelLap(); } }).catch(e => toast(e.message, 'err')); }
};
ACT.lapTab = t => { const u = lapUI(); u.tab = t.dataset.t; u.q = ''; render(); };
CHG.lapF = t => { const u = lapUI(); u[t.dataset.k] = t.dataset.k === 'bulan' ? Number(t.value) : t.value; render(); };
INP.lapCari = debounce(t => { lapUI().q = t.value; const el = $('#lap-tabel'); if (el) el.innerHTML = tabelLap(); }, 150);
function dataLap() {
  const u = lapUI(), mm = memMap(), pm = prodMap();
  if (u.tab === 'member') return { kol: [{ l: 'Nama', k: 'nama' }, { l: 'Email', k: 'email' }, { l: 'WhatsApp', f: m => hpTampil(m.wa) }, { l: 'Status', k: 'status' }, { l: 'Label', f: m => semuaLabel(m).join('; ') }, { l: 'Terdaftar', f: m => tgl(m.daftar) }, { l: 'Jam belajar', f: m => jamBelajar(m.menit) }], rows: S.A.member.filter(m => (!u.produk || S.A.akses.some(a => a.member === m.id && a.produk === u.produk)) && cari(m.nama + ' ' + m.email + ' ' + m.label, u.q)) };
  if (u.tab === 'transaksi') return { kol: [{ l: 'Order', k: 'id' }, { l: 'Tanggal', f: t => tgl(t.dibuat) }, { l: 'Member', f: t => (mm[t.member] || {}).nama }, { l: 'Kelas', k: 'namaProduk' }, { l: 'Total', f: t => rp(t.nominal) }, { l: 'Metode', k: 'metode' }, { l: 'Status', k: 'status' }], rows: S.A.transaksi.filter(t => (!u.produk || t.produk === u.produk) && cari(t.id + ' ' + t.namaProduk + ' ' + (mm[t.member] || {}).nama + ' ' + t.status, u.q)).sort((a, b) => new Date(b.dibuat) - new Date(a.dibuat)) };
  if (u.tab === 'progres') return { kol: [{ l: 'Member', f: r => (mm[r.m] || {}).nama }, { l: 'Email', f: r => (mm[r.m] || {}).email }, { l: 'Kelas', f: r => (pm[r.p] || {}).Nama }, { l: 'Materi selesai', f: r => r.selesai + '/' + r.total }, { l: 'Progres', f: r => r.persen + '%' }, { l: 'Menit belajar', k: 'menit' }], rows: (S.A.progres || []).filter(r => (!u.produk || r.p === u.produk) && cari((mm[r.m] || {}).nama + ' ' + (pm[r.p] || {}).Nama, u.q)).sort((a, b) => b.persen - a.persen) };
  return { kol: [{ l: 'Waktu', f: r => tglJam(r.Waktu_Kirim) }, { l: 'Kanal', k: 'Kanal' }, { l: 'Tujuan', k: 'Tujuan' }, { l: 'Event', k: 'Event' }, { l: 'Status', k: 'Status' }, { l: 'Ringkasan', k: 'Ringkasan' }], rows: (u.log || []).filter(r => cari(r.Tujuan + ' ' + r.Event + ' ' + r.Ringkasan, u.q)) };
}
function tabelLap() {
  const u = lapUI();
  if (u.tab === 'log' && !u.log) return skeleton(5, 40);
  const d = dataLap(), val = (r, c) => { const v = c.f ? c.f(r) : r[c.k]; return v == null ? '' : v; };
  return `<div class="tbl-wrap" style="max-height:520px;overflow:auto"><table class="tbl"><thead><tr>${d.kol.map(c => `<th>${esc(c.l)}</th>`).join('')}</tr></thead><tbody>${d.rows.slice(0, 300).map(r => `<tr>${d.kol.map(c => `<td class="small">${esc(val(r, c))}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${d.kol.length}">${kosong('search', 'Tidak ada data')}</td></tr>`}</tbody></table></div><p class="xs muted mt8">${angka(d.rows.length)} baris${d.rows.length > 300 ? ' (300 pertama ditampilkan; ekspor memuat semua)' : ''}.</p>`;
}
ACT.eksporLap = t => { const d = dataLap(); ekspor('laporan-' + lapUI().tab, d.kol, d.rows, t.dataset.f).catch(e => toast(e.message, 'err')); };
function grafikLaporan() {
  const u = lapUI(), n = u.bulan, A = S.A, lab = [], pend = [], mem = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); const k = bulanKey(d.toISOString());
    lab.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }));
    pend.push(A.transaksi.filter(t => t.status === 'Terverifikasi' && (!u.produk || t.produk === u.produk) && bulanKey(t.diverifikasi || t.dibuat) === k).reduce((a, t) => a + t.nominal, 0));
    mem.push(A.member.filter(m => bulanKey(m.daftar) === k).length);
  }
  const singkat = v => v >= 1e6 ? String(+(v / 1e6).toFixed(1)).replace('.', ',') + 'jt' : v >= 1e3 ? Math.round(v / 1e3) + 'rb' : v;
  const sumbuX = { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 8 } };
  const ungu = '#6C3CE9', opsi = { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: sumbuX, y: { grid: { color: cssVar('--line') }, beginAtZero: true, ticks: { precision: 0 } } } };
  gambarChart('ch-l-pend', { type: 'bar', data: { labels: lab, datasets: [{ data: pend, backgroundColor: ungu, borderRadius: 8, maxBarThickness: 30 }] }, options: Object.assign({}, opsi, { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => rp(c.raw) } } }, scales: { x: sumbuX, y: { grid: { color: cssVar('--line') }, beginAtZero: true, ticks: { callback: singkat } } } }) }).catch(e => toast(e.message, 'err'));
  gambarChart('ch-l-mem', { type: 'line', data: { labels: lab, datasets: [{ data: mem, borderColor: ungu, backgroundColor: 'rgba(108,60,233,.12)', fill: true, tension: .4, pointBackgroundColor: '#fff', pointBorderColor: ungu, pointBorderWidth: 2 }] }, options: opsi }).catch(() => { });
  const pm = prodMap(), per = {};
  (A.progres || []).forEach(r => { (per[r.p] = per[r.p] || []).push(r.persen); });
  const ks = Object.keys(per).filter(p => pm[p] && (!u.produk || p === u.produk));
  gambarChart('ch-l-sel', { type: 'bar', data: { labels: ks.map(p => potong(pm[p].Nama, 26)), datasets: [{ label: 'Rata-rata progres %', data: ks.map(p => Math.round(per[p].reduce((a, b) => a + b, 0) / per[p].length)), backgroundColor: '#8B5CF6', borderRadius: 6 }, { label: 'Tuntas %', data: ks.map(p => Math.round(per[p].filter(x => x === 100).length / per[p].length * 100)), backgroundColor: '#10B981', borderRadius: 6 }] }, options: { indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom' } }, scales: { x: { max: 100, grid: { color: cssVar('--line') } }, y: { grid: { display: false } } } } }).catch(() => { });
  const h = A.belajarHarian || {}, mg = [], ml = [];
  for (let w = 11; w >= 0; w--) { let s = 0; for (let d = 0; d < 7; d++) { const t = new Date(Date.now() - (w * 7 + d) * 864e5 + 7 * 36e5).toISOString().slice(0, 10); s += h[t] || 0; } ml.push(w ? '-' + w + 'mg' : 'Ini'); mg.push(Math.round(s / 6) / 10); }
  gambarChart('ch-l-jam', { type: 'line', data: { labels: ml, datasets: [{ data: mg, borderColor: ungu, backgroundColor: 'rgba(108,60,233,.12)', fill: true, tension: .4, pointBackgroundColor: '#fff', pointBorderColor: ungu, pointBorderWidth: 2 }] }, options: Object.assign({}, opsi, { plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.raw + ' jam' } } } }) }).catch(() => { });
}

/* ---------------- Pengaturan sistem ---------------- */
function pUI() { return S.ui.peng || (S.ui.peng = { tab: 'identitas', imp: null }); }
VIEWS['a-pengaturan'] = {
  area: 'adm', title: 'Pengaturan Sistem', roles: ['superadmin'], live: () => ['promo', 'label', 'tim'].indexOf(pUI().tab) > -1,
  render() {
    if (!S.A) return skeleton(4, 80);
    const u = pUI(), tab = (id, l) => `<button class="${u.tab === id ? 'on' : ''}" data-act="pTab" data-t="${id}">${l}</button>`;
    const isi = { identitas: tabIdentitas, bayar: tabBayar, promo: tabPromo, label: tabLabel, tim: tabTim, migrasi: tabMigrasi, sistem: tabSistem }[u.tab]();
    return `<div class="page-h"><div><div class="crumb">Sistem ${ic('chevR', 'xs')}<b>Pengaturan</b></div><h1>Pengaturan Sistem</h1><p>Identitas portal, pembayaran, promo, label CRM, tim admin, migrasi data, dan PWA.</p></div></div>
      <div class="tabs">${tab('identitas', 'Identitas')}${tab('bayar', 'Pembayaran')}${tab('promo', 'Kode Promo')}${tab('label', 'Label CRM')}${tab('tim', 'Tim Admin')}${tab('migrasi', 'Migrasi Data')}${tab('sistem', 'Sistem & Aplikasi HP')}</div>${isi}`;
  }
};
ACT.pTab = t => { pUI().tab = t.dataset.t; render(); };
function fieldSet(k, label, o) { o = o || {}; const v = nilaiSet(k); return `<div class="field ${o.span ? 'span2' : ''}"><label for="ps-${k}">${label}</label>${o.area ? `<textarea class="inp" id="ps-${k}" name="${k}" style="min-height:80px">${esc(v)}</textarea>` : `<input class="inp" id="ps-${k}" name="${k}" value="${esc(v)}" ${o.type ? `type="${o.type}"` : ''} placeholder="${esc(o.ph || '')}">`}${o.hint ? `<span class="hint">${o.hint}</span>` : ''}</div>`; }
function simpanSetForm(form, btn, ekstra) {
  const o = Object.assign(formObj(form), ekstra || {});
  tombolMuat(btn, true, 'Menyimpan…');
  return api('simpanPengaturan', S.token, o).then(r => {
    S.A.pengaturan = r;
    Object.keys(r.nilai).forEach(k => { if (k in S.app || ['HERO_GAMBAR', 'LOGO_URL', 'QRIS_URL', 'PROMO_UPSELL_PRODUK'].indexOf(k) > -1) S.app[k] = r.nilai[k]; });
    LS.set('pk_app', S.app); simpanCache(); tombolMuat(btn, false); toast('Pengaturan tersimpan'); renderChrome();
  }).catch(e => { tombolMuat(btn, false); toast(e.message, 'err'); });
}
function tabIdentitas() {
  return `<form class="card pad-l" id="f-ident"><div class="form-grid two">${fieldSet('NAMA_PORTAL', 'Nama portal')}${fieldSet('NAMA_ALT', 'Nama alternatif / sub-judul')}${fieldSet('TAGLINE', 'Judul banner hero', { span: 1 })}${fieldSet('HERO_SUB', 'Teks banner hero', { span: 1, area: 1 })}${fieldSet('LOGO_URL', 'URL logo (persegi)', { ph: 'https://…' })}${fieldSet('HERO_GAMBAR', 'URL gambar hero (opsional)', { ph: 'https://…' })}${fieldSet('EMAIL_KONTAK', 'Email kontak', { type: 'email' })}${fieldSet('WA_ADMIN', 'WhatsApp admin', { ph: '0812…', hint: 'Tombol "Hubungi" & alert bukti bayar baru.' })}${fieldSet('PROMO_BANNER', 'Teks banner promo katalog', { span: 1, hint: 'Kosongkan untuk menyembunyikan.' })}${fieldSet('PROMO_UPSELL_JUDUL', 'Judul kartu promosi dashboard')}
    <div class="field"><label for="ps-up">Kelas yang ditawarkan di kartu promosi</label><select class="inp" id="ps-up" name="PROMO_UPSELL_PRODUK"><option value="">— Katalog umum —</option>${S.A.produk.map(p => `<option value="${p.ID_Produk}" ${nilaiSet('PROMO_UPSELL_PRODUK') === p.ID_Produk ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select></div>${fieldSet('PROMO_UPSELL_TEKS', 'Teks kartu promosi', { span: 1, area: 1 })}</div>
    <button type="button" class="btn pri mt16" data-act="simpanIdent">${ic('check', 'sm')}Simpan identitas</button></form>`;
}
ACT.simpanIdent = t => { const f = $('#f-ident'); const o = formObj(f); if (o.WA_ADMIN) o.WA_ADMIN = o.WA_ADMIN.replace(/\D/g, '').replace(/^0/, '62'); simpanSetForm(f, t, { WA_ADMIN: o.WA_ADMIN }); };
function tabBayar() {
  const rek = safeJSON(nilaiSet('REKENING'), []);
  return `<form class="card pad-l col g16" id="f-bayar"><h3>Rekening tujuan transfer</h3><div id="rek-list" class="col g8">${(rek.length ? rek : [{}]).map(r => barisRek(r)).join('')}</div><button type="button" class="btn sec sm" style="align-self:flex-start" data-act="tambahRek">${ic('plus', 'sm')}Tambah rekening</button>
    <div class="form-grid two">${fieldSet('QRIS_URL', 'URL gambar QRIS (opsional)', { ph: 'https://…', hint: 'Bila diisi, opsi QRIS muncul di checkout.' })}${fieldSet('BATAS_BAYAR_JAM', 'Batas waktu bayar (jam)', { type: 'number' })}${fieldSet('MAX_BUKTI_MB', 'Ukuran maks. bukti bayar (MB)', { type: 'number' })}</div>
    <button type="button" class="btn pri" style="align-self:flex-start" data-act="simpanBayar">${ic('check', 'sm')}Simpan pembayaran</button></form>`;
}
function barisRek(r) { return `<div class="row g8 rek-row"><input class="inp" data-r="bank" placeholder="Bank" value="${esc(r.bank || '')}" style="max-width:120px" aria-label="Bank"><input class="inp" data-r="norek" placeholder="No. rekening" value="${esc(r.norek || '')}" aria-label="Nomor rekening"><input class="inp" data-r="atasNama" placeholder="Atas nama" value="${esc(r.atasNama || '')}" aria-label="Atas nama"><button type="button" class="btn ghost icon sm" data-act="hapusRek" aria-label="Hapus rekening">${ic('trash', 'sm')}</button></div>`; }
ACT.tambahRek = () => $('#rek-list').insertAdjacentHTML('beforeend', barisRek({}));
ACT.hapusRek = t => t.closest('.rek-row').remove();
ACT.simpanBayar = t => {
  const rek = $$('.rek-row').map(r => ({ bank: $('[data-r=bank]', r).value.trim(), norek: $('[data-r=norek]', r).value.replace(/\D/g, ''), atasNama: $('[data-r=atasNama]', r).value.trim() })).filter(r => r.bank && r.norek);
  simpanSetForm($('#f-bayar'), t, { REKENING: JSON.stringify(rek) }).then(() => { S.app.REKENING = JSON.stringify(rek); LS.set('pk_app', S.app); });
};
function tabelMaster(kolom, rows, aksi) {
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${kolom.map(k => `<th>${k[0]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(r => `<tr>${kolom.map(k => `<td class="small">${k[1](r)}</td>`).join('')}<td class="nowrap right">${aksi(r)}</td></tr>`).join('') || `<tr><td colspan="${kolom.length + 1}">${kosong('inbox', 'Belum ada data')}</td></tr>`}</tbody></table></div>`;
}
function tabPromo() {
  const pm = prodMap();
  return `<div class="card pad"><div class="card-h"><h3>Kode promo</h3><button class="btn pri sm" data-act="editPromo">${ic('plus', 'sm')}Kode baru</button></div>
    ${tabelMaster([['Kode', r => `<b class="mono">${esc(r.Kode)}</b>`], ['Potongan', r => r.Jenis === 'Persen' ? r.Nilai + '%' : rp(r.Nilai)], ['Berlaku untuk', r => r.ID_Produk ? String(r.ID_Produk).split(',').map(x => esc((pm[x.trim()] || {}).Nama || x)).join(', ') : 'Semua kelas'], ['Pemakaian', r => `${r.Terpakai || 0}${Number(r.Kuota) ? ' / ' + r.Kuota : ''}`], ['Sampai', r => r.Berlaku_Sampai ? tgl(r.Berlaku_Sampai) : '—'], ['Status', r => `<span class="pill ${r.Status === 'Aktif' ? 'bg-ok' : 'bg-grey'}">${esc(r.Status)}</span>`]], S.A.promo || [], r => `<button class="btn ghost icon xs" data-act="editPromo" data-id="${esc(r.Kode)}" aria-label="Edit">${ic('edit', 'sm')}</button><button class="btn ghost icon xs" data-act="hapusPromo" data-id="${esc(r.Kode)}" aria-label="Hapus">${ic('trash', 'sm')}</button>`)}</div>`;
}
ACT.editPromo = t => {
  const id = t.dataset.id, r = id ? S.A.promo.find(x => x.Kode === id) : null, v = r || { Jenis: 'Nominal', Status: 'Aktif', Kuota: 0 };
  const w = modal({ title: r ? 'Edit kode promo' : 'Kode promo baru', body: `<form id="f-promo" class="form-grid two"><div class="field"><label>Kode</label><input class="inp" name="Kode" value="${esc(v.Kode || '')}" ${r ? 'readonly' : ''} style="text-transform:uppercase"></div><div class="field"><label>Status</label><select class="inp" name="Status">${['Aktif', 'Nonaktif'].map(s => `<option ${v.Status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="field"><label>Jenis</label><select class="inp" name="Jenis">${['Nominal', 'Persen'].map(s => `<option ${v.Jenis === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="field"><label>Nilai</label><input class="inp" name="Nilai" type="number" min="0" value="${esc(v.Nilai || '')}"></div>
    <div class="field"><label>Kuota (0 = tanpa batas)</label><input class="inp" name="Kuota" type="number" min="0" value="${esc(v.Kuota || 0)}"></div><div class="field"><label>Berlaku sampai</label><input class="inp" name="Berlaku_Sampai" type="date" value="${esc(String(v.Berlaku_Sampai || '').slice(0, 10))}"></div>
    <div class="field span2"><label>Khusus kelas (kosong = semua)</label><select class="inp" name="ID_Produk"><option value="">Semua kelas</option>${S.A.produk.map(p => `<option value="${p.ID_Produk}" ${v.ID_Produk === p.ID_Produk ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select></div></form>`, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Simpan</button>` });
  w.querySelector('[data-k=ok]').onclick = () => {
    const o = formObj(w.querySelector('#f-promo')); o.Kode = o.Kode.toUpperCase(); o.Nilai = Number(o.Nilai) || 0; o.Kuota = Number(o.Kuota) || 0;
    o.Berlaku_Sampai = o.Berlaku_Sampai ? new Date(o.Berlaku_Sampai + 'T23:59:59+07:00').toISOString() : '';
    tutupModal(w); simpanMaster('Promo', 'promo', 'Kode', [o], r ? [Object.assign({}, r)] : [], 'Kode promo tersimpan');
  };
};
ACT.hapusPromo = t => hapusBaris('Promo', 'promo', 'Kode', t.dataset.id, 'kode ' + t.dataset.id);
function tabLabel() {
  return `<div class="card pad"><div class="card-h"><h3>Label CRM</h3><button class="btn pri sm" data-act="editLabel">${ic('plus', 'sm')}Label manual</button></div>
    <p class="small muted mb16">Label otomatis dihitung ulang dari peristiwa (checkout, pembayaran, aktivitas, tuntas) dan tiap pagi. Nama & warnanya boleh diubah. Label manual diberikan admin dan tidak pernah ditimpa sistem.</p>
    ${tabelMaster([['Label', r => `<span class="lbl-chip" style="background:${esc(r.Warna)}1f;color:${esc(r.Warna)};font-size:12px">${esc(r.Nama_Label)}</span>`], ['Aturan', r => r.Aturan_Otomatis === 'MANUAL' ? '<span class="badge bg-grey">Manual</span>' : `<span class="badge bg-lav">Otomatis</span> <span class="xs mono muted">${esc(r.Aturan_Otomatis)}</span>`], ['Kontak', r => angka(S.A.member.filter(m => semuaLabel(m).indexOf(r.Nama_Label) > -1).length)]], S.A.label, r => `<button class="btn ghost icon xs" data-act="editLabel" data-id="${esc(r.ID_Label)}" aria-label="Edit">${ic('edit', 'sm')}</button>${r.Aturan_Otomatis === 'MANUAL' ? `<button class="btn ghost icon xs" data-act="hapusLabel" data-id="${esc(r.ID_Label)}" aria-label="Hapus">${ic('trash', 'sm')}</button>` : ''}`)}</div>`;
}
ACT.editLabel = t => {
  const id = t.dataset.id, r = id ? S.A.label.find(x => x.ID_Label === id) : null, v = r || { ID_Label: uid('LBL'), Warna: '#6C3CE9', Aturan_Otomatis: 'MANUAL' };
  const w = modal({ title: r ? 'Edit label' : 'Label manual baru', size: 'sm', body: `<form id="f-lbl" class="col g12"><div class="field"><label>Nama label</label><input class="inp" name="Nama_Label" value="${esc(v.Nama_Label || '')}"></div><div class="field"><label>Warna</label><input class="inp" name="Warna" type="color" value="${esc(v.Warna)}" style="height:44px;padding:4px"></div></form>`, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Simpan</button>` });
  w.querySelector('[data-k=ok]').onclick = () => { const o = formObj(w.querySelector('#f-lbl')); if (!o.Nama_Label) return toast('Nama label wajib', 'err'); tutupModal(w); simpanMaster('CRM_Label', 'label', 'ID_Label', [{ ID_Label: v.ID_Label, Nama_Label: o.Nama_Label, Warna: o.Warna }], r ? [Object.assign({}, r)] : [], 'Label tersimpan'); };
};
ACT.hapusLabel = t => { const r = S.A.label.find(x => x.ID_Label === t.dataset.id); hapusBaris('CRM_Label', 'label', 'ID_Label', r.ID_Label, 'label ' + r.Nama_Label); };
function tabTim() {
  return `<div class="card pad"><div class="card-h"><h3>Tim admin</h3><button class="btn pri sm" data-act="editAdmin">${ic('plus', 'sm')}Admin / Staf</button></div>
    <p class="small muted mb16"><b>Staf</b> dapat memverifikasi pembayaran, melihat & mencatat CRM, memantau antrean, dan melihat laporan. <b>Superadmin</b> mengelola semua.</p>
    ${tabelMaster([['Nama', r => `<div class="row g8">${avatar(r.Nama, 'sm soft')}<b>${esc(r.Nama)}</b></div>`], ['Email', r => esc(r.Email)], ['Peran', r => `<span class="badge ${r.Peran === 'Superadmin' ? 'bg-lav' : 'bg-info'}">${esc(r.Peran)}</span>`], ['Status', r => `<span class="pill ${r.Status === 'Aktif' ? 'bg-ok' : 'bg-grey'}">${esc(r.Status)}</span>`], ['Login terakhir', r => r.Login_Terakhir ? relatif(r.Login_Terakhir) : '—']], S.A.admin || [], r => `<button class="btn ghost icon xs" data-act="editAdmin" data-id="${esc(r.ID_Admin)}" aria-label="Edit">${ic('edit', 'sm')}</button>${r.ID_Admin !== S.user.id ? `<button class="btn ghost icon xs" data-act="hapusAdmin" data-id="${esc(r.ID_Admin)}" aria-label="Hapus">${ic('trash', 'sm')}</button>` : ''}`)}</div>`;
}
ACT.editAdmin = t => {
  const id = t.dataset.id, r = id ? S.A.admin.find(x => x.ID_Admin === id) : null, v = r || { ID_Admin: uid('ADM'), Peran: 'Staf', Status: 'Aktif' };
  const w = modal({ title: r ? 'Edit admin' : 'Tambah admin', body: `<form id="f-adm" class="form-grid two"><div class="field"><label>Nama</label><input class="inp" name="Nama" value="${esc(v.Nama || '')}"></div><div class="field"><label>Email</label><input class="inp" name="Email" type="email" value="${esc(v.Email || '')}"></div>
    <div class="field"><label>Peran</label><select class="inp" name="Peran">${['Staf', 'Superadmin'].map(s => `<option ${v.Peran === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="field"><label>Status</label><select class="inp" name="Status">${['Aktif', 'Nonaktif'].map(s => `<option ${v.Status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <div class="field span2"><label>${r ? 'Sandi baru (kosongkan bila tidak diganti)' : 'Sandi awal (min. 8 karakter)'}</label><input class="inp" name="_sandi" type="text" autocomplete="off"></div></form>`, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Simpan</button>` });
  w.querySelector('[data-k=ok]').onclick = ev => {
    const o = formObj(w.querySelector('#f-adm')); const row = { ID_Admin: v.ID_Admin, Nama: o.Nama, Email: o.Email, Peran: o.Peran, Status: o.Status };
    if (o._sandi) row._sandi = o._sandi;
    tombolMuat(ev.currentTarget, true, 'Menyimpan…');
    api('simpanData', S.token, 'Admin', [row]).then(res => { upsertArr(S.A.admin, res.rows, 'ID_Admin'); simpanCache(); tutupModal(w); render(); toast('Admin tersimpan'); }).catch(e => { tombolMuat(ev.currentTarget, false); toast(e.message, 'err'); });
  };
};
ACT.hapusAdmin = t => { const r = S.A.admin.find(x => x.ID_Admin === t.dataset.id); hapusBaris('Admin', 'admin', 'ID_Admin', r.ID_Admin, r.Nama); };
function tabMigrasi() {
  const u = pUI(), im = u.imp;
  const sh = [['Pengaturan', 'Pengaturan portal', 1], ['CRM_Label', 'Label CRM', 1], ['Template_Notifikasi', 'Templat notifikasi', 1], ['Admin', 'Tim admin & staf', 1], ['Produk', 'Produk / kelas', 1], ['Kurikulum', 'Kurikulum / modul', 1], ['Materi', 'Materi', 1], ['Promo', 'Kode promo', 1], ['Member', 'Member / pengguna', 1], ['Opt_In', 'Persetujuan (opt-in)', 1], ['Akses', 'Akses kelas', 1], ['Transaksi', 'Transaksi / order', 1], ['Progres', 'Progres belajar', 1], ['CRM_Catatan', 'Catatan CRM', 1], ['Broadcast', 'Riwayat broadcast', 1], ['Log_Aktivitas', 'Log aktivitas', 0]];
  return `<div class="adm-grid2"><div class="card pad-l col g16"><h3>Import data dari app lama</h3>
      <p class="small muted">Spreadsheet lama <b>hanya dibaca</b>, tidak pernah diubah. Kolom dicocokkan berdasarkan <b>nama header</b> (+ alias umum), aman dijalankan berkali-kali (tanpa data dobel).</p>
      <div class="field"><label for="im-src">URL / ID spreadsheet app lama</label><input class="inp" id="im-src" placeholder="https://docs.google.com/spreadsheets/d/…" value="${esc(u.impSrc || '')}"><span class="hint">Harus milik akun Google yang sama agar ID berkas Drive lama tetap terbaca.</span></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px">${sh.map(s => `<label class="check"><input type="checkbox" class="im-sh" value="${s[0]}" ${s[2] ? 'checked' : ''}><span class="small">${s[1]}</span></label>`).join('')}</div>
      <label class="check"><input type="checkbox" id="im-timpa"><span class="small">Timpa data yang sudah ada (nama, harga, judul…). Default: hanya menambah yang belum ada.</span></label>
      <div class="row wrap g8"><button class="btn sec" data-act="impJalan" data-dry="1">${ic('search', 'sm')}Pindai (dry-run)</button><button class="btn pri" data-act="impJalan" data-dry="0">${ic('db', 'sm')}Jalankan Import</button></div></div>
    <div class="card pad-l col g12"><h3>Hasil</h3>${im ? `<div class="small"><b>${esc(im.source.name)}</b> · ${im.dryRun ? '<span class="badge bg-info">DRY-RUN — belum ada yang ditulis</span>' : '<span class="badge bg-ok">Import selesai</span>'}</div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Data</th><th class="num">Di app lama</th><th class="num">Ditambah</th><th class="num">Diperbarui</th><th class="num">Dilewati</th></tr></thead><tbody>${Object.keys(im.report).map(k => { const r = im.report[k]; return `<tr><td class="small b">${esc(k)}${r.info ? ` <span class="xs muted">(${esc(r.info)})</span>` : ''}</td><td class="num">${angka(r.source)}</td><td class="num c-ok b">${angka(r.inserted)}</td><td class="num c-pri">${angka(r.updated)}</td><td class="num muted">${angka(r.skipped)}</td></tr>`; }).join('')}</tbody></table></div>
      ${im.warnings.length ? `<div class="card pad-s" style="box-shadow:none;border-color:var(--warn)"><b class="small c-warn">Peringatan</b><ul class="small" style="margin:6px 0 0;padding-left:18px">${im.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>` : ''}` : '<p class="small muted">Jalankan Pindai untuk melihat perkiraan jumlah data yang akan ditambah, diperbarui, dan dilewati.</p>'}
      <div class="card pad-s" style="box-shadow:none"><b class="small">Checklist cutover</b><ol class="small" style="margin:6px 0 0;padding-left:18px"><li>Pindai → Jalankan Import.</li><li>Cek member, kelas, thumbnail, transaksi. Uji login 1 akun member (sandi lama tetap berlaku).</li><li>Isi ulang token Fonnte di Notifikasi › Konfigurasi (rahasia tidak ikut pindah).</li><li>Tepat sebelum pindah: <b>Jalankan Import sekali lagi</b> (delta sync).</li><li>Umumkan alamat baru (broadcast WA). Member cukup login ulang sekali. Arsipkan deployment lama.</li></ol></div></div></div>`;
}
ACT.impJalan = async t => {
  const u = pUI(), src = $('#im-src').value.trim(), dry = t.dataset.dry === '1';
  u.impSrc = src;
  if (!src) return toast('Tempel URL spreadsheet app lama', 'err');
  const sheets = $$('.im-sh').filter(x => x.checked).map(x => x.value);
  if (!dry && !(await konfirmasi('Jalankan import sungguhan? Data baru akan ditulis ke database app ini (app lama tidak diubah).', { ok: 'Jalankan import' }))) return;
  tombolMuat(t, true, dry ? 'Memindai…' : 'Mengimpor…');
  api('importData', S.token, { sumber: src, sheets, dryRun: dry, timpa: $('#im-timpa').checked }).then(r => {
    u.imp = r; tombolMuat(t, false); render();
    toast(dry ? 'Pindai selesai — periksa hasilnya' : 'Import selesai');
    if (!dry) ACT.segarkanAdmin();
  }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); });
};
function tabSistem() {
  const P = S.A.pengaturan || {}, fe = nilaiSet('APP_URL') || (location.origin + location.pathname), api_ = nilaiSet('API_URL') || GAS_URL;
  const embed = `<iframe src="${fe}" style="width:100%;height:100vh;border:0" allow="clipboard-write; fullscreen" loading="lazy"></iframe>`;
  const pf = S.ui.perf;
  const baris = (l, v) => `<div class="row between small"><span>${l}</span>${v}</div>`;
  const ok = (b, ya, tidak) => b ? `<span class="badge bg-ok">${ya}</span>` : `<span class="badge bg-err">${tidak}</span>`;
  return `<div class="adm-grid2"><form class="card pad-l col g16" id="f-sis"><h3>Alamat aplikasi</h3><div class="form-grid">
      ${fieldSet('APP_URL', 'URL aplikasi (GitHub Pages)', { ph: 'https://username.github.io/portalkelas/', hint: 'Dipakai untuk {{link}} & tautan berhenti langganan di WA/email. Terisi otomatis saat admin pertama login.' })}
      <div class="field"><label>URL backend API (/exec)</label><input class="inp mono" value="${esc(api_)}" readonly style="font-size:12px"><span class="hint">Diatur di <code class="k">js/config.js</code> frontend. Bukan rahasia — keamanan dijaga token sesi & cek peran di server.</span></div>
      ${fieldSet('CRM_NONAKTIF_HARI', 'Ambang hari label Non-Aktif', { type: 'number' })}${fieldSet('ARSIP_HARI', 'Arsipkan antrean & log setelah (hari)', { type: 'number' })}</div>
      <button type="button" class="btn pri" style="align-self:flex-start" data-act="simpanSis">${ic('check', 'sm')}Simpan</button></form>
    <div class="col g16"><div class="card pad-l col g12"><div class="row between"><h3>Performa server</h3><button class="btn ghost sm" data-act="cekPerf">${ic('refresh', 'sm')}Cek</button></div>
      ${pf ? `${baris('Cache katalog', pf.cache.katalog === 'HANGAT' ? '<span class="badge bg-ok">hangat</span>' : '<span class="badge bg-warn">dingin</span>')}
        ${baris('Warmup terakhir', `<span class="xs">${pf.cache.warmTerakhir ? relatif(pf.cache.warmTerakhir.at) + ' · ' + esc(pf.cache.warmTerakhir.scope) + ' · ' + pf.cache.warmTerakhir.ms + ' ms' : '—'}</span>`)}
        ${baris('Antrean notifikasi', pf.antrean.ada ? `<span class="badge bg-warn">ada${pf.antrean.sedangDiproses ? ' · diproses' : ''}</span>` : '<span class="badge bg-ok">kosong</span>')}
        ${baris('Trigger antrean (1 mnt) / harian', ok(pf.trigger.antrean && pf.trigger.harian, 'aktif', 'belum lengkap'))}
        ${baris('Script Properties', `<span class="xs">${angka(pf.scriptProperties.ukuranByte)} / ${angka(pf.scriptProperties.batasByte)} byte</span>`)}
        <label class="switch"><input type="checkbox" data-chg="aturWarm" ${pf.keepWarm ? 'checked' : ''}>Warmup otomatis tiap menit (±10–20 mnt kuota trigger/hari)</label>` : `<p class="small muted">Klik <b>Cek</b> untuk melihat status cache, antrean, trigger, dan kuota.</p>`}
      <p class="xs muted">Waktu respons per aksi: buka Console (F12) lalu ketik <code class="k">Perf.summary()</code>.</p></div>
    <div class="card pad-l col g12"><h3>Informasi sistem</h3><dl class="kv"><dt>Versi backend</dt><dd>${esc(P.versi || '')} · skema v${esc(P.skema || '')}</dd><dt>Database</dt><dd>${P.ssUrl ? `<a href="${esc(P.ssUrl)}" target="_blank" rel="noopener">Buka spreadsheet ${ic('ext', 'xs')}</a>` : '—'}</dd><dt>Folder Drive</dt><dd>${P.folderUrl ? `<a href="${esc(P.folderUrl)}" target="_blank" rel="noopener">Buka folder ${ic('ext', 'xs')}</a>` : '—'}</dd></dl>
      <button class="btn sec" data-act="sinkronSkema">${ic('db', 'sm')}Sinkron skema database</button><span class="xs muted">Menambah sheet/kolom baru setelah upgrade kode — data lama tidak disentuh.</span></div>
    <div class="card pad-l col g12"><h3>Aplikasi HP & sematkan</h3><p class="small muted">Frontend ini sudah PWA: member membuka alamat di bawah lalu memilih <b>Pasang aplikasi</b>.</p>
      <div class="rek"><div class="trunc"><div class="xs muted">Alamat aplikasi</div><b class="trunc">${esc(fe)}</b></div><button class="btn soft sm" data-act="salinTeks" data-teks="${esc(fe)}">${ic('copy', 'sm')}Salin</button></div>
      <div class="field"><label>Kode sematan (Blogger/WordPress, opsional)</label><textarea class="inp mono" readonly style="min-height:70px;font-size:12px">${esc(embed)}</textarea></div><button class="btn sec sm" style="align-self:flex-start" data-act="salinTeks" data-teks="${esc(embed)}">${ic('copy', 'sm')}Salin kode</button></div></div></div>`;
}
ACT.cekPerf = t => { tombolMuat(t, true, '…'); api('statusSistem', S.token).then(r => { S.ui.perf = r; render(); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
CHG.aturWarm = t => { const pf = S.ui.perf, lama = pf.keepWarm; optimis({ ubah: () => { pf.keepWarm = t.checked; }, kirim: () => api('aturKeepWarm', S.token, t.checked), sukses: r => { S.ui.perf = r; }, balik: () => { pf.keepWarm = lama; }, pesanGagal: 'Gagal mengubah' }).catch(() => { }); };
ACT.simpanSis = t => simpanSetForm($('#f-sis'), t);
ACT.sinkronSkema = t => { tombolMuat(t, true, 'Menyinkronkan…'); api('sinkronSkema', S.token).then(r => { tombolMuat(t, false); toast(`Skema sinkron. Sheet baru: ${r.sheetBaru.length}, kolom baru: ${r.kolomBaru.length}`); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
