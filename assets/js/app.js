/* 0113131 ไวยากรณ์ภาษามลายู — แอปหน้าเดียว (hash routing) ไม่ต้อง build
   เนื้อหาบทเรียนโหลดจากไฟล์ content/bab-XX.md แล้วแปลงเป็นหน้าเว็บด้วย marked.js */
(function () {
  "use strict";
  const C = window.COURSE;
  const CH = C.chapters.slice().sort((a, b) => a.no - b.no);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $("#app");
  const hasThai = s => /[฀-๿]/.test(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const strip = s => String(s).replace(/<[^>]+>/g, "");
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = n => String(n).padStart(2, "0");

  /* ---------- storage (per viewer, optional) ---------- */
  const KEY = "tb0113131";
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* ignore */ } }
  const isDone = n => (load().done || []).includes(n);
  function setDone(n, v) { const s = load(); const d = new Set(s.done || []); v ? d.add(n) : d.delete(n); s.done = [...d]; save(s); }
  /* ---------- Kemajuan pelajar · ความก้าวหน้า (localStorage, peranti ini sahaja) ----------
     done: [nombor bab] · skor: { n: { ok, all, best, cuba, t } } · akhir: { n, sec, t } */
  const storageOK = (() => { try { localStorage.setItem("__tb", "1"); localStorage.removeItem("__tb"); return true; } catch (e) { return false; } })();
  const getSkor = n => (load().skor || {})[n] || null;
  function setSkor(n, ok, all) { const s = load(); s.skor = s.skor || {}; const p = s.skor[n] || {}; s.skor[n] = { ok, all, best: Math.max(p.best || 0, ok), cuba: (p.cuba || 0) + 1, t: Date.now() }; save(s); }
  function setAkhir(n, sec) { const s = load(); const a = s.akhir || {}; if (a.n === n && a.sec === (sec || "")) return; s.akhir = { n, sec: sec || "", t: Date.now() }; save(s); }
  function resetKemajuan() { const s = load(); delete s.done; delete s.skor; delete s.akhir; save(s); }
  const tarikh = t => { try { return new Date(t).toLocaleString("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  const NOTA_SIMPAN_F = () => B("Kemajuan dan skor disimpan dalam pelayar (localStorage) pada peranti ini sahaja. Data ini <b>tidak dihantar kepada pensyarah</b> dan bukan rekod markah rasmi. Jika anda menukar peranti atau pelayar, menggunakan mod peribadi, atau memadam data pelayar, kemajuan tidak akan kelihatan atau akan hilang.",
    "ความก้าวหน้าและคะแนนบันทึกในเบราว์เซอร์ (localStorage) ของอุปกรณ์เครื่องนี้เท่านั้น <b>ไม่ได้ส่งไปให้อาจารย์</b> และไม่ใช่คะแนนอย่างเป็นทางการ หากเปลี่ยนอุปกรณ์หรือเบราว์เซอร์ ใช้โหมดไม่ระบุตัวตน หรือล้างข้อมูลเบราว์เซอร์ ข้อมูลจะไม่แสดงหรือหายไป");
  const NOTA_PENDEK_F = () => `<span class="nota-simpan">${B("Disimpan dalam pelayar ini sahaja; tidak dihantar kepada pensyarah.", "บันทึกในเบราว์เซอร์นี้เท่านั้น ไม่ได้ส่งให้อาจารย์")} <a href="#/kemajuan">${B("Lihat kemajuan", "ดูความก้าวหน้า")}</a></span>`;
  function sambungHref() { const a = load().akhir; if (!a || !CH.some(c => c.no === a.n)) return null; return babLink(a.n) + (a.sec ? "/" + a.sec : ""); }

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2600); }

  /* ---------- speech ---------- */
  let voice = null;
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /^ms([-_]|$)/i.test(v.lang)) || vs.find(v => /^id([-_]|$)/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, onend) {
    if (!("speechSynthesis" in window)) { toast(T("Pelayar ini tidak menyokong bacaan suara", "เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง")); return; }
    speechSynthesis.cancel();
    const clean = strip(text).replace(/[*`]/g, "").replace(/…/g, " ").replace(/\s+/g, " ").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = voice ? voice.lang : "ms-MY"; if (voice) u.voice = voice; u.rate = 0.9;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
    if (!voice && !speak.warned) { speak.warned = true; toast(T("Suara bahasa Melayu tiada pada peranti ini; suara terdekat digunakan", "ไม่พบเสียงภาษามลายูในเครื่อง ระบบจะใช้เสียงที่ใกล้เคียงที่สุด")); }
  }
  const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const sayBtn = (text, label) => `<button class="say" type="button" data-say="${esc(strip(text))}" aria-label="Dengar · ฟังเสียง ${esc(label || strip(text))}">${SPK}</button>`;
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-say]"); if (b) { speak(b.dataset.say); return; }
    const m = e.target.closest(".ms-say"); if (m) { $$(".ms-say.speaking").forEach(x => x.classList.remove("speaking")); m.classList.add("speaking"); speak(m.textContent, () => m.classList.remove("speaking")); }
  });
  document.addEventListener("keydown", e => { const m = e.target.closest && e.target.closest(".ms-say"); if (m && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); m.click(); } });

  /* ---------- markdown ---------- */
  if (window.marked) marked.setOptions({ gfm: true, breaks: true });
  /* dwibahasa: B() = Melayu di atas, Thai di bawah · T() = sebaris untuk tajuk tab, toast, aria */
  const B = (ms, th) => `<span class="bm" lang="ms">${ms}</span><span class="tr" lang="th">${th}</span>`;
  const T = (ms, th) => `${ms} · ${th}`;
  const md = s => window.marked ? marked.parse(s) : `<pre>${esc(s)}</pre>`;
  const mdi = s => window.marked ? marked.parseInline(s) : esc(s);
  const cache = {};
  function fetchBab(n) {
    if (!cache[n]) cache[n] = fetch(`content/bab-${pad(n)}.md`, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).catch(err => { delete cache[n]; throw err; });
    return cache[n];
  }
  /* Struktur bab · โครงสร้างบท
     Struktur 12 bahagian (Tajuk Pelajaran … Rujukan) dan struktur lama 6 bahagian kedua-duanya disokong.
     id bahagian ditentukan oleh perkataan pertama tajuk ## (bukan kedudukannya).
     รองรับทั้งโครงสร้างใหม่ 12 หัวข้อและโครงสร้างเดิม 6 หัวข้อ โดยดูจากคำแรกของหัวข้อ ## */
  const SEC_DEF = [
    ["tajuk", /^tajuk/i, "Tajuk Pelajaran", "ชื่อบทเรียน"],
    ["hasil", /^hasil/i, "Hasil Pembelajaran", "ผลลัพธ์การเรียนรู้"],
    ["pengenalan", /^pengenalan/i, "Pengenalan", "บทนำ"],
    ["konsep", /^konsep/i, "Konsep dan Definisi", "แนวคิดและนิยาม"],
    ["penerangan", /^penerangan/i, "Penerangan Tatabahasa", "คำอธิบายหลักไวยากรณ์"],
    ["contoh", /^contoh/i, "Contoh Ayat", "ตัวอย่างประโยค"],
    ["jadual", /^jadual/i, "Jadual Perbandingan", "ตารางเปรียบเทียบ"],
    ["kesalahan", /^kesalahan/i, "Kesalahan Lazim", "ข้อผิดพลาดที่พบบ่อย"],
    ["latihan", /^latihan/i, "Latihan Interaktif", "แบบฝึกหัดโต้ตอบ"],
    ["rumusan", /^rumusan/i, "Rumusan", "สรุปบทเรียน"],
    ["kuiz", /^kuiz/i, "Kuiz Penilaian", "แบบทดสอบท้ายบท"],
    ["rangka", /^rangka/i, "Rangka Bab", "โครงร่าง"],
    ["isi", /^isi/i, "Isi Penting", "เนื้อหา"],
    ["kes", /^kajian/i, "Kajian Kes", "กรณีศึกษา"],
    ["soalan", /^soalan/i, "Soalan Penilaian", "คำถามท้ายบท"],
    ["rujukan", /^rujukan/i, "Rujukan", "เอกสารอ้างอิง"]
  ];
  const SEC_SHORT = Object.fromEntries(SEC_DEF.map(d => [d[0], B(d[2], d[3])]));
  const IDS_LAMA = ["hasil", "rangka", "isi", "kes", "soalan", "rujukan"];
  const IDS_BARU = ["tajuk", "hasil", "pengenalan", "konsep", "penerangan", "contoh", "jadual", "kesalahan", "latihan", "rumusan", "kuiz", "rujukan"];
  const secIds = c => c && c.struktur === 12 ? IDS_BARU : IDS_LAMA;
  /* แยกไฟล์บทเป็นส่วน ๆ ตามหัวข้อ ## */
  function splitSections(text) {
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    const parts = text.split(/^## /m).slice(1);
    return parts.map((p, i) => {
      const nl = p.indexOf("\n");
      const title = p.slice(0, nl).trim().replace(/^\d+\.\s*/, "");
      const d = SEC_DEF.find(x => x[1].test(title.replace(/<br>.*/, "").trim()));
      return { id: d ? d[0] : (IDS_LAMA[i] || "s" + i), title, body: p.slice(nl + 1) };
    });
  }
  /* ---------- Latihan interaktif · แบบฝึกหัดโต้ตอบ ----------
     Ditulis dalam fail bab sebagai blok kod:  ```latihan-isi | latihan-betulkan | latihan-golong | latihan-benar
     Baris "Arahan: Melayu | Thai", baris "Kategori: A | B" (golong sahaja), kemudian satu item sebaris; medan dipisahkan " | ".
     เขียนในไฟล์บทเป็นบล็อกโค้ด แต่ละบรรทัดคือหนึ่งข้อ แยกช่องด้วย " | " */
  const LAT_NAMA = {
    objektif: ["Soalan Objektif", "ข้อสอบปรนัย"], isi: ["Isi Tempat Kosong", "เติมคำในช่องว่าง"], golong: ["Golongkan", "จัดประเภท"],
    betulkan: ["Betulkan Kesalahan Ayat", "แก้ไขประโยคผิด"], analisis: ["Analisis Struktur Ayat", "วิเคราะห์โครงสร้างประโยค"],
    benar: ["Betul atau Salah", "ถูกหรือผิด"], terbuka: ["Soalan Terbuka", "คำถามปลายเปิด"]
  };
  const ms1 = t => String(t).split(" · ")[0].replace(/<br>.*/, "").trim().toLowerCase();
  const expHTML = (m, t) => m ? `<p class="lat-exp" hidden><b>Penjelasan:</b> ${mdi(m)}${t ? `<br><b>คำอธิบาย:</b> ${mdi(t)}` : ""}</p>` : "";
  const bi = t => { const [m, th] = String(t || "").split("<br>"); return th ? B(mdi(m), mdi(th)) : mdi(m); };
  const FB = '<p class="lat-fb" aria-live="polite"></p>';
  let latN = 0;
  /* Baca blok: baris kepala (Arahan/Kategori/Label/Tajuk), item sebaris, atau item berbilang baris yang bermula dengan "??"
     อ่านบล็อก: บรรทัดหัว (Arahan/Kategori/Label/Tajuk) ข้อแบบบรรทัดเดียว หรือข้อหลายบรรทัดที่ขึ้นต้นด้วย "??" */
  function parseLat(src) {
    const o = { arahan: null, tajuk: null, cats: [], items: [] }; let cur = null;
    src.split("\n").map(l => l.trim()).filter(Boolean).forEach(l => {
      const h = l.match(/^(Arahan|Kategori|Label|Tajuk):\s*(.*)$/i);
      if (h) { const v = h[2].split(/\s+\|\s+/), k = h[1].toLowerCase(); if (k === "arahan") o.arahan = v; else if (k === "tajuk") o.tajuk = v; else o.cats = v; return; }
      if (l.startsWith("??")) { cur = { q: l.slice(2).trim(), opts: [], sample: "", kr: [] }; o.items.push(cur); return; }
      if (cur && /^[+-] /.test(l)) { const [t, r] = l.slice(2).split(/\s+::\s+/); cur.opts.push({ ok: l[0] === "+", t: t.trim(), r: r || "" }); return; }
      if (cur && l.startsWith("= ")) { cur.sample = l.slice(2).trim(); return; }
      if (cur && l.startsWith("* ")) { cur.kr.push(l.slice(2).trim()); return; }
      cur = null; o.items.push(l.split(/\s+\|\s+/));
    });
    return o;
  }
  function latihanHTML(type, src) {
    const { arahan, tajuk, cats, items } = parseLat(src);
    const nm = tajuk || LAT_NAMA[type]; if (!LAT_NAMA[type] || !items.length) return `<pre>${esc(src)}</pre>`;
    const id = "lat" + (++latN);
    const li = items.map(f => {
      if (type === "objektif") {
        return `<li class="lat-item"><span class="lat-q">${bi(f.q)}</span><span class="lat-opts">${f.opts.map(x => `<button type="button" class="opt lat-ob"${x.ok ? " data-ok" : ""}>${mdi(x.t)}</button>`).join("")}</span>${FB}<ul class="lat-why" hidden>${f.opts.map(x => `<li class="${x.ok ? "why-ok" : "why-no"}"><b>${x.ok ? "✓" : "✗"} ${mdi(x.t)}</b> ${bi(x.r)}</li>`).join("")}</ul></li>`;
      }
      if (type === "terbuka") {
        const [sm, st] = f.sample.split("<br>");
        return `<li class="lat-item lat-tb"><span class="lat-q">${bi(f.q)}</span><textarea class="lat-ta" rows="4" lang="ms" aria-label="Jawapan anda · คำตอบของคุณ" placeholder="Tulis jawapan anda di sini · เขียนคำตอบที่นี่"></textarea><button type="button" class="btn btn-line lat-buka">Lihat contoh jawapan dan kriteria · ดูตัวอย่างคำตอบและเกณฑ์</button>${FB}<div class="lat-model" hidden>${f.sample ? `<p class="lat-sample"><b>Contoh jawapan · ตัวอย่างคำตอบ</b><br>${mdi(sm)}${st ? `<br><span class="tr" lang="th">${mdi(st)}</span>` : ""}</p>` : ""}<p class="lat-note">Jawapan anda tidak perlu sama perkataan demi perkataan. Tandakan kriteria yang dipenuhi oleh jawapan anda. · ไม่จำเป็นต้องตรงกับตัวอย่างคำต่อคำ ให้ติ๊กเกณฑ์ที่คำตอบของคุณทำได้</p><ul class="lat-kr">${f.kr.map(k => `<li><label><input type="checkbox" class="lat-kc"> <span>${bi(k)}</span></label></li>`).join("")}</ul><p class="lat-krs" aria-live="polite"></p></div></li>`;
      }
      if (type === "isi") {
        const [q, ans, em, et] = f; const [a, b] = q.split("___");
        return `<li class="lat-item" data-ans="${esc(ans || "")}"><span class="lat-q" lang="ms">${mdi(a || "")}<input class="lat-in" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" lang="ms" aria-label="Jawapan · คำตอบ">${mdi(b || "")}</span> <button type="button" class="opt lat-semak">Semak · ตรวจ</button>${FB}${expHTML(em, et)}</li>`;
      }
      if (type === "betulkan") {
        const [q, em, et] = f; const m = q.match(/\[([^\]→]+)→([^\]]+)\]/);
        const wrong = m ? m[1].trim() : "", right = m ? m[2].trim() : "";
        const parts = q.split(/(\[[^\]]+\])/).flatMap(x => /^\[/.test(x) ? [{ w: wrong, ok: 1 }] : x.split(/\s+/).filter(Boolean).map(w => ({ w, ok: 0 })));
        const fixed = q.replace(/\[[^\]]+\]/, `**${right}**`);
        return `<li class="lat-item"><span class="lat-words" lang="ms">${parts.map(p => /^[.,!?;:]+$/.test(p.w) ? `<span class="lat-p">${esc(p.w)}</span>` : `<button type="button" class="opt lat-w"${p.ok ? " data-ok" : ""}>${esc(p.w)}</button>`).join(" ")}</span>${FB}<p class="lat-fix" hidden lang="ms">✓ ${mdi(fixed)}</p>${expHTML(em, et)}</li>`;
      }
      if (type === "analisis") {
        const [q, em, et] = f;
        const body = q.split(/(\[[^\]]+\])/).map(x => {
          const m = x.match(/^\[([^|\]]+)\|([^\]]+)\]$/); if (!m) return x.trim() ? `<span class="lat-p">${esc(x.trim())}</span>` : "";
          const k = cats.findIndex(c => ms1(c) === ms1(m[2]));
          return `<span class="lat-ch" data-a="${k}"><span class="lat-cht" lang="ms">${esc(m[1].trim())}</span><select class="lat-sel" aria-label="Fungsi bagi ${esc(m[1].trim())} · หน้าที่ของ ${esc(m[1].trim())}"><option value="">— pilih · เลือก —</option>${cats.map((c, j) => `<option value="${j}">${esc(c)}</option>`).join("")}</select><small class="lat-cor" hidden>→ ${esc(cats[k] || "?")}</small></span>`;
        }).join(" ");
        return `<li class="lat-item"><span class="lat-chs">${body}</span><button type="button" class="opt lat-semak-an">Semak · ตรวจ</button>${FB}${expHTML(em, et)}</li>`;
      }
      if (type === "golong") {
        const [w, cat, em, et] = f; const k = cats.findIndex(c => ms1(c) === ms1(cat));
        return `<li class="lat-item" data-a="${k}"><span class="lat-q">${bi(w)}</span><span class="lat-opts">${cats.map((c, j) => `<button type="button" class="opt lat-c" data-j="${j}">${mdi(c)}</button>`).join("")}</span>${FB}${expHTML(em, et)}</li>`;
      }
      const [st, bs, em, et] = f; const ok = /^(b|betul|benar)$/i.test((bs || "").trim()) ? 1 : 0;
      return `<li class="lat-item" data-a="${ok}"><span class="lat-q">${bi(st)}</span><span class="lat-opts"><button type="button" class="opt lat-tf" data-v="1">Betul · ถูก</button><button type="button" class="opt lat-tf" data-v="0">Salah · ผิด</button></span>${FB}${expHTML(em, et)}</li>`;
    }).join("");
    return `<div class="lat lat-${type}" id="${id}"><p class="lat-h">${B(mdi(nm[0]), mdi(nm[1] || ""))}</p>${arahan ? `<p class="lat-arahan">${mdi(arahan[0])}${arahan[1] ? `<br>${mdi(arahan[1])}` : ""}</p>` : ""}<ol>${li}</ol><div class="ex-foot"><span class="score lat-score" aria-live="polite"></span><button class="btn btn-line" type="button" data-lat-reset="${id}">Cuba semula · ทำใหม่</button></div></div>`;
  }
  /* Tukar blok ```latihan-… kepada penanda, kemudian isi selepas markdown diproses */
  function mdLat(body) {
    const store = [];
    const src = body.replace(/^```latihan-(\w+)[^\n]*\n([\s\S]*?)^```\s*$/gm, (_, t, b) => { store.push(latihanHTML(t, b)); return `\n<div data-lat-ph="${store.length - 1}"></div>\n`; });
    return md(src).replace(/<div data-lat-ph="(\d+)"><\/div>/g, (_, i) => store[+i]);
  }
  const normJ = t => String(t).toLowerCase().replace(/[.,!?;:]+$/g, "").replace(/\s+/g, " ").trim();
  function bindLat(root) {
    const skor = box => {
      if (box.classList.contains("lat-terbuka")) {
        const k = $$(".lat-kc", box), c = k.filter(x => x.checked).length;
        $(".lat-score", box).textContent = `Penilaian kendiri · ประเมินตนเอง: ${c}/${k.length} kriteria · เกณฑ์`; return;
      }
      const all = $$(".lat-item", box), d = all.filter(x => x.dataset.res !== undefined), r = d.filter(x => x.dataset.res === "1").length;
      $(".lat-score", box).textContent = `Markah · คะแนน ${r}/${all.length}` + (d.length < all.length ? ` (dijawab · ตอบแล้ว ${d.length})` : "");
    };
    const done = (li, ok, msg) => {
      li.dataset.res = ok ? "1" : "0";
      const fb = $(".lat-fb", li); fb.className = "lat-fb " + (ok ? "right" : "wrong"); fb.textContent = msg;
      $$(".lat-exp, .lat-fix, .lat-why", li).forEach(x => { x.hidden = false; });
      skor(li.closest(".lat"));
    };
    const semak = li => {
      const inp = $(".lat-in", li); if (!inp.value.trim()) { inp.focus(); return; }
      const alt = li.dataset.ans.split("/"), ok = alt.map(normJ).includes(normJ(inp.value)), j = alt.join(" / ");
      inp.disabled = true; inp.classList.add(ok ? "right" : "wrong"); $(".lat-semak", li).disabled = true;
      done(li, ok, ok ? "Betul · ถูกต้อง" : `Jawapan anda "${inp.value.trim()}" belum tepat. Jawapan: ${j} · คำตอบ "${inp.value.trim()}" ยังไม่ถูก คำตอบที่ถูกคือ ${j}`);
    };
    root.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.classList.contains("lat-in")) { e.preventDefault(); semak(e.target.closest(".lat-item")); } });
    root.addEventListener("change", e => { if (e.target.classList.contains("lat-kc")) { const li = e.target.closest(".lat-item"), k = $$(".lat-kc", li), c = k.filter(x => x.checked).length; $(".lat-krs", li).textContent = `Kriteria dipenuhi · ผ่านเกณฑ์ ${c}/${k.length}` + (c === k.length ? " — Cemerlang · ยอดเยี่ยม" : c >= k.length / 2 ? " — Baik; semak kriteria yang belum dipenuhi · ดี ลองปรับส่วนที่ยังขาด" : " — Perlu diperbaiki · ควรปรับปรุง"); skor(li.closest(".lat")); } });
    root.addEventListener("click", e => {
      const t = e.target.closest("button"); if (!t || t.disabled) return;
      const li = t.closest(".lat-item");
      if (t.classList.contains("lat-semak")) return semak(li);
      if (t.classList.contains("lat-buka")) {
        const ta = $(".lat-ta", li), fb = $(".lat-fb", li);
        if (!ta.value.trim() && !li.dataset.cuba) { li.dataset.cuba = "1"; fb.className = "lat-fb wrong"; fb.textContent = "Cuba tulis jawapan anda dahulu, kemudian klik sekali lagi. · ลองเขียนคำตอบก่อน แล้วกดอีกครั้ง"; ta.focus(); return; }
        fb.textContent = ""; $(".lat-model", li).hidden = false; t.disabled = true; skor(li.closest(".lat")); return;
      }
      if (t.classList.contains("lat-ob")) {
        const ok = t.hasAttribute("data-ok");
        $$(".lat-ob", li).forEach(b => { b.disabled = true; if (b.hasAttribute("data-ok")) b.classList.add("right"); });
        if (!ok) t.classList.add("wrong");
        return done(li, ok, ok ? "Betul · ถูกต้อง — lihat sebab setiap pilihan · ดูเหตุผลของแต่ละตัวเลือก" : "Belum tepat · ยังไม่ถูก — lihat sebab setiap pilihan di bawah · ดูเหตุผลของแต่ละตัวเลือกด้านล่าง");
      }
      if (t.classList.contains("lat-semak-an")) {
        const ch = $$(".lat-ch", li), sel = ch.map(c => $(".lat-sel", c));
        if (sel.some(s => s.value === "")) { const fb = $(".lat-fb", li); fb.className = "lat-fb wrong"; fb.textContent = "Pilih fungsi bagi setiap bahagian dahulu. · เลือกหน้าที่ให้ครบทุกส่วนก่อน"; return; }
        let r = 0;
        ch.forEach((c, k) => { const s = sel[k], ok = +s.value === +c.dataset.a; s.disabled = true; s.classList.add(ok ? "right" : "wrong"); if (ok) r++; else $(".lat-cor", c).hidden = false; });
        t.disabled = true;
        return done(li, r === ch.length, r === ch.length ? `Betul semua · ถูกทั้งหมด (${r}/${ch.length})` : `${r}/${ch.length} bahagian betul; jawapan yang betul ditunjukkan dengan → · ถูก ${r}/${ch.length} ส่วน คำตอบที่ถูกแสดงด้วย →`);
      }
      if (t.classList.contains("lat-w")) {
        const ok = t.hasAttribute("data-ok");
        $$(".lat-w", li).forEach(b => { b.disabled = true; if (b.hasAttribute("data-ok")) b.classList.add(ok ? "right" : "wrong-key"); });
        if (!ok) t.classList.add("wrong");
        return done(li, ok, ok ? "Betul, itulah kesalahannya · ถูกต้อง คำนี้คือจุดที่ผิด" : `"${t.textContent}" tidak salah. Kesalahan sebenar ditandai dengan garis merah · "${t.textContent}" ไม่ผิด จุดที่ผิดจริงมีขีดเส้นสีแดง`);
      }
      if (t.classList.contains("lat-c") || t.classList.contains("lat-tf")) {
        const a = +li.dataset.a, j = t.classList.contains("lat-c") ? +t.dataset.j : +t.dataset.v, bs = $$(".lat-c, .lat-tf", li);
        bs.forEach((b, k) => { b.disabled = true; if ((b.classList.contains("lat-c") ? k : +b.dataset.v) === a) b.classList.add("right"); });
        if (j !== a) t.classList.add("wrong");
        const label = t.classList.contains("lat-c") ? bs[a].textContent : (a ? "Betul · ถูก" : "Salah · ผิด");
        return done(li, j === a, j === a ? "Betul · ถูกต้อง" : `Anda memilih "${t.textContent}". Jawapan: ${label} · คุณเลือก "${t.textContent}" คำตอบที่ถูกคือ ${label}`);
      }
      const rs = e.target.closest("[data-lat-reset]");
      if (rs) {
        const box = $("#" + rs.dataset.latReset);
        $$(".lat-item", box).forEach(li => {
          delete li.dataset.res; delete li.dataset.cuba;
          $$(".lat-fb, .lat-krs", li).forEach(f => { f.className = f.classList.contains("lat-krs") ? "lat-krs" : "lat-fb"; f.textContent = ""; });
          $$(".lat-exp, .lat-fix, .lat-why, .lat-model, .lat-cor", li).forEach(x => { x.hidden = true; });
          $$("button, input, select, textarea", li).forEach(b => { b.disabled = false; b.classList.remove("right", "wrong", "wrong-key"); });
          $$(".lat-in, .lat-ta, .lat-sel", li).forEach(i => { i.value = ""; }); $$(".lat-kc", li).forEach(c => { c.checked = false; });
        });
        $(".lat-score", box).textContent = "";
      }
    });
  }
  /* อ่านข้อปรนัยจาก markdown: "1. คำถาม" / "   ก. ... ข. ... ค. ... ง. ..." / "**เฉลย** 1 ข · 2 ค (หมายเหตุ)" */
  function parseMCQ(text) {
    const lines = text.split("\n"); const qs = []; let cur = null; let key = ""; const exp = {};
    for (const ln of lines) {
      /* Penjelasan jawapan: "- **1** Melayu<br>Thai" selepas baris เฉลย · คำอธิบายเฉลยรายข้อ */
      const me = ln.match(/^\s*-\s+\*\*(\d+)\*\*\s+(.+)$/);
      if (key && me) { exp[+me[1]] = me[2].trim(); continue; }
      const mq = ln.match(/^(\d+)\.\s+(.*)$/);
      if (mq) { cur = { n: +mq[1], q: mq[2].trim(), o: [] }; qs.push(cur); continue; }
      if (/\*\*เฉลย\*\*/.test(ln)) { key = ln.replace(/\*\*เฉลย\*\*/, ""); continue; }
      const t = ln.trim();
      if (cur && /^ก\.\s/.test(t)) {
        const idx = []; const re = /(^|\s)([กขคง])\.\s+/g; let m;
        while ((m = re.exec(t))) idx.push({ L: m[2], at: m.index + m[1].length, start: m.index + m[0].length });
        cur.o = idx.map((x, k) => t.slice(x.start, k + 1 < idx.length ? idx[k + 1].at : t.length).trim());
      }
    }
    const ans = {}; const re = /(\d+)\s*([กขคง])(?:\s*\(([^)]*)\))?/g; let m;
    while ((m = re.exec(key))) ans[+m[1]] = { a: "กขคง".indexOf(m[2]), note: m[3] || "" };
    return qs.filter(q => q.o.length >= 2 && ans[q.n]).map(q => ({ q: q.q, o: q.o, a: ans[q.n].a, note: ans[q.n].note, exp: exp[q.n] || "" }));
  }
  /* หลังแปลง markdown: ห่อตาราง ซ่อนแนวคำตอบ และทำให้คำมลายูกดฟังเสียงได้ */
  /* Pisahkan baris Melayu dan Thai dalam satu blok (dipisahkan oleh <br>).
     Blok yang mengandungi kedua-dua bahasa: baris Thai dipaparkan di bawah dengan warna lembut.
     Blok yang hanya dalam satu bahasa (bab yang belum diterjemah) tidak diubah. */
  /* Bahasa sesuatu baris ditentukan oleh tulisan yang dominan; perkataan Melayu bercondong (<em>)
     dalam baris Thai dan petikan Thai dalam baris Melayu tidak mengubah bahasanya.
     ภาษาของแต่ละบรรทัดตัดสินจากตัวอักษรที่มีมากกว่า ไม่นับคำมลายูตัวเอียงและแนวคำตอบ */
  const noEm = n => { if (n.nodeType !== 1) return n.textContent; const c = n.cloneNode(true); c.querySelectorAll && c.querySelectorAll("em").forEach(e => e.remove()); return c.tagName === "EM" ? "" : c.textContent; };
  const thaiDom = t => { t = t.replace(/\(แนวคำตอบ:/g, "("); const th = (t.match(/[\u0E00-\u0E7F]/g) || []).length, la = (t.match(/[A-Za-z]/g) || []).length; return th > 0 && th >= la; };
  function splitLang(root) {
    $$("h2, h3, h4, p, li, td, th, .opt", root).forEach(el => {
      if (el.dataset.dw || el.closest(".hint summary")) return;
      const nodes = []; for (const n of Array.from(el.childNodes)) { if (n.nodeType === 1 && /^(UL|OL|TABLE|DETAILS|DIV|BLOCKQUOTE|P)$/.test(n.tagName)) break; nodes.push(n); }
      if (!nodes.some(n => n.nodeName === "BR")) return;
      const lines = [[]]; nodes.forEach(n => { if (n.nodeName === "BR") lines.push([]); else lines[lines.length - 1].push(n); });
      const txt = l => l.map(n => n.textContent).join("").trim();
      const isTh = l => thaiDom(l.map(n => noEm(n)).join(""));
      const solid = lines.filter(l => txt(l));
      if (solid.length < 2 || !solid.some(isTh) || !solid.some(l => !isTh(l))) return;
      el.dataset.dw = "1";
      const ref = nodes[nodes.length - 1].nextSibling;
      nodes.forEach(n => n.remove());
      lines.forEach(l => {
        if (!txt(l) && !l.some(n => n.nodeType === 1)) return;
        const sp = document.createElement("span"); const th = isTh(l);
        sp.className = th ? "tr" : "bm"; sp.lang = th ? "th" : "ms";
        l.forEach(n => sp.appendChild(n)); el.insertBefore(sp, ref);
      });
    });
  }
  function enhance(root) {
    splitLang(root);
    $$("h2, h3, h4, p, li, td, th, .opt, blockquote", root).forEach(el => { if (!el.dataset.dw && !el.lang && !el.closest("[lang=th]") && thaiDom(noEm(el))) el.lang = "th"; });
    $$("pre", root).forEach(p => { p.tabIndex = 0; });
    labelJadual(root);
    $$("table", root).forEach(t => { if (!t.parentElement.classList.contains("tbl-wrap")) { const w = document.createElement("div"); w.className = "tbl-wrap"; t.replaceWith(w); w.appendChild(t); } });
    $$("li, p, td", root).forEach(el => {
      if (!/\(แนวคำตอบ:/.test(el.innerHTML)) return;
      el.innerHTML = el.innerHTML.replace(/\(แนวคำตอบ:\s*([\s\S]*?)\)(?=\s|<|$)/g, '<details class="hint"><summary>Panduan jawapan · ดูแนวคำตอบ</summary><div>$1</div></details>');
    });
    /* butang panduan jawapan diletakkan selepas baris Thai, bukan di antara dua bahasa */
    $$("details.hint", root).forEach(d => {
      const sp = d.closest(".bm"); if (!sp) return;
      const th = Array.from(sp.parentElement.children).filter(c => c.classList.contains("tr")).pop();
      if (th) th.after(d);
    });
    $$("em", root).forEach(em => {
      const t = em.textContent.trim();
      if (!t || hasThai(t) || em.closest("button, a, summary, h2, h3, .opt, .q-text")) return;
      em.classList.add("ms-say"); em.setAttribute("lang", "ms"); em.tabIndex = 0; em.setAttribute("role", "button"); em.title = "Klik untuk dengar · กดเพื่อฟังเสียง";
    });
  }

  /* Jadual mudah alih: setiap sel diberi label lajur supaya jadual boleh dipaparkan sebagai kad pada skrin kecil
     ตารางบนมือถือ: ใส่ชื่อคอลัมน์ให้ทุกช่อง เพื่อแสดงเป็นการ์ดบนจอเล็ก */
  function labelJadual(root) {
    $$("table", root).forEach(t => {
      const hs = $$("thead th", t).map(th => { const m = th.querySelector(".bm"), r = th.querySelector(".tr"); return m ? m.textContent.trim() + (r ? " · " + r.textContent.trim() : "") : th.textContent.trim(); });
      if (!hs.length) return;
      t.classList.add("tbl-kad");
      $$("tbody tr", t).forEach(tr => $$("td", tr).forEach((td, i) => { if (hs[i]) td.setAttribute("data-label", hs[i]); }));
    });
  }
  const mqMobile = window.matchMedia("(max-width: 860px)");

  /* ---------- shared bits ---------- */
  const babLink = n => `#/bab/${n}`;
  const partName = p => p === "sintaksis" ? B("Bahagian Sintaksis", "ภาควากยสัมพันธ์") : B("Bahagian Morfologi", "ภาควจีวิภาค");
  function setNav(route) { $$(".mainnav a").forEach(a => { if (a.dataset.route === route) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); }); $(".mainnav").classList.remove("open"); $(".menu-btn").setAttribute("aria-expanded", "false"); }
  function table(head, rows) { return `<div class="tbl-wrap"><table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }

  /* ================= HOME ================= */
  /* ประโยคตัวอย่างสำหรับหน้าแรก: [ประธาน, ภาคแสดง, แบบประโยค, คำแปล] */
  const AYAT = [
    ["Hamidah", "pelajar universiti.", "FN + FN", "ฮามีดะห์เป็นนักศึกษามหาวิทยาลัย"],
    ["Anif", "sedang tidur.", "FN + FK", "อานีฟกำลังนอนหลับ"],
    ["Lelaki itu", "pemurah.", "FN + FA", "ผู้ชายคนนั้นใจกว้าง"],
    ["Pejabat saya", "di Songkhla.", "FN + FSN", "สำนักงานของฉันอยู่ที่สงขลา"],
    ["Pelajar itu", "membaca buku cerita di perpustakaan.", "FN + FK", "นักศึกษาคนนั้นอ่านหนังสือนิทานที่ห้องสมุด"],
    ["Institusi itu", "Universiti Thaksin.", "FN + FN", "สถาบันนั้นคือมหาวิทยาลัยทักษิณ"],
    ["Lukisan Chairat Sangthong", "sungguh cantik.", "FN + FA", "ภาพวาดของไชยรัตน์ แสงทองงดงามยิ่งนัก"],
    ["Bungkusan itu", "daripada Muhammad.", "FN + FSN", "ห่อของนั้นมาจากมูหำหมัด"],
    ["Mereka", "tinggal di Yala.", "FN + FK", "พวกเขาอาศัยอยู่ที่ยะลา"],
    ["Kopi itu", "panas.", "FN + FA", "กาแฟนั้นร้อน"]
  ];
  function home() {
    setNav("home"); document.title = `${C.code} ${C.ms} · ${C.th} | Universiti Thaksin`;
    const next = CH.find(l => !isDone(l.no)) || CH[0];
    const doneCount = CH.filter(l => isDone(l.no)).length;
    const day = Math.floor(Date.now() / 864e5) % AYAT.length;
    const weeks = CH.map(c => ({ week: c.week, c })).concat(C.extraWeeks.map(x => ({ week: x.week, x }))).sort((a, b) => a.week - b.week);
    app.innerHTML = `
      <section class="hero"><div class="wrap">
        <div id="ayat-box">
          <p class="hero-label">Ayat hari ini · ประโยควันนี้</p>
          <p class="hero-ayat" id="ayat" lang="ms"></p>
          <p class="hero-tr" id="ayat-tr"></p>
          <div class="k-legend"><span class="ls">Subjek · ประธาน</span><span class="lp">Predikat · ภาคแสดง</span><span id="ayat-pola"></span></div>
          <div class="btn-row"><button type="button" class="btn btn-hero btn-dw" id="ayat-k">${B("Pisahkan subjek–predikat", "แยกประธาน–ภาคแสดง")}</button><button type="button" class="btn btn-ghost btn-dw" id="ayat-n">${B("Ayat seterusnya", "ประโยคถัดไป")}</button><span id="ayat-say"></span></div>
        </div>
        <div class="hero-side">
          <h1><span lang="ms">${C.code} ${C.ms}</span><br><span style="font-weight:500;opacity:.85">${C.th}</span></h1>
          <p class="bm" lang="ms">Dokumen pengajaran dalam talian, ${C.termMs}. Tiga belas bab daripada morfem hingga transformasi ayat, lengkap dengan kajian kes, kuiz dan alat latihan.</p>
          <p class="tr hero-tr2">เอกสารประกอบการสอนออนไลน์ ${C.term} 13 บท ตั้งแต่หน่วยคำถึงการแปลงประโยค พร้อมกรณีศึกษา แบบทดสอบ และเครื่องมือฝึก</p>
          <div class="btn-row">
            ${(() => { const h = sambungHref(), a = load().akhir; return h ? `<a class="btn btn-hero btn-dw" href="${h}">${B("Sambung Belajar · Bab " + a.n, "เรียนต่อ บทที่ " + a.n)}</a>` : `<a class="btn btn-hero btn-dw" href="${babLink(next.no)}">${doneCount ? B("Mula Bab " + next.no, "เริ่มบทที่ " + next.no) : B("Mula Bab 1", "เริ่มบทที่ 1")}</a>`; })()}
            <a class="btn btn-ghost btn-dw" href="#/kemajuan">${B(`Kemajuan ${Math.round(doneCount / CH.length * 100)}%`, `ความก้าวหน้า ${Math.round(doneCount / CH.length * 100)}%`)}</a>
            <a class="btn btn-ghost btn-dw" href="#/kandungan">${B("Kandungan", "สารบัญ")}</a>
          </div>
        </div>
      </div></section>
      <div class="cengkih-band" role="presentation"></div>
      <section class="section"><div class="wrap">
        <div class="section-head"><h2>${B("Rancangan Pembelajaran 15 Minggu", "แผนการเรียน 15 สัปดาห์")}</h2><p>${doneCount ? B(`${doneCount} daripada ${CH.length} bab sudah dipelajari`, `ทำเครื่องหมายเรียนแล้ว ${doneCount} จาก ${CH.length} บท`) : B(`${CH.length} bab · 3 jam seminggu`, `${CH.length} บทเรียน · 3 ชั่วโมงต่อสัปดาห์`)}</p></div>
        <ol class="jadual">${weeks.map(w => {
          if (w.x) return `<li><a class="jrow extra" href="${w.x.href}"><div class="jweek"><b>Minggu ${w.week}</b>สัปดาห์ ${w.week}</div><div class="jtitle"><span class="ms" lang="ms">${w.x.ms}</span><span class="th">${w.x.th}</span><span class="th" style="display:block;font-weight:400;font-size:14.5px;color:var(--muted)">${w.x.note}</span></div><div class="jstat">${w.x.linkMs}<br>${w.x.link} →</div></a></li>`;
          const c = w.c, d = isDone(c.no);
          const head = c.no === 1 || c.no === 8 ? `<li aria-hidden="true"><p class="part-head">${partName(c.part)}</p></li>` : "";
          return `${head}<li><a class="jrow" href="${babLink(c.no)}"><div class="jweek"><b>Minggu ${w.week}</b>Bab ${c.no} · บทที่ ${c.no}</div>
            <div class="jtitle"><span class="ms" lang="ms">${c.ms}</span><span class="th">${c.th}</span></div>
            <div class="jstat ${d ? "done" : ""}">${d ? "✓ Selesai · เรียนแล้ว" : c.clos.join(" · ")}${getSkor(c.no) ? `<span class="jskor">Kuiz ${getSkor(c.no).best}/${getSkor(c.no).all}</span>` : ""}</div></a></li>`;
        }).join("")}</ol>
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap tri">
        <div><h3>${B("Kuiz", "แบบทดสอบ")}</h3><p class="bm" lang="ms">Soalan objektif dipilih secara rawak daripada semua bab dan disemak serta-merta. Sesuai untuk ulang kaji sebelum peperiksaan.</p><p class="tr">สุ่มข้อปรนัยจากทุกบท ตรวจคำตอบทันที ใช้ทบทวนก่อนสอบกลางภาคและปลายภาค</p><a href="#/kuiz">Mula kuiz · เริ่มทำแบบทดสอบ</a></div>
        <div><h3>${B("Alat Latihan", "เครื่องมือฝึก")}</h3><p class="bm" lang="ms">Imbuhan meN-, peN-, ber- dan ter- ditambah secara automatik, dan ayat aktif ditukar kepada ayat pasif.</p><p class="tr">เติมปัจจัย meN- peN- ber- ter- อัตโนมัติ และแปลงประโยคกรรตุวาจกเป็นกรรมวาจก</p><a href="#/alat">Buka alat · เปิดเครื่องมือ</a></div>
        <div><h3>${B("Istilah Tatabahasa", "อภิธานศัพท์ไวยากรณ์")}</h3><p class="bm" lang="ms">Lebih ${window.ISTILAH.length} istilah Melayu–Thai yang boleh dicari dan dipautkan kepada bab berkaitan.</p><p class="tr">ศัพท์เทคนิคภาษามลายู–ไทยกว่า ${window.ISTILAH.length} คำ ค้นหาได้ และโยงไปยังบทที่เกี่ยวข้อง</p><a href="#/istilah">Buka glosari · เปิดอภิธานศัพท์</a></div>
      </div></section>`;
    let k = day;
    const box = $("#ayat-box");
    const draw = () => {
      const [s, p, pola, tr] = AYAT[k];
      $("#ayat").innerHTML = `<span class="konst k-s">${esc(s)}</span> <span class="konst k-p">${esc(p)}</span>`;
      $("#ayat-tr").textContent = tr; $("#ayat-pola").textContent = "Pola · แบบ " + pola;
      $("#ayat-say").innerHTML = sayBtn(s + " " + p).replace('class="say"', 'class="say hero-say"');
    };
    $("#ayat-k").onclick = () => { const on = box.classList.toggle("show-k"); $("#ayat-k").innerHTML = on ? B("Sembunyikan pemisahan", "ซ่อนการแยกส่วน") : B("Pisahkan subjek–predikat", "แยกประธาน–ภาคแสดง"); };
    $("#ayat-n").onclick = () => { k = (k + 1) % AYAT.length; draw(); };
    draw();
    window.scrollTo(0, 0);
  }

  /* ================= LESSON ================= */
  function mcqHTML(items, id, src) {
    return `<div class="ex" id="${id}">${items.map((it, i) => `<div class="q" data-a="${it.a}">
        ${src ? `<p class="quiz-src"><a href="${babLink(it.bab)}">Bab ${it.bab} · บทที่ ${it.bab}</a></p>` : ""}
        <p class="q-text">${i + 1}. ${mdi(it.q)}</p>
        <div class="opts">${it.o.map((o, j) => `<button type="button" class="opt" data-j="${j}">${"กขคง"[j]}. ${mdi(o)}</button>`).join("")}</div>
        <p class="fb" aria-live="polite"></p>${it.note ? `<p class="note-ans" hidden>Catatan · หมายเหตุ: ${mdi(it.note)}</p>` : ""}${it.exp ? `<p class="note-ans exp-ans" hidden>${(([m, t]) => `<b>Penjelasan:</b> ${mdi(m)}${t ? `<br><b>คำอธิบาย:</b> ${mdi(t)}` : ""}`)(it.exp.split("<br>"))}</p>` : ""}</div>`).join("")}
      <div class="ex-foot"><span class="score" aria-live="polite"></span><button class="btn btn-line" type="button" data-reset="${id}">Cuba semula · ทำใหม่</button></div></div>`;
  }
  function bindMCQ(root, onAll) {
    root.addEventListener("click", e => {
      const opt = e.target.closest(".q .opt"), rst = e.target.closest("[data-reset]");
      if (opt && !opt.disabled) {
        const q = opt.closest(".q"), a = +q.dataset.a, j = +opt.dataset.j, ex = q.closest(".ex");
        $$(".opt", q).forEach((b, k) => { b.disabled = true; if (k === a) b.classList.add("right"); });
        if (j !== a) opt.classList.add("wrong");
        q.dataset.res = j === a ? "1" : "0";
        const fb = $(".fb", q); fb.className = "fb " + (j === a ? "right" : "wrong"); fb.textContent = j === a ? "Betul · ถูกต้อง" : `Belum tepat. Jawapan yang betul ialah ${"กขคง"[a]} (kotak hijau) · ยังไม่ถูก คำตอบที่ถูกคือข้อ ${"กขคง"[a]} (กรอบสีเขียว)`;
        $$(".note-ans", q).forEach(nt => { nt.hidden = false; });
        const all = $$(".q", ex), done = all.filter(x => x.dataset.res !== undefined), ok = done.filter(x => x.dataset.res === "1").length;
        $(".score", ex).textContent = `Markah · คะแนน ${ok}/${all.length}` + (done.length < all.length ? ` (dijawab · ตอบแล้ว ${done.length})` : "");
        if (done.length === all.length && onAll) onAll(ok, all.length);
      }
      if (rst) {
        const ex = $("#" + rst.dataset.reset);
        $$(".q", ex).forEach(q => { delete q.dataset.res; $$(".opt", q).forEach(b => { b.disabled = false; b.classList.remove("right", "wrong"); }); const fb = $(".fb", q); fb.className = "fb"; fb.textContent = ""; $$(".note-ans", q).forEach(nt => { nt.hidden = true; }); });
        $(".score", ex).textContent = "";
        if (onAll) onAll(null);
      }
    });
  }

  /* ส่วน "คำถามท้ายบท": ข้อปรนัยกลายเป็นแบบโต้ตอบ ส่วนอัตนัยและโจทย์คิดวิเคราะห์แสดงตามเดิม */
  function soalanHTML(body, n) {
    const parts = body.split(/^### /m);
    let out = parts[0].trim() ? md(parts[0]) : "";
    parts.slice(1).forEach((p, i) => {
      const nl = p.indexOf("\n"), h = p.slice(0, nl).trim(), rest = p.slice(nl + 1);
      if (/ปรนัย/.test(h)) {
        const items = parseMCQ(rest);
        out += `<h3>${mdi(h)}</h3>` + (items.length ? `<p class="lead" style="color:var(--muted)">Klik jawapan; semakan dibuat serta-merta · กดเลือกคำตอบ ระบบจะตรวจทันที</p>${mcqHTML(items, `mcq${n}`)}` : md(rest));
      } else out += `<h3>${mdi(h)}</h3>${mdLat(rest)}`;
    });
    return out;
  }

  const PDF_ICO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>';
  /* Cetak: buka semua panduan jawapan supaya turut dicetak · เปิดแนวคำตอบทั้งหมดก่อนพิมพ์ */
  document.addEventListener("click", e => { if (e.target.closest("[data-print]")) window.print(); });
  window.addEventListener("beforeprint", () => $$("details.hint").forEach(d => { d.dataset.wasOpen = d.open ? "1" : ""; d.open = true; }));
  window.addEventListener("afterprint", () => $$("details.hint").forEach(d => { d.open = d.dataset.wasOpen === "1"; }));
  function lesson(n, sub) {
    const c = CH.find(x => x.no === n); if (!c) return notFound();
    setNav("home"); document.title = `Bab ${c.no} ${c.ms} · บทที่ ${c.no} | ${C.code}`;
    const i = CH.indexOf(c), prev = CH[i - 1], next = CH[i + 1];
    app.innerHTML = `
      <header class="lesson-head" id="s-tajuk"><div class="wrap">
        <p class="crumb"><a href="#/">Rancangan · แผนการเรียน</a> / <a href="#/kandungan">Kandungan · สารบัญ</a> / Minggu ${c.week} · สัปดาห์ที่ ${c.week}</p>
        ${c.struktur === 12 ? `<p class="lesson-eyebrow"><span lang="ms">1. Tajuk Pelajaran</span> · ชื่อบทเรียน</p>` : ""}
        <p class="lesson-no"><span lang="ms">Bab ${c.no}</span> · บทที่ ${c.no}<span class="part-tag" lang="ms">${c.part === "sintaksis" ? "Sintaksis" : "Morfologi"}</span></p>
        <h1 class="lesson-title" lang="ms">${c.ms}</h1>
        <p class="lesson-th">${c.th}</p>
        <ul class="chips">${c.clos.map(x => `<li class="chip" title="${esc((C.clos.find(y => y.id === x) || {}).text || "")}">${x}</li>`).join("")}</ul>
        <div class="pdf-row">
          <a class="btn btn-pdf btn-dw" href="pdf/bab-${pad(n)}.pdf" download="${C.code}-Bab-${pad(n)}.pdf">${PDF_ICO}<span>${B("Muat turun PDF", "ดาวน์โหลด PDF")}</span></a>
          <button type="button" class="btn btn-ghost btn-dw" data-print>${B("Cetak", "พิมพ์")}</button>
        </div>
      </div></header>
      <div class="wrap lesson-body"><nav class="toc" aria-label="Tajuk dalam bab · หัวข้อในบท"><details class="toc-d" open><summary><span class="toc-sum-h">Dalam bab ini · ในบทนี้</span><span class="toc-kini" aria-hidden="true"></span></summary><ol>${secIds(c).map(id => `<li><a href="#/bab/${n}/${id}" data-sec="${id}">${SEC_SHORT[id]}</a></li>`).join("")}</ol></details></nav>
        <div id="bab-body"><p class="loading">Memuatkan Bab ${n}… · กำลังโหลดเนื้อหาบทที่ ${n}…</p></div></div>`;
    window.scrollTo(0, 0);
    fetchBab(n).then(text => {
      if (location.hash.split("/")[2] !== String(n)) return;
      const secs = splitSections(text);
      const body = $("#bab-body");
      body.innerHTML = `<p class="say-hint">${SPK} <span>Klik perkataan Melayu bercetak condong untuk mendengar sebutan · กดคำภาษามลายูตัวเอียงเพื่อฟังเสียง</span></p>` + secs.map((s, k) => `<section class="block" id="s-${s.id}"><h2>${c.struktur === 12 ? `<span class="sec-no" aria-hidden="true">${k + 2}.</span> ` : ""}${mdi(s.title)}</h2><div class="prose">${s.id === "soalan" || s.id === "kuiz" ? soalanHTML(s.body, n) : mdLat(s.body)}</div></section>`).join("") + `
        <div class="lesson-foot">
          <div class="done-box"><button type="button" class="btn ${isDone(n) ? "btn-line" : "btn-solid"}" data-done>${isDone(n) ? "✓ Bab ini selesai · เรียนบทนี้แล้ว (klik untuk batal · กดเพื่อยกเลิก)" : "Tandakan selesai · ทำเครื่องหมายว่าเรียนแล้ว"}</button>
          ${NOTA_PENDEK_F()}</div>
          <nav class="pn" aria-label="Bab sebelum dan seterusnya · บทก่อนหน้าและถัดไป">
            ${prev ? `<a href="${babLink(prev.no)}"><small>Bab sebelum · บทก่อนหน้า (${prev.no})</small><span class="ms" lang="ms">${prev.ms}</span></a>` : ""}
            ${next ? `<a class="next" href="${babLink(next.no)}"><small>Bab seterusnya · บทถัดไป (${next.no})</small><span class="ms" lang="ms">${next.ms}</span></a>` : ""}
          </nav>
        </div>`;
      /* Skor kuiz bab disimpan · บันทึกคะแนนแบบทดสอบท้ายบท */
      const ex = $(`#mcq${n}`, body);
      const skorTxt = () => { const k = getSkor(n); return k ? B(`Skor terakhir ${k.ok}/${k.all} · terbaik ${k.best}/${k.all} · ${k.cuba} kali cubaan`, `คะแนนล่าสุด ${k.ok}/${k.all} · สูงสุด ${k.best}/${k.all} · ทำแล้ว ${k.cuba} ครั้ง`) : B("Belum ada skor yang disimpan untuk bab ini.", "ยังไม่มีคะแนนที่บันทึกไว้สำหรับบทนี้"); };
      if (ex) ex.insertAdjacentHTML("afterend", `<div class="skor-bab" aria-live="polite"><p class="skor-txt">${skorTxt()}</p>${NOTA_PENDEK_F()}</div>`);
      enhance(body); bindLat(body);
      bindMCQ(body, (ok, all) => {
        if (ok === null) return;
        setSkor(n, ok, all); $(".skor-txt", body).innerHTML = skorTxt();
        const pc = Math.round(ok / all * 100);
        if (pc >= 80 && !isDone(n)) toast(T(`Skor ${ok}/${all} disimpan. Anda boleh menandakan bab ini selesai.`, `บันทึกคะแนน ${ok}/${all} แล้ว ทำเครื่องหมายว่าเรียนบทนี้จบได้`));
        else toast(T(`Skor ${ok}/${all} disimpan`, `บันทึกคะแนน ${ok}/${all} แล้ว`));
      });
      setAkhir(n, sub && sub !== "tajuk" ? sub : "");
      /* senarai tajuk mengikut bahagian sebenar dalam fail · สารบัญย่อยตามหัวข้อจริงในไฟล์ */
      const ids = (c.struktur === 12 ? ["tajuk"] : []).concat(secs.map(s => s.id));
      $(".toc-d").open = !mqMobile.matches;
      $(".toc ol").innerHTML = ids.map(id => `<li><a href="#/bab/${n}/${id}" data-sec="${id}">${SEC_SHORT[id] || id}</a></li>`).join("");
      // TOC: เลื่อนภายในหน้า
      $$(".toc a").forEach(a => a.addEventListener("click", e => { e.preventDefault(); if (mqMobile.matches) $(".toc-d").open = false; const t = $("#s-" + a.dataset.sec) || (a.dataset.sec === "tajuk" ? $("#s-tajuk") : null); if (t) t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); history.replaceState(null, "", a.getAttribute("href")); }));
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { $$(".toc a").forEach(a => { const on = "s-" + a.dataset.sec === en.target.id; a.classList.toggle("on", on); if (on) { a.setAttribute("aria-current", "location"); const k = $(".toc-kini"); if (k) k.textContent = a.querySelector(".bm") ? a.querySelector(".bm").textContent : a.textContent; } else a.removeAttribute("aria-current"); }); if (location.hash.split("/")[2] === String(n)) setAkhir(n, en.target.id === "s-tajuk" ? "" : en.target.id.replace(/^s-/, "")); } }), { rootMargin: "-30% 0px -60% 0px" });
        $$(".block", body).forEach(b => io.observe(b)); if ($("#s-tajuk")) io.observe($("#s-tajuk"));
      }
      const btnDone = $("[data-done]", body);
      btnDone.addEventListener("click", () => {
        const v = !isDone(n); setDone(n, v);
        btnDone.className = "btn " + (v ? "btn-line" : "btn-solid");
        btnDone.textContent = v ? "✓ Bab ini selesai · เรียนบทนี้แล้ว (klik untuk batal · กดเพื่อยกเลิก)" : "Tandakan selesai · ทำเครื่องหมายว่าเรียนแล้ว";
        const d = CH.filter(x => isDone(x.no)).length;
        toast(v ? T(`Bab ${n} selesai · ${d}/${CH.length} bab (${Math.round(d / CH.length * 100)}%)`, `เรียนบทที่ ${n} แล้ว · ${d}/${CH.length} บท`) : T("Tanda dibatalkan", "ยกเลิกเครื่องหมายแล้ว"));
      });
      if (sub && $("#s-" + sub)) setTimeout(() => $("#s-" + sub).scrollIntoView(), 30);
    }).catch(() => {
      $("#bab-body").innerHTML = `<div class="note"><p>Bab ${n} gagal dimuatkan. Sila muat semula halaman. · โหลดเนื้อหาบทที่ ${n} ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p><p style="font-size:15px;color:var(--muted)">หมายเหตุสำหรับผู้สอน: เนื้อหาโหลดจากไฟล์ <code>content/bab-${pad(n)}.md</code> ต้องเปิดผ่านเว็บไซต์ (GitHub Pages) ไม่ใช่การดับเบิลคลิกไฟล์ในเครื่อง</p></div>`;
    });
  }

  /* ================= KEMAJUAN · ความก้าวหน้า ================= */
  function kemajuan() {
    setNav("kemajuan"); document.title = `Kemajuan Saya · ความก้าวหน้า | ${C.code}`;
    const st = load(), skor = st.skor || {}, akhir = st.akhir;
    const done = CH.filter(c => isDone(c.no)).length, pc = Math.round(done / CH.length * 100);
    const sk = CH.map(c => skor[c.no]).filter(Boolean);
    const purata = sk.length ? Math.round(sk.reduce((a, k) => a + k.best / k.all, 0) / sk.length * 100) : null;
    const h = sambungHref(), ca = akhir && CH.find(c => c.no === akhir.n);
    app.innerHTML = `<section class="section"><div class="wrap kemajuan">
      <div class="section-head"><h1>${B("Kemajuan Saya", "ความก้าวหน้าของฉัน")}</h1></div>
      <div class="note nota-kemajuan" role="note"><p>${NOTA_SIMPAN_F()}</p></div>
      ${storageOK ? "" : `<div class="note nota-amaran" role="alert"><p>${B("Pelayar ini tidak membenarkan penyimpanan (contohnya mod peribadi). Kemajuan tidak dapat disimpan.", "เบราว์เซอร์นี้ไม่อนุญาตให้บันทึกข้อมูล (เช่น โหมดไม่ระบุตัวตน) จึงบันทึกความก้าวหน้าไม่ได้")}</p></div>`}
      <div class="kj-stat">
        <div class="kj-kad"><p class="kj-label">${B("Bab selesai", "บทที่เรียนจบ")}</p><p class="kj-nilai">${done}<small> / ${CH.length}</small></p></div>
        <div class="kj-kad"><p class="kj-label">${B("Kemajuan pelajaran", "ความก้าวหน้า")}</p><p class="kj-nilai">${pc}<small>%</small></p>
          <div class="kj-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pc}" aria-label="Kemajuan pelajaran · ความก้าวหน้า ${pc}%"><span style="width:${pc}%"></span></div></div>
        <div class="kj-kad"><p class="kj-label">${B("Kuiz bab dijawab", "แบบทดสอบท้ายบทที่ทำแล้ว")}</p><p class="kj-nilai">${sk.length}<small> / ${CH.length}</small></p></div>
        <div class="kj-kad"><p class="kj-label">${B("Purata skor terbaik", "ค่าเฉลี่ยคะแนนสูงสุด")}</p><p class="kj-nilai">${purata === null ? "—" : purata + "<small>%</small>"}</p></div>
      </div>
      <div class="kj-sambung">
        ${h ? `<a class="btn btn-solid btn-dw" href="${h}">${B("Sambung Belajar", "เรียนต่อจากครั้งล่าสุด")}</a><p>${B(`Terakhir dibuka: Bab ${ca.no} · ${ca.ms}${akhir.sec && SEC_DEF.find(d => d[0] === akhir.sec) ? " · " + SEC_DEF.find(d => d[0] === akhir.sec)[2] : ""} · ${tarikh(akhir.t)}`, `เปิดล่าสุด: บทที่ ${ca.no} ${ca.th}`)}</p>`
          : `<a class="btn btn-solid btn-dw" href="${babLink(1)}">${B("Mula Bab 1", "เริ่มบทที่ 1")}</a><p>${B("Belum ada bab yang dibuka.", "ยังไม่ได้เปิดบทเรียน")}</p>`}
      </div>
      <h2 class="kj-h2">${B("Kemajuan mengikut bab", "ความก้าวหน้ารายบท")}</h2>
      <div class="tbl-wrap"><table class="kj-jadual"><thead><tr>
        <th scope="col">${B("Bab", "บท")}</th><th scope="col">${B("Tajuk", "ชื่อบท")}</th><th scope="col">${B("Status", "สถานะ")}</th>
        <th scope="col">${B("Skor kuiz terakhir", "คะแนนล่าสุด")}</th><th scope="col">${B("Skor terbaik", "คะแนนสูงสุด")}</th><th scope="col">${B("Cubaan", "จำนวนครั้ง")}</th></tr></thead>
        <tbody>${CH.map(c => { const k = skor[c.no], d = isDone(c.no); return `<tr>
          <td>${c.no}</td><td><a href="${babLink(c.no)}"><span lang="ms">${c.ms}</span></a><br><span class="tr-kecil">${c.th}</span></td>
          <td class="${d ? "kj-ok" : ""}">${d ? B("✓ Selesai", "เรียนจบ") : B("Belum", "ยังไม่จบ")}</td>
          <td>${k ? `${k.ok}/${k.all} <small>(${Math.round(k.ok / k.all * 100)}%)</small>` : "—"}</td>
          <td>${k ? `${k.best}/${k.all}` : "—"}</td><td>${k ? k.cuba : "—"}</td></tr>`; }).join("")}</tbody></table></div>
      <p class="kj-cara">${B("Cara mengemas kini: tekan <b>Tandakan selesai</b> di hujung setiap bab, dan jawab semua soalan objektif dalam <b>Kuiz Penilaian</b> untuk menyimpan skor.", "วิธีอัปเดต: กด <b>ทำเครื่องหมายว่าเรียนแล้ว</b> ท้ายบท และตอบข้อปรนัยใน <b>แบบทดสอบท้ายบท</b> ให้ครบเพื่อบันทึกคะแนน")}</p>
      <div class="kj-padam"><button type="button" class="btn btn-line" id="kj-padam">${B("Padam data kemajuan", "ล้างข้อมูลความก้าวหน้า")}</button></div>
      <dialog class="kj-dialog" id="kj-dialog" aria-labelledby="kj-dt">
        <h2 id="kj-dt">${B("Padam semua data kemajuan?", "ล้างข้อมูลความก้าวหน้าทั้งหมดหรือไม่")}</h2>
        <p>${B("Tanda bab selesai, skor kuiz dan kedudukan terakhir dalam pelayar ini akan dipadam. Tindakan ini tidak boleh dibatalkan.", "เครื่องหมายบทที่เรียนจบ คะแนนแบบทดสอบ และตำแหน่งล่าสุดในเบราว์เซอร์นี้จะถูกลบ และกู้คืนไม่ได้")}</p>
        <div class="btn-row"><button type="button" class="btn btn-line" id="kj-batal">${B("Batal", "ยกเลิก")}</button><button type="button" class="btn btn-solid kj-bahaya" id="kj-ya">${B("Ya, padam", "ยืนยันล้างข้อมูล")}</button></div>
      </dialog>
    </div></section>`;
    labelJadual(app);
    const dlg = $("#kj-dialog");
    $("#kj-padam").onclick = () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); $("#kj-batal").focus(); };
    $("#kj-batal").onclick = () => { dlg.close ? dlg.close() : dlg.removeAttribute("open"); $("#kj-padam").focus(); };
    $("#kj-ya").onclick = () => { resetKemajuan(); dlg.close ? dlg.close() : dlg.removeAttribute("open"); kemajuan(); toast(T("Data kemajuan telah dipadam", "ล้างข้อมูลความก้าวหน้าแล้ว")); };
    window.scrollTo(0, 0);
  }

  /* ================= QUIZ ================= */
  function kuiz(part) {
    setNav("kuiz"); document.title = `Kuiz · แบบทดสอบ | ${C.code}`;
    const sel = part === "morfologi" || part === "sintaksis" ? part : "semua";
    const chs = CH.filter(c => sel === "semua" || c.part === sel);
    const N = sel === "semua" ? 20 : 15;
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h1>${B("Kuiz", "แบบทดสอบ")}</h1><p>${B(`${N} soalan rawak daripada soalan penilaian`, `สุ่ม ${N} ข้อจากคำถามท้ายบท`)}</p></div>
      <div class="quiz-intro" role="group" aria-label="Pilih skop · เลือกขอบเขตข้อสอบ">
        <a class="chip-btn" href="#/kuiz/morfologi" ${sel === "morfologi" ? 'aria-current="page"' : ""}>Morfologi, Bab 1–7 · ภาควจีวิภาค</a>
        <a class="chip-btn" href="#/kuiz/sintaksis" ${sel === "sintaksis" ? 'aria-current="page"' : ""}>Sintaksis, Bab 8–13 · ภาควากยสัมพันธ์</a>
        <a class="chip-btn" href="#/kuiz/semua" ${sel === "semua" ? 'aria-current="page"' : ""}>Semua bab · ทุกบท</a>
      </div>
      <div class="result" id="kz-res" aria-live="polite"></div>
      <div id="kz"><p class="loading">Menyediakan soalan… · กำลังเตรียมข้อสอบ…</p></div>
    </div></section>`;
    window.scrollTo(0, 0);
    Promise.all(chs.map(c => fetchBab(c.no).then(t => {
      const s = splitSections(t).find(x => x.id === "soalan" || x.id === "kuiz"); if (!s) return [];
      const m = s.body.split(/^### /m).find(p => /^[^\n]*ปรนัย/.test(p)); if (!m) return [];
      return parseMCQ(m.slice(m.indexOf("\n") + 1)).map(q => Object.assign(q, { bab: c.no }));
    }))).then(lists => {
      const pool = lists.flat();
      const draw = () => {
        const items = shuffle(pool).slice(0, N);
        $("#kz").innerHTML = mcqHTML(items, "kzex", true) + `<div class="btn-row" style="margin-top:6px"><button class="btn btn-solid" type="button" id="kz-new">Set baharu · สุ่มชุดใหม่</button></div>`;
        $("#kz-res").className = "result";
        enhance($("#kz"));
        $("#kz-new").onclick = () => { draw(); window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); };
      };
      bindMCQ($("#kz"), (ok, all) => {
        const r = $("#kz-res");
        if (ok === null) { r.className = "result"; return; }
        const pc = Math.round(ok / all * 100);
        r.innerHTML = `<b>${ok} / ${all}</b> &nbsp;${pc}% — ${pc >= 80 ? B("Cemerlang, anda sudah bersedia.", "ยอดเยี่ยม พร้อมสอบแล้ว") : pc >= 60 ? B("Baik. Ulang kaji soalan yang salah.", "ดี ทบทวนข้อที่ผิดอีกครั้ง") : B("Baca semula bab berkaitan (klik nombor bab di atas setiap soalan).", "ควรกลับไปอ่านบทที่เกี่ยวข้อง (กดเลขบทเหนือแต่ละข้อ)")}`;
        r.className = "result show"; r.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
      });
      draw();
    }).catch(() => { $("#kz").innerHTML = `<div class="note"><p>Soalan gagal dimuatkan. Sila muat semula halaman. · โหลดข้อสอบไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p></div>`; });
  }

  /* ================= TOOLS ================= */
  const VOW = /[aeiou]/;
  /* Kata dasar satu suku kata: satu vokal sahaja (cat, bom, lap). Kata seperti baik, naik, buat
     mempunyai dua suku kata (ba-ik, na-ik, bu-at) walaupun vokalnya berturutan.
     คำพยางค์เดียวต้องมีสระตัวเดียว ส่วน baik, naik, buat เป็นสองพยางค์ */
  const syll = w => (w.match(/[aeiou]/g) || []).length;
  const isCluster = w => /^[bcdfghjklmnpqrstvwxyz]{2}/.test(w) && !/^(ng|ny|sy|kh)/.test(w);
  /* กฎการหลอมรวมของ meN- / peN- (Tatabahasa Dewan) */
  function nasal(base, pre) { // pre = "me" หรือ "pe"
    const w = base.toLowerCase().trim(); if (!w) return null;
    const EXC = { punya: [pre + "mpunya", "Pengecualian: bunyi p dikekalkan dalam mempunyai · คำยกเว้น: คงเสียง p ใน mempunyai"], kaji: [pre + "ngkaji", "Pengecualian: bunyi k dikekalkan untuk membezakannya daripada mengaji (membaca al-Quran) · คำยกเว้น: คงเสียง k เพื่อแยกจาก mengaji (อ่านอัลกุรอาน)"] };
    if (EXC[w] && !(w === "punya" && pre === "pe")) return { w: EXC[w][0], r: EXC[w][1] }; // peN- + punya → pemunya (biasa)
    if (syll(w) === 1) return { w: pre + "nge" + w, r: `Kata dasar satu suku kata → ${pre}nge- · คำฐานพยางค์เดียว` };
    if (isCluster(w)) {
      const f = w[0];
      const p = "bfvp".includes(f) ? "m" : "cdjztsl".includes(f) ? "n" : "ng";
      return { w: pre + p + w, r: `Kata dasar bermula dengan gugus konsonan (${w.slice(0, 2)}-) → tiada peleburan · คำฐานขึ้นต้นด้วยพยัญชนะควบ → ไม่หลอมเสียง` };
    }
    if (/^(ng|ny)/.test(w) || "lmnrwy".includes(w[0])) return { w: pre + w, r: `${w.slice(0, /^(ng|ny)/.test(w) ? 2 : 1)} → ${pre}-` };
    if ("bfv".includes(w[0])) return { w: pre + "m" + w, r: `${w[0]} → ${pre}m-` };
    if (w[0] === "p") return { w: pre + "m" + w.slice(1), r: `p → ${pre}m-, bunyi p luluh · เสียง p หลอมหายไป` };
    if (/^sy/.test(w) || "cdjz".includes(w[0])) return { w: pre + "n" + w, r: `${/^sy/.test(w) ? "sy" : w[0]} → ${pre}n-` };
    if (w[0] === "t") return { w: pre + "n" + w.slice(1), r: `t → ${pre}n-, bunyi t luluh · เสียง t หลอมหายไป` };
    if (VOW.test(w[0]) || /^kh/.test(w) || "gh".includes(w[0])) return { w: pre + "ng" + w, r: `${VOW.test(w[0]) ? "vokal · สระ" : /^kh/.test(w) ? "kh" : w[0]} → ${pre}ng-` };
    if (w[0] === "k") return { w: pre + "ng" + w.slice(1), r: `k → ${pre}ng-, bunyi k luluh · เสียง k หลอมหายไป` };
    if (w[0] === "s") return { w: pre + "ny" + w.slice(1), r: `s → ${pre}ny-, bunyi s luluh · เสียง s หลอมหายไป` };
    return { w: pre + w, r: "" };
  }
  function berTer(base, pre) { // pre = "ber" หรือ "ter"
    const w = base.toLowerCase().trim();
    if (pre === "ber" && w === "ajar") return { w: "belajar", r: "Pengecualian: ber- + ajar → bel- · คำยกเว้น" };
    if (w[0] === "r") return { w: pre.slice(0, 2) + w, r: `Kata dasar bermula dengan r → ${pre.slice(0, 2)}- · คำฐานขึ้นต้นด้วย r` };
    if (pre === "ber" && /^[^aeiou]?er[^aeiou]/.test(w)) return { w: "be" + w, r: "Suku kata pertama berakhir dengan -er → be- · พยางค์แรกลงท้ายด้วย -er" };
    return { w: pre + w, r: "" };
  }
  const PRON12 = ["saya", "aku", "kami", "kita", "engkau", "kau", "kamu", "awak", "anda"];
  function alat() {
    setNav("alat"); document.title = `Alat Latihan · เครื่องมือฝึก | ${C.code}`;
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h1>${B("Alat Latihan", "เครื่องมือฝึก")}</h1><p>${B("Digunakan bersama Bab 6–7 dan Bab 13", "ใช้คู่กับบทที่ 6–7 และบทที่ 13")}</p></div>

      <div class="tool" id="t-imb">
        <h2 class="tool-h">${B("Pengimbuhan kata dasar", "เติมปัจจัยให้คำฐาน")}</h2>
        <p class="lead"><span class="bm" lang="ms">Taipkan kata dasar. Imbuhan ditambah mengikut peraturan peleburan bunyi dalam <i>Tatabahasa Dewan</i>, beserta sebabnya. Ulang kaji <a class="on-band" style="color:var(--langit)" href="#/bab/6">Bab 6</a>.</span><span class="tr">พิมพ์คำฐาน ระบบจะเติมปัจจัยตามกฎการหลอมเสียงใน <i>Tatabahasa Dewan</i> พร้อมบอกเหตุผล ใช้ทบทวนบทที่ 6</span></p>
        <div class="tool-row"><input class="tinput" type="text" id="imb-in" value="tulis" lang="ms" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Kata dasar · คำฐาน"></div>
        <div class="chips-row" aria-label="Contoh kata dasar · ตัวอย่างคำฐาน">${["baca", "pukul", "tulis", "kira", "sapu", "ambil", "cat", "lawat", "cari", "proses", "kerja", "ajar", "rasa", "bersih"].map(x => `<button type="button" data-w="${x}">${x}</button>`).join("")}</div>
        <div class="tbl-wrap" style="max-width:none;margin:0"><table class="imb"><thead><tr><th>${B("Imbuhan", "ปัจจัย")}</th><th>${B("Kata terbitan", "คำที่ได้")}</th><th>${B("Sebab / makna utama", "เหตุผล / ความหมายหลัก")}</th><th><span class="sr-only">Dengar · ฟัง</span></th></tr></thead><tbody id="imb-out"></tbody></table></div>
        <p class="tool-alt" style="margin-top:10px"><span class="bm" lang="ms">Alat ini menggunakan peraturan umum. Sesetengah kata mempunyai bentuk khusus atau tidak menerima imbuhan tertentu; sentiasa semak dengan <i>Kamus Dewan</i> atau PRPM.</span><span class="tr">ระบบใช้กฎทั่วไป คำบางคำมีรูปเฉพาะหรือไม่รับปัจจัยบางตัว ควรตรวจกับ <i>Kamus Dewan</i> หรือ PRPM เสมอ</span></p>
      </div>

      <div class="tool" id="t-pas">
        <h2 class="tool-h">${B("Ayat aktif → ayat pasif", "แปลงประโยคกรรตุวาจกเป็นกรรมวาจก")}</h2>
        <p class="lead"><span class="bm" lang="ms">Isikan unsur ayat. Ayat aktif dan ayat pasif dibina mengikut diri pelaku. Ulang kaji <a class="on-band" style="color:var(--langit)" href="#/bab/13">Bab 13</a>.</span><span class="tr">กรอกส่วนประกอบของประโยค ระบบจะสร้างประโยคกรรตุวาจกและกรรมวาจกที่ถูกต้องตามบุรุษของผู้กระทำ ใช้ทบทวนบทที่ 13</span></p>
        <div class="tool-grid">
          <label>Pelaku (subjek) · ผู้กระทำ<input class="tinput" id="p-s" value="Menteri" lang="ms" autocomplete="off"></label>
          <label>Kata bantu · คำช่วย<input class="tinput" id="p-b" value="akan" lang="ms" autocomplete="off" placeholder="boleh dikosongkan · เว้นว่างได้"></label>
          <label>Kata dasar kata kerja · คำฐานของกริยา<input class="tinput" id="p-v" value="rasmi" lang="ms" autocomplete="off"></label>
          <label>Akhiran · ปัจจัยท้าย<select id="p-x"><option value="">(tiada · ไม่มี)</option><option value="kan" selected>-kan</option><option value="i">-i</option></select></label>
          <label>Objek · กรรม<input class="tinput" id="p-o" value="bangunan itu" lang="ms" autocomplete="off"></label>
        </div>
        <div class="chips-row"><button type="button" data-ex="Menteri|akan|rasmi|kan|bangunan itu">Menteri</button><button type="button" data-ex="Saya|masih|hormat|i|lelaki itu">saya</button><button type="button" data-ex="Kami|sudah|jemput||tetamu itu">kami</button><button type="button" data-ex="Polis|sedang|siasat||kes itu">Polis</button><button type="button" data-ex="Engkau|mesti|bersih|kan|bilik ini">engkau</button></div>
        <div class="pas" id="pas-out"></div>
      </div>
    </div></section>`;
    // เติมปัจจัย
    const inp = $("#imb-in"), out = $("#imb-out");
    const row = (af, res, mean) => res ? `<tr><td>${af}</td><td class="w" lang="ms">${esc(res.w)}</td><td class="r">${res.r ? esc(res.r) + "<br>" : ""}${mean}</td><td>${sayBtn(res.w)}</td></tr>` : "";
    const run = () => {
      const w = inp.value.trim().toLowerCase().replace(/[^a-z]/g, "");
      if (!w) { out.innerHTML = `<tr><td colspan="4" class="r">Taipkan kata dasar dalam tulisan Rumi, contohnya baca · พิมพ์คำฐานเป็นอักษรรูมี เช่น baca</td></tr>`; return; }
      const me = nasal(w, "me"), pe = nasal(w, "pe");
      out.innerHTML = row("meN-", me, B("kata kerja aktif", "กริยากรรตุวาจก")) + row("di-", { w: "di" + w, r: "" }, B("kata kerja pasif (pelaku diri ketiga)", "กริยากรรมวาจก (ผู้กระทำบุรุษที่ 3)")) +
        row("peN-", pe, B("kata nama: pelaku / alat", "นาม: ผู้กระทำ / เครื่องมือ")) + row("peN-…-an", { w: pe.w + "an", r: "" }, B("kata nama: proses", "นาม: กระบวนการ")) +
        row("ber-", berTer(w, "ber"), B("kata kerja: mempunyai / memakai / melakukan", "กริยา: มี / สวม / กระทำ")) + row("ter-", berTer(w, "ter"), B("tidak sengaja / keadaan / paling", "ไม่ได้ตั้งใจ / อยู่ในสภาพ / ที่สุด"));
    };
    inp.addEventListener("input", run); $$("#t-imb [data-w]").forEach(b => b.onclick = () => { inp.value = b.dataset.w; run(); });
    run();
    // aktif → pasif
    const pf = ["p-s", "p-b", "p-v", "p-x", "p-o"].map(id => $("#" + id));
    const runP = () => {
      const [s, b, v, x, o] = pf.map(f => f.value.trim());
      const po = $("#pas-out");
      if (!s || !v || !o) { po.innerHTML = `<div><small>Isikan pelaku, kata dasar kata kerja dan objek · กรอกผู้กระทำ คำฐานของกริยา และกรรม</small></div>`; return; }
      const vb = v.toLowerCase() + x, bb = b ? b.toLowerCase() + " " : "";
      const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
      const act = `${cap(s)} ${bb}${nasal(v, "me").w}${x} ${o}.`;
      const p12 = PRON12.includes(s.toLowerCase());
      const agent = /^(dia|ia|mereka|beliau)$/i.test(s) ? s.toLowerCase() : s;
      const pas = p12 ? `${cap(o)} ${bb}${s.toLowerCase()} ${vb}.` : `${cap(o)} ${bb}di${vb} oleh ${agent}.`;
      const why = p12 ? B("Pelaku ialah kata ganti nama diri pertama atau kedua: objek dikedepankan, meN- digugurkan, kata ganti nama diletakkan terus di hadapan kata kerja dan kata bantu di hadapan kata ganti nama (bukan di- … oleh saya).", "ผู้กระทำเป็นสรรพนามบุรุษที่ 1–2: ย้ายกรรมไปต้นประโยค ตัด meN- วางสรรพนามหน้ากริยาทันที และคำช่วยอยู่หน้าสรรพนาม (ห้ามใช้ di- … oleh saya)") : B("Pelaku ialah diri ketiga atau kata nama: subjek dan objek ditukar tempat, meN- ditukar kepada di-, dan oleh diletakkan di hadapan pelaku.", "ผู้กระทำเป็นบุรุษที่ 3 หรือนาม: สลับประธานกับกรรม เปลี่ยน meN- เป็น di- และเติม oleh หน้าผู้กระทำ");
      po.innerHTML = `<div><small>Ayat aktif · กรรตุวาจก</small><p lang="ms">${esc(act)} ${sayBtn(act)}</p></div><div><small>Ayat pasif · กรรมวาจก</small><p lang="ms">${esc(pas)} ${sayBtn(pas)}</p></div><div><small>Peraturan · กฎที่ใช้</small><span style="color:var(--band-soft);display:block">${why}</span></div>`;
    };
    pf.forEach(f => f.addEventListener("input", runP));
    $$("#t-pas [data-ex]").forEach(btn => btn.onclick = () => { btn.dataset.ex.split("|").forEach((v, i) => { pf[i].value = v; }); runP(); });
    runP();
    window.scrollTo(0, 0);
  }

  /* ================= GLOSSARY ================= */
  function istilah() {
    setNav("istilah"); document.title = `Istilah Tatabahasa · อภิธานศัพท์ | ${C.code}`;
    const all = window.ISTILAH.map(([m, t, d, n]) => ({ m, t, d, n }));
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h1>${B("Istilah Tatabahasa", "อภิธานศัพท์ไวยากรณ์")}</h1><p>${B(`${all.length} istilah`, `${all.length} คำ`)}</p></div>
      <div class="gl-tools"><label class="sr-only" for="gq">Cari istilah · ค้นหาศัพท์</label><input id="gq" type="search" placeholder="Cari, contohnya frasa · ค้นหา เช่น วลี" autocomplete="off">
      <label class="sr-only" for="gb">Pilih bab · เลือกบท</label><select id="gb"><option value="">Semua bab · ทุกบท</option>${CH.map(c => `<option value="${c.no}">Bab ${c.no} ${c.ms}</option>`).join("")}</select></div>
      <p class="gl-count" aria-live="polite"></p>
      <div class="tbl-wrap" style="max-width:none"><table><thead><tr><th>${B("Bahasa Melayu", "ภาษามลายู")}</th><th>${B("Bahasa Thai", "ภาษาไทย")}</th><th>${B("Huraian", "คำอธิบาย")}</th><th>${B("Bab", "บท")}</th><th><span class="sr-only">Dengar · ฟัง</span></th></tr></thead><tbody id="gl"></tbody></table></div>
    </div></section>`;
    const q = $("#gq"), b = $("#gb"), tb = $("#gl"), cnt = $(".gl-count");
    const run = () => {
      const s = q.value.trim().toLowerCase(), bb = b.value;
      const rows = all.filter(x => (!bb || x.n === +bb) && (!s || (x.m + " " + x.t + " " + x.d).toLowerCase().includes(s)));
      cnt.textContent = rows.length ? `${rows.length} istilah ditemui · พบ ${rows.length} คำ` : "Tiada padanan. Cuba kata yang lebih pendek atau pilih “Semua bab”. · ไม่พบศัพท์ที่ค้นหา ลองพิมพ์ให้สั้นลงหรือเลือก “ทุกบท”";
      tb.innerHTML = rows.map(x => `<tr><td class="ms" lang="ms">${esc(x.m)}</td><td>${esc(x.t)}</td><td style="color:var(--muted);font-size:15px">${esc(x.d)}</td><td class="gl-bab"><a href="${babLink(x.n)}">Bab ${x.n}</a></td><td class="say-cell">${sayBtn(x.m.replace(/\s*\(.*\)/, ""))}</td></tr>`).join("");
    };
    q.addEventListener("input", run); b.addEventListener("change", run); run();
    window.scrollTo(0, 0);
  }

  /* ================= COURSE INFO ================= */
  function kursus() {
    setNav("kursus"); document.title = `Maklumat Kursus · ข้อมูลรายวิชา | ${C.code}`;
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h1>${B(`${C.code} ${C.ms}`, C.th)}</h1><p>${B(`${C.termMs} · ${C.credits} kredit`, `${C.term} · ${C.credits} หน่วยกิต`)}</p></div>
      <div class="info-grid">
        <div class="prose">
          <h2 class="h3">${B("Sinopsis kursus", "คำอธิบายรายวิชา")}</h2><p class="bm" lang="ms">${C.descMs}</p><p class="tr">${C.descTh}</p><p lang="en" style="color:var(--muted)">${C.descEn}</p>
          <h2 class="h3">${B("Matlamat", "จุดมุ่งหมาย")}</h2><p class="bm" lang="ms">${C.goalMs}</p><p class="tr">${C.goal}</p>
          <h2 class="h3">${B("Hasil pembelajaran kursus (CLO) dan wajaran", "ผลลัพธ์การเรียนรู้ (CLOs) และสัดส่วนคะแนน")}</h2>
          <ul class="clo">${C.clos.map(c => `<li><b>${c.id}</b><div>${B(c.ms, c.text)}<div class="bar" role="img" aria-label="${c.weight}%"><span style="width:${c.weight}%"></span></div><small style="color:var(--muted)">${c.weight}% · ${c.howMs} · ${c.how}</small></div></li>`).join("")}</ul>
          <p><a class="btn btn-line" href="#/clo">${B("Lihat pemetaan CLO → bab → aktiviti → alat penilaian", "ดูตารางเชื่อมโยง CLO → บทเรียน → กิจกรรม → เครื่องมือประเมิน")}</a></p>
        </div>
        <div class="prose">
          <h2 class="h3">${B("Pensyarah", "ผู้สอน")}</h2><ul class="people">${C.teachers.map(t => `<li>${t.name}<small>${t.roleMs} · ${t.role}${t.email ? ` · <a href="mailto:${t.email}">${t.email}</a>` : ""}</small></li>`).join("")}</ul>
          <h2 class="h3">${B("Waktu konsultasi", "เวลาให้คำปรึกษา")}</h2><p class="bm" lang="ms">${C.officeMs}</p><p class="tr">${C.office}</p>
          <h2 class="h3">${B("Kumpulan kuliah", "กลุ่มเรียน")}</h2>${table([B("Kumpulan", "กลุ่ม"), B("Hari dan masa", "วันและเวลา"), B("Bilik", "ห้อง")], C.groups.map(g => [g[0], B(g[3] || g[1], g[1]), g[2]]))}
          <h2 class="h3">${B("Skala gred", "เกณฑ์การตัดสินผล (อิงเกณฑ์)")}</h2>${table([B("Gred", "ระดับ"), B("Markah (%)", "คะแนน (%)"), B("Maksud", "ความหมาย")], C.grades.map(g => [g[0], g[1], B(g[3] || g[2], g[2])]))}
        </div>
      </div>
      <div class="info-grid" style="margin-top:20px">
        <div class="prose"><h2 class="h3">${B("Buku teks dan bacaan", "ตำราและเอกสารแนะนำ")}</h2><ul>${C.books.map(b => `<li>${b}</li>`).join("")}</ul></div>
        <div class="prose"><h2 class="h3">${B("Sumber dalam talian", "แหล่งเรียนรู้ออนไลน์")}</h2><ul>${C.resources.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener">${r.th}</a></li>`).join("")}</ul></div>
      </div>
    </div></section>`;
    window.scrollTo(0, 0);
  }

  /* ================= Pemetaan CLO · การเชื่อมโยง CLO ================= */
  function pemetaanClo() {
    setNav("kursus"); document.title = `Pemetaan CLO · การเชื่อมโยง CLO | ${C.code}`;
    const M = C.mko3, ids = C.clos.map(c => c.id);
    const tag = (k) => k === "rasmi" ? `<span class="sumber-tag rasmi">${B("Rasmi · มคอ.3", "ทางการ")}</span>`
      : k === "pelan" ? `<span class="sumber-tag pelan">${B("Pelan mingguan", "แผนรายสัปดาห์")}</span>`
      : `<span class="sumber-tag cadang">${B("Cadangan laman web", "ข้อเสนอของเว็บไซต์")}</span>`;
    const babL = n => { const c = CH.find(x => x.no === n); return c ? `<a href="#/bab/${n}" aria-label="Bab ${n} · บทที่ ${n}">${n}</a>` : ""; };
    const babUntuk = id => "Bab " + M.pelan.filter(r => r.bab && r.clos.includes(id)).map(r => babL(r.bab)).join(", ");
    const babWeb = id => M.pelan.filter(r => r.bab && r.web.includes(id)).map(r => babL(r.bab)).join(", ");
    const kelasUntuk = id => M.pelan.filter(r => r.clos.includes(id)).map(r => `<li>${B(`Minggu ${r.week}: ${r.ms}`, `สัปดาห์ ${r.week}: ${r.th}`)}</li>`).join("");
    const sel = (r, id) => r.clos.includes(id) ? `<span class="m-pelan" aria-hidden="true" title="Pelan mingguan · แผนรายสัปดาห์">●</span><span class="sr-only">Pelan mingguan</span>`
      : r.web.includes(id) ? `<span class="m-web" aria-hidden="true" title="Tambahan laman web · เว็บติดป้ายเพิ่ม">○</span><span class="sr-only">Tambahan laman web</span>` : `<span aria-hidden="true">·</span><span class="sr-only">Tiada</span>`;
    const cloRingkas = c => `<b>${c.id}</b>`;
    app.innerHTML = `<section class="section clo-page"><div class="wrap">
      <div class="section-head"><h1>${B("Pemetaan CLO → bab → aktiviti → alat penilaian", "ตารางเชื่อมโยง CLO → บทเรียน → กิจกรรม → เครื่องมือประเมิน")}</h1>
        <p>${B(`${C.code} ${C.ms} · ${C.termMs}`, `${C.code} ${C.th} · ${C.term}`)}</p></div>
      <div class="nota-sumber prose">
        <h2 class="h3">${B("Sumber dan status maklumat", "ที่มาและสถานะของข้อมูล")}</h2>
        <ul class="sumber-senarai">
          <li>${tag("rasmi")} ${B(`Pernyataan CLO, kaedah pengajaran, alat pengukuran dan wajaran dipetik daripada ${M.sumberMs}. Teks Melayu ialah terjemahan; teks Thai mengikut dokumen asal.`, `ข้อความ CLO วิธีสอน เครื่องมือวัด และสัดส่วนคะแนน คัดจาก${M.sumberTh} ข้อความภาษามลายูเป็นคำแปล ข้อความภาษาไทยเป็นไปตามต้นฉบับ`)}</li>
          <li>${tag("pelan")} ${B(`CLO setiap minggu dan cara penilaian dalam kelas dipetik daripada ${M.pelanMs}.`, `CLO รายสัปดาห์และการวัดผลในชั้นเรียน คัดจาก${M.pelanTh}`)}</li>
          <li>${tag("cadang")} ${B("Kaitan aktiviti dalam laman web ini dengan CLO ialah cadangan penyusun laman web untuk latihan kendiri, bukan sebahagian daripada dokumen rasmi dan tidak dikira dalam markah.", "การโยงกิจกรรมบนเว็บไซต์นี้กับ CLO เป็นข้อเสนอของผู้จัดทำเว็บไซต์เพื่อการฝึกด้วยตนเอง ไม่ใช่ส่วนหนึ่งของเอกสารทางการ และไม่นำไปคิดคะแนน")}</li>
        </ul>
      </div>

      <h2 class="h3 clo-h">${B("1. CLO, kaedah dan alat penilaian rasmi", "1. CLO วิธีสอน และเครื่องมือประเมินตาม มคอ.3")} ${tag("rasmi")}</h2>
      ${table([B("CLO", "CLO"), B("Kaedah pengajaran", "วิธีสอน"), B("Alat pengukuran", "เครื่องมือวัด"), B("Penilaian sumatif", "การประเมินสรุป"), B("Wajaran", "สัดส่วน")],
        C.clos.map(c => { const r = M.rasmi[c.id]; return [`${cloRingkas(c)}<div class="clo-teks">${B(c.ms, c.text)}</div>`, B(r.ajarMs, r.ajarTh), B(r.alatMs, r.alatTh), B(c.howMs, c.how), `<b>${c.weight}%</b>`]; }))}

      <h2 class="h3 clo-h">${B("2. Pemetaan CLO → bab → aktiviti → alat penilaian", "2. ตารางเชื่อมโยง CLO → บทเรียน → กิจกรรม → เครื่องมือประเมิน")}</h2>
      <p class="clo-ket">${B("Lajur bab: senarai pertama mengikut pelan mingguan; “+ laman web” ialah bab yang turut ditanda dengan CLO itu dalam laman web.", "คอลัมน์บทเรียน: รายการแรกตามแผนรายสัปดาห์ ส่วน “+ เว็บไซต์” คือบทที่เว็บไซต์ติดป้าย CLO นั้นเพิ่ม")}</p>
      ${table([B("CLO", "CLO"), `${B("Bab", "บทเรียน")}`, `${B("Aktiviti kelas", "กิจกรรม/การวัดผลในชั้น")} ${tag("pelan")}`, `${B("Aktiviti laman web", "กิจกรรมบนเว็บไซต์")} ${tag("cadang")}`, `${B("Alat penilaian rasmi", "เครื่องมือประเมินทางการ")} ${tag("rasmi")}`],
        C.clos.map(c => { const r = M.rasmi[c.id], w = babWeb(c.id);
          return [`${cloRingkas(c)}<div class="clo-teks">${B(c.ms, c.text)}</div>`,
            `<span class="nw-bab">${babUntuk(c.id)}</span>${w ? `<div class="clo-web"><span lang="ms">+ laman web</span> · เว็บไซต์: ${w}</div>` : ""}`,
            `<ul class="clo-ul">${kelasUntuk(c.id)}</ul>`,
            `<ul class="clo-ul">${M.aktiviti[c.id].map(a => `<li><a href="${a.h}">${B(a.ms, a.th)}</a></li>`).join("")}</ul>`,
            `${B(r.alatMs, r.alatTh)}<div class="clo-sum">${B(`${c.howMs} · ${c.weight}%`, `${c.how} · ${c.weight}%`)}</div>`]; }))}

      <h2 class="h3 clo-h">${B("3. Matriks minggu × CLO", "3. เมทริกซ์สัปดาห์ × CLO")}</h2>
      <p class="clo-ket"><span class="m-pelan" aria-hidden="true">●</span> <span lang="ms">pelan mingguan</span> · ตามแผนรายสัปดาห์ &nbsp;&nbsp; <span class="m-web" aria-hidden="true">○</span> <span lang="ms">tanda tambahan laman web sahaja</span> · เว็บไซต์ติดป้ายเพิ่มเท่านั้น</p>
      ${table([B("Minggu", "สัปดาห์"), B("Bab", "บทเรียน"), ...ids, B("Penilaian dalam kelas", "การวัดผลในชั้น")],
        M.pelan.map(r => { const c = r.bab ? CH.find(x => x.no === r.bab) : null;
          const ex = !c && C.extraWeeks ? C.extraWeeks.find(x => x.week === r.week) : null;
          return [String(r.week), c ? `<a href="#/bab/${c.no}">${B(`Bab ${c.no}: ${c.ms}`, c.th)}</a>` : ex ? B(ex.ms, ex.th) : "—", ...ids.map(id => `<span class="m-sel">${sel(r, id)}</span>`), B(r.ms, r.th)]; }))}

      <h2 class="h3 clo-h">${B("4. Jurang dan perkara untuk disemak", "4. ช่องว่างและประเด็นที่ควรตรวจสอบ")}</h2>
      <ol class="clo-jurang prose">
        <li>${B("Peperiksaan pertengahan: มคอ.3 mengaitkannya dengan CLO1 (30%), tetapi pelan mingguan memberikan 60 daripada 100 markah kepada bahagian CLO2. Perlu ditentukan bagaimana markah bahagian CLO2 dikira (dalam 30% CLO1 atau dalam 20% CLO2).", "สอบกลางภาค: มคอ.3 ผูกกับ CLO1 (30%) แต่แผนรายสัปดาห์ให้ส่วนที่วัด CLO2 60 จาก 100 คะแนน ควรกำหนดว่าคะแนนส่วน CLO2 จะนับใน 30% ของ CLO1 หรือใน 20% ของ CLO2")}</li>
        <li>${B("CLO4: penilaian sumatif rasmi hanya peperiksaan akhir (30%), sedangkan alat pengukuran dan pelan mingguan juga menggunakan hasil penulisan/pembetulan teks dan pembentangan berubrik (minggu 14–15). Wajaran bagi tugasan berubrik ini belum dinyatakan.", "CLO4: การประเมินสรุปทางการมีเฉพาะสอบปลายภาค (30%) แต่เครื่องมือวัดและแผนรายสัปดาห์ใช้ชิ้นงานเขียน/ปรับแก้ข้อความและการนำเสนอที่ใช้รูบริก (สัปดาห์ 14–15) ด้วย ยังไม่ได้ระบุว่าชิ้นงานเหล่านี้นับคะแนนส่วนใด")}</li>
        <li>${B("CLO3: penilaian sumatif ialah tugasan dan aktiviti amali dengan rubrik (20%), tetapi rubrik CLO3 belum terdapat dalam dokumen yang disemak; penilaian minggu 9–13 terdiri daripada lembaran kerja dan kuiz.", "CLO3: การประเมินสรุปคืองานมอบหมายและกิจกรรมปฏิบัติพร้อมรูบริก (20%) แต่ยังไม่พบรูบริกของ CLO3 ในเอกสารที่ตรวจ การวัดผลสัปดาห์ 9–13 เป็นใบงานและแบบทดสอบย่อย")}</li>
        <li>${B("Tanda CLO dalam laman web lebih luas daripada pelan mingguan bagi Bab 1, 3, 4, 5, 9, 10 dan 11 (lihat ○ dalam matriks). Pensyarah boleh memilih sama ada mengekalkan tanda tambahan ini atau menyelaraskannya dengan pelan mingguan.", "ป้าย CLO บนเว็บไซต์กว้างกว่าแผนรายสัปดาห์ในบทที่ 1, 3, 4, 5, 9, 10 และ 11 (ดู ○ ในเมทริกซ์) ผู้สอนเลือกได้ว่าจะคงป้ายเพิ่มไว้ หรือปรับให้ตรงกับแผนรายสัปดาห์")}</li>
        <li>${B("Markah dalam laman web disimpan dalam pelayar pelajar sahaja dan tidak dihantar kepada pensyarah, jadi ia tidak boleh menjadi bukti pencapaian CLO yang rasmi; gunakannya sebagai penilaian formatif.", "คะแนนบนเว็บไซต์บันทึกในเบราว์เซอร์ของนิสิตเท่านั้นและไม่ได้ส่งถึงอาจารย์ จึงใช้เป็นหลักฐานการบรรลุ CLO ทางการไม่ได้ ใช้เป็นการประเมินระหว่างเรียนเท่านั้น")}</li>
        <li>${B("Ujian pra dan pasca (minggu 1 dan 15) tidak terdapat dalam laman web. Pemetaan CLO → PLO dalam lampiran มคอ.3 tidak dimasukkan kerana tanda dalam jadual tersebut tidak dapat dibaca dengan pasti daripada fail.", "แบบทดสอบก่อนและหลังเรียน (สัปดาห์ 1 และ 15) ไม่มีบนเว็บไซต์ และไม่ได้ใส่การเชื่อมโยง CLO → PLO ในภาคผนวกของ มคอ.3 เพราะอ่านเครื่องหมายในตารางจากไฟล์ได้ไม่ชัดเจน")}</li>
      </ol>
      <p class="clo-ket"><a href="#/kursus">← <span lang="ms">Kembali ke Maklumat Kursus</span> · กลับไปหน้าข้อมูลรายวิชา</a></p>
    </div></section>`;
    labelJadual(app);
    /* Matriks kekal sebagai jadual (boleh skrol) di telefon · เมทริกซ์คงเป็นตาราง เลื่อนแนวนอนได้บนมือถือ */
    const mt = $$("table", app)[2]; if (mt) { mt.classList.remove("tbl-kad"); mt.classList.add("clo-matriks"); const wr = mt.parentElement; wr.tabIndex = 0; wr.setAttribute("role", "region"); wr.setAttribute("aria-label", "Matriks minggu × CLO · เมทริกซ์สัปดาห์ × CLO"); }
    window.scrollTo(0, 0);
  }

  /* ================= ปกใน และ สารบัญ ================= */
  const ruleSVG = '<svg class="rule" viewBox="0 0 120 12" aria-hidden="true"><path class="ln" d="M0 6H48M72 6H120" stroke-width="1"/><path class="dm" d="M60 0 66 6 60 12 54 6Z"/></svg>';
  const nw = t => String(t).split(" ").map(w => `<span class="nw">${w}</span>`).join(" ");
  function kulitDalam() {
    setNav(""); document.title = `Kulit Dalam · ปกใน | ${C.code}`;
    app.innerHTML = `<section class="sheet-wrap"><article class="sheet" aria-label="Kulit dalam · ปกใน">
      <div class="sheet-inner">
        <img class="emblem" src="assets/img/logo-fakulti-400.png" srcset="assets/img/logo-fakulti-400.png 400w, assets/img/logo-fakulti.png 800w" sizes="260px" width="400" height="111" alt="Fakulti Kemanusiaan dan Sains Sosial, Universiti Thaksin · คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยทักษิณ">
        <p class="doc">${C.docTypeMs}<br>${C.docType}</p>
        <p class="code">Kursus ${C.code} · รายวิชา ${C.code}</p>
        <h1 class="t-th">${nw(C.th)}</h1>
        <p class="t-en" lang="en">${C.en}</p>
        <p class="t-ms" lang="ms">${C.ms}</p>
        ${ruleSVG}
        <p class="by">Disusun oleh · เรียบเรียงโดย</p>
        <p class="author" lang="ms">${nw(C.authorMs)}</p><p class="author">${nw(C.author)}</p>
        <p class="degree">${C.authorDegree}</p>
        <div class="org"><span lang="ms">${C.facultyMs}<br><b>${C.universityMs}</b><br>${C.termMs}</span><br><br>${C.faculty}<br><b>${C.university}</b><br>${C.term}</div>
      </div>
    </article>
    <div class="sheet-actions"><a class="btn btn-solid" href="#/kandungan">Ke Kandungan · ไปที่สารบัญ</a><button type="button" class="btn btn-line" data-opencover>Kulit hadapan · ดูปกนอก</button></div></section>`;
    window.scrollTo(0, 0);
  }
  function kandungan() {
    setNav("kandungan"); document.title = `Kandungan · สารบัญ | ${C.code}`;
    const row = (no, title, pg, href) => `<a class="toc-row" href="${href}"><span class="toc-no">${no}</span><span class="toc-title">${title}</span><span class="toc-dots" aria-hidden="true"></span><span class="toc-pg">${pg}</span></a>`;
    const part = p => `<div class="toc-part"><h2>${partName(p)}</h2><ol class="toc-list">${CH.filter(c => c.part === p).map(c => {
      const d = isDone(c.no);
      return `<li>${row("Bab " + c.no, `<span class="ms" lang="ms">${c.ms}</span><span class="th">${c.th}</span>`, `<span class="${d ? "toc-pg done" : ""}">${d ? "✓ " : ""}Minggu ${c.week}${getSkor(c.no) ? ` · Kuiz ${getSkor(c.no).best}/${getSkor(c.no).all}` : ""}</span>`, babLink(c.no))}
        <details class="toc-subd"><summary><span lang="ms">${secIds(c).length} bahagian</span> · ${secIds(c).length} หัวข้อ</summary>
        <ol class="toc-subs" aria-label="Bahagian Bab ${c.no} · หัวข้อในบทที่ ${c.no}">${secIds(c).map(id => { const d = SEC_DEF.find(x => x[0] === id); return `<li><a href="${babLink(c.no)}/${id}"><span class="sb-t"><span lang="ms">${d[2]}</span><small>${d[3]}</small></span></a></li>`; }).join("")}</ol></details></li>`;
    }).join("")}</ol></div>`;
    app.innerHTML = `<section class="section"><div class="wrap toc-page">
      <header class="toc-head"><h1 lang="ms">Kandungan</h1><p>สารบัญ</p>${sambungHref() ? `<p class="toc-sambung"><a class="btn btn-solid btn-dw" href="${sambungHref()}">${B("Sambung Belajar · Bab " + load().akhir.n, "เรียนต่อ บทที่ " + load().akhir.n)}</a></p>` : ""}</header>
      <div class="toc-part"><h2>${B("Bahagian Awal", "ส่วนนำ")}</h2><ul class="toc-list">
        <li><button type="button" class="toc-row" data-opencover><span class="toc-no"></span><span class="toc-title"><span class="ms" lang="ms">Kulit Hadapan</span><span class="th">ปกนอก</span></span><span class="toc-dots" aria-hidden="true"></span><span class="toc-pg">Kulit · ปก</span></button></li>
        <li>${row("", '<span class="ms" lang="ms">Kulit Dalam</span><span class="th">ปกใน</span>', "Penyusun", "#/kulit-dalam")}</li>
        <li>${row("", '<span class="ms" lang="ms">Maklumat Kursus</span><span class="th">ข้อมูลรายวิชา</span>', "CLO · Penilaian", "#/kursus")}</li>
        <li>${row("", '<span class="ms" lang="ms">Rancangan Pembelajaran 15 Minggu</span><span class="th">แผนการเรียน 15 สัปดาห์</span>', "Laman utama", "#/")}</li>
      </ul></div>
      ${part("morfologi")}${part("sintaksis")}
      <div class="toc-part"><h2>${B("Lampiran", "ภาคผนวก")}</h2><ul class="toc-list">
        <li>${row("", '<span class="ms" lang="ms">Kemajuan Saya</span><span class="th">ความก้าวหน้าของฉัน</span>', `${CH.filter(x => isDone(x.no)).length}/${CH.length} bab`, "#/kemajuan")}</li>
        <li>${row("", '<span class="ms" lang="ms">Kuiz Keseluruhan</span><span class="th">แบบทดสอบรวม</span>', "Semua bab", "#/kuiz")}</li>
        <li>${row("", '<span class="ms" lang="ms">Alat Latihan: Pengimbuhan · Ayat Pasif</span><span class="th">เครื่องมือฝึก: เติมปัจจัย · แปลงกรรมวาจก</span>', "Bab 6, 13", "#/alat")}</li>
        <li>${row("", '<span class="ms" lang="ms">Istilah Tatabahasa</span><span class="th">อภิธานศัพท์ไวยากรณ์</span>', window.ISTILAH.length + " istilah", "#/istilah")}</li>
        <li>${row("", '<span class="ms" lang="ms">Buku Teks dan Sumber</span><span class="th">ตำราและแหล่งเรียนรู้</span>', "Maklumat kursus", "#/kursus")}</li>
      </ul></div>
    </div></section>`;
    window.scrollTo(0, 0);
  }

  function notFound() { app.innerHTML = `<section class="section"><div class="wrap"><h2>${B("Halaman tidak ditemui", "ไม่พบหน้านี้")}</h2><p class="bm" lang="ms">Pautan mungkin salah taip. Kembali ke <a href="#/">rancangan pembelajaran</a> untuk memilih bab.</p><p class="tr">ลิงก์อาจพิมพ์ผิด กลับไปที่<a href="#/">แผนการเรียน</a>เพื่อเลือกบทเรียน</p></div></section>`; }

  /* ---------- ปุ่มนำทางด้านล่าง (ทุกหน้า) ---------- */
  const ICON = {
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    prev: '<path d="M15 5 8 12l7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6"/>',
    top: '<path d="M12 19V6"/><path d="M6 11l6-6 6 6"/>'
  };
  const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  /* Kulit dalam tidak dimasukkan dalam urutan Sebelum/Seterusnya; ia masih boleh dibuka dari kulit hadapan dan Kandungan
     ปกในไม่อยู่ในลำดับปุ่มก่อนหน้า/ถัดไป แต่ยังเปิดได้จากปกนอกและสารบัญ */
  const SEQ = [{ key: "kandungan", href: "#/kandungan", ms: "Kandungan", th: "สารบัญ" }, { key: "home", href: "#/", ms: "Rancangan", th: "แผนการเรียน" }]
    .concat(CH.map(c => ({ key: "bab" + c.no, href: babLink(c.no), ms: "Bab " + c.no, th: "บทที่ " + c.no })))
    .concat([{ key: "kemajuan", href: "#/kemajuan", ms: "Kemajuan", th: "ความก้าวหน้า" }, { key: "kuiz", href: "#/kuiz", ms: "Kuiz", th: "แบบทดสอบ" }, { key: "alat", href: "#/alat", ms: "Alat Latihan", th: "เครื่องมือฝึก" }, { key: "istilah", href: "#/istilah", ms: "Istilah", th: "อภิธานศัพท์" }, { key: "kursus", href: "#/kursus", ms: "Maklumat Kursus", th: "ข้อมูลรายวิชา" }, { key: "clo", href: "#/clo", ms: "Pemetaan CLO", th: "การเชื่อมโยง CLO" }]);
  const pnName = x => `<b class="pn-ms">${x.ms}</b><i class="pn-th">${x.th}</i>`;
  function pageNav(key) {
    const nav = $("#pagenav"); const i = SEQ.findIndex(x => x.key === key);
    const prev = i > 0 ? SEQ[i - 1] : null, next = key === "kulit-dalam" ? SEQ[0] : i >= 0 && i < SEQ.length - 1 ? SEQ[i + 1] : null;
    const cur = k => key === k ? ' aria-current="page"' : "";
    nav.innerHTML = `
      <a href="#/"${cur("home")}>${ico("home")}<span class="pn-dw">Utama<small>หน้าแรก</small></span></a>
      <span class="sep" aria-hidden="true"></span>
      ${key === "kulit-dalam" || key === "kandungan" ? `<button type="button" class="pn-wide" data-opencover aria-label="Sebelum · ก่อนหน้า: Kulit Hadapan · ปกนอก">${ico("prev")}<span><small>Sebelum · ก่อนหน้า</small>${pnName({ ms: "Kulit Hadapan", th: "ปกนอก" })}</span></button>`
        : prev ? `<a class="pn-wide" href="${prev.href}" aria-label="Sebelum · ก่อนหน้า: ${prev.ms} · ${prev.th}">${ico("prev")}<span><small>Sebelum · ก่อนหน้า</small>${pnName(prev)}</span></a>`
             : `<span class="pn-wide is-off" aria-hidden="true">${ico("prev")}<span><small>Sebelum · ก่อนหน้า</small>—</span></span>`}
      ${next ? `<a class="pn-wide next" href="${next.href}" aria-label="Seterusnya · ถัดไป: ${next.ms} · ${next.th}"><span><small>Seterusnya · ถัดไป</small>${pnName(next)}</span>${ico("next")}</a>`
             : `<span class="pn-wide next is-off" aria-hidden="true"><span><small>Seterusnya · ถัดไป</small>—</span>${ico("next")}</span>`}
      <span class="sep" aria-hidden="true"></span>
      <a href="#/istilah"${cur("istilah")}>${ico("book")}<span class="pn-dw">Istilah<small>ศัพท์</small></span></a>
      <button type="button" data-top>${ico("top")}<span class="pn-dw">Atas<small>บนสุด</small></span></button>`;
    $("[data-top]", nav).onclick = () => window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
  }

  /* ---------- หน้าปก (เปิด/ปิดได้) ---------- */
  const cover = $("#cover");
  $("#cover-term").textContent = C.termMs + " · " + C.term;
  function openCover() {
    document.documentElement.classList.remove("no-cover");
    cover.classList.remove("closing"); cover.hidden = false; cover.scrollTop = 0;
    $("#cover-skip").checked = load().cover === "off";
    document.body.style.overflow = "hidden";
    setTimeout(() => $("#cover-enter").focus({ preventScroll: true }), 50);
  }
  function closeCover() {
    const s = load(); s.cover = $("#cover-skip").checked ? "off" : "on"; save(s);
    document.body.style.overflow = "";
    const done = () => { cover.hidden = true; cover.classList.remove("closing"); };
    if (reduced()) done(); else { cover.classList.add("closing"); setTimeout(done, 340); }
    app.focus({ preventScroll: true });
  }
  $("#cover-enter").addEventListener("click", closeCover);
  $$("[data-close-cover]", cover).forEach(a => a.addEventListener("click", closeCover));
  document.addEventListener("click", e => { if (e.target.closest("[data-opencover]")) openCover(); });
  $("#cover-open").addEventListener("click", openCover);
  $("#cover-skip").addEventListener("change", e => { const s = load(); s.cover = e.target.checked ? "off" : "on"; save(s); toast(e.target.checked ? T("Kulit hadapan tidak akan dipaparkan lagi; buka melalui butang “Kulit” di penjuru kanan atas", "จะไม่แสดงหน้าปกอีก เปิดได้จากปุ่ม “หน้าปก” มุมขวาบน") : T("Kulit hadapan dipaparkan setiap kali laman dibuka", "จะแสดงหน้าปกทุกครั้งที่เปิดเว็บ")); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !cover.hidden) closeCover(); });
  if (document.documentElement.classList.contains("no-cover")) cover.hidden = true;
  else { document.body.style.overflow = "hidden"; $("#cover-skip").checked = false; setTimeout(() => $("#cover-enter").focus({ preventScroll: true }), 50); }

  /* ---------- router ---------- */
  let laluanPertama = true;
  /* GoatCounter: kira setiap halaman # sekali · นับผู้เข้าชมทุกหน้า (เว็บนี้เปลี่ยนหน้าด้วย # จึงต้องนับเอง) */
  let gcAkhir = "";
  window.kiraLawatan = function () {
    const gc = window.goatcounter;
    if (!gc || typeof gc.count !== "function") return;
    /* Bahagian dalam bab tidak dikira berasingan · หัวข้อย่อยในบทนับรวมเป็นหน้าบทเดียว */
    const laluan = location.pathname + location.hash.replace(/^(#\/bab\/\d+)\/.*$/, "$1");
    if (laluan === gcAkhir) return;
    gcAkhir = laluan;
    try { gc.count({ path: laluan, title: document.title }); } catch (e) {}
  };
  function route() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    const p = location.hash.replace(/^#\/?/, "").split("/");
    const n = parseInt(p[1], 10);
    pageNav(!p[0] ? "home" : p[0] === "bab" ? "bab" + n : p[0]);
    if (!p[0]) home();
    else if (p[0] === "bab") lesson(n, p[2]);
    else if (p[0] === "kuiz") kuiz(p[1]);
    else if (p[0] === "alat") alat();
    else if (p[0] === "istilah") istilah();
    else if (p[0] === "kursus") kursus();
    else if (p[0] === "clo") pemetaanClo();
    else if (p[0] === "kulit-dalam") kulitDalam();
    else if (p[0] === "kandungan") kandungan();
    else if (p[0] === "kemajuan") kemajuan();
    else notFound();
    /* Fokus dipindahkan ke kandungan hanya selepas navigasi, bukan semasa halaman mula dibuka (supaya pautan langkau kekal pertama)
       ย้ายโฟกัสไปเนื้อหาเฉพาะเมื่อเปลี่ยนหน้า ไม่ใช่ตอนเปิดเว็บครั้งแรก */
    if (!laluanPertama) app.focus({ preventScroll: true });
    laluanPertama = false;
    document.documentElement.classList.toggle("di-bab", p[0] === "bab");
    bacaBar();
    window.kiraLawatan();
    setTimeout(() => { $("#sr-umum").textContent = document.title; }, 300);
  }
  window.addEventListener("hashchange", route);

  /* ---------- chrome ---------- */
  $(".menu-btn").addEventListener("click", e => { const n = $(".mainnav"); const o = n.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); });
  /* ---------- Saiz teks · ขนาดตัวอักษร ---------- */
  const FS = [0.9, 1, 1.1, 1.2, 1.35];
  const fsBtn = $(".fs-btn"), fsPanel = $("#fs-panel");
  function applyFs(v, umum) {
    document.documentElement.style.setProperty("--fs", v);
    $("#fs-val").textContent = Math.round(v * 100) + "%";
    $$(".fs-step").forEach(b => { b.disabled = (b.dataset.fs === "-1" && v <= FS[0]) || (b.dataset.fs === "1" && v >= FS[FS.length - 1]); });
    if (umum) { const s = load(); if (v === 1) delete s.fs; else s.fs = v; save(s); bacaBar(); }
  }
  applyFs(load().fs || 1);
  const fsTutup = fokus => { fsPanel.hidden = true; fsBtn.setAttribute("aria-expanded", "false"); if (fokus) fsBtn.focus(); };
  fsBtn.addEventListener("click", () => { const o = fsPanel.hidden; fsPanel.hidden = !o; fsBtn.setAttribute("aria-expanded", String(o)); if (o) $(".fs-step:not([disabled])", fsPanel).focus(); });
  fsPanel.addEventListener("click", e => {
    const b = e.target.closest("[data-fs]"); if (!b) return;
    const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--fs")) || 1;
    let i = FS.indexOf(FS.reduce((a, x) => Math.abs(x - cur) < Math.abs(a - cur) ? x : a, 1));
    const d = +b.dataset.fs; i = d === 0 ? 1 : Math.min(FS.length - 1, Math.max(0, i + d));
    applyFs(FS[i], true);
  });
  document.addEventListener("click", e => { if (!fsPanel.hidden && !e.target.closest(".fs-wrap")) fsTutup(false); });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!fsPanel.hidden) fsTutup(true);
    const n = $(".mainnav"); if (n.classList.contains("open")) { n.classList.remove("open"); $(".menu-btn").setAttribute("aria-expanded", "false"); $(".menu-btn").focus(); }
  });
  /* Pautan langkau · ลิงก์ข้ามไปเนื้อหา (tidak mengubah hash supaya penghala tidak terganggu) */
  $("[data-skip]").addEventListener("click", e => { e.preventDefault(); app.focus(); app.scrollIntoView(); });
  /* ---------- Bar kemajuan membaca · แถบความก้าวหน้าการอ่าน ---------- */
  let bacaRaf = 0;
  function bacaBar() {
    cancelAnimationFrame(bacaRaf);
    bacaRaf = requestAnimationFrame(() => {
      const bar = $(".read-bar span"); if (!bar) return;
      if (!document.documentElement.classList.contains("di-bab")) { bar.style.transform = "scaleX(0)"; return; }
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    });
  }
  addEventListener("scroll", bacaBar, { passive: true }); addEventListener("resize", bacaBar);
  mqMobile.addEventListener && mqMobile.addEventListener("change", () => { const d = $(".toc-d"); if (d) d.open = !mqMobile.matches; });
  function applyTheme(t) { if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); }
  applyTheme(load().theme);
  $(".theme-btn").addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    const t = dark ? "light" : "dark"; applyTheme(t); const s = load(); s.theme = t; save(s);
  });
  route();
})();
