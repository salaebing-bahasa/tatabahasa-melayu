/* ข้อมูลรายวิชา — อ้างอิงจาก มคอ.3 (TSU03) รายวิชา 0113131 ภาคเรียนที่ 2 ปีการศึกษา 2569
   แก้ไขข้อมูลในไฟล์นี้ได้โดยตรง เว็บจะอัปเดตตามอัตโนมัติ
   เนื้อหาแต่ละบทอยู่ในโฟลเดอร์ content/ (ไฟล์ bab-01.md ถึง bab-13.md) */
window.COURSE = {
  code: "0113131",
  th: "ไวยากรณ์ภาษามลายู",
  en: "Malay Grammar",
  ms: "Tatabahasa Bahasa Melayu",
  credits: "3 (3-0-6)",
  term: "ภาคเรียนที่ 2 ปีการศึกษา 2569",
  /* ข้อมูลสำหรับหน้าปกใน */
  docType: "เอกสารประกอบการสอนออนไลน์",
  author: "ผู้ช่วยศาสตราจารย์มูหำหมัด สาแลบิง",
  authorDegree: "กศ.ม. (ภาษามลายู)",
  faculty: "สาขาวิชาภาษามลายู คณะมนุษยศาสตร์และสังคมศาสตร์",
  university: "มหาวิทยาลัยทักษิณ วิทยาเขตสงขลา",
  goal: "เพื่อให้นิสิตมีความรู้ความเข้าใจหลักไวยากรณ์ภาษามลายูตั้งแต่ระดับคำและกระบวนการสร้างคำ (วจีวิภาค) จนถึงการสร้างวลี อนุประโยค และประโยค (วากยสัมพันธ์) สามารถวิเคราะห์โครงสร้างภาษาและนำความรู้ไปใช้สื่อสารด้วยภาษามลายูได้ถูกต้องเหมาะสมกับบริบท",
  descTh: "หลักไวยากรณ์ภาษามลายูตั้งแต่วจีวิภาคถึงวากยสัมพันธ์ เพื่อเป็นเครื่องมือช่วยให้สามารถใช้ภาษาสื่อสารความหมายภาษามลายูได้อย่างถูกต้อง",
  descEn: "Malay Language grammar, including morphology to syntax, enables to communicate Malay Language correctly",
  clos: [
    { id: "CLO1", text: "อธิบายแนวคิดและองค์ประกอบสำคัญของวจีวิภาคและวากยสัมพันธ์ภาษามลายูได้อย่างถูกต้อง", weight: 30, how: "สอบกลางภาค (แบบทดสอบข้อเขียน)" },
    { id: "CLO2", text: "จำแนกชนิดคำและวิเคราะห์โครงสร้างคำ ตลอดจนกระบวนการสร้างคำในภาษามลายูได้", weight: 20, how: "แบบฝึกหัดและใบงานวิเคราะห์โครงสร้างภาษา" },
    { id: "CLO3", text: "วิเคราะห์โครงสร้างวลี อนุประโยค และประโยคภาษามลายูตามหลักไวยากรณ์ได้", weight: 20, how: "งานมอบหมายและกิจกรรมปฏิบัติ (เกณฑ์รูบริก)" },
    { id: "CLO4", text: "สร้างและปรับแก้ประโยคหรือข้อความภาษามลายูให้ถูกต้องตามหลักไวยากรณ์และเหมาะสมกับสถานการณ์สื่อสารได้", weight: 30, how: "สอบปลายภาค (ข้อเขียนเชิงวิเคราะห์และประยุกต์ใช้)" }
  ],
  grades: [["A","80–100","ดีเยี่ยม"],["B+","75–79","ดีมาก"],["B","70–74","ดี"],["C+","65–69","ค่อนข้างดี"],["C","60–64","พอใช้"],["D+","55–59","อ่อน"],["D","50–54","อ่อนมาก"],["F","ต่ำกว่า 50","ไม่ผ่าน"]],

  /* บทเรียน: no = เลขบท, file = ไฟล์เนื้อหาใน content/, part = ภาค (morfologi / sintaksis) */
  chapters: [
    { no: 1,  week: 1,  part: "morfologi", ms: "Pengenalan Tatabahasa", th: "บทนำ: ไวยากรณ์ภาษามลายูกับการสื่อสาร", clos: ["CLO1", "CLO4"] },
    { no: 2,  week: 2,  part: "morfologi", ms: "Morfem dan Kata", th: "หน่วยคำและคำ", clos: ["CLO1", "CLO2"] },
    { no: 3,  week: 3,  part: "morfologi", ms: "Kata Nama", th: "คำนาม", clos: ["CLO2", "CLO4"] },
    { no: 4,  week: 4,  part: "morfologi", ms: "Kata Kerja dan Kata Adjektif", th: "คำกริยาและคำคุณศัพท์", clos: ["CLO2", "CLO4"] },
    { no: 5,  week: 5,  part: "morfologi", ms: "Kata Tugas", th: "คำไวยากรณ์", clos: ["CLO2", "CLO4"] },
    { no: 6,  week: 6,  part: "morfologi", ms: "Pengimbuhan I: Awalan", th: "การเติมปัจจัย I: อุปสรรค", clos: ["CLO2"] },
    { no: 7,  week: 7,  part: "morfologi", ms: "Pengimbuhan II dan Pembentukan Kata Lain", th: "การเติมปัจจัย II และกระบวนการสร้างคำอื่น", clos: ["CLO2", "CLO4"] },
    { no: 8,  week: 9,  part: "sintaksis", ms: "Pengenalan Sintaksis", th: "บทนำวากยสัมพันธ์", clos: ["CLO1", "CLO3"] },
    { no: 9,  week: 10, part: "sintaksis", ms: "Frasa Nama dan Frasa Kerja", th: "วลีนามและวลีกริยา", clos: ["CLO3", "CLO4"] },
    { no: 10, week: 11, part: "sintaksis", ms: "Frasa Adjektif dan Frasa Sendi Nama", th: "วลีคุณศัพท์และวลีบุพบท", clos: ["CLO3", "CLO4"] },
    { no: 11, week: 12, part: "sintaksis", ms: "Ayat Dasar dan Jenis Ayat", th: "ประโยคพื้นฐานและชนิดของประโยค", clos: ["CLO3", "CLO4"] },
    { no: 12, week: 13, part: "sintaksis", ms: "Ayat Tunggal dan Ayat Majmuk", th: "ประโยคเดี่ยวและประโยครวม", clos: ["CLO3", "CLO4"] },
    { no: 13, week: 14, part: "sintaksis", ms: "Ragam, Susunan dan Transformasi Ayat", th: "วาจก การเรียงลำดับ และการแปลงประโยค", clos: ["CLO3", "CLO4"] }
  ],
  /* สัปดาห์ที่ไม่ใช่บทเรียน */
  extraWeeks: [
    { week: 8,  th: "สอบกลางภาค (บทที่ 1–7)", note: "CLO1 · 30%", href: "#/kuiz/morfologi", link: "ฝึกทำข้อสอบภาควจีวิภาค" },
    { week: 15, th: "ไวยากรณ์เพื่อการสื่อสาร: นำเสนอโครงงานแก้ไขข้อความจริงและทบทวน", note: "นำไปสู่สอบปลายภาค (CLO4 · 30%)", href: "#/bab/13/soalan", link: "ดูโจทย์โครงงาน" }
  ],

  teachers: [
    { name: "ผศ.มูหำหมัด สาแลบิง", role: "อาจารย์ผู้รับผิดชอบรายวิชาและผู้สอน", email: "smuhammad@tsu.ac.th" },
    { name: "อ.ดร.กูซม ยามิรูเด็ง", role: "อาจารย์ผู้รับผิดชอบรายวิชาและผู้สอน", email: "kusom@tsu.ac.th" },
    { name: "อ.ซัมซียะห์ มะลาเฮง", role: "อาจารย์ผู้รับผิดชอบรายวิชาและผู้สอน", email: "" }
  ],
  office: "วันพุธ 13.00–16.00 น. ห้องพักอาจารย์ 1316 (ผศ.มูหำหมัด สาแลบิง)",
  groups: [
    ["S101", "วันพฤหัสบดี คาบ 7–9 (14.00–17.10 น.)", "13532"],
    ["S102", "วันอังคาร คาบ 1–3 (08.00–11.10 น.)", "13507"],
    ["S103", "วันอังคาร คาบ 7–9 (14.00–17.10 น.)", "13505"],
    ["S104", "วันพุธ คาบ 1–3 (08.00–11.10 น.)", "15302"]
  ],
  books: [
    "มูหำหมัด สาแลบิง. (2569). <i>ไวยากรณ์ภาษามลายู</i>. สงขลา: หลักสูตรภาษามลายู คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยทักษิณ. (ตำราหลัก)",
    "Abdullah Hassan. (2003). <i>Tatabahasa Bahasa Melayu</i>. Pahang: PTS Publications &amp; Distributors.",
    "Alias Mohammad Yatim. (1998). <i>Mengenali Bahasa Melayu</i>. Kedah: Percetakan Paavai.",
    "Nik Safiah Karim, Farid M. Onn, Hashim Haji Musa &amp; Abdul Hamid Mahmood. (2015). <i>Tatabahasa Dewan Edisi Ketiga</i>. Kuala Lumpur: Dewan Bahasa dan Pustaka.",
    "Sulaiman Masri &amp; Ahmad Khair Mohd Nor. (2002). <i>Tatabahasa Melayu Mesra Pengguna</i>. Kuala Lumpur: Utusan Publications &amp; Distributors.",
    "Asmah Haji Omar. (2009). <i>Nahu Melayu Mutakhir</i> (Edisi Kelima). Kuala Lumpur: Dewan Bahasa dan Pustaka. (อ่านเพิ่มเติม)"
  ],
  resources: [
    { th: "Pusat Rujukan Persuratan Melayu (PRPM) — พจนานุกรมและคำถามการใช้ภาษา, Dewan Bahasa dan Pustaka", url: "https://prpm.dbp.gov.my/" },
    { th: "Dewan Bahasa dan Pustaka (DBP)", url: "https://www.dbp.gov.my/" }
  ]
};
