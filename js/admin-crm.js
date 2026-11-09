/* ==========================================================================
   DASHBOARD ADMIN (2/3): Member & CRM, Verifikasi Transaksi
   ========================================================================== */
function crmUI() { return S.ui.crm || (S.ui.crm = { q: '', label: '', status: '', produk: '', wa: '', optin: '', kpi: '', hal: 1, sel: {} }); }
function dupWA() { const c = {}; S.A.member.forEach(m => { if (m.wa) c[m.wa] = (c[m.wa] || 0) + 1; }); return c; }
function semuaLabel(m) { return (m.label + ';' + m.labelManual).split(';').map(x => x.trim()).filter(Boolean); }
function progresMember(id) { const r = (S.A.progres || []).filter(x => x.m === id); return r.length ? Math.round(r.reduce((a, x) => a + x.persen, 0) / r.length) : null; }
function abandoned(id) { const now = Date.now(); return S.A.transaksi.some(t => t.member === id && (t.status === 'Kedaluwarsa' || (t.status === 'Menunggu' && !t.bukti && new Date(t.batas) < now))) && !S.A.transaksi.some(t => t.member === id && t.status === 'Terverifikasi'); }
function daftarCRM() {
  const u = crmUI(), op = S.A.optin || {}, dup = dupWA(), now = Date.now();
  const aksesPer = {}; S.A.akses.forEach(a => { (aksesPer[a.member] = aksesPer[a.member] || []).push(a); });
  return S.A.member.filter(m => {
    if (u.q && !cari(m.nama + ' ' + m.email + ' ' + m.wa + ' ' + hpTampil(m.wa), u.q)) return false;
    if (u.label && semuaLabel(m).indexOf(u.label) < 0) return false;
    if (u.status && m.status !== u.status) return false;
    if (u.produk && !(aksesPer[m.id] || []).some(a => a.produk === u.produk)) return false;
    if (u.wa === 'belum' ? m.statusWA : u.wa && m.statusWA !== u.wa) return false;
    const o = op[m.id] || {};
    if (u.optin === 'ya' && !(o.wp || o.ep)) return false;
    if (u.optin === 'tidak' && (o.wp || o.ep)) return false;
    if (u.kpi === 'aktif' && !(aksesPer[m.id] || []).some(a => a.status === 'Aktif' && (!a.berakhir || new Date(a.berakhir) > now))) return false;
    if (u.kpi === 'dup' && !(m.wa && dup[m.wa] > 1)) return false;
    if (u.kpi === 'abandoned' && !abandoned(m.id)) return false;
    return true;
  }).sort((a, b) => new Date(b.daftar || 0) - new Date(a.daftar || 0));
}
VIEWS['a-member'] = {
  area: 'adm', title: 'Member & CRM',
  render() {
    if (!S.A) return skeleton(6, 64);
    const u = crmUI(), A = S.A, op = A.optin || {}, dup = dupWA(), now = Date.now();
    const L = daftarCRM(), per = 50, hal = Math.min(u.hal, Math.max(1, Math.ceil(L.length / per)));
    const page = L.slice((hal - 1) * per, hal * per);
    const aktifSet = new Set(A.akses.filter(a => a.status === 'Aktif' && (!a.berakhir || new Date(a.berakhir) > now)).map(a => a.member));
    const lbl = {}; A.member.forEach(m => semuaLabel(m).forEach(x => { if (!/^Pembeli:|^merged/.test(x)) lbl[x] = (lbl[x] || 0) + 1; }));
    const nSel = Object.keys(u.sel).length;
    const k = (id, lab, val, ikon, cls) => `<div class="card kpi klik ${u.kpi === id ? 'sel' : ''}" data-act="crmKpi" data-k="${id}" style="${u.kpi === id ? 'border-color:var(--primary);box-shadow:0 0 0 3px rgba(108,60,233,.15)' : ''}"><div class="row between"><span class="lab">${lab}</span><span class="ico ${cls}" style="width:34px;height:34px">${ic(ikon, 'sm')}</span></div><div class="val" style="font-size:24px">${angka(val)}</div></div>`;
    const memMp = memMap(), pm = prodMap();
    return `<div class="page-h"><div><div class="crumb">Pelanggan ${ic('chevR', 'xs')}<b>Member & CRM</b></div><h1>Member & CRM</h1><p>Satu database kontak: leads → member aktif → alumni, lengkap dengan label otomatis.</p></div>
      <div class="row wrap g8"><button class="btn sec" data-act="cekDuplikat">${ic('merge', 'sm')}Duplikat</button>${SA() ? `<button class="btn sec" data-act="importKontak">${ic('upload', 'sm')}Import CSV</button>` : ''}<button class="btn pri" data-act="tambahKontak">${ic('plus', 'sm')}Kontak</button></div></div>
    <div class="kpi4 mb16" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${k('', 'Total Kontak', A.member.length, 'users', 'bg-lav')}${k('aktif', 'Member Aktif', aktifSet.size, 'checkc', 'bg-ok')}${k('wa', 'WA Terverifikasi', A.member.filter(m => m.statusWA === 'Terdaftar').length, 'wa', 'bg-ok')}${k('belumwa', 'Belum Dicek WA', A.member.filter(m => !m.statusWA).length, 'phone', 'bg-grey')}${k('optout', 'Tanpa Izin Promo', A.member.filter(m => { const o = op[m.id] || {}; return !(o.wp || o.ep); }).length, 'bell', 'bg-warn')}${k('dup', 'Duplikat WA', A.member.filter(m => m.wa && dup[m.wa] > 1).length, 'merge', 'bg-pink')}${k('abandoned', 'Abandoned Leads', A.member.filter(m => abandoned(m.id)).length, 'alert', 'bg-err')}</div>
    <div class="card pad"><div class="chips mb16"><button class="chip ${!u.label ? 'on' : ''}" data-act="crmLabel" data-l="">Semua label</button>${Object.keys(lbl).sort((a, b) => lbl[b] - lbl[a]).map(x => `<button class="chip ${u.label === x ? 'on' : ''}" data-act="crmLabel" data-l="${esc(x)}">${esc(x)} <span class="n">${lbl[x]}</span></button>`).join('')}</div>
      <div class="toolbar"><div class="search" style="max-width:320px"><span class="sr">Cari kontak</span>${ic('search')}<input id="cari-crm" type="search" placeholder="Nama, email, nomor WA…" value="${esc(u.q)}" data-in="crmCari"></div>
        <select class="inp pill-inp" style="width:auto" data-chg="crmF" data-k="status" aria-label="Status akun"><option value="">Semua status</option>${['Lead', 'Aktif', 'Nonaktif', 'Diblokir'].map(s => `<option ${u.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <select class="inp pill-inp" style="width:auto;max-width:220px" data-chg="crmF" data-k="produk" aria-label="Kelas"><option value="">Semua kelas</option>${A.produk.map(p => `<option value="${p.ID_Produk}" ${u.produk === p.ID_Produk ? 'selected' : ''}>${esc(p.Nama)}</option>`).join('')}</select>
        <select class="inp pill-inp" style="width:auto" data-chg="crmF" data-k="wa" aria-label="Status WA"><option value="">Status WA</option><option value="Terdaftar" ${u.wa === 'Terdaftar' ? 'selected' : ''}>Terdaftar WA</option><option value="Tidak Terdaftar" ${u.wa === 'Tidak Terdaftar' ? 'selected' : ''}>Bukan WA</option><option value="belum" ${u.wa === 'belum' ? 'selected' : ''}>Belum dicek</option></select>
        <select class="inp pill-inp" style="width:auto" data-chg="crmF" data-k="optin" aria-label="Izin promosi"><option value="">Izin promosi</option><option value="ya" ${u.optin === 'ya' ? 'selected' : ''}>Setuju</option><option value="tidak" ${u.optin === 'tidak' ? 'selected' : ''}>Tidak setuju</option></select>
        <span class="grow"></span>${SA() ? tombolEkspor('eksporCRM') : ''}</div>
      ${nSel ? `<div class="batchbar"><b class="small c-pri">${ic('checkc', 'sm')} ${nSel} kontak dipilih</b><div class="row wrap g8"><button class="btn sec sm" data-act="crmBulk" data-a="deteksiWA">${ic('wa', 'sm')}Deteksi WA</button><button class="btn sec sm" data-act="crmBulk" data-a="tag">${ic('tag', 'sm')}Beri label</button><button class="btn sec sm" data-act="crmBulk" data-a="untag">Hapus label</button><button class="btn sec sm" data-act="crmBulk" data-a="optout">Opt-out</button>${SA() ? `<button class="btn sec sm" data-act="crmBulk" data-a="optin">Opt-in</button><button class="btn pri sm" data-act="crmBlast">${ic('megaphone', 'sm')}Blast ke terpilih</button>` : ''}<button class="btn ghost sm" data-act="crmSelNone">Batal</button></div></div>` : ''}
      <div class="tbl-wrap mt12"><table class="tbl"><thead><tr><th style="width:36px"><label class="check"><input type="checkbox" id="cs-all" data-chg="crmSelAll" aria-label="Pilih semua" ${page.length && page.every(m => u.sel[m.id]) ? 'checked' : ''}></label></th><th>Kontak</th><th>WhatsApp</th><th>Label</th><th>Kelas & progres</th><th>Dihubungi</th><th>Status</th><th></th></tr></thead><tbody>
      ${page.map(m => {
        const o = op[m.id] || {}, prog = progresMember(m.id), nk = A.akses.filter(a => a.member === m.id && a.status === 'Aktif').length;
        const masalah = !m.wa || m.statusWA === 'Tidak Terdaftar' || (m.wa && dup[m.wa] > 1);
        return `<tr class="klik ${u.sel[m.id] ? 'sel' : ''}" data-act="bukaMember" data-id="${m.id}" style="${masalah ? 'box-shadow:inset 3px 0 0 var(--warn)' : ''}"><td data-stop="1"><label class="check"><input type="checkbox" id="cs-${m.id}" data-chg="crmSel" data-id="${m.id}" ${u.sel[m.id] ? 'checked' : ''} aria-label="Pilih ${esc(m.nama)}"></label></td>
          <td><div class="row g8">${avatar(m.nama, 'sm soft')}<div style="min-width:0;max-width:220px"><b class="small trunc" style="display:block">${esc(m.nama)}</b><span class="xs muted trunc" style="display:block">${esc(m.email)}</span></div></div></td>
          <td class="nowrap"><span class="mono small">${esc(hpTampil(m.wa)) || '<span class="muted">—</span>'}</span> ${m.wa ? waBadge(m.statusWA) : ''}${m.wa && dup[m.wa] > 1 ? ' <span class="wa-badge bg-pink">ganda</span>' : ''}<div class="xs muted">${o.wp ? 'WA promo ✓' : 'WA promo ✕'} · ${o.ep ? 'Email ✓' : 'Email ✕'}</div></td>
          <td style="min-width:160px;max-width:280px">${chipsLabel(m.label + ';' + m.labelManual, 3)}</td>
          <td class="nowrap small">${nk ? `${nk} kelas aktif<div style="width:110px" class="mt8">${bar(prog || 0, 'thin')}</div><span class="xs muted">${prog || 0}% rata-rata</span>` : '<span class="muted">—</span>'}</td>
          <td class="nowrap xs">${m.kontak ? relatif(m.kontak) : '<span class="muted">belum</span>'}<div class="muted">${m.pesan} pesan</div></td>
          <td>${pillAkun(m.status)}</td><td><button class="btn ghost icon xs" data-act="bukaMember" data-id="${m.id}" aria-label="Detail">${ic('chevR', 'sm')}</button></td></tr>`;
      }).join('') || `<tr><td colspan="8">${kosong('users', 'Tidak ada kontak', 'Ubah filter atau tambah kontak baru.')}</td></tr>`}</tbody></table></div>
      ${pager(L.length, hal, per, 'crmHal')}</div>`;
  }
};
INP.crmCari = debounce(t => { const u = crmUI(); u.q = t.value; u.hal = 1; rerender(); }, 150);
CHG.crmF = t => { const u = crmUI(); u[t.dataset.k] = t.value; u.hal = 1; render(); };
ACT.crmLabel = t => { const u = crmUI(); u.label = t.dataset.l; u.hal = 1; render(); };
ACT.crmKpi = t => { const u = crmUI(), k = t.dataset.k; Object.assign(u, { kpi: '', wa: '', optin: '', hal: 1 }); if (k === 'wa') u.wa = 'Terdaftar'; else if (k === 'belumwa') u.wa = 'belum'; else if (k === 'optout') u.optin = 'tidak'; else u.kpi = k; render(); };
ACT.crmHal = t => { crmUI().hal = Number(t.dataset.hal); render(); window.scrollTo(0, 0); };
ACT.noop = () => { };
CHG.crmSel = t => { const u = crmUI(); if (t.checked) u.sel[t.dataset.id] = 1; else delete u.sel[t.dataset.id]; rerender(); };
CHG.crmSelAll = t => { const u = crmUI(), L = daftarCRM(), per = 50, page = L.slice((u.hal - 1) * per, u.hal * per); page.forEach(m => { if (t.checked) u.sel[m.id] = 1; else delete u.sel[m.id]; }); rerender(); };
ACT.crmSelNone = () => { crmUI().sel = {}; render(); };
ACT.crmBulk = async t => {
  const u = crmUI(), ids = Object.keys(u.sel), a = t.dataset.a;
  if (a === 'deteksiWA') return deteksiWAMassal(ids);
  let nilai = '';
  if (a === 'tag' || a === 'untag') {
    const opsi = S.A.label.filter(l => l.Aturan_Otomatis === 'MANUAL').map(l => l.Nama_Label);
    nilai = await tanya(a === 'tag' ? 'Beri label' : 'Hapus label', { pesan: 'Label manual tersedia: ' + (opsi.join(', ') || '— (buat di Pengaturan › Label CRM)') + '. Boleh mengetik label baru.', placeholder: 'Nama label', ok: a === 'tag' ? 'Beri label' : 'Hapus label' });
    if (!nilai) return;
  }
  if (a === 'optout' && !(await konfirmasi(`Hentikan pesan promosi untuk <b>${ids.length} kontak</b>? Pesan transaksi tetap terkirim.`, { ok: 'Opt-out' }))) return;
  if (a === 'optin' && !(await konfirmasi(`Catat persetujuan promosi untuk <b>${ids.length} kontak</b>? Pastikan Anda memiliki bukti persetujuan dari mereka.`, { ok: 'Catat persetujuan' }))) return;
  const lama = salin(S.A.member.filter(m => ids.indexOf(m.id) > -1)), lamaOpt = salin(S.A.optin);
  optimis({
    ubah: () => {
      S.A.member.forEach(m => {
        if (ids.indexOf(m.id) < 0) return;
        if (a === 'tag' || a === 'untag') { const set = m.labelManual.split(';').map(x => x.trim()).filter(Boolean); const i = set.indexOf(nilai); if (a === 'tag' && i < 0) set.push(nilai); if (a === 'untag' && i > -1) set.splice(i, 1); m.labelManual = set.join('; '); }
        if (a === 'optout' || a === 'optin') { const o = S.A.optin[m.id] || (S.A.optin[m.id] = { wt: true }); o.wp = o.ep = a === 'optin'; }
      });
    },
    kirim: () => api('crmMassal', S.token, ids, a, nilai),
    sukses: r => { if (r.optin) S.A.optin = r.optin; u.sel = {}; simpanCache(); toast(`${ids.length} kontak diperbarui`); },
    balik: () => { upsertArr(S.A.member, lama, 'id'); S.A.optin = lamaOpt; }, pesanGagal: 'Aksi massal gagal'
  }).catch(() => { });
};
async function deteksiWAMassal(ids) {
  ids = ids.filter(id => (memMap()[id] || {}).wa);
  if (!ids.length) return toast('Tidak ada nomor untuk dicek', 'info');
  let n = 0;
  toast(`Mengecek ${ids.length} nomor WhatsApp…`, 'info');
  for (let i = 0; i < ids.length; i += 50) {
    try {
      const r = await api('cekNomorWA', S.token, ids.slice(i, i + 50));
      (r.hasil || []).forEach(h => { const m = memMap()[h.id]; if (m) { m.statusWA = h.statusWA; m.cekWA = new Date().toISOString(); } });
      n += r.dicek || 0; rerender();
    } catch (e) { toast(e.message, 'err'); break; }
  }
  if (n) { toast(`${n} nomor selesai dicek`); simpanCache(); }
}
ACT.crmBlast = () => { const ids = Object.keys(crmUI().sel); S.ui.bc = Object.assign(bcUI(), { manual: ids, sumber: 'manual' }); go('a-broadcast'); toast(ids.length + ' penerima dimuat ke kampanye', 'info'); };
ACT.eksporCRM = t => {
  const op = S.A.optin || {};
  ekspor('kontak-crm', [{ l: 'ID', k: 'id' }, { l: 'Nama', k: 'nama' }, { l: 'Email', k: 'email' }, { l: 'WhatsApp', f: m => hpTampil(m.wa) }, { l: 'Status WA', k: 'statusWA' }, { l: 'Status Akun', k: 'status' }, { l: 'Label', f: m => semuaLabel(m).join('; ') }, { l: 'Izin WA Promo', f: m => (op[m.id] || {}).wp ? 'Ya' : 'Tidak' }, { l: 'Izin Email Promo', f: m => (op[m.id] || {}).ep ? 'Ya' : 'Tidak' }, { l: 'Sumber', k: 'sumber' }, { l: 'Terdaftar', f: m => tgl(m.daftar) }, { l: 'Login Terakhir', f: m => tglJam(m.login) }, { l: 'Jumlah Pesan', k: 'pesan' }], daftarCRM(), t.dataset.f).catch(e => toast(e.message, 'err'));
};
ACT.tambahKontak = () => {
  const w = modal({ title: 'Tambah Kontak', size: 'sm', body: `<form id="f-kon" class="col g12"><div class="field"><label for="kn-n">Nama</label><input class="inp" id="kn-n" name="Nama" required></div><div class="field"><label for="kn-e">Email</label><input class="inp" id="kn-e" name="Email" type="email" required></div><div class="field"><label for="kn-w">WhatsApp</label><input class="inp" id="kn-w" name="No_WhatsApp" type="tel" placeholder="0812…"></div><div class="field"><label for="kn-s">Sumber lead</label><input class="inp" id="kn-s" name="Sumber_Lead" placeholder="Manual, Seminar, Instagram…"></div></form>`, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Simpan</button>` });
  w.querySelector('[data-k=ok]').onclick = ev => {
    const o = formObj(w.querySelector('#f-kon'));
    if (o.Nama.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(o.Email)) return toast('Isi nama & email yang valid', 'err');
    tombolMuat(ev.currentTarget, true, 'Menyimpan…');
    api('simpanData', S.token, 'Member', [Object.assign({ ID_Member: uid('MBR') }, o)]).then(r => { upsertArr(S.A.member, r.rows, 'id'); tutupModal(w); simpanCache(); rerender(); toast('Kontak ditambahkan'); })
      .catch(e => { tombolMuat(ev.currentTarget, false); toast(e.message, 'err'); });
  };
};
ACT.importKontak = () => {
  const w = modal({
    title: 'Import Kontak (CSV)', body: `<div class="col g12"><p class="small muted">Kolom: <code class="k">nama,email,wa,label,optin</code>. Email yang sudah ada tidak diduplikasi (hanya kolom kosong yang dilengkapi). Isi <code class="k">optin</code> = ya hanya bila kontak memang menyetujui info promosi.</p>
      <button class="btn sec sm" style="align-self:flex-start" data-k="tpl">${ic('download', 'sm')}Unduh template CSV</button>
      <label class="drop"><span class="ico">${ic('upload')}</span><b class="c-pri">Pilih berkas CSV</b><span class="xs muted" id="imp-info">Maksimal 5.000 baris</span><input type="file" accept=".csv,text/csv" class="sr" id="imp-file"></label></div>`,
    foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok" disabled>Import</button>`
  });
  let rows = [];
  w.querySelector('[data-k=tpl]').onclick = () => unduhBlob(new Blob(['﻿nama,email,wa,label,optin\nBudi Santoso,budi@contoh.id,081234567890,Seminar Okt,ya\n'], { type: 'text/csv' }), 'template-kontak.csv');
  w.querySelector('#imp-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      rows = parseCSV(String(fr.result));
      w.querySelector('#imp-info').innerHTML = `<b>${angka(rows.length)}</b> baris terbaca dari ${esc(f.name)}`;
      w.querySelector('[data-k=ok]').disabled = !rows.length;
    };
    fr.readAsText(f);
  };
  w.querySelector('[data-k=ok]').onclick = ev => {
    tombolMuat(ev.currentTarget, true, 'Mengimpor…');
    api('crmImport', S.token, rows).then(r => { upsertArr(S.A.member, r.member || [], 'id'); if (r.optin) S.A.optin = r.optin; tutupModal(w); simpanCache(); rerender(); toast(`Import selesai: +${r.ditambah} baru, ${r.diperbarui} diperbarui, ${r.dilewati} dilewati`); })
      .catch(e => { tombolMuat(ev.currentTarget, false); toast(e.message, 'err'); });
  };
};
function parseCSV(txt) {
  txt = txt.replace(/^﻿/, '');
  const sep = (txt.split('\n')[0].match(/;/g) || []).length > (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const out = []; let row = [], cur = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === sep) { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cur); out.push(row); row = []; cur = ''; } else cur += c;
  }
  if (cur || row.length) { row.push(cur); out.push(row); }
  const h = (out.shift() || []).map(x => x.trim().toLowerCase());
  return out.filter(r => r.join('').trim()).map(r => { const o = {}; h.forEach((k, i) => { o[k] = (r[i] || '').trim(); }); return o; });
}
ACT.cekDuplikat = () => {
  const g = {};
  S.A.member.forEach(m => { if (m.wa) (g[m.wa] = g[m.wa] || []).push(m); });
  const grup = Object.keys(g).filter(k => g[k].length > 1);
  const w = modal({
    title: 'Periksa Duplikat (nomor WA sama)', size: 'lg',
    body: grup.length ? grup.map(k => `<div class="card pad-s mb8"><div class="row between mb8"><b class="mono">${esc(hpTampil(k))}</b><span class="xs muted">${g[k].length} kontak</span></div>${g[k].map((m, i) => `<label class="check" style="padding:6px 0"><input type="radio" name="u_${k}" value="${m.id}" ${i === 0 ? 'checked' : ''}><span><b>${esc(m.nama)}</b> · ${esc(m.email)} · ${pillAkun(m.status)} <span class="xs muted">${tgl(m.daftar)}</span></span></label>`).join('')}${SA() ? `<button class="btn soft sm mt8" data-gabung="${k}">${ic('merge', 'sm')}Gabungkan ke kontak terpilih</button>` : ''}</div>`).join('') : kosong('checkc', 'Tidak ada duplikat', 'Semua nomor WhatsApp unik.')
  });
  $$('[data-gabung]', w).forEach(b => b.onclick = () => {
    const k = b.dataset.gabung, utama = (w.querySelector(`input[name="u_${k}"]:checked`) || {}).value;
    const lain = g[k].map(m => m.id).filter(id => id !== utama);
    konfirmasi(`Gabungkan ${lain.length} kontak ke <b>${esc(memMap()[utama].nama)}</b>? Transaksi, akses, progres, dan catatan dipindahkan. Kontak lain ditandai "Digabung".`, { ok: 'Gabungkan' }).then(ya => {
      if (!ya) return;
      tombolMuat(b, true, 'Menggabungkan…');
      api('crmGabung', S.token, utama, lain).then(d => { S.A = d; S.sinkron = Date.now(); simpanCache(); tutupModal(w); rerender(); toast('Kontak digabungkan'); }).catch(e => { tombolMuat(b, false); toast(e.message, 'err'); });
    });
  });
};

/* --- Drawer profil CRM --- */
ACT.bukaMember = t => {
  const id = t.dataset.id, m = memMap()[id];
  if (!m) return;
  const p = $('#cari-pop'); if (p) p.innerHTML = '';
  const w = modal({ title: m.nama, drawer: true, size: 'lg', body: `<div id="crm-isi">${isiCRM(m, null)}</div>` });
  w.dataset.member = id;
  api('crmDetail', S.token, id).then(d => { upsertArr(S.A.member, [d.member], 'id'); S.ui.crmDet = d; const el = $('#crm-isi', w); if (el) el.innerHTML = isiCRM(memMap()[id], d); }).catch(e => toast(e.message, 'err'));
};
function isiCRM(m, d) {
  const A = S.A, pm = prodMap(), o = d ? d.optin : (A.optin[m.id] || {}), now = Date.now();
  const akses = A.akses.filter(a => a.member === m.id), trx = A.transaksi.filter(t => t.member === m.id).sort((a, b) => new Date(b.dibuat) - new Date(a.dibuat));
  const prog = {}; (A.progres || []).filter(r => r.m === m.id).forEach(r => { prog[r.p] = r; });
  const manual = m.labelManual.split(';').map(x => x.trim()).filter(Boolean);
  const labelOps = A.label.filter(l => l.Aturan_Otomatis === 'MANUAL' && manual.indexOf(l.Nama_Label) < 0);
  return `<div class="col g16">
    <div class="row g12">${avatar(m.nama, 'lg')}<div class="grow" style="min-width:0"><h2 class="trunc">${esc(m.nama)}</h2><div class="small muted trunc">${esc(m.email)}</div><div class="row wrap g4 mt8">${pillAkun(m.status)}${chipsLabel(m.label, 6)}</div></div></div>
    <div class="row wrap g8">${m.wa ? `<a class="btn ok sm" href="https://wa.me/${esc(m.wa)}" target="_blank" rel="noopener">${ic('wa', 'sm')}WhatsApp</a>` : ''}<a class="btn sec sm" href="mailto:${esc(m.email)}">${ic('mail', 'sm')}Email</a>${m.wa ? `<button class="btn sec sm" data-act="salinTeks" data-teks="${esc(hpTampil(m.wa))}">${ic('copy', 'sm')}${esc(hpTampil(m.wa))}</button>` : ''}
      <button class="btn sec sm" data-act="aksiMember" data-a="kirim_kode" data-id="${m.id}">${ic('key', 'sm')}Kirim kode login</button>${SA() ? (m.status === 'Diblokir' ? `<button class="btn sec sm" data-act="aksiMember" data-a="aktifkan" data-id="${m.id}">Aktifkan</button>` : `<button class="btn danger sm" data-act="aksiMember" data-a="blokir" data-id="${m.id}">Blokir</button>`) : ''}</div>
    <div class="card pad-s"><dl class="kv"><dt>WhatsApp</dt><dd>${esc(hpTampil(m.wa)) || '—'} ${m.wa ? waBadge(m.statusWA) : ''}</dd><dt>Sumber lead</dt><dd>${esc(m.sumber || '-')}</dd><dt>Terdaftar</dt><dd>${tglJam(m.daftar)}</dd><dt>Login terakhir</dt><dd>${m.login ? relatif(m.login) : 'belum pernah'}</dd><dt>Aktivitas belajar</dt><dd>${m.aktivitas ? relatif(m.aktivitas) : '—'} · ${durasi(m.menit)}</dd><dt>Izin promosi</dt><dd>${o.wp ? '<span class="badge bg-ok">WA ✓</span>' : '<span class="badge bg-grey">WA ✕</span>'} ${o.ep ? '<span class="badge bg-ok">Email ✓</span>' : '<span class="badge bg-grey">Email ✕</span>'}</dd><dt>Pesan terkirim</dt><dd>${m.pesan} · ${m.kontak ? 'terakhir ' + relatif(m.kontak) : 'belum'}</dd></dl></div>
    <div><h3 class="mb8">Label manual</h3><div class="row wrap g4">${manual.map(x => `<span class="lbl-chip" style="padding:4px 10px">${esc(x)} <button data-act="lblHapus" data-id="${m.id}" data-l="${esc(x)}" aria-label="Hapus label ${esc(x)}">✕</button></span>`).join('') || '<span class="xs muted">Belum ada</span>'}
      ${labelOps.length ? `<select class="inp pill-inp" style="width:auto;min-height:32px;font-size:12px" data-chg="lblTambah" data-id="${m.id}"><option value="">+ Label</option>${labelOps.map(l => `<option>${esc(l.Nama_Label)}</option>`).join('')}</select>` : ''}</div></div>
    <div><div class="row between mb8"><h3>Kelas & akses</h3><button class="btn soft xs" data-act="beriAkses" data-id="${m.id}">${ic('plus', 'xs')}Beri akses</button></div>
      ${akses.map(a => { const r = prog[a.produk], aktif = a.status === 'Aktif' && (!a.berakhir || new Date(a.berakhir) > now); return `<div class="card pad-s mb8" style="box-shadow:none"><div class="row between g8"><div style="min-width:0"><b class="small clamp2">${esc((pm[a.produk] || {}).Nama || a.produk)}</b><div class="xs muted">${aktif ? 'Aktif' : esc(a.status)} · ${a.berakhir ? 's.d. ' + tgl(a.berakhir) : 'selamanya'} · ${esc(a.sumber)}</div></div><div class="row g4"><button class="btn ghost xs" data-act="aksesAksi" data-a="perpanjang" data-m="${m.id}" data-p="${a.produk}">Perpanjang</button>${aktif ? `<button class="btn ghost xs c-err" data-act="aksesAksi" data-a="cabut" data-m="${m.id}" data-p="${a.produk}">Cabut</button>` : ''}</div></div>${r ? `<div class="row g8 mt8"><div class="grow">${bar(r.persen, r.persen === 100 ? 'ok thin' : 'thin')}</div><span class="xs b">${r.persen}%</span></div>` : ''}</div>`; }).join('') || '<p class="xs muted">Belum memiliki akses kelas.</p>'}</div>
    <div><h3 class="mb8">Riwayat pembelian</h3>${trx.map(t => `<button class="dl-row" style="width:100%;text-align:left" data-act="bukaTrxDariCRM" data-id="${t.id}"><div class="grow"><b class="small">${esc(t.namaProduk)}</b><div class="xs muted">${esc(t.id)} · ${tgl(t.dibuat)}</div></div><div class="right"><b class="small">${rp(t.nominal)}</b><div>${pillTrx(t.status)}</div></div></button>`).join('') || '<p class="xs muted">Belum ada transaksi.</p>'}</div>
    <div class="card pad-s" style="box-shadow:none"><h3 class="mb8">Catatan admin</h3><div class="row g8 mb8"><select class="inp" id="ct-jenis" style="width:auto"><option>Catatan</option><option>Telepon</option><option>WA Manual</option><option>Kunjungan</option><option>Email Manual</option></select></div><textarea class="inp" id="ct-isi" style="min-height:70px" placeholder="Hasil follow-up, minat, keberatan…"></textarea><button class="btn pri sm mt8" data-act="simpanCatatan" data-id="${m.id}">${ic('check', 'sm')}Simpan catatan</button></div>
    <div><h3 class="mb8">Activity timeline</h3>${d ? `<div class="timeline">${d.timeline.map(x => `<div class="tl-it ${esc(x.j)}">${esc(x.t)}<time>${tglJam(x.w)}</time></div>`).join('') || '<p class="xs muted">Belum ada aktivitas.</p>'}</div>` : skeleton(4, 36)}</div>
    ${SA() ? `<details class="card pad-s" style="box-shadow:none"><summary class="b small" style="cursor:pointer">Edit data kontak</summary><form id="f-edm" class="col g12 mt12"><div class="field"><label>Nama</label><input class="inp" name="Nama" value="${esc(m.nama)}"></div><div class="field"><label>Email</label><input class="inp" name="Email" type="email" value="${esc(m.email)}"></div><div class="field"><label>WhatsApp</label><input class="inp" name="No_WhatsApp" value="${esc(hpTampil(m.wa))}"></div><div class="field"><label>Status akun</label><select class="inp" name="Status_Akun">${['Lead', 'Aktif', 'Nonaktif', 'Diblokir'].map(s => `<option ${m.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><button type="button" class="btn pri sm" data-act="simpanKontak" data-id="${m.id}">Simpan perubahan</button></form></details>` : ''}
  </div>`;
}
function segarkanDrawer(id) { const w = $$('.modal-bg').find(x => x.dataset.member === id); if (w) { const el = $('#crm-isi', w); if (el) el.innerHTML = isiCRM(memMap()[id], S.ui.crmDet && S.ui.crmDet.member.id === id ? S.ui.crmDet : null); } rerender(); }
ACT.bukaTrxDariCRM = t => { tutupModal(); ACT.bukaTrx(t); };
ACT.lblHapus = t => ubahLabelManual(t.dataset.id, t.dataset.l, 'untag');
CHG.lblTambah = t => { if (t.value) ubahLabelManual(t.dataset.id, t.value, 'tag'); };
function ubahLabelManual(id, lbl, aksi) {
  const m = memMap()[id], lama = m.labelManual;
  optimis({
    ubah: () => { const s = m.labelManual.split(';').map(x => x.trim()).filter(Boolean); const i = s.indexOf(lbl); if (aksi === 'tag' && i < 0) s.push(lbl); if (aksi === 'untag' && i > -1) s.splice(i, 1); m.labelManual = s.join('; '); segarkanDrawer(id); },
    kirim: () => api('crmMassal', S.token, [id], aksi, lbl), sukses: () => simpanCache(), balik: () => { m.labelManual = lama; segarkanDrawer(id); }, pesanGagal: 'Label gagal disimpan'
  }).catch(() => { });
}
ACT.simpanCatatan = t => {
  const id = t.dataset.id, isi = ($('#ct-isi') || {}).value || '', jenis = ($('#ct-jenis') || {}).value || 'Catatan';
  if (isi.trim().length < 2) return toast('Catatan kosong', 'err');
  const d = S.ui.crmDet && S.ui.crmDet.member.id === id ? S.ui.crmDet : null;
  const item = { w: new Date().toISOString(), j: 'catatan', t: jenis + ' oleh ' + S.user.nama + ': ' + isi.trim() };
  optimis({
    ubah: () => { if (d) d.timeline.unshift(item); if (jenis !== 'Catatan') memMap()[id].kontak = item.w; segarkanDrawer(id); },
    kirim: () => api('crmCatatan', S.token, id, isi, jenis), sukses: () => toast('Catatan tersimpan'),
    balik: () => { if (d) d.timeline.shift(); segarkanDrawer(id); }, pesanGagal: 'Catatan gagal disimpan'
  }).catch(() => { });
};
ACT.aksiMember = t => {
  const id = t.dataset.id, a = t.dataset.a, m = memMap()[id];
  const pesan = { kirim_kode: `Kirim kode login sekali pakai ke WA & email <b>${esc(m.nama)}</b>?`, blokir: `Blokir akun <b>${esc(m.nama)}</b>? Member tidak bisa login sampai diaktifkan lagi.`, aktifkan: `Aktifkan kembali akun <b>${esc(m.nama)}</b>?` }[a];
  konfirmasi(pesan, { ok: a === 'kirim_kode' ? 'Kirim kode' : a === 'blokir' ? 'Blokir' : 'Aktifkan', danger: a === 'blokir' }).then(ya => {
    if (!ya) return;
    const lama = m.status;
    optimis({
      ubah: () => { if (a === 'blokir') m.status = 'Diblokir'; if (a === 'aktifkan') m.status = 'Aktif'; segarkanDrawer(id); },
      kirim: () => api('aksiMember', S.token, id, a), sukses: r => { upsertArr(S.A.member, [r], 'id'); segarkanDrawer(id); simpanCache(); toast(a === 'kirim_kode' ? 'Kode login masuk antrean WA & email' : 'Status akun diperbarui'); },
      balik: () => { m.status = lama; segarkanDrawer(id); }, pesanGagal: 'Aksi gagal'
    }).catch(() => { });
  });
};
ACT.simpanKontak = t => {
  const id = t.dataset.id, o = formObj($('#f-edm'));
  tombolMuat(t, true, 'Menyimpan…');
  api('simpanData', S.token, 'Member', [Object.assign({ ID_Member: id }, o)]).then(r => { upsertArr(S.A.member, r.rows, 'id'); simpanCache(); segarkanDrawer(id); toast('Kontak diperbarui'); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); });
};
ACT.beriAkses = t => {
  const id = t.dataset.id;
  const w = modal({ title: 'Beri akses kelas manual', size: 'sm', body: `<div class="col g12"><div class="field"><label for="ba-p">Kelas</label><select class="inp" id="ba-p">${S.A.produk.map(p => `<option value="${p.ID_Produk}">${esc(p.Nama)}</option>`).join('')}</select></div><div class="field"><label for="ba-h">Durasi (hari)</label><input class="inp" id="ba-h" type="number" min="0" placeholder="Kosong = ikuti pengaturan kelas, 0 = selamanya"></div><label class="check"><input type="checkbox" id="ba-n" checked><span>Kirim info akses & kode login ke member</span></label></div>`, foot: `<button class="btn sec" data-act="tutupModal">Batal</button><button class="btn pri" data-k="ok">Beri akses</button>` });
  w.querySelector('[data-k=ok]').onclick = ev => { aturAksesKlien(id, w.querySelector('#ba-p').value, 'beri', w.querySelector('#ba-h').value, w.querySelector('#ba-n').checked, ev.currentTarget, w); };
};
ACT.aksesAksi = t => {
  const a = t.dataset.a;
  if (a === 'cabut') return konfirmasi('Cabut akses kelas ini? Member tidak bisa membuka materi lagi.', { ok: 'Cabut akses', danger: true }).then(ya => ya && aturAksesKlien(t.dataset.m, t.dataset.p, 'cabut', '', false, t));
  tanya('Perpanjang akses (hari)', { pesan: 'Kosongkan untuk mengikuti durasi kelas. Isi 0 untuk akses selamanya.', placeholder: '30', ok: 'Perpanjang' }).then(h => { if (h !== null) aturAksesKlien(t.dataset.m, t.dataset.p, 'perpanjang', h, true, t); });
};
function aturAksesKlien(idMember, idProduk, aksi, hari, kirimInfo, btn, w) {
  tombolMuat(btn, true, 'Menyimpan…');
  api('aturAkses', S.token, { idMember, idProduk, aksi, hari, kirimInfo }).then(r => {
    S.A.akses = S.A.akses.filter(a => a.member !== idMember).concat(r.akses);
    upsertArr(S.A.member, [r.member], 'id'); simpanCache();
    if (w) tutupModal(w);
    segarkanDrawer(idMember); toast(aksi === 'cabut' ? 'Akses dicabut' : 'Akses diberikan');
  }).catch(e => { tombolMuat(btn, false); toast(e.message, 'err'); });
}

/* ---------------- Verifikasi transaksi ---------------- */
function trxUI() { return S.ui.trx || (S.ui.trx = { q: '', status: 'Menunggu', metode: '', rentang: '30', hal: 1, sel: {} }); }
function daftarTrx() {
  const u = trxUI(), mm = memMap(), now = Date.now(), batas = u.rentang === 'all' ? 0 : now - Number(u.rentang) * 864e5;
  return S.A.transaksi.filter(t => {
    if (u.status && t.status !== u.status) return false;
    if (u.metode && t.metode !== u.metode) return false;
    if (batas && new Date(t.dibuat).getTime() < batas && t.status !== 'Menunggu') return false;
    const m = mm[t.member] || {};
    return cari(t.id + ' ' + t.namaProduk + ' ' + m.nama + ' ' + m.email + ' ' + m.wa + ' ' + t.nominal, u.q);
  }).sort((a, b) => (b.bukti - a.bukti) || new Date(b.dibuat) - new Date(a.dibuat));
}
VIEWS['a-transaksi'] = {
  area: 'adm', title: 'Verifikasi Transaksi',
  render() {
    if (!S.A) return skeleton(5, 70);
    const u = trxUI(), A = S.A, mm = memMap(), now = Date.now();
    if (S.ui.trxSel) { u.aktif = S.ui.trxSel; u.status = ''; S.ui.trxSel = null; }
    const L = daftarTrx(), per = 25, hal = Math.min(u.hal, Math.max(1, Math.ceil(L.length / per))), page = L.slice((hal - 1) * per, hal * per);
    if (!u.aktif || !A.transaksi.find(t => t.id === u.aktif)) u.aktif = (L[0] || {}).id;
    const tunggu = A.transaksi.filter(t => t.status === 'Menunggu' && t.bukti);
    const hariIni = new Date().toISOString().slice(0, 10), kemarin = new Date(now - 864e5).toISOString().slice(0, 10);
    const verHari = d => A.transaksi.filter(t => t.status === 'Terverifikasi' && String(t.diverifikasi || '').slice(0, 10) === d);
    const vh = verHari(hariIni), vk = verHari(kemarin);
    const minggu = A.transaksi.filter(t => t.diverifikasi && now - new Date(t.diverifikasi) < 7 * 864e5 && t.status === 'Terverifikasi');
    const rataMnt = minggu.length ? Math.round(minggu.reduce((a, t) => a + (new Date(t.diverifikasi) - new Date(t.dibuat)) / 6e4, 0) / minggu.length) : 0;
    const tolak = A.transaksi.filter(t => (t.status === 'Ditolak' || t.status === 'Kedaluwarsa') && now - new Date(t.diverifikasi || t.dibuat) < 7 * 864e5);
    const cnt = s => A.transaksi.filter(t => !s || t.status === s).length;
    const nSel = Object.keys(u.sel).length;
    const met = [...new Set(A.transaksi.map(t => t.metode))];
    return `<div class="page-h"><div><div class="crumb">${esc(S.app.NAMA_PORTAL)} ${ic('chevR', 'xs')} Keuangan ${ic('chevR', 'xs')}<b>Verifikasi Transaksi</b></div><h1>Verifikasi Transaksi Pembayaran</h1><p>Tinjau bukti transfer, setujui akses kelas otomatis (&lt; 5 menit), atau tolak transaksi tidak valid.</p></div>
      <div class="row wrap g8"><span class="chip" style="background:var(--ok-bg);color:var(--ok-t);border-color:transparent"><span style="width:8px;height:8px;border-radius:50%;background:var(--ok)"></span>Notifikasi otomatis aktif</span><button class="btn sec" data-act="segarkanAdmin">${ic('refresh', 'sm')}Segarkan</button>${tombolEkspor('eksporTrx')}</div></div>
    <div class="kpi4 mb16">
      ${kpi({ lab: 'Menunggu Tindakan', val: tunggu.length + '<small class="c-warn">transaksi</small>', ikon: 'clock', cls: 'bg-warn', glow: 'rgba(245,158,11,.3)', sub: `<b>${rp(tunggu.reduce((a, t) => a + t.nominal, 0))}</b><span class="badge bg-warn">Perlu tindakan</span>` })}
      ${kpi({ lab: 'Terverifikasi Hari Ini', val: vh.length + '<small class="c-ok">transaksi</small>', ikon: 'checkc', cls: 'bg-ok', glow: 'rgba(16,185,129,.25)', sub: `<b>${rp(vh.reduce((a, t) => a + t.nominal, 0))}</b><span class="badge bg-ok">${vk.length ? (vh.length >= vk.length ? '▲ ' : '▼ ') + Math.abs(Math.round((vh.length - vk.length) / vk.length * 100)) + '% dr kemarin' : 'hari ini'}</span>` })}
      ${kpi({ lab: 'Rata-rata Order → Aktif', val: `<span class="c-pri">${rataMnt < 60 ? rataMnt : Math.round(rataMnt / 6) / 10}</span><small>${rataMnt < 60 ? 'menit' : 'jam'}</small>`, ikon: 'zap', cls: 'bg-lav', glow: 'rgba(108,60,233,.2)', sub: `<span class="muted">7 hari · ${minggu.length} transaksi</span><span class="badge bg-lav">target &lt; 5 mnt setelah bukti</span>` })}
      ${kpi({ lab: 'Ditolak / Batal (7 hari)', val: tolak.length + '<small class="c-err">transaksi</small>', ikon: 'xc', cls: 'bg-err', glow: 'rgba(239,68,68,.2)', sub: `<b>${rp(tolak.reduce((a, t) => a + t.nominal, 0))}</b><span class="badge bg-err">invalid / expired</span>` })}
    </div>
    <div class="card pad mb16"><div class="toolbar"><div class="search" style="max-width:360px"><span class="sr">Cari transaksi</span>${ic('search')}<input id="cari-trx" type="search" placeholder="Order ID, nama, email, WA, nominal…" value="${esc(u.q)}" data-in="trxCari"></div>
      <div class="seg">${[['', 'Semua'], ['Menunggu', 'Menunggu'], ['Terverifikasi', 'Terverifikasi'], ['Ditolak', 'Ditolak'], ['Kedaluwarsa', 'Kedaluwarsa']].map(s => `<button class="${u.status === s[0] ? 'on' : ''}" data-act="trxStatus" data-s="${s[0]}">${s[1]} (${cnt(s[0])})</button>`).join('')}</div>
      <select class="inp pill-inp" style="width:auto" data-chg="trxF" data-k="metode" aria-label="Metode"><option value="">Metode: Semua</option>${met.map(x => `<option ${u.metode === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
      <select class="inp pill-inp" style="width:auto" data-chg="trxF" data-k="rentang" aria-label="Rentang"><option value="7" ${u.rentang === '7' ? 'selected' : ''}>7 hari terakhir</option><option value="30" ${u.rentang === '30' ? 'selected' : ''}>30 hari</option><option value="90" ${u.rentang === '90' ? 'selected' : ''}>90 hari</option><option value="all" ${u.rentang === 'all' ? 'selected' : ''}>Semua waktu</option></select></div>
      ${nSel ? `<div class="batchbar"><b class="small c-pri">${ic('checkc', 'sm')} ${nSel} transaksi dipilih</b><div class="row wrap g8"><button class="btn pri sm" data-act="verifMassal" data-a="setujui">${ic('checkc', 'sm')}Setujui terpilih</button><button class="btn sec sm" data-act="verifMassal" data-a="tolak">Tolak</button><button class="btn danger sm" data-act="verifMassal" data-a="kedaluwarsa">Tandai kedaluwarsa</button><button class="btn ghost sm" data-act="trxSelNone">Batal</button></div></div>` : ''}</div>
    <div class="verif"><div class="card" style="overflow:hidden"><div class="row between" style="padding:16px 18px"><div class="row g8"><h3>Daftar Antrean Transaksi</h3><span class="badge bg-lav">${L.length}</span></div><span class="xs muted row g4">${ic('sort', 'xs')}Bukti terbaru di atas</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:36px"><label class="check"><input type="checkbox" id="ts-all" data-chg="trxSelAll" aria-label="Pilih semua menunggu"></label></th><th>Order & kelas</th><th>Member</th><th class="num">Nominal</th><th>Status</th><th></th></tr></thead><tbody>
      ${page.map(t => { const m = mm[t.member] || {}; const bisa = t.status === 'Menunggu'; return `<tr class="klik ${u.aktif === t.id ? 'sel' : ''}" data-act="pilihTrx" data-id="${t.id}"><td data-stop="1">${bisa ? `<label class="check"><input type="checkbox" id="ts-${t.id}" data-chg="trxSel" data-id="${t.id}" ${u.sel[t.id] ? 'checked' : ''} aria-label="Pilih ${t.id}"></label>` : ''}</td>
        <td style="max-width:230px"><b class="small nowrap ${u.aktif === t.id ? 'c-pri' : ''}">#${esc(t.id)}</b><div class="xs muted nowrap">${tglJam(t.dibuat)}</div><div class="xs trunc" style="color:var(--text);opacity:.8;margin-top:2px" title="${esc(t.namaProduk)}">${esc(String(t.namaProduk || '').split(':')[0])}</div></td>
        <td><div class="row g8">${avatar(m.nama, 'sm soft')}<div style="min-width:0;max-width:170px"><b class="small trunc" style="display:block">${esc(m.nama || '-')}</b><span class="xs muted trunc" style="display:block">${esc(m.email || '')}</span></div></div></td>
        <td class="num nowrap"><b class="small">${rp(t.nominal)}</b><div class="xs muted">${esc(t.metode)}${t.kodeUnik ? ' · kode ' + t.kodeUnik : ''}</div></td>
        <td class="nowrap">${pillTrx(t.status)}<div class="xs mt4">${t.bukti ? `<span class="c-info b row g4" style="display:inline-flex">${ic('image', 'xs')}Bukti ada</span>` : t.status === 'Menunggu' ? '<span class="muted">Belum ada bukti</span>' : ''}</div></td>
        <td data-stop="1" class="nowrap">${bisa && t.bukti ? `<div class="row g4"><button class="btn ok icon xs" data-act="verifSatu" data-a="setujui" data-id="${t.id}" title="Setujui cepat" aria-label="Setujui ${t.id}">${ic('check', 'sm')}</button><button class="btn danger icon xs" data-act="verifSatu" data-a="tolak" data-id="${t.id}" title="Tolak" aria-label="Tolak ${t.id}">${ic('x', 'sm')}</button></div>` : `<button class="btn ghost xs" data-act="pilihTrx" data-id="${t.id}">Detail</button>`}</td></tr>`; }).join('') || `<tr><td colspan="6">${kosong('receipt', 'Tidak ada transaksi', u.status === 'Menunggu' ? 'Semua pembayaran sudah diproses. 🎉' : 'Ubah filter pencarian.')}</td></tr>`}</tbody></table></div>
      <div style="padding:0 16px 12px">${pager(L.length, hal, per, 'trxHal')}</div></div>
      <aside class="sticky" id="trx-panel">${panelTrx(u.aktif)}</aside></div>`;
  },
  after() { const u = trxUI(); muatBukti(u.aktif); }
};
function panelTrx(id) {
  const t = S.A.transaksi.find(x => x.id === id);
  if (!t) return `<div class="card pad-l">${kosong('receipt', 'Pilih transaksi', 'Klik baris untuk melihat detail & bukti transfer.')}</div>`;
  const m = memMap()[t.member] || {}, p = prodMap()[t.produk] || {}, rek = safeJSON(S.app.REKENING, [])[0] || {};
  const bukti = S.bukti['adm:' + t.id];
  return `<div class="card pad-l col g16" style="position:relative;overflow:hidden"><i class="glow" style="position:absolute;right:-40px;top:-40px;width:120px;height:120px;border-radius:50%;background:rgba(108,60,233,.12);filter:blur(24px)"></i>
    <div class="row between top"><div><div class="row g8 wrap"><h2>Detail Transaksi</h2>${pillTrx(t.status)}</div><b class="small c-pri">#${esc(t.id)}</b></div></div>
    <div class="card pad-s" style="box-shadow:none;background:var(--lav-2)"><div class="row g12">${avatar(m.nama, 'soft')}<div class="grow" style="min-width:0"><div class="row g4 wrap"><b class="trunc">${esc(m.nama || '-')}</b><span class="lbl-chip">${m.status === 'Lead' ? 'Lead Baru' : esc(m.status || '')}</span></div><div class="xs muted trunc">${esc(m.email || '')}</div></div><button class="btn ghost icon xs" data-act="bukaMember" data-id="${m.id}" aria-label="Profil CRM">${ic('user', 'sm')}</button></div>
      ${m.wa ? `<div class="row between mt12"><span class="small row g4">${ic('phone', 'xs c-ok')}${esc(hpTampil(m.wa))}</span><a class="btn ok xs" href="https://wa.me/${esc(m.wa)}?text=${encodeURIComponent('Halo ' + (m.nama || '') + ', terkait pembayaran ' + t.id)}" target="_blank" rel="noopener">${ic('wa', 'xs')}Chat WhatsApp</a></div>` : ''}</div>
    <div class="row g12">${'<div style="width:64px;flex:none">' + thumb({ nama: p.Nama || t.namaProduk, kategori: p.Kategori, thumb: p.Thumbnail_URL }) + '</div>'}<div style="min-width:0"><b class="small clamp2">${esc(t.namaProduk)}</b><div class="xs muted">${Number(p.Durasi_Akses_Hari) ? 'Akses ' + p.Durasi_Akses_Hari + ' hari' : 'Akses selamanya'}</div></div></div>
    <div class="card pad-s" style="box-shadow:none;background:var(--lav-2)"><div class="sum-line"><span>Harga resmi</span><span>${rp(t.harga)}</span></div>${t.potongan ? `<div class="sum-line"><span>Promo ${esc(t.promo)}</span><span class="c-ok">− ${rp(t.potongan)}</span></div>` : ''}<div class="sum-line"><span>Kode unik verifikasi</span><span class="c-pri b">+ ${rp(t.kodeUnik)}</span></div>
      <div class="row between" style="border-top:1px solid var(--line);margin-top:6px;padding-top:10px"><div><div class="xs muted">Total ditagihkan</div><b style="font-size:18px">${rp(t.nominal)}</b></div><div class="right"><div class="xs muted">${esc(t.metode)}</div><b class="small">${esc(rek.bank || '')} ${esc(rek.norek || '')}</b></div></div></div>
    <div><div class="row between mb8"><b class="small row g4">${ic('receipt', 'sm c-pri')}Bukti transfer pelanggan</b>${bukti ? `<button class="c-pri small b" data-act="zoomBukti" data-id="${t.id}">${ic('search', 'xs')} Perbesar</button>` : ''}</div>
      <div class="proof-img" data-act="zoomBukti" data-id="${t.id}">${t.bukti ? (bukti ? (bukti.mime === 'application/pdf' ? `<div class="col g8 center" style="padding:20px">${ic('filetext', 'lg c-pri')}<b class="small">Bukti PDF</b><span class="xs muted">Klik untuk membuka</span></div>` : `<img src="${bukti.url}" alt="Bukti transfer ${esc(t.id)}">`) : '<div class="col g8 center" style="padding:20px"><span class="spin"></span><span class="xs muted">Memuat bukti…</span></div>') : `<div class="col g8 center" style="padding:20px">${ic('image', 'lg muted')}<span class="xs muted">Member belum mengunggah bukti</span></div>`}</div></div>
    ${t.status === 'Menunggu' ? `<div class="field"><label for="trx-cat">Catatan admin (opsional)</label><input class="inp" id="trx-cat" placeholder="Contoh: mutasi BCA cocok pukul 14:16" value="${esc(S.ui.catTrx && S.ui.catTrx[t.id] || '')}" data-in="catTrx" data-id="${t.id}"></div>
      <button class="btn pri lg block" data-act="verifSatu" data-a="setujui" data-id="${t.id}">${ic('shield', 'sm')}Setujui & Aktivasi Akses Kelas</button>
      <p class="xs muted center" style="margin-top:-8px">Memicu WhatsApp & Email kredensial + kuitansi PDF otomatis (antrean ± 1 menit).</p>
      <div class="row g8"><button class="btn danger grow" data-act="verifSatu" data-a="tolak" data-id="${t.id}">${ic('xc', 'sm')}Tolak Bayar</button><button class="btn sec grow" data-act="verifSatu" data-a="minta_ulang" data-id="${t.id}">${ic('refresh', 'sm')}Minta Bukti Ulang</button></div>`
      : `<div class="card pad-s small" style="box-shadow:none"><dl class="kv"><dt>Status</dt><dd>${pillTrx(t.status)}</dd><dt>Diproses</dt><dd>${tglJam(t.diverifikasi)}</dd><dt>Oleh</dt><dd>${esc(t.oleh || '-')}</dd><dt>Catatan</dt><dd>${esc(t.catatan || '-')}</dd></dl></div>${t.status === 'Terverifikasi' ? `<button class="btn sec block" data-act="kuitansiAdm" data-id="${t.id}">${ic('download', 'sm')}Unduh kuitansi PDF</button>` : ''}`}
  </div>`;
}
function muatBukti(id) {
  const t = S.A && S.A.transaksi.find(x => x.id === id);
  if (!t || !t.bukti || S.bukti['adm:' + id]) return;
  S.bukti['adm:' + id] = null;
  api('lihatBukti', S.token, id).then(r => { S.bukti['adm:' + id] = { url: 'data:' + r.mime + ';base64,' + r.data, mime: r.mime, raw: r }; const pnl = $('#trx-panel'); if (pnl && trxUI().aktif === id) pnl.innerHTML = panelTrx(id); })
    .catch(e => { delete S.bukti['adm:' + id]; toast('Bukti: ' + e.message, 'err'); });
}
ACT.pilihTrx = t => {
  const u = trxUI(); u.aktif = t.dataset.id;
  if (window.innerWidth < 1280) { modal({ title: 'Detail transaksi', drawer: true, body: `<div id="trx-panel-m">${panelTrx(u.aktif)}</div>` }); muatBuktiModal(u.aktif); }
  else { $$('#v-a-transaksi tbody tr').forEach(r => r.classList.toggle('sel', r.dataset.id === u.aktif)); $('#trx-panel').innerHTML = panelTrx(u.aktif); muatBukti(u.aktif); }
};
function muatBuktiModal(id) {
  muatBukti(id);
  const iv = setInterval(() => { const el = $('#trx-panel-m'); if (!el) return clearInterval(iv); if (S.bukti['adm:' + id]) { el.innerHTML = panelTrx(id); clearInterval(iv); } }, 300);
}
ACT.zoomBukti = t => { const b = S.bukti['adm:' + t.dataset.id]; if (b) unduhB64(b.raw, true); };
INP.catTrx = t => { (S.ui.catTrx = S.ui.catTrx || {})[t.dataset.id] = t.value; };
INP.trxCari = debounce(t => { const u = trxUI(); u.q = t.value; u.hal = 1; rerender(); }, 150);
ACT.trxStatus = t => { const u = trxUI(); u.status = t.dataset.s; u.hal = 1; u.sel = {}; render(); };
CHG.trxF = t => { const u = trxUI(); u[t.dataset.k] = t.value; u.hal = 1; render(); };
ACT.trxHal = t => { trxUI().hal = Number(t.dataset.hal); render(); };
CHG.trxSel = t => { const u = trxUI(); if (t.checked) u.sel[t.dataset.id] = 1; else delete u.sel[t.dataset.id]; rerender(); };
CHG.trxSelAll = t => { const u = trxUI(); daftarTrx().filter(x => x.status === 'Menunggu').slice(0, 200).forEach(x => { if (t.checked) u.sel[x.id] = 1; else delete u.sel[x.id]; }); rerender(); };
ACT.trxSelNone = () => { trxUI().sel = {}; render(); };
ACT.verifSatu = async t => {
  const a = t.dataset.a, id = t.dataset.id;
  let cat = (S.ui.catTrx && S.ui.catTrx[id]) || '';
  if ((a === 'tolak' || a === 'minta_ulang') && !cat) { cat = await tanya(a === 'tolak' ? 'Alasan penolakan' : 'Catatan untuk member', { pesan: 'Pesan ini dikirim ke member via WA & email.', placeholder: a === 'tolak' ? 'Nominal tidak sesuai / bukti tidak valid' : 'Foto bukti buram, mohon unggah ulang', ok: a === 'tolak' ? 'Tolak' : 'Kirim', danger: a === 'tolak' }); if (cat === null) return; }
  jalankanVerifikasi([id], a, cat);
};
ACT.verifMassal = async t => {
  const a = t.dataset.a, ids = Object.keys(trxUI().sel);
  let cat = '';
  if (a === 'tolak') { cat = await tanya('Alasan penolakan (' + ids.length + ' transaksi)', { placeholder: 'Bukti tidak valid', ok: 'Tolak semua', danger: true }); if (cat === null) return; }
  else if (!(await konfirmasi(`${a === 'setujui' ? 'Setujui & aktifkan akses' : 'Tandai kedaluwarsa'} untuk <b>${ids.length} transaksi</b>?`, { ok: a === 'setujui' ? 'Setujui semua' : 'Tandai', danger: a !== 'setujui' }))) return;
  jalankanVerifikasi(ids, a, cat);
};
function jalankanVerifikasi(ids, aksi, catatan) {
  const u = trxUI(), lamaT = salin(S.A.transaksi.filter(t => ids.indexOf(t.id) > -1));
  const memIds = lamaT.map(t => t.member), lamaM = salin(S.A.member.filter(m => memIds.indexOf(m.id) > -1));
  const st = { setujui: 'Terverifikasi', tolak: 'Ditolak', kedaluwarsa: 'Kedaluwarsa' }[aksi];
  const now = new Date().toISOString();
  optimis({
    ubah: () => {
      S.A.transaksi.forEach(t => { if (ids.indexOf(t.id) < 0 || t.status !== 'Menunggu') return; if (st) { t.status = st; t.diverifikasi = now; t.oleh = S.user.nama; t.catatan = catatan || t.catatan; } else { t.bukti = false; t.catatan = catatan; delete S.bukti['adm:' + t.id]; } });
      if (aksi === 'setujui') S.A.member.forEach(m => { if (memIds.indexOf(m.id) > -1) m.status = 'Aktif'; });
      u.sel = {};
      const next = daftarTrx().find(t => t.status === 'Menunggu' && t.bukti && ids.indexOf(t.id) < 0);
      if (next && st) u.aktif = next.id;
    },
    kirim: () => api('verifikasi', S.token, ids, aksi, catatan),
    sukses: r => {
      upsertArr(S.A.transaksi, r.transaksi, 'id');
      const aff = r.member.map(m => m.id);
      S.A.akses = S.A.akses.filter(a => aff.indexOf(a.member) < 0).concat(r.akses);
      upsertArr(S.A.member, r.member, 'id'); simpanCache();
      toast(aksi === 'setujui' ? `${r.diproses} transaksi disetujui · akses aktif · notifikasi diantrekan` : aksi === 'tolak' ? 'Transaksi ditolak · member diberi tahu' : aksi === 'minta_ulang' ? 'Permintaan unggah ulang dikirim' : 'Ditandai kedaluwarsa');
    },
    balik: () => { upsertArr(S.A.transaksi, lamaT, 'id'); upsertArr(S.A.member, lamaM, 'id'); },
    pesanGagal: 'Verifikasi gagal'
  }).catch(() => { });
  if ($('.modal-bg.drawer')) tutupModal();
}
ACT.kuitansiAdm = t => { tombolMuat(t, true, 'Menyiapkan…'); api('unduhKuitansi', S.token, t.dataset.id).then(r => { tombolMuat(t, false); unduhB64(r, true); }).catch(e => { tombolMuat(t, false); toast(e.message, 'err'); }); };
ACT.eksporTrx = t => {
  const mm = memMap();
  ekspor('transaksi', [{ l: 'Order', k: 'id' }, { l: 'Tanggal', f: x => tglJam(x.dibuat) }, { l: 'Member', f: x => (mm[x.member] || {}).nama }, { l: 'Email', f: x => (mm[x.member] || {}).email }, { l: 'Kelas', k: 'namaProduk' }, { l: 'Harga', k: 'harga' }, { l: 'Potongan', k: 'potongan' }, { l: 'Kode Unik', k: 'kodeUnik' }, { l: 'Total', k: 'nominal' }, { l: 'Metode', k: 'metode' }, { l: 'Status', k: 'status' }, { l: 'Diverifikasi', f: x => tglJam(x.diverifikasi) }, { l: 'Oleh', k: 'oleh' }], daftarTrx(), t.dataset.f).catch(e => toast(e.message, 'err'));
};
