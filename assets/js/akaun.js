/* Akaun pelajar · ระบบบัญชีผู้เรียน (Firebase Authentication + Firestore)
   - Log masuk dengan Google · ล็อกอินด้วยบัญชี Google
   - Segerakkan kemajuan (done, skor, akhir) daripada localStorage ke awan · ซิงก์ความก้าวหน้าขึ้นระบบ
   - Rekod setiap jawapan latihan/kuiz · บันทึกคำตอบรายข้อ (event "tb:jawab" จาก app.js)
   Kandungan pelajaran tetap boleh dibaca tanpa log masuk · เนื้อหาทุกบทยังเปิดอ่านได้โดยไม่ต้องล็อกอิน
   Struktur data · โครงสร้างข้อมูล:
     pelajar/{uid}                 { nama, emel, setuju, done, skor, akhir, dicipta, kemaskini }
     pelajar/{uid}/jawapan/{auto}  { bab, laluan, jenis, latihan, item, soalan, jawapan, betul, masa }
   Peraturan keselamatan: lihat fail firestore.rules · กฎความปลอดภัยอยู่ในไฟล์ firestore.rules */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, addDoc, getDocs, collection, query, orderBy, limit, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* Nilai ini awam (bukan kata laluan); keselamatan data dikawal oleh firestore.rules
   ค่าเหล่านี้เป็นค่าสาธารณะ ไม่ใช่รหัสผ่าน ความปลอดภัยของข้อมูลควบคุมด้วย firestore.rules */
const firebaseConfig = {
  apiKey: "AIzaSyBHtc0YDkMZmFjkrFC1zduyQjETAj2WGzk",
  authDomain: "tatabahasa-melayu.firebaseapp.com",
  projectId: "tatabahasa-melayu",
  storageBucket: "tatabahasa-melayu.firebasestorage.app",
  messagingSenderId: "657023566026",
  appId: "1:657023566026:web:8ef67ded91089adbf73433"
};

const KEY = "tb0113131";
const VERSI_SETUJU = 1; // naikkan jika teks persetujuan berubah · เพิ่มเลขเมื่อแก้ข้อความแจ้งเรื่องข้อมูล
const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = getFirestore(fb);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

let pengguna = null;     // pengguna yang sudah bersetuju · ผู้ใช้ที่ยอมรับข้อตกลงแล้ว
let sedia = false;       // data awan sudah digabung · รวมข้อมูลจากบัญชีแล้ว
let tSimpan = null;
let cacheJawapan = null; // jawapan pengguna semasa (terbaru dahulu) · คำตอบของผู้ใช้ปัจจุบัน เรียงใหม่สุดก่อน

/* Baca sejarah jawapan untuk Papan Pemuka dan Skor Saya · อ่านประวัติคำตอบสำหรับแดชบอร์ดและหน้าคะแนน */
async function jawapanSaya(paksa) {
  if (!pengguna || !sedia) return null;
  if (cacheJawapan && !paksa) return cacheJawapan;
  const snap = await getDocs(query(collection(db, "pelajar", pengguna.uid, "jawapan"), orderBy("masa", "desc"), limit(2000)));
  cacheJawapan = snap.docs.map(d => { const x = d.data(); return { ...x, soalan: x.soalan || "", masa: x.masa && x.masa.toMillis ? x.masa.toMillis() : Date.now() }; });
  return cacheJawapan;
}

const $ = s => document.querySelector(s);
const bacaLokal = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
const tulisLokal = o => { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* ignore */ } };
const toast = m => { const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 3200); };
const segar = () => window.dispatchEvent(new Event("tb:segar"));

/* Gabung kemajuan peranti ini dengan kemajuan dalam akaun · รวมความก้าวหน้าในเครื่องกับในบัญชี (เก็บค่าที่ดีที่สุด) */
function gabung(a, b) {
  const done = [...new Set([...(a.done || []), ...(b.done || [])])].sort((x, y) => x - y);
  const skor = { ...(a.skor || {}) };
  for (const [n, k] of Object.entries(b.skor || {})) {
    const p = skor[n];
    skor[n] = !p ? k : { ...(k.t > p.t ? k : p), best: Math.max(p.best || 0, k.best || 0), cuba: Math.max(p.cuba || 0, k.cuba || 0) };
  }
  const akhir = [a.akhir, b.akhir].filter(Boolean).sort((x, y) => (y.t || 0) - (x.t || 0))[0] || null;
  return { done, skor, akhir };
}
const kemajuanSahaja = o => ({ done: o.done || [], skor: o.skor || {}, akhir: o.akhir || null });

/* ---------- Butang akaun di bar atas · ปุ่มบัญชีที่แถบด้านบน ---------- */
function butang() {
  let w = $("#akaun-wrap");
  if (!w) {
    const sasaran = $(".topbar .theme-btn");
    if (!sasaran) return;
    w = document.createElement("div"); w.id = "akaun-wrap"; w.className = "akaun-wrap";
    sasaran.parentNode.insertBefore(w, sasaran);
  }
  if (!pengguna) {
    w.innerHTML = `<button type="button" class="akaun-btn akaun-masuk" id="akaun-masuk"><span lang="ms">Log masuk</span><small>เข้าสู่ระบบ</small></button>`;
    $("#akaun-masuk").onclick = masuk;
    return;
  }
  const nama = pengguna.displayName || pengguna.email || "?";
  w.innerHTML = `<button type="button" class="akaun-btn akaun-saya" id="akaun-saya" aria-expanded="false" aria-controls="akaun-menu" aria-label="Akaun saya · บัญชีของฉัน: ${esc(nama)}"><span class="akaun-huruf" aria-hidden="true">${esc(nama.trim().charAt(0).toUpperCase())}</span></button>
    <div class="akaun-menu" id="akaun-menu" hidden>
      <p class="akaun-nama">${esc(nama)}</p><p class="akaun-emel">${esc(pengguna.email || "")}</p>
      <a href="#/papan" class="akaun-pautan"><span lang="ms">Papan pemuka</span> · แดชบอร์ด</a>
      <a href="#/skor" class="akaun-pautan"><span lang="ms">Skor saya</span> · คะแนนของฉัน</a>
      <button type="button" class="btn btn-line" id="akaun-keluar"><span lang="ms">Log keluar</span> · ออกจากระบบ</button>
    </div>`;
  const b = $("#akaun-saya"), m = $("#akaun-menu");
  b.onclick = e => { e.stopPropagation(); const buka = m.hidden; m.hidden = !buka; b.setAttribute("aria-expanded", String(buka)); };
  m.addEventListener("click", e => e.stopPropagation());
  $("#akaun-keluar").onclick = keluar;
  m.querySelectorAll("a").forEach(a => a.onclick = () => { m.hidden = true; b.setAttribute("aria-expanded", "false"); });
}
document.addEventListener("click", () => { const m = $("#akaun-menu"); if (m && !m.hidden) { m.hidden = true; const b = $("#akaun-saya"); if (b) b.setAttribute("aria-expanded", "false"); } });
document.addEventListener("keydown", e => { if (e.key === "Escape") { const m = $("#akaun-menu"); if (m && !m.hidden) { m.hidden = true; const b = $("#akaun-saya"); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); } } } });
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

async function masuk() {
  try { await signInWithPopup(auth, provider); }
  catch (e) {
    if (e && (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")) { await signInWithRedirect(auth, provider); return; }
    if (e && (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request")) return;
    console.error(e); toast("Log masuk gagal · ล็อกอินไม่สำเร็จ — " + (e && e.code ? e.code : ""));
  }
}

async function keluar() {
  await simpanSekarang();
  await signOut(auth);
  /* Padam kemajuan pada peranti ini supaya pengguna lain (contoh: komputer makmal) tidak melihatnya
     ลบความก้าวหน้าในเครื่องนี้ เพื่อไม่ให้ผู้ใช้คนถัดไป (เช่น เครื่องในห้องแล็บ) เห็นข้อมูล */
  const s = bacaLokal(); delete s.done; delete s.skor; delete s.akhir; tulisLokal(s);
  toast("Anda telah log keluar · ออกจากระบบแล้ว");
  segar();
}

/* ---------- Persetujuan PDPA · หน้าขอความยินยอมเรื่องข้อมูลส่วนบุคคล ---------- */
function mintaSetuju() {
  return new Promise(resolve => {
    const d = document.createElement("dialog"); d.className = "akaun-dialog"; d.setAttribute("aria-labelledby", "akaun-dlg-h");
    d.innerHTML = `<h2 id="akaun-dlg-h"><span class="bm" lang="ms">Makluman penggunaan data</span><span class="tr">การใช้ข้อมูลของผู้เรียน</span></h2>
      <p class="bm" lang="ms">Apabila log masuk, laman ini menyimpan nama, alamat e-mel, kemajuan, skor dan jawapan latihan anda bagi kursus 0113131. Data ini boleh dilihat oleh pensyarah kursus dan digunakan untuk merancang pengajaran serta menambah baik pembelajaran. Data tidak dikongsi dengan pihak lain dan bukan rekod markah rasmi.</p>
      <p class="tr">เมื่อล็อกอิน เว็บไซต์จะบันทึกชื่อ อีเมล ความก้าวหน้า คะแนน และคำตอบแบบฝึกหัดของคุณในรายวิชา 0113131 อาจารย์ผู้สอนดูข้อมูลนี้ได้ และใช้เพื่อวางแผนการสอนและพัฒนาการเรียนรู้ ข้อมูลไม่เปิดเผยแก่บุคคลอื่น และไม่ใช่คะแนนอย่างเป็นทางการ</p>
      <p class="tr">ถ้าไม่ต้องการ กด "ไม่ยอมรับ" แล้วยังอ่านบทเรียนและทำแบบฝึกได้ตามปกติโดยไม่ต้องล็อกอิน ข้อมูลจะเก็บไว้ในเครื่องนี้เท่านั้น สอบถามหรือขอลบข้อมูลได้ที่ <a href="mailto:smuhammad@tsu.ac.th">smuhammad@tsu.ac.th</a></p>
      <div class="akaun-dlg-btn"><button type="button" class="btn btn-line" value="tidak"><span lang="ms">Tidak setuju</span> · ไม่ยอมรับ</button><button type="button" class="btn btn-solid" value="ya"><span lang="ms">Setuju</span> · ยอมรับ</button></div>`;
    document.body.appendChild(d);
    const tutup = v => { d.close(); d.remove(); resolve(v); };
    d.querySelectorAll("button").forEach(b => b.onclick = () => tutup(b.value === "ya"));
    d.addEventListener("cancel", e => { e.preventDefault(); tutup(false); });
    d.showModal();
  });
}

/* ---------- Selepas log masuk · หลังล็อกอิน ---------- */
async function selepasMasuk(u) {
  const ref = doc(db, "pelajar", u.uid);
  let awan = {};
  try { const snap = await getDoc(ref); awan = snap.exists() ? snap.data() : {}; }
  catch (e) { console.error(e); toast("Tidak dapat membaca akaun · อ่านข้อมูลบัญชีไม่ได้"); await signOut(auth); return; }

  if ((awan.setuju && awan.setuju.versi) !== VERSI_SETUJU) {
    const ok = await mintaSetuju();
    if (!ok) { await signOut(auth); toast("Tidak log masuk. Kemajuan disimpan pada peranti ini sahaja · ไม่ได้ล็อกอิน บันทึกเฉพาะในเครื่องนี้"); return; }
  }
  const lokal = bacaLokal();
  const g = gabung(kemajuanSahaja(awan), kemajuanSahaja(lokal));
  tulisLokal({ ...lokal, ...g });
  const data = { nama: u.displayName || "", emel: u.email || "", ...g, kemaskini: serverTimestamp() };
  if (!awan.dicipta) data.dicipta = serverTimestamp();
  if ((awan.setuju && awan.setuju.versi) !== VERSI_SETUJU) data.setuju = { versi: VERSI_SETUJU, masa: serverTimestamp() };
  try { await setDoc(ref, data, { merge: true }); }
  catch (e) { console.error(e); toast("Tidak dapat menyimpan ke akaun · บันทึกลงบัญชีไม่ได้"); }
  pengguna = u; sedia = true;
  butang(); segar();
  toast(`Selamat datang · ยินดีต้อนรับ ${u.displayName || u.email || ""}`);
}

async function simpanSekarang() {
  clearTimeout(tSimpan); tSimpan = null;
  if (!pengguna || !sedia) return;
  try { await setDoc(doc(db, "pelajar", pengguna.uid), { ...kemajuanSahaja(bacaLokal()), kemaskini: serverTimestamp() }, { merge: true }); }
  catch (e) { console.error(e); }
}

/* Dipanggil oleh app.js setiap kali kemajuan disimpan · app.js เรียกทุกครั้งที่บันทึกความก้าวหน้า */
window.TBAkaun = {
  pengguna: () => pengguna,
  jawapanSaya,
  simpan: () => { if (!pengguna || !sedia) return; clearTimeout(tSimpan); tSimpan = setTimeout(simpanSekarang, 1500); },
  masuk, keluar
};

window.addEventListener("tb:jawab", e => {
  if (!pengguna || !sedia) return;
  const d = e.detail || {};
  const rek = {
    bab: Number.isInteger(d.bab) ? d.bab : null, laluan: String(d.laluan || "").slice(0, 120), jenis: String(d.jenis || "").slice(0, 30),
    latihan: String(d.latihan || "").slice(0, 30), item: Number(d.item) || 0, soalan: String(d.soalan || "").slice(0, 300),
    jawapan: String(d.jawapan || "").slice(0, 300), betul: !!d.betul
  };
  if (cacheJawapan) cacheJawapan.unshift({ ...rek, masa: Date.now() });
  addDoc(collection(db, "pelajar", pengguna.uid, "jawapan"), { ...rek, masa: serverTimestamp() }).catch(err => console.error(err));
});
window.addEventListener("pagehide", () => { if (tSimpan) simpanSekarang(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && tSimpan) simpanSekarang(); });

getRedirectResult(auth).catch(e => console.error(e));
onAuthStateChanged(auth, u => {
  pengguna = null; sedia = false; cacheJawapan = null; butang();
  if (u) selepasMasuk(u);
});
butang();
