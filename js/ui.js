/* ==========================================================================
   Komponen UI bersama
   ========================================================================== */
const KATEGORI = [
  [/front|web|react|javascript|html/i, 'bg-indigo', 'linear-gradient(135deg,#312E81,#1E1B4B)', '#A5B4FC'],
  [/back|java|server|api|python|data/i, 'bg-pink', 'linear-gradient(135deg,#4C1D95,#1E1B4B)', '#D8B4FE'],
  [/design|desain|ui|ux|figma|grafis/i, 'bg-ok', 'linear-gradient(135deg,#065F46,#042F2E)', '#6EE7B7'],
  [/market|crm|bisnis|sales|funnel|ads/i, 'bg-pink', 'linear-gradient(135deg,#9F1239,#6B21A8)', '#FDA4AF'],
  [/produkt|product|apps script|excel|office/i, 'bg-warn', 'linear-gradient(135deg,#D97706,#E11D48)', '#FDE68A'],
  [/syariah|islam|hukum|agama/i, 'bg-info', 'linear-gradient(135deg,#1D4ED8,#4338CA)', '#BFDBFE']
];
function kat(k) { const f = KATEGORI.find(x => x[0].test(k || '')); return f || [null, 'bg-lav', 'linear-gradient(135deg,#4A1FB8,#6C3CE9)', '#DDD6FE']; }
function badgeKat(k) { return `<span class="badge up ${kat(k)[1]}">${esc(k || 'Umum')}</span>`; }
function thumb(p, o) {
  o = o || {};
  const k = kat(p.kategori);
  const img = p.thumb ? `<img src="${esc(p.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('hasimg');this.remove()"><i class="shade"></i>` : '';
  return `<div class="thumb ${p.thumb ? 'hasimg' : ''} ${o.cls || ''}" style="background:${k[2]}">${img}
    <div class="tt">${o.tl ? '' : `<small style="color:${k[3]}">${esc(p.kategori || 'Kelas')}</small>`}<b>${esc(potong(String(p.nama || '').split(':')[0], 40))}</b></div>
    ${o.tl ? `<div class="tl">${o.tl}</div>` : ''}${o.tr ? `<div class="tr">${o.tr}</div>` : ''}${o.bl ? `<div class="bl">${o.bl}</div>` : ''}</div>`;
}
function potong(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function bintang(r, n) { return r ? `<span class="rating">${ic('star', 'xs fill')}${String(Number(r).toFixed(1)).replace('.', ',')}${n ? `<small>(${angka(n)})</small>` : ''}</span>` : ''; }
function avatar(nama, cls) { return `<span class="avatar ${cls || ''}" aria-hidden="true">${esc(inisial(nama))}</span>`; }
function ring(persen, isi, sub, warna) {
  const r = 15.9155, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, persen || 0));
  return `<div class="ring" role="img" aria-label="${Math.round(p)}%"><svg viewBox="0 0 36 36"><circle class="trk" cx="18" cy="18" r="${r}" fill="none" stroke-width="3.6"/><circle class="val" cx="18" cy="18" r="${r}" fill="none" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}" ${warna ? `style="stroke:${warna}"` : ''}/></svg><div class="lbl" ${warna ? `style="color:${warna}"` : ''}><span>${isi}${sub ? `<small>${sub}</small>` : ''}</span></div></div>`;
}
function bar(persen, cls) { return `<div class="bar ${cls || ''}" role="progressbar" aria-valuenow="${Math.round(persen)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.max(0, Math.min(100, persen))}%"></i></div>`; }
function kosong(ikon, judul, teks, aksi) { return `<div class="empty"><div class="ico">${ic(ikon, 'lg')}</div><h3>${esc(judul)}</h3>${teks ? `<p class="small">${teks}</p>` : ''}${aksi || ''}</div>`; }
function skeleton(n, h) { return Array.from({ length: n || 3 }, () => `<div class="sk" style="height:${h || 60}px;margin-bottom:10px"></div>`).join(''); }
const STATUS_TRX = { Menunggu: 'bg-warn', Terverifikasi: 'bg-ok', Ditolak: 'bg-err', Kedaluwarsa: 'bg-grey' };
function pillTrx(s) { return `<span class="pill ${STATUS_TRX[s] || 'bg-lav'}">${esc(s)}</span>`; }
const STATUS_AKUN = { Lead: 'bg-grey', Aktif: 'bg-ok', Nonaktif: 'bg-warn', Diblokir: 'bg-err', 'Menunggu Aktivasi': 'bg-info' };
function pillAkun(s) { return `<span class="pill ${STATUS_AKUN[s] || 'bg-lav'}">${esc(s || 'Lead')}</span>`; }
function waBadge(s) { return s === 'Terdaftar' ? '<span class="wa-badge wa-ya">✓ WA</span>' : s === 'Tidak Terdaftar' ? '<span class="wa-badge wa-tidak">✕ bukan WA</span>' : '<span class="wa-badge wa-belum">? belum dicek</span>'; }
function chipsLabel(str, maks) {
  const arr = String(str || '').split(';').map(x => x.trim()).filter(Boolean);
  const L = (S.A && S.A.label) || [];
  return arr.slice(0, maks || 9).map(x => { const w = (L.find(l => l.Nama_Label === x) || (/^Pembeli:/.test(x) && L.find(l => l.Aturan_Otomatis === 'PEMBELI_KELAS')) || {}).Warna; return `<span class="lbl-chip" ${w ? `style="background:${w}1f;color:${w}"` : ''}>${esc(x)}</span>`; }).join('') + (arr.length > (maks || 9) ? `<span class="lbl-chip">+${arr.length - (maks || 9)}</span>` : '');
}
const TIPE_IKON = { Video: 'video', PDF: 'filetext', DOCX: 'file', ZIP: 'archive', Tautan: 'link' };
function ikonTipe(t) { return TIPE_IKON[t] || 'file'; }
function pager(total, hal, per, act) {
  const n = Math.max(1, Math.ceil(total / per));
  if (n <= 1) return `<div class="pager"><span>Menampilkan ${angka(total)} data</span></div>`;
  const a = Math.max(1, Math.min(hal - 2, n - 4)), b = Math.min(n, a + 4);
  let btn = `<button data-act="${act}" data-hal="${hal - 1}" ${hal <= 1 ? 'disabled' : ''} aria-label="Sebelumnya">‹</button>`;
  for (let i = a; i <= b; i++) btn += `<button data-act="${act}" data-hal="${i}" class="${i === hal ? 'on' : ''}">${i}</button>`;
  btn += `<button data-act="${act}" data-hal="${hal + 1}" ${hal >= n ? 'disabled' : ''} aria-label="Berikutnya">›</button>`;
  return `<div class="pager"><span>Menampilkan ${angka((hal - 1) * per + 1)}–${angka(Math.min(total, hal * per))} dari ${angka(total)}</span><div class="pg">${btn}</div></div>`;
}

/** Grafik garis halus (SVG murni) — gaya referensi "Your Statistics". */
function grafikGaris(data, o) {
  o = o || {};
  const W = 320, H = 180, L = 26, R = 12, T = 26, B = 146;
  const maks = Math.max(o.min || 1, ...data.map(d => d.v)) * 1.05;
  const n = data.length;
  const x = i => n === 1 ? (L + W - R) / 2 : L + (i * (W - R - L)) / (n - 1);
  const y = v => B - (v / maks) * (B - T);
  const pts = data.map((d, i) => [x(i), y(d.v)]);
  let path = '';
  pts.forEach((p, i) => {
    if (!i) { path = `M ${p[0].toFixed(1)} ${p[1].toFixed(1)}`; return; }
    const p0 = pts[i - 2] || pts[i - 1], p1 = pts[i - 1], p3 = pts[i + 1] || p;
    const cl = v => Math.max(T - 4, Math.min(B, v));
    path += ` C ${(p1[0] + (p[0] - p0[0]) / 6).toFixed(1)} ${cl(p1[1] + (p[1] - p0[1]) / 6).toFixed(1)}, ${(p[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${cl(p[1] - (p3[1] - p1[1]) / 6).toFixed(1)}, ${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  });
  const imax = data.reduce((m, d, i) => d.v > data[m].v ? i : m, 0);
  const grid = [0, .33, .66, 1].map(f => { const v = maks / 1.05 * f, yy = y(v); return `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="var(--line)" stroke-dasharray="${f ? '3 4' : ''}"/><text x="2" y="${yy + 3}" font-size="9" fill="var(--muted)">${o.fmtY ? o.fmtY(v) : Math.round(v)}</text>`; }).join('');
  const lbl = n <= 12;
  const nodes = pts.map((p, i) => {
    const d = data[i], tag = o.fmt ? o.fmt(d.v) : d.v;
    const tampil = (lbl && d.v > 0) || i === imax;
    return `<g>${tampil ? `<rect x="${p[0] - 14}" y="${p[1] - 23}" width="28" height="15" rx="5" fill="var(--card)" stroke="var(--line)"/><text x="${p[0]}" y="${p[1] - 12.5}" text-anchor="middle" font-size="8" font-weight="800" fill="var(--primary-t)">${tag}</text>` : ''}<circle cx="${p[0]}" cy="${p[1]}" r="${i === imax ? 4.5 : 3.6}" fill="var(--primary)" stroke="var(--card)" stroke-width="2"><title>${esc(d.l)}: ${tag}</title></circle></g>`;
  }).join('');
  const sumbu = data.map((d, i) => (lbl || i % Math.ceil(n / 8) === 0) ? `<text x="${x(i)}" y="${B + 18}" text-anchor="middle" font-size="9" ${i === imax ? 'font-weight="800" fill="var(--primary-t)"' : 'fill="var(--muted)"'}>${esc(d.l)}</text>` : '').join('');
  const id = 'g' + Math.random().toString(36).slice(2, 7);
  return `<svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || 'Grafik')}"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#6C3CE9" stop-opacity=".22"/><stop offset="100%" stop-color="#6C3CE9" stop-opacity="0"/></linearGradient></defs>${grid}${n > 1 ? `<path d="${path} L ${pts[n - 1][0]} ${B} L ${pts[0][0]} ${B} Z" fill="url(#${id})"/><path d="${path}" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"/>` : ''}${nodes}${sumbu}</svg>`;
}

/** Ilustrasi hero (SVG asli, tanpa aset luar). */
function ilustrasiHero() {
  return `<svg viewBox="0 0 220 200" aria-hidden="true"><defs><linearGradient id="hb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
  <rect x="30" y="34" width="160" height="112" rx="16" fill="rgba(255,255,255,.95)"/><rect x="44" y="50" width="70" height="8" rx="4" fill="#EEE8FD"/><rect x="44" y="64" width="110" height="6" rx="3" fill="#F4F2FB"/><rect x="44" y="76" width="96" height="6" rx="3" fill="#F4F2FB"/>
  <rect x="44" y="96" width="132" height="8" rx="4" fill="#EEE8FD"/><rect x="44" y="96" width="88" height="8" rx="4" fill="#6C3CE9"/><circle cx="164" cy="64" r="16" fill="url(#hb)"/><path d="M158 64l4 4 8-9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
  <rect x="44" y="114" width="40" height="18" rx="9" fill="#6C3CE9"/><rect x="90" y="114" width="40" height="18" rx="9" fill="#EEE8FD"/>
  <rect x="120" y="128" width="78" height="58" rx="12" fill="#4A1FB8" opacity=".95"/><rect x="132" y="142" width="36" height="6" rx="3" fill="#C4B5FD"/><rect x="132" y="154" width="52" height="6" rx="3" fill="#8B5CF6"/><rect x="132" y="166" width="28" height="6" rx="3" fill="#C4B5FD"/>
  <circle cx="40" cy="160" r="18" fill="#F5B400"/><path d="M33 160l5 5 9-10" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="196" cy="30" r="6" fill="#F5B400"/><circle cx="18" cy="60" r="4" fill="#fff" opacity=".6"/></svg>`;
}
function ilustrasiMegafon() {
  return `<svg class="art" viewBox="0 0 100 100" aria-hidden="true"><path d="M45 42 72 26c2-1 4 1 4 3v38c0 2-2 4-4 3L45 54z" fill="#7C3AED"/><ellipse cx="73" cy="48" rx="5" ry="21" fill="#FBBF24"/><ellipse cx="74" cy="48" rx="2" ry="15" fill="#D97706"/><rect x="25" y="38" width="22" height="20" rx="4" fill="#A78BFA"/><path d="M32 58 28 78c-1 2 1 4 4 4 2 0 4-2 5-5l3-19z" fill="#6D28D9"/><path d="M84 38c3 3 3 17 0 20" stroke="#8B5CF6" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M91 32c5 5 5 29 0 34" stroke="#C4B5FD" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
}

/* ---------- Berkas: baca (+kompres gambar), unduh base64 ---------- */
function bacaFile(file, o) {
  o = o || {};
  return new Promise((res, rej) => {
    if (!file) return rej(new Error('Tidak ada berkas.'));
    if (o.tipe && !o.tipe.test(file.type)) return rej(new Error('Format berkas tidak didukung.'));
    const kecilkan = o.kompres && /^image\/(jpeg|png)$/.test(file.type) && file.size > 350 * 1024;
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Gagal membaca berkas.'));
    fr.onload = () => {
      const url = fr.result;
      if (!kecilkan) {
        if (o.maxMB && file.size > o.maxMB * 1048576) return rej(new Error('Ukuran maksimal ' + o.maxMB + ' MB.'));
        return res({ nama: file.name, mime: file.type || 'application/octet-stream', data: String(url).split(',')[1], size: file.size, preview: url });
      }
      const im = new Image();
      im.onload = () => {
        const m = o.maxPx || 1600, sk = Math.min(1, m / Math.max(im.width, im.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(im.width * sk); cv.height = Math.round(im.height * sk);
        const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
        const out = cv.toDataURL('image/jpeg', .82);
        const size = Math.round(out.length * .75);
        if (o.maxMB && size > o.maxMB * 1048576) return rej(new Error('Ukuran maksimal ' + o.maxMB + ' MB.'));
        res({ nama: file.name.replace(/\.\w+$/, '') + '.jpg', mime: 'image/jpeg', data: out.split(',')[1], size: size, preview: out });
      };
      im.onerror = () => rej(new Error('Gambar tidak valid.'));
      im.src = url;
    };
    fr.readAsDataURL(file);
  });
}
function b64keBlob(b64, mime) { const bin = atob(b64), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime }); }
function unduhBlob(blob, nama) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = nama; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
function unduhB64(o, pratinjau) {
  const blob = b64keBlob(o.data, o.mime);
  if (pratinjau && /^(image\/|application\/pdf)/.test(o.mime)) {
    const url = URL.createObjectURL(blob);
    const isi = /^image\//.test(o.mime) ? `<img src="${url}" alt="${esc(o.nama)}" style="width:100%;border-radius:14px">` : `<iframe src="${url}" title="${esc(o.nama)}" style="width:100%;height:70vh;border:0;border-radius:14px;background:#fff"></iframe>`;
    const w = modal({ title: o.nama, size: 'lg', body: isi, foot: `<button class="btn sec" data-act="tutupModal">Tutup</button><button class="btn pri" data-k="dl">${ic('download', 'sm')}Unduh</button>`, onClose: () => URL.revokeObjectURL(url) });
    w.querySelector('[data-k=dl]').onclick = () => unduhBlob(blob, o.nama);
    return;
  }
  unduhBlob(blob, o.nama);
}

/* ---------- Pustaka dimuat saat dibutuhkan (lazy) ---------- */
const LIB = {
  chart: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js',
  xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  jspdf: 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
  autotable: 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'
};
const _lib = {};
function muatJS(k) {
  if (_lib[k]) return _lib[k];
  _lib[k] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIB[k] || k; s.onload = res; s.onerror = () => { delete _lib[k]; rej(new Error('Gagal memuat pustaka ' + k + '. Periksa koneksi.')); }; document.head.appendChild(s); });
  return _lib[k];
}
/** Ekspor tabel: kolom [{k, l}] → CSV / Excel / PDF. */
async function ekspor(nama, kolom, rows, format) {
  const nilai = (r, c) => { const v = typeof c.f === 'function' ? c.f(r) : r[c.k]; return v == null ? '' : v; };
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    const q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const csv = '﻿' + [kolom.map(c => q(c.l)).join(',')].concat(rows.map(r => kolom.map(c => q(nilai(r, c))).join(','))).join('\n');
    return unduhBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${nama}-${stamp}.csv`);
  }
  if (format === 'xlsx') {
    await muatJS('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([kolom.map(c => c.l)].concat(rows.map(r => kolom.map(c => nilai(r, c)))));
    ws['!cols'] = kolom.map(c => ({ wch: Math.min(40, Math.max(10, String(c.l).length + 4)) }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, nama.slice(0, 30));
    return XLSX.writeFile(wb, `${nama}-${stamp}.xlsx`);
  }
  await muatJS('jspdf'); await muatJS('autotable');
  const doc = new window.jspdf.jsPDF({ orientation: kolom.length > 5 ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(14); doc.setTextColor(74, 31, 184); doc.text((S.app.NAMA_PORTAL || 'PortalKelas') + ' — ' + nama.replace(/-/g, ' '), 36, 40);
  doc.setFontSize(9); doc.setTextColor(107, 104, 128); doc.text('Dicetak ' + new Date().toLocaleString('id-ID'), 36, 56);
  doc.autoTable({ startY: 70, head: [kolom.map(c => c.l)], body: rows.map(r => kolom.map(c => String(nilai(r, c)))), styles: { fontSize: 8, cellPadding: 4 }, headStyles: { fillColor: [108, 60, 233] }, alternateRowStyles: { fillColor: [250, 249, 254] } });
  doc.save(`${nama}-${stamp}.pdf`);
}
function tombolEkspor(act, kunci) {
  return `<div class="row g4"><button class="btn sec sm" data-act="${act}" data-f="xlsx" data-k="${kunci || ''}">${ic('download', 'sm')}Excel</button><button class="btn sec sm" data-act="${act}" data-f="csv" data-k="${kunci || ''}">CSV</button><button class="btn sec sm" data-act="${act}" data-f="pdf" data-k="${kunci || ''}">PDF</button></div>`;
}
/** Nilai warna dari variabel CSS (untuk Chart.js). */
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
const CHARTS = {};
async function gambarChart(id, cfg) {
  await muatJS('chart');
  const el = document.getElementById(id); if (!el) return;
  if (CHARTS[id]) CHARTS[id].destroy();
  Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
  Chart.defaults.color = cssVar('--muted');
  Chart.defaults.borderColor = cssVar('--line');
  CHARTS[id] = new Chart(el, cfg);
}
