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
    if (!("speechSynthesis" in window)) { toast("เบราว์เซอร์นี้ไม่รองรับการอ่านออกเสียง"); return; }
    speechSynthesis.cancel();
    const clean = strip(text).replace(/[*`]/g, "").replace(/…/g, " ").replace(/\s+/g, " ").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = voice ? voice.lang : "ms-MY"; if (voice) u.voice = voice; u.rate = 0.9;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
    if (!voice && !speak.warned) { speak.warned = true; toast("ไม่พบเสียงภาษามลายูในเครื่อง ระบบจะใช้เสียงที่ใกล้เคียงที่สุด"); }
  }
  const SPK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  const sayBtn = (text, label) => `<button class="say" type="button" data-say="${esc(strip(text))}" aria-label="ฟังเสียง ${esc(label || strip(text))}">${SPK}</button>`;
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-say]"); if (b) { speak(b.dataset.say); return; }
    const m = e.target.closest(".ms-say"); if (m) { $$(".ms-say.speaking").forEach(x => x.classList.remove("speaking")); m.classList.add("speaking"); speak(m.textContent, () => m.classList.remove("speaking")); }
  });
  document.addEventListener("keydown", e => { const m = e.target.closest && e.target.closest(".ms-say"); if (m && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); m.click(); } });

  /* ---------- markdown ---------- */
  if (window.marked) marked.setOptions({ gfm: true, breaks: false });
  const md = s => window.marked ? marked.parse(s) : `<pre>${esc(s)}</pre>`;
  const mdi = s => window.marked ? marked.parseInline(s) : esc(s);
  const cache = {};
  function fetchBab(n) {
    if (!cache[n]) cache[n] = fetch(`content/bab-${pad(n)}.md`, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); }).catch(err => { delete cache[n]; throw err; });
    return cache[n];
  }
  const SEC_IDS = ["hasil", "rangka", "isi", "kes", "soalan", "rujukan"];
  const SEC_SHORT = { hasil: "ผลลัพธ์การเรียนรู้", rangka: "โครงร่าง", isi: "เนื้อหา", kes: "กรณีศึกษา", soalan: "คำถามท้ายบท", rujukan: "เอกสารอ้างอิง" };
  /* แยกไฟล์บทเป็นส่วน ๆ ตามหัวข้อ ## */
  function splitSections(text) {
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    const parts = text.split(/^## /m).slice(1);
    return parts.map((p, i) => {
      const nl = p.indexOf("\n");
      const title = p.slice(0, nl).trim().replace(/^\d+\.\s*/, "");
      return { id: SEC_IDS[i] || "s" + i, title, body: p.slice(nl + 1) };
    });
  }
  /* อ่านข้อปรนัยจาก markdown: "1. คำถาม" / "   ก. ... ข. ... ค. ... ง. ..." / "**เฉลย** 1 ข · 2 ค (หมายเหตุ)" */
  function parseMCQ(text) {
    const lines = text.split("\n"); const qs = []; let cur = null; let key = "";
    for (const ln of lines) {
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
    return qs.filter(q => q.o.length >= 2 && ans[q.n]).map(q => ({ q: q.q, o: q.o, a: ans[q.n].a, note: ans[q.n].note }));
  }
  /* หลังแปลง markdown: ห่อตาราง ซ่อนแนวคำตอบ และทำให้คำมลายูกดฟังเสียงได้ */
  function enhance(root) {
    $$("table", root).forEach(t => { if (!t.parentElement.classList.contains("tbl-wrap")) { const w = document.createElement("div"); w.className = "tbl-wrap"; t.replaceWith(w); w.appendChild(t); } });
    $$("li, p, td", root).forEach(el => {
      if (!/\(แนวคำตอบ:/.test(el.innerHTML)) return;
      el.innerHTML = el.innerHTML.replace(/\(แนวคำตอบ:\s*([\s\S]*?)\)(?=\s|<|$)/g, '<details class="hint"><summary>ดูแนวคำตอบ</summary><div>$1</div></details>');
    });
    $$("em", root).forEach(em => {
      const t = em.textContent.trim();
      if (!t || hasThai(t) || em.closest("button, a, summary, h2, h3, .opt, .q-text")) return;
      em.classList.add("ms-say"); em.setAttribute("lang", "ms"); em.tabIndex = 0; em.setAttribute("role", "button"); em.title = "กดเพื่อฟังเสียง";
    });
  }

  /* ---------- shared bits ---------- */
  const babLink = n => `#/bab/${n}`;
  const partName = p => p === "sintaksis" ? "ภาควากยสัมพันธ์ (Sintaksis)" : "ภาควจีวิภาค (Morfologi)";
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
    setNav("home"); document.title = `${C.code} ${C.th} | มหาวิทยาลัยทักษิณ`;
    const next = CH.find(l => !isDone(l.no)) || CH[0];
    const doneCount = CH.filter(l => isDone(l.no)).length;
    const day = Math.floor(Date.now() / 864e5) % AYAT.length;
    const weeks = CH.map(c => ({ week: c.week, c })).concat(C.extraWeeks.map(x => ({ week: x.week, x }))).sort((a, b) => a.week - b.week);
    app.innerHTML = `
      <section class="hero"><div class="wrap">
        <div id="ayat-box">
          <p class="hero-label">AYAT HARI INI · ประโยควันนี้</p>
          <p class="hero-ayat" id="ayat" lang="ms"></p>
          <p class="hero-tr" id="ayat-tr"></p>
          <div class="k-legend"><span class="ls">ประธาน (subjek)</span><span class="lp">ภาคแสดง (predikat)</span><span id="ayat-pola"></span></div>
          <div class="btn-row"><button type="button" class="btn btn-hero" id="ayat-k">แยกประธาน–ภาคแสดง</button><button type="button" class="btn btn-ghost" id="ayat-n">ประโยคถัดไป</button><span id="ayat-say"></span></div>
        </div>
        <div class="hero-side">
          <h1>${C.code} ${C.th}<br><span class="ms" lang="ms" style="font-weight:500;opacity:.85">${C.ms}</span></h1>
          <p>เอกสารประกอบการสอนออนไลน์ ${C.term} 13 บท ตั้งแต่หน่วยคำถึงการแปลงประโยค พร้อมกรณีศึกษา แบบทดสอบ และเครื่องมือฝึก</p>
          <div class="btn-row">
            <a class="btn btn-hero" href="${babLink(next.no)}">${doneCount ? "เรียนต่อ บทที่ " + next.no : "เริ่มบทที่ 1"}</a>
            <a class="btn btn-ghost" href="#/kandungan">สารบัญ</a>
          </div>
        </div>
      </div></section>
      <div class="rebung" role="presentation"></div>
      <section class="section"><div class="wrap">
        <div class="section-head"><h2>แผนการเรียน 15 สัปดาห์</h2><p>${doneCount ? `ทำเครื่องหมายเรียนแล้ว ${doneCount} จาก ${CH.length} บท` : `${CH.length} บทเรียน · 3 ชั่วโมงต่อสัปดาห์`}</p></div>
        <ol class="jadual">${weeks.map(w => {
          if (w.x) return `<li><a class="jrow extra" href="${w.x.href}"><div class="jweek"><b>สัปดาห์ ${w.week}</b></div><div class="jtitle"><span class="th">${w.x.th}</span><span class="th" style="display:block;font-weight:400;font-size:14.5px;color:var(--muted)">${w.x.note}</span></div><div class="jstat">${w.x.link} →</div></a></li>`;
          const c = w.c, d = isDone(c.no);
          const head = c.no === 1 || c.no === 8 ? `<li aria-hidden="true"><p class="part-head">${partName(c.part)}</p></li>` : "";
          return `${head}<li><a class="jrow" href="${babLink(c.no)}"><div class="jweek"><b>สัปดาห์ ${w.week}</b>บทที่ ${c.no}</div>
            <div class="jtitle"><span class="ms" lang="ms">${c.ms}</span><span class="th">${c.th}</span></div>
            <div class="jstat ${d ? "done" : ""}">${d ? "✓ เรียนแล้ว" : c.clos.join(" · ")}</div></a></li>`;
        }).join("")}</ol>
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap tri">
        <div><h3>แบบทดสอบ</h3><p>สุ่มข้อปรนัยจากทุกบท ตรวจคำตอบทันที ใช้ทบทวนก่อนสอบกลางภาคและปลายภาค</p><a href="#/kuiz">เริ่มทำแบบทดสอบ</a></div>
        <div><h3>เครื่องมือฝึก</h3><p>เติมปัจจัย meN- peN- ber- ter- อัตโนมัติ และแปลงประโยคกรรตุวาจกเป็นกรรมวาจก</p><a href="#/alat">เปิดเครื่องมือ</a></div>
        <div><h3>อภิธานศัพท์ไวยากรณ์</h3><p>ศัพท์เทคนิคภาษามลายู–ไทยกว่า ${window.ISTILAH.length} คำ ค้นหาได้ และโยงไปยังบทที่เกี่ยวข้อง</p><a href="#/istilah">เปิดอภิธานศัพท์</a></div>
      </div></section>`;
    let k = day;
    const box = $("#ayat-box");
    const draw = () => {
      const [s, p, pola, tr] = AYAT[k];
      $("#ayat").innerHTML = `<span class="konst k-s">${esc(s)}</span> <span class="konst k-p">${esc(p)}</span>`;
      $("#ayat-tr").textContent = tr; $("#ayat-pola").textContent = "แบบ " + pola;
      $("#ayat-say").innerHTML = sayBtn(s + " " + p).replace('class="say"', 'class="say hero-say"');
    };
    $("#ayat-k").onclick = () => { const on = box.classList.toggle("show-k"); $("#ayat-k").textContent = on ? "ซ่อนการแยกส่วน" : "แยกประธาน–ภาคแสดง"; };
    $("#ayat-n").onclick = () => { k = (k + 1) % AYAT.length; draw(); };
    draw();
    window.scrollTo(0, 0);
  }

  /* ================= LESSON ================= */
  function mcqHTML(items, id, src) {
    return `<div class="ex" id="${id}">${items.map((it, i) => `<div class="q" data-a="${it.a}">
        ${src ? `<p class="quiz-src"><a href="${babLink(it.bab)}">บทที่ ${it.bab}</a></p>` : ""}
        <p class="q-text">${i + 1}. ${mdi(it.q)}</p>
        <div class="opts">${it.o.map((o, j) => `<button type="button" class="opt" data-j="${j}">${"กขคง"[j]}. ${mdi(o)}</button>`).join("")}</div>
        <p class="fb" aria-live="polite"></p>${it.note ? `<p class="note-ans" hidden>หมายเหตุ: ${mdi(it.note)}</p>` : ""}</div>`).join("")}
      <div class="ex-foot"><span class="score" aria-live="polite"></span><button class="btn btn-line" type="button" data-reset="${id}">ทำใหม่</button></div></div>`;
  }
  function bindMCQ(root, onAll) {
    root.addEventListener("click", e => {
      const opt = e.target.closest(".opt"), rst = e.target.closest("[data-reset]");
      if (opt && !opt.disabled) {
        const q = opt.closest(".q"), a = +q.dataset.a, j = +opt.dataset.j, ex = q.closest(".ex");
        $$(".opt", q).forEach((b, k) => { b.disabled = true; if (k === a) b.classList.add("right"); });
        if (j !== a) opt.classList.add("wrong");
        q.dataset.res = j === a ? "1" : "0";
        const fb = $(".fb", q); fb.className = "fb " + (j === a ? "right" : "wrong"); fb.textContent = j === a ? "ถูกต้อง" : `ยังไม่ถูก คำตอบที่ถูกคือข้อ ${"กขคง"[a]} (กรอบสีเขียว)`;
        const nt = $(".note-ans", q); if (nt) nt.hidden = false;
        const all = $$(".q", ex), done = all.filter(x => x.dataset.res !== undefined), ok = done.filter(x => x.dataset.res === "1").length;
        $(".score", ex).textContent = `ได้ ${ok} จาก ${all.length} ข้อ` + (done.length < all.length ? ` (ตอบแล้ว ${done.length} ข้อ)` : "");
        if (done.length === all.length && onAll) onAll(ok, all.length);
      }
      if (rst) {
        const ex = $("#" + rst.dataset.reset);
        $$(".q", ex).forEach(q => { delete q.dataset.res; $$(".opt", q).forEach(b => { b.disabled = false; b.classList.remove("right", "wrong"); }); const fb = $(".fb", q); fb.className = "fb"; fb.textContent = ""; const nt = $(".note-ans", q); if (nt) nt.hidden = true; });
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
        out += `<h3>${mdi(h)}</h3>` + (items.length ? `<p class="lead" style="color:var(--muted)">กดเลือกคำตอบ ระบบจะตรวจทันที</p>${mcqHTML(items, `mcq${n}`)}` : md(rest));
      } else out += `<h3>${mdi(h)}</h3>${md(rest)}`;
    });
    return out;
  }

  function lesson(n, sub) {
    const c = CH.find(x => x.no === n); if (!c) return notFound();
    setNav("home"); document.title = `บทที่ ${c.no} ${c.ms} | ${C.code}`;
    const i = CH.indexOf(c), prev = CH[i - 1], next = CH[i + 1];
    app.innerHTML = `
      <header class="lesson-head"><div class="wrap">
        <p class="crumb"><a href="#/">แผนการเรียน</a> / <a href="#/kandungan">สารบัญ</a> / สัปดาห์ที่ ${c.week}</p>
        <p class="lesson-no">บทที่ ${c.no} · <span lang="ms">Bab ${c.no}</span><span class="part-tag" lang="ms">${c.part === "sintaksis" ? "Sintaksis" : "Morfologi"}</span></p>
        <h1 class="lesson-title" lang="ms">${c.ms}</h1>
        <p class="lesson-th">${c.th}</p>
        <ul class="chips">${c.clos.map(x => `<li class="chip" title="${esc((C.clos.find(y => y.id === x) || {}).text || "")}">${x}</li>`).join("")}</ul>
      </div></header>
      <div class="wrap lesson-body"><nav class="toc" aria-label="หัวข้อในบท"><p>ในบทนี้</p><ol>${SEC_IDS.map(id => `<li><a href="#/bab/${n}/${id}" data-sec="${id}">${SEC_SHORT[id]}</a></li>`).join("")}</ol></nav>
        <div id="bab-body"><p class="loading">กำลังโหลดเนื้อหาบทที่ ${n}…</p></div></div>`;
    window.scrollTo(0, 0);
    fetchBab(n).then(text => {
      if (location.hash.split("/")[2] !== String(n)) return;
      const secs = splitSections(text);
      const body = $("#bab-body");
      body.innerHTML = `<p class="say-hint">${SPK} คำภาษามลายูตัวเอียงในเนื้อหา กดเพื่อฟังเสียงได้</p>` + secs.map(s => `<section class="block" id="s-${s.id}"><h2>${mdi(s.title)}</h2><div class="prose">${s.id === "soalan" ? soalanHTML(s.body, n) : md(s.body)}</div></section>`).join("") + `
        <div class="lesson-foot">
          <div class="done-box"><button type="button" class="btn ${isDone(n) ? "btn-line" : "btn-solid"}" data-done>${isDone(n) ? "✓ เรียนบทนี้แล้ว (กดเพื่อยกเลิก)" : "ทำเครื่องหมายว่าเรียนแล้ว"}</button>
          <span style="color:var(--muted);font-size:15px">บันทึกไว้ในเบราว์เซอร์นี้เท่านั้น</span></div>
          <nav class="pn" aria-label="บทก่อนหน้าและถัดไป">
            ${prev ? `<a href="${babLink(prev.no)}"><small>บทก่อนหน้า · บทที่ ${prev.no}</small><span class="ms" lang="ms">${prev.ms}</span></a>` : ""}
            ${next ? `<a class="next" href="${babLink(next.no)}"><small>บทถัดไป · บทที่ ${next.no}</small><span class="ms" lang="ms">${next.ms}</span></a>` : ""}
          </nav>
        </div>`;
      enhance(body); bindMCQ(body);
      // TOC: เลื่อนภายในหน้า
      $$(".toc a").forEach(a => a.addEventListener("click", e => { e.preventDefault(); const t = $("#s-" + a.dataset.sec); if (t) t.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); history.replaceState(null, "", a.getAttribute("href")); }));
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) $$(".toc a").forEach(a => a.classList.toggle("on", "s-" + a.dataset.sec === en.target.id)); }), { rootMargin: "-30% 0px -60% 0px" });
        $$(".block", body).forEach(b => io.observe(b));
      }
      $("[data-done]", body).addEventListener("click", () => { const v = !isDone(n); setDone(n, v); toast(v ? `บันทึกว่าเรียนบทที่ ${n} แล้ว` : "ยกเลิกเครื่องหมายแล้ว"); lesson(n); });
      if (sub && $("#s-" + sub)) setTimeout(() => $("#s-" + sub).scrollIntoView(), 30);
    }).catch(() => {
      $("#bab-body").innerHTML = `<div class="note"><p>โหลดเนื้อหาบทที่ ${n} ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p><p style="font-size:15px;color:var(--muted)">หมายเหตุสำหรับผู้สอน: เนื้อหาโหลดจากไฟล์ <code>content/bab-${pad(n)}.md</code> ต้องเปิดผ่านเว็บไซต์ (GitHub Pages) ไม่ใช่การดับเบิลคลิกไฟล์ในเครื่อง</p></div>`;
    });
  }

  /* ================= QUIZ ================= */
  function kuiz(part) {
    setNav("kuiz"); document.title = `แบบทดสอบ | ${C.code}`;
    const sel = part === "morfologi" || part === "sintaksis" ? part : "semua";
    const chs = CH.filter(c => sel === "semua" || c.part === sel);
    const N = sel === "semua" ? 20 : 15;
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h2>แบบทดสอบ <span class="ms" lang="ms" style="font-weight:500;color:var(--muted);font-size:20px">Kuiz</span></h2><p>สุ่ม ${N} ข้อจากคำถามท้ายบท</p></div>
      <div class="quiz-intro" role="group" aria-label="เลือกขอบเขตข้อสอบ">
        <a class="chip-btn" href="#/kuiz/morfologi" aria-pressed="${sel === "morfologi"}">ภาควจีวิภาค บทที่ 1–7</a>
        <a class="chip-btn" href="#/kuiz/sintaksis" aria-pressed="${sel === "sintaksis"}">ภาควากยสัมพันธ์ บทที่ 8–13</a>
        <a class="chip-btn" href="#/kuiz/semua" aria-pressed="${sel === "semua"}">ทุกบท</a>
      </div>
      <div class="result" id="kz-res" aria-live="polite"></div>
      <div id="kz"><p class="loading">กำลังเตรียมข้อสอบ…</p></div>
    </div></section>`;
    window.scrollTo(0, 0);
    Promise.all(chs.map(c => fetchBab(c.no).then(t => {
      const s = splitSections(t).find(x => x.id === "soalan"); if (!s) return [];
      const m = s.body.split(/^### /m).find(p => /^[^\n]*ปรนัย/.test(p)); if (!m) return [];
      return parseMCQ(m.slice(m.indexOf("\n") + 1)).map(q => Object.assign(q, { bab: c.no }));
    }))).then(lists => {
      const pool = lists.flat();
      const draw = () => {
        const items = shuffle(pool).slice(0, N);
        $("#kz").innerHTML = mcqHTML(items, "kzex", true) + `<div class="btn-row" style="margin-top:6px"><button class="btn btn-solid" type="button" id="kz-new">สุ่มชุดใหม่</button></div>`;
        $("#kz-res").className = "result";
        enhance($("#kz"));
        $("#kz-new").onclick = () => { draw(); window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" }); };
      };
      bindMCQ($("#kz"), (ok, all) => {
        const r = $("#kz-res");
        if (ok === null) { r.className = "result"; return; }
        const pc = Math.round(ok / all * 100);
        r.innerHTML = `<b>${ok} / ${all}</b> &nbsp;คิดเป็น ${pc}% — ${pc >= 80 ? "ยอดเยี่ยม พร้อมสอบแล้ว" : pc >= 60 ? "ดี ทบทวนข้อที่ผิดอีกครั้ง" : "ควรกลับไปอ่านบทที่เกี่ยวข้อง (กดเลขบทเหนือแต่ละข้อ)"}`;
        r.className = "result show"; r.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "center" });
      });
      draw();
    }).catch(() => { $("#kz").innerHTML = `<div class="note"><p>โหลดข้อสอบไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง</p></div>`; });
  }

  /* ================= TOOLS ================= */
  const VOW = /[aeiou]/;
  const syll = w => (w.match(/[aeiou]+/g) || []).length;
  const isCluster = w => /^[bcdfghjklmnpqrstvwxyz]{2}/.test(w) && !/^(ng|ny|sy|kh)/.test(w);
  /* กฎการหลอมรวมของ meN- / peN- (Tatabahasa Dewan) */
  function nasal(base, pre) { // pre = "me" หรือ "pe"
    const w = base.toLowerCase().trim(); if (!w) return null;
    const EXC = { punya: [pre + "mpunya", "คำยกเว้น: คงเสียง p ใน mempunyai"], kaji: [pre + "ngkaji", "คำยกเว้น: คงเสียง k เพื่อแยกจาก mengaji (อ่านอัลกุรอาน)"] };
    if (EXC[w]) return { w: EXC[w][0], r: EXC[w][1] };
    if (syll(w) === 1) return { w: pre + "nge" + w, r: `คำฐานพยางค์เดียว → ${pre}nge-` };
    if (isCluster(w)) {
      const f = w[0];
      const p = "bfvp".includes(f) ? "m" : "cdjztsl".includes(f) ? "n" : "ng";
      return { w: pre + p + w, r: `คำฐานขึ้นต้นด้วยพยัญชนะควบ (${w.slice(0, 2)}-) → ไม่หลอมเสียง` };
    }
    if (/^(ng|ny)/.test(w) || "lmnrwy".includes(w[0])) return { w: pre + w, r: `${w.slice(0, /^(ng|ny)/.test(w) ? 2 : 1)} → ${pre}-` };
    if ("bfv".includes(w[0])) return { w: pre + "m" + w, r: `${w[0]} → ${pre}m-` };
    if (w[0] === "p") return { w: pre + "m" + w.slice(1), r: `p → ${pre}m- และเสียง p หลอมหายไป` };
    if (/^sy/.test(w) || "cdjz".includes(w[0])) return { w: pre + "n" + w, r: `${/^sy/.test(w) ? "sy" : w[0]} → ${pre}n-` };
    if (w[0] === "t") return { w: pre + "n" + w.slice(1), r: `t → ${pre}n- และเสียง t หลอมหายไป` };
    if (VOW.test(w[0]) || /^kh/.test(w) || "gh".includes(w[0])) return { w: pre + "ng" + w, r: `${VOW.test(w[0]) ? "สระ" : /^kh/.test(w) ? "kh" : w[0]} → ${pre}ng-` };
    if (w[0] === "k") return { w: pre + "ng" + w.slice(1), r: `k → ${pre}ng- และเสียง k หลอมหายไป` };
    if (w[0] === "s") return { w: pre + "ny" + w.slice(1), r: `s → ${pre}ny- และเสียง s หลอมหายไป` };
    return { w: pre + w, r: "" };
  }
  function berTer(base, pre) { // pre = "ber" หรือ "ter"
    const w = base.toLowerCase().trim();
    if (pre === "ber" && w === "ajar") return { w: "belajar", r: "คำยกเว้น: ber- + ajar → bel-" };
    if (w[0] === "r") return { w: pre.slice(0, 2) + w, r: `คำฐานขึ้นต้นด้วย r → ${pre.slice(0, 2)}-` };
    if (pre === "ber" && /^[^aeiou]?er[^aeiou]/.test(w)) return { w: "be" + w, r: "พยางค์แรกลงท้ายด้วย -er → be-" };
    return { w: pre + w, r: "" };
  }
  const PRON12 = ["saya", "aku", "kami", "kita", "engkau", "kau", "kamu", "awak", "anda"];
  function alat() {
    setNav("alat"); document.title = `เครื่องมือฝึก | ${C.code}`;
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h2>เครื่องมือฝึก <span class="ms" lang="ms" style="font-weight:500;color:var(--muted);font-size:20px">Alat Latihan</span></h2><p>ใช้คู่กับบทที่ 6–7 และบทที่ 13</p></div>

      <div class="tool" id="t-imb">
        <h3>เติมปัจจัยให้คำฐาน (Pengimbuhan)</h3>
        <p class="lead">พิมพ์คำฐาน (kata dasar) ระบบจะเติมปัจจัยตามกฎการหลอมเสียงใน <i>Tatabahasa Dewan</i> พร้อมบอกเหตุผล · ใช้ทบทวน <a class="on-band" style="color:var(--langit)" href="#/bab/6">บทที่ 6</a></p>
        <div class="tool-row"><input class="tinput" type="text" id="imb-in" value="tulis" lang="ms" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="คำฐาน"></div>
        <div class="chips-row" aria-label="ตัวอย่างคำฐาน">${["baca", "pukul", "tulis", "kira", "sapu", "ambil", "cat", "lawat", "cari", "proses", "kerja", "ajar", "rasa", "bersih"].map(x => `<button type="button" data-w="${x}">${x}</button>`).join("")}</div>
        <div class="tbl-wrap" style="max-width:none;margin:0"><table class="imb"><thead><tr><th>ปัจจัย</th><th>คำที่ได้</th><th>เหตุผล / ความหมายหลัก</th><th><span class="sr-only">ฟัง</span></th></tr></thead><tbody id="imb-out"></tbody></table></div>
        <p class="tool-alt" style="margin-top:10px">ระบบใช้กฎทั่วไป คำบางคำมีรูปเฉพาะหรือไม่รับปัจจัยบางตัว ควรตรวจกับ <i>Kamus Dewan</i> หรือ PRPM เสมอ</p>
      </div>

      <div class="tool" id="t-pas">
        <h3>แปลงประโยคกรรตุวาจกเป็นกรรมวาจก (Aktif → Pasif)</h3>
        <p class="lead">กรอกส่วนประกอบของประโยค ระบบจะสร้างประโยคกรรตุวาจกและกรรมวาจกที่ถูกต้องตามบุรุษของผู้กระทำ · ใช้ทบทวน <a class="on-band" style="color:var(--langit)" href="#/bab/13">บทที่ 13</a></p>
        <div class="tool-grid">
          <label>ผู้กระทำ (subjek)<input class="tinput" id="p-s" value="Menteri" lang="ms" autocomplete="off"></label>
          <label>คำช่วย (kata bantu)<input class="tinput" id="p-b" value="akan" lang="ms" autocomplete="off" placeholder="เว้นว่างได้"></label>
          <label>คำฐานของกริยา<input class="tinput" id="p-v" value="rasmi" lang="ms" autocomplete="off"></label>
          <label>ปัจจัยท้าย<select id="p-x"><option value="">(ไม่มี)</option><option value="kan" selected>-kan</option><option value="i">-i</option></select></label>
          <label>กรรม (objek)<input class="tinput" id="p-o" value="bangunan itu" lang="ms" autocomplete="off"></label>
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
      if (!w) { out.innerHTML = `<tr><td colspan="4" class="r">พิมพ์คำฐานเป็นอักษรรูมี เช่น baca</td></tr>`; return; }
      const me = nasal(w, "me"), pe = nasal(w, "pe");
      out.innerHTML = row("meN-", me, "กริยากรรตุวาจก") + row("di-", { w: "di" + w, r: "" }, "กริยากรรมวาจก (ผู้กระทำบุรุษที่ 3)") +
        row("peN-", pe, "นาม: ผู้กระทำ / เครื่องมือ") + row("peN-…-an", { w: pe.w + "an", r: "" }, "นาม: กระบวนการ") +
        row("ber-", berTer(w, "ber"), "กริยา: มี / สวม / กระทำ") + row("ter-", berTer(w, "ter"), "ไม่ได้ตั้งใจ / อยู่ในสภาพ / ที่สุด");
    };
    inp.addEventListener("input", run); $$("#t-imb [data-w]").forEach(b => b.onclick = () => { inp.value = b.dataset.w; run(); });
    run();
    // aktif → pasif
    const pf = ["p-s", "p-b", "p-v", "p-x", "p-o"].map(id => $("#" + id));
    const runP = () => {
      const [s, b, v, x, o] = pf.map(f => f.value.trim());
      const po = $("#pas-out");
      if (!s || !v || !o) { po.innerHTML = `<div><small>กรอกผู้กระทำ คำฐานของกริยา และกรรม</small></div>`; return; }
      const vb = v.toLowerCase() + x, bb = b ? b.toLowerCase() + " " : "";
      const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
      const act = `${cap(s)} ${bb}${nasal(v, "me").w}${x} ${o}.`;
      const p12 = PRON12.includes(s.toLowerCase());
      const agent = /^(dia|ia|mereka|beliau)$/i.test(s) ? s.toLowerCase() : s;
      const pas = p12 ? `${cap(o)} ${bb}${s.toLowerCase()} ${vb}.` : `${cap(o)} ${bb}di${vb} oleh ${agent}.`;
      const why = p12 ? "ผู้กระทำเป็นสรรพนามบุรุษที่ 1–2: ย้ายกรรมไปต้นประโยค ตัด meN- วางสรรพนามหน้ากริยาทันที และคำช่วยอยู่หน้าสรรพนาม (ห้ามใช้ di- … oleh saya)" : "ผู้กระทำเป็นบุรุษที่ 3 หรือนาม: สลับประธานกับกรรม เปลี่ยน meN- เป็น di- และเติม oleh หน้าผู้กระทำ";
      po.innerHTML = `<div><small>กรรตุวาจก (ayat aktif)</small><p lang="ms">${esc(act)} ${sayBtn(act)}</p></div><div><small>กรรมวาจก (ayat pasif)</small><p lang="ms">${esc(pas)} ${sayBtn(pas)}</p></div><div><small>กฎที่ใช้</small><span style="color:var(--band-soft)">${why}</span></div>`;
    };
    pf.forEach(f => f.addEventListener("input", runP));
    $$("#t-pas [data-ex]").forEach(btn => btn.onclick = () => { btn.dataset.ex.split("|").forEach((v, i) => { pf[i].value = v; }); runP(); });
    runP();
    window.scrollTo(0, 0);
  }

  /* ================= GLOSSARY ================= */
  function istilah() {
    setNav("istilah"); document.title = `อภิธานศัพท์ไวยากรณ์ | ${C.code}`;
    const all = window.ISTILAH.map(([m, t, d, n]) => ({ m, t, d, n }));
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h2>อภิธานศัพท์ไวยากรณ์ <span class="ms" lang="ms" style="font-weight:500;color:var(--muted);font-size:20px">Istilah Tatabahasa</span></h2><p>${all.length} คำ</p></div>
      <div class="gl-tools"><label class="sr-only" for="gq">ค้นหาศัพท์</label><input id="gq" type="search" placeholder="ค้นหา เช่น frasa หรือ วลี" autocomplete="off">
      <label class="sr-only" for="gb">เลือกบท</label><select id="gb"><option value="">ทุกบท</option>${CH.map(c => `<option value="${c.no}">บทที่ ${c.no} ${c.ms}</option>`).join("")}</select></div>
      <p class="gl-count" aria-live="polite"></p>
      <div class="tbl-wrap" style="max-width:none"><table><thead><tr><th>ภาษามลายู</th><th>ภาษาไทย</th><th>คำอธิบาย</th><th>บท</th><th><span class="sr-only">ฟัง</span></th></tr></thead><tbody id="gl"></tbody></table></div>
    </div></section>`;
    const q = $("#gq"), b = $("#gb"), tb = $("#gl"), cnt = $(".gl-count");
    const run = () => {
      const s = q.value.trim().toLowerCase(), bb = b.value;
      const rows = all.filter(x => (!bb || x.n === +bb) && (!s || (x.m + " " + x.t + " " + x.d).toLowerCase().includes(s)));
      cnt.textContent = rows.length ? `พบ ${rows.length} คำ` : "ไม่พบศัพท์ที่ค้นหา ลองพิมพ์ให้สั้นลงหรือเลือก “ทุกบท”";
      tb.innerHTML = rows.map(x => `<tr><td class="ms" lang="ms">${esc(x.m)}</td><td>${esc(x.t)}</td><td style="color:var(--muted);font-size:15px">${esc(x.d)}</td><td class="gl-bab"><a href="${babLink(x.n)}">บทที่ ${x.n}</a></td><td class="say-cell">${sayBtn(x.m.replace(/\s*\(.*\)/, ""))}</td></tr>`).join("");
    };
    q.addEventListener("input", run); b.addEventListener("change", run); run();
    window.scrollTo(0, 0);
  }

  /* ================= COURSE INFO ================= */
  function kursus() {
    setNav("kursus"); document.title = `ข้อมูลรายวิชา | ${C.code}`;
    app.innerHTML = `<section class="section"><div class="wrap">
      <div class="section-head"><h2>${C.code} ${C.th}</h2><p>${C.term} · ${C.credits} หน่วยกิต</p></div>
      <div class="info-grid">
        <div class="prose">
          <h3>คำอธิบายรายวิชา</h3><p>${C.descTh}</p><p lang="en" style="color:var(--muted)">${C.descEn}</p>
          <h3>จุดมุ่งหมาย</h3><p>${C.goal}</p>
          <h3>ผลลัพธ์การเรียนรู้ (CLOs) และสัดส่วนคะแนน</h3>
          <ul class="clo">${C.clos.map(c => `<li><b>${c.id}</b><div>${c.text}<div class="bar" role="img" aria-label="${c.weight} เปอร์เซ็นต์"><span style="width:${c.weight}%"></span></div><small style="color:var(--muted)">${c.weight}% · ${c.how}</small></div></li>`).join("")}</ul>
        </div>
        <div class="prose">
          <h3>ผู้สอน</h3><ul class="people">${C.teachers.map(t => `<li>${t.name}<small>${t.role}${t.email ? ` · <a href="mailto:${t.email}">${t.email}</a>` : ""}</small></li>`).join("")}</ul>
          <h3>เวลาให้คำปรึกษา</h3><p>${C.office}</p>
          <h3>กลุ่มเรียน</h3>${table(["กลุ่ม", "วันและเวลา", "ห้อง"], C.groups)}
          <h3>เกณฑ์การตัดสินผล (อิงเกณฑ์)</h3>${table(["ระดับ", "คะแนน (%)", "ความหมาย"], C.grades)}
        </div>
      </div>
      <div class="info-grid" style="margin-top:20px">
        <div class="prose"><h3>ตำราและเอกสารแนะนำ</h3><ul>${C.books.map(b => `<li>${b}</li>`).join("")}</ul></div>
        <div class="prose"><h3>แหล่งเรียนรู้ออนไลน์</h3><ul>${C.resources.map(r => `<li><a href="${r.url}" target="_blank" rel="noopener">${r.th}</a></li>`).join("")}</ul></div>
      </div>
    </div></section>`;
    window.scrollTo(0, 0);
  }

  /* ================= ปกใน และ สารบัญ ================= */
  const bunga = cls => `<svg class="${cls}" viewBox="-40 -40 80 80" aria-hidden="true"><circle class="ring" r="37"/>${
    [0, 45, 90, 135, 180, 225, 270, 315].map(r => `<path class="pt" d="M0 -6C7 -14 7 -26 0 -33C-7 -26 -7 -14 0 -6Z" transform="rotate(${r})"/><circle class="dt" cy="-20" r="2" transform="rotate(${r})"/>`).join("")
  }<circle class="ct" r="5.5"/></svg>`;
  const ruleSVG = '<svg class="rule" viewBox="0 0 120 12" aria-hidden="true"><path class="ln" d="M0 6H48M72 6H120" stroke-width="1"/><path class="dm" d="M60 0 66 6 60 12 54 6Z"/></svg>';
  const nw = t => String(t).split(" ").map(w => `<span class="nw">${w}</span>`).join(" ");
  function kulitDalam() {
    setNav(""); document.title = `ปกใน | ${C.code} ${C.th}`;
    app.innerHTML = `<section class="sheet-wrap"><article class="sheet" aria-label="ปกใน">
      <div class="sheet-inner">
        ${bunga("emblem")}
        <p class="doc">${C.docType}</p>
        <p class="code">รายวิชา ${C.code}</p>
        <h1 class="t-th">${nw(C.th)}</h1>
        <p class="t-en" lang="en">${C.en}</p>
        <p class="t-ms" lang="ms">${C.ms}</p>
        ${ruleSVG}
        <p class="by">เรียบเรียงโดย</p>
        <p class="author">${nw(C.author)}</p>
        <p class="degree">${C.authorDegree}</p>
        <div class="org">${C.faculty}<br><b>${C.university}</b><br>${C.term}</div>
      </div>
    </article>
    <div class="sheet-actions"><a class="btn btn-solid" href="#/kandungan">ไปที่สารบัญ</a><button type="button" class="btn btn-line" data-opencover>ดูปกนอก</button></div></section>`;
    window.scrollTo(0, 0);
  }
  function kandungan() {
    setNav("kandungan"); document.title = `สารบัญ | ${C.code} ${C.th}`;
    const row = (no, title, pg, href) => `<a class="toc-row" href="${href}"><span class="toc-no">${no}</span><span class="toc-title">${title}</span><span class="toc-dots" aria-hidden="true"></span><span class="toc-pg">${pg}</span></a>`;
    const part = p => `<div class="toc-part"><h2>${partName(p)}</h2><ol class="toc-list">${CH.filter(c => c.part === p).map(c => {
      const d = isDone(c.no);
      return `<li>${row("บทที่ " + c.no, `<span class="ms" lang="ms">${c.ms}</span><span class="th">${c.th}</span>`, `<span class="${d ? "toc-pg done" : ""}">${d ? "✓ " : ""}สัปดาห์ที่ ${c.week}</span>`, babLink(c.no))}
        <ul class="toc-subs" aria-label="หัวข้อในบทที่ ${c.no}">${SEC_IDS.map(id => `<li><a href="${babLink(c.no)}/${id}">${SEC_SHORT[id]}</a></li>`).join("")}</ul></li>`;
    }).join("")}</ol></div>`;
    app.innerHTML = `<section class="section"><div class="wrap toc-page">
      <header class="toc-head"><h1>สารบัญ</h1><p lang="ms">Kandungan</p></header>
      <div class="toc-part"><h2>ส่วนนำ</h2><ul class="toc-list">
        <li><button type="button" class="toc-row" data-opencover><span class="toc-no"></span><span class="toc-title"><span class="solo">ปกนอก</span></span><span class="toc-dots" aria-hidden="true"></span><span class="toc-pg">หน้าปก</span></button></li>
        <li>${row("", '<span class="solo">ปกใน</span>', "ผู้เรียบเรียง", "#/kulit-dalam")}</li>
        <li>${row("", '<span class="solo">ข้อมูลรายวิชา</span>', "CLOs · การวัดผล", "#/kursus")}</li>
        <li>${row("", '<span class="solo">แผนการเรียน 15 สัปดาห์</span>', "หน้าแรก", "#/")}</li>
      </ul></div>
      ${part("morfologi")}${part("sintaksis")}
      <div class="toc-part"><h2>ภาคผนวก</h2><ul class="toc-list">
        <li>${row("", '<span class="solo">แบบทดสอบรวม</span>', "สุ่มจากทุกบท", "#/kuiz")}</li>
        <li>${row("", '<span class="solo">เครื่องมือฝึก: เติมปัจจัย · แปลงกรรมวาจก</span>', "บทที่ 6, 13", "#/alat")}</li>
        <li>${row("", '<span class="solo">อภิธานศัพท์ไวยากรณ์</span>', window.ISTILAH.length + " คำ", "#/istilah")}</li>
        <li>${row("", '<span class="solo">ตำราและแหล่งเรียนรู้</span>', "ข้อมูลรายวิชา", "#/kursus")}</li>
      </ul></div>
    </div></section>`;
    window.scrollTo(0, 0);
  }

  function notFound() { app.innerHTML = `<section class="section"><div class="wrap"><h2>ไม่พบหน้านี้</h2><p>ลิงก์อาจพิมพ์ผิด กลับไปที่ <a href="#/">แผนการเรียน</a> เพื่อเลือกบทเรียน</p></div></section>`; }

  /* ---------- ปุ่มนำทางด้านล่าง (ทุกหน้า) ---------- */
  const ICON = {
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    prev: '<path d="M15 5 8 12l7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6"/>',
    top: '<path d="M12 19V6"/><path d="M6 11l6-6 6 6"/>'
  };
  const ico = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const SEQ = [{ key: "kulit-dalam", href: "#/kulit-dalam", name: "ปกใน" }, { key: "kandungan", href: "#/kandungan", name: "สารบัญ" }, { key: "home", href: "#/", name: "แผนการเรียน" }]
    .concat(CH.map(c => ({ key: "bab" + c.no, href: babLink(c.no), name: "บทที่ " + c.no })))
    .concat([{ key: "kuiz", href: "#/kuiz", name: "แบบทดสอบ" }, { key: "alat", href: "#/alat", name: "เครื่องมือฝึก" }, { key: "istilah", href: "#/istilah", name: "อภิธานศัพท์" }, { key: "kursus", href: "#/kursus", name: "ข้อมูลรายวิชา" }]);
  function pageNav(key) {
    const nav = $("#pagenav"); const i = SEQ.findIndex(x => x.key === key);
    const prev = i > 0 ? SEQ[i - 1] : null, next = i >= 0 && i < SEQ.length - 1 ? SEQ[i + 1] : null;
    const cur = k => key === k ? ' aria-current="page"' : "";
    nav.innerHTML = `
      <a href="#/"${cur("home")}>${ico("home")}หน้าแรก</a>
      <span class="sep" aria-hidden="true"></span>
      ${key === "kulit-dalam" ? `<button type="button" class="pn-wide" data-opencover aria-label="ก่อนหน้า: ปกนอก">${ico("prev")}<span><small>ก่อนหน้า</small>ปกนอก</span></button>`
        : prev ? `<a class="pn-wide" href="${prev.href}" aria-label="ก่อนหน้า: ${prev.name}">${ico("prev")}<span><small>ก่อนหน้า</small>${prev.name}</span></a>`
             : `<span class="pn-wide is-off" aria-hidden="true">${ico("prev")}<span><small>ก่อนหน้า</small>—</span></span>`}
      ${next ? `<a class="pn-wide next" href="${next.href}" aria-label="ถัดไป: ${next.name}"><span><small>ถัดไป</small>${next.name}</span>${ico("next")}</a>`
             : `<span class="pn-wide next is-off" aria-hidden="true"><span><small>ถัดไป</small>—</span>${ico("next")}</span>`}
      <span class="sep" aria-hidden="true"></span>
      <a href="#/istilah"${cur("istilah")}>${ico("book")}ศัพท์</a>
      <button type="button" data-top>${ico("top")}บนสุด</button>`;
    $("[data-top]", nav).onclick = () => window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" });
  }

  /* ---------- หน้าปก (เปิด/ปิดได้) ---------- */
  const cover = $("#cover");
  $("#cover-term").textContent = C.term;
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
  $("#cover-skip").addEventListener("change", e => { const s = load(); s.cover = e.target.checked ? "off" : "on"; save(s); toast(e.target.checked ? "จะไม่แสดงหน้าปกอีก เปิดได้จากปุ่ม “หน้าปก” มุมขวาบน" : "จะแสดงหน้าปกทุกครั้งที่เปิดเว็บ"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !cover.hidden) closeCover(); });
  if (document.documentElement.classList.contains("no-cover")) cover.hidden = true;
  else { document.body.style.overflow = "hidden"; $("#cover-skip").checked = false; setTimeout(() => $("#cover-enter").focus({ preventScroll: true }), 50); }

  /* ---------- router ---------- */
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
    else if (p[0] === "kulit-dalam") kulitDalam();
    else if (p[0] === "kandungan") kandungan();
    else notFound();
    app.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);

  /* ---------- chrome ---------- */
  $(".menu-btn").addEventListener("click", e => { const n = $(".mainnav"); const o = n.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); });
  function applyTheme(t) { if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); }
  applyTheme(load().theme);
  $(".theme-btn").addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    const t = dark ? "light" : "dark"; applyTheme(t); const s = load(); s.theme = t; save(s);
  });
  route();
})();
