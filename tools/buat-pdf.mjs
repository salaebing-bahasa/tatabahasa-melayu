/* Membina PDF setiap bab daripada halaman laman web sendiri.
   สร้างไฟล์ PDF ของแต่ละบทจากหน้าเว็บจริง (ใช้รูปแบบสำหรับพิมพ์ใน style.css)

   Guna · วิธีใช้:  node tools/buat-pdf.mjs            (semua bab · ทุกบท)
                    node tools/buat-pdf.mjs 1 2        (bab tertentu · เฉพาะบทที่ระบุ)
   Hasil · ผลลัพธ์:  pdf/bab-01.pdf … pdf/bab-13.pdf

   Biasanya skrip ini dijalankan secara automatik oleh GitHub Actions
   (.github/workflows/pdf.yml) setiap kali fail dalam content/ diubah.
   ปกติสคริปต์นี้ทำงานอัตโนมัติทุกครั้งที่แก้ไฟล์ใน content/ ไม่ต้องรันเอง

   Pilihan persekitaran:
   CHROME_PATH = laluan pelayar Chrome (jika tidak menggunakan Chromium Playwright)
   FONT_DIR    = folder node_modules yang mengandungi @fontsource/* (untuk mesin tanpa akses Google Fonts) */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

let pw;
try { pw = await import("playwright"); } catch { pw = await import("playwright-core"); }
const { chromium } = pw;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "pdf");
const FONT_DIR = process.env.FONT_DIR || "";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".md": "text/markdown; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".woff": "font/woff", ".pdf": "application/pdf" };

/* Senarai bab daripada fail content/ */
let bab = fs.readdirSync(path.join(ROOT, "content")).map(f => (f.match(/^bab-(\d+)\.md$/) || [])[1]).filter(Boolean).map(Number).sort((a, b) => a - b);
const pilih = process.argv.slice(2).map(Number).filter(Boolean);
if (pilih.length) bab = bab.filter(n => pilih.includes(n));

/* Pelayan statik kecil · เซิร์ฟเวอร์ภายในเครื่องสำหรับเปิดหน้าเว็บ */
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file;
  if (p.startsWith("/__fonts/") && FONT_DIR) file = path.join(FONT_DIR, p.slice(9));
  else file = path.join(ROOT, p === "/" ? "index.html" : p);
  file = path.resolve(file);
  if (!file.startsWith(ROOT + path.sep) && !(FONT_DIR && file.startsWith(path.resolve(FONT_DIR) + path.sep))) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" }).end(data);
  });
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}`;

/* Fon tempatan (pilihan) menggantikan Google Fonts */
function fontCss() {
  const pick = [
    ["ibm-plex-sans-thai", ["400", "500", "600", "700"]],
    ["cormorant-garamond", ["500", "600", "700", "500-italic", "600-italic"]],
    ["noto-serif-thai", ["600", "700"]]
  ];
  return pick.map(([pkg, ws]) => ws.map(w => {
    const f = path.join(FONT_DIR, "@fontsource", pkg, w + ".css");
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8").replace(/url\(\.\/files\//g, `url(${BASE}/__fonts/@fontsource/${pkg}/files/`) : "";
  }).join("\n")).join("\n");
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 } });
await ctx.addInitScript(() => { try { localStorage.setItem("tb0113131", JSON.stringify({ cover: "off" })); } catch (e) {} });
if (FONT_DIR) {
  const css = fontCss();
  await ctx.route("https://fonts.googleapis.com/**", r => r.fulfill({ status: 200, contentType: "text/css", body: css }));
  await ctx.route("https://fonts.gstatic.com/**", r => r.abort());
}
fs.mkdirSync(OUT, { recursive: true });
const C = await (async () => { const pg = await ctx.newPage(); await pg.goto(BASE + "/index.html#/kandungan"); const c = await pg.evaluate(() => window.COURSE); await pg.close(); return c; })();

for (const n of bab) {
  const ch = C.chapters.find(c => c.no === n) || { ms: "", th: "" };
  const pg = await ctx.newPage();
  await pg.goto(`${BASE}/index.html#/bab/${n}`);
  await pg.waitForSelector("#bab-body .block", { timeout: 20000 });
  await pg.evaluate(async () => {
    document.querySelectorAll("details.hint").forEach(d => { d.open = true; });
    await document.fonts.ready;
  });
  await pg.emulateMedia({ media: "print" });
  const nn = String(n).padStart(2, "0");
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  await pg.pdf({
    path: path.join(OUT, `bab-${nn}.pdf`),
    format: "A4",
    printBackground: true,
    margin: { top: "16mm", bottom: "18mm", left: "16mm", right: "16mm" },
    displayHeaderFooter: true,
    headerTemplate: `<div style="width:100%;font-size:8px;color:#7A1F2B;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>${C.code} ${esc(C.ms)} · ${esc(C.th)}</span><span>Bab ${n} · ${esc(ch.ms)}</span></div>`,
    footerTemplate: `<div style="width:100%;font-size:8px;color:#6B5558;padding:0 16mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>Universiti Thaksin · มหาวิทยาลัยทักษิณ</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
  });
  await pg.close();
  console.log(`pdf/bab-${nn}.pdf`);
}
await browser.close();
server.close();
