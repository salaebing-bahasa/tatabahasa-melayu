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
  termMs: "Semester 2 Tahun Akademik 2569",
  /* ข้อมูลสำหรับหน้าปกใน */
  docType: "เอกสารประกอบการสอนออนไลน์",
  docTypeMs: "Dokumen Pengajaran Dalam Talian",
  author: "ผู้ช่วยศาสตราจารย์มูหำหมัด สาแลบิง",
  authorMs: "Penolong Profesor Muhammad Salaebing",
  authorDegree: "กศ.ม. (ภาษามลายู)",
  faculty: "สาขาวิชาภาษามลายู คณะมนุษยศาสตร์และสังคมศาสตร์",
  facultyMs: "Program Bahasa Melayu, Fakulti Kemanusiaan dan Sains Sosial",
  university: "มหาวิทยาลัยทักษิณ วิทยาเขตสงขลา",
  universityMs: "Universiti Thaksin, Kampus Songkhla",
  goal: "เพื่อให้นิสิตมีความรู้ความเข้าใจหลักไวยากรณ์ภาษามลายูตั้งแต่ระดับคำและกระบวนการสร้างคำ (วจีวิภาค) จนถึงการสร้างวลี อนุประโยค และประโยค (วากยสัมพันธ์) สามารถวิเคราะห์โครงสร้างภาษาและนำความรู้ไปใช้สื่อสารด้วยภาษามลายูได้ถูกต้องเหมาะสมกับบริบท",
  goalMs: "Supaya pelajar memahami prinsip tatabahasa bahasa Melayu daripada peringkat kata dan proses pembentukan kata (morfologi) hingga pembinaan frasa, klausa dan ayat (sintaksis), dapat menganalisis struktur bahasa, dan menggunakan pengetahuan itu untuk berkomunikasi dalam bahasa Melayu dengan betul dan sesuai dengan konteks.",
  descMs: "Prinsip tatabahasa bahasa Melayu daripada morfologi hingga sintaksis sebagai alat untuk berkomunikasi dalam bahasa Melayu dengan betul.",
  descTh: "หลักไวยากรณ์ภาษามลายูตั้งแต่วจีวิภาคถึงวากยสัมพันธ์ เพื่อเป็นเครื่องมือช่วยให้สามารถใช้ภาษาสื่อสารความหมายภาษามลายูได้อย่างถูกต้อง",
  descEn: "Malay Language grammar, including morphology to syntax, enables to communicate Malay Language correctly",
  clos: [
    { id: "CLO1", ms: "Menghuraikan konsep dan unsur utama morfologi dan sintaksis bahasa Melayu dengan betul", howMs: "Peperiksaan pertengahan semester (ujian bertulis)", text: "อธิบายแนวคิดและองค์ประกอบสำคัญของวจีวิภาคและวากยสัมพันธ์ภาษามลายูได้อย่างถูกต้อง", weight: 30, how: "สอบกลางภาค (แบบทดสอบข้อเขียน)" },
    { id: "CLO2", ms: "Mengklasifikasikan golongan kata serta menganalisis struktur kata dan proses pembentukan kata dalam bahasa Melayu", howMs: "Latihan dan lembaran kerja analisis struktur bahasa", text: "จำแนกชนิดคำและวิเคราะห์โครงสร้างคำ ตลอดจนกระบวนการสร้างคำในภาษามลายูได้", weight: 20, how: "แบบฝึกหัดและใบงานวิเคราะห์โครงสร้างภาษา" },
    { id: "CLO3", ms: "Menganalisis struktur frasa, klausa dan ayat bahasa Melayu berdasarkan prinsip tatabahasa", howMs: "Tugasan dan aktiviti amali (rubrik)", text: "วิเคราะห์โครงสร้างวลี อนุประโยค และประโยคภาษามลายูตามหลักไวยากรณ์ได้", weight: 20, how: "งานมอบหมายและกิจกรรมปฏิบัติ (เกณฑ์รูบริก)" },
    { id: "CLO4", ms: "Membina dan membetulkan ayat atau teks bahasa Melayu supaya betul dari segi tatabahasa dan sesuai dengan situasi komunikasi", howMs: "Peperiksaan akhir (penulisan analitis dan aplikasi)", text: "สร้างและปรับแก้ประโยคหรือข้อความภาษามลายูให้ถูกต้องตามหลักไวยากรณ์และเหมาะสมกับสถานการณ์สื่อสารได้", weight: 30, how: "สอบปลายภาค (ข้อเขียนเชิงวิเคราะห์และประยุกต์ใช้)" }
  ],
  /* ===== Pemetaan CLO · การเชื่อมโยง CLO =====
     rasmi  = คัดจาก มคอ.3 (TSU03) ตามต้นฉบับ ห้ามแก้ข้อความ CLO เอง
     pelan  = คัดจาก "แผนการสอนรายสัปดาห์ รายวิชา 0113131" ของผู้สอน
     aktiviti = ข้อเสนอการเชื่อมโยงกิจกรรมบนเว็บไซต์ (ไม่ใช่เอกสารทางการ) */
  mko3: {
    sumberTh: "มคอ.3 (TSU03) รายวิชา 0113131 ไวยากรณ์ภาษามลายู ภาคเรียนที่ 2/2569 ปรับปรุงวันที่ 23 ตุลาคม 2569",
    sumberMs: "Dokumen มคอ.3 (TSU03) kursus 0113131 Tatabahasa Melayu, Semester 2/2569, dikemas kini 23 Oktober 2569",
    pelanTh: "แผนการสอนรายสัปดาห์ รายวิชา 0113131 ไวยากรณ์ภาษามลายู (เอกสารของผู้สอน)",
    pelanMs: "Rancangan pengajaran mingguan kursus 0113131 (dokumen pensyarah)",
    rasmi: {
      CLO1: { ajarTh: "บรรยายแบบมีส่วนร่วม แผนผังแนวคิด อภิปรายตัวอย่าง", ajarMs: "Kuliah interaktif, peta konsep, perbincangan contoh", alatTh: "แบบทดสอบความรู้ แบบฝึกอธิบายแนวคิด", alatMs: "Ujian pengetahuan, latihan menghuraikan konsep" },
      CLO2: { ajarTh: "วิเคราะห์คำจากข้อความจริง กิจกรรมกลุ่มจำแนกคำ", ajarMs: "Analisis kata daripada teks sebenar, aktiviti kumpulan mengklasifikasikan kata", alatTh: "ใบงานวิเคราะห์คำ แบบทดสอบเชิงวิเคราะห์", alatMs: "Lembaran kerja analisis kata, ujian analitis" },
      CLO3: { ajarTh: "ฝึกแยกส่วนประกอบวลีและประโยค อภิปรายกรณีศึกษา", ajarMs: "Latihan mencerakinkan unsur frasa dan ayat, perbincangan kajian kes", alatTh: "ใบงานวิเคราะห์ประโยค แบบทดสอบ", alatMs: "Lembaran kerja analisis ayat, ujian" },
      CLO4: { ajarTh: "ฝึกเขียนและแก้ไขข้อความ แลกเปลี่ยนข้อเสนอแนะระหว่างเพื่อน", ajarMs: "Latihan menulis dan membetulkan teks, maklum balas rakan sebaya", alatTh: "ชิ้นงานเขียน/แก้ไขข้อความ เกณฑ์ประเมินรูบริก", alatMs: "Hasil penulisan/pembetulan teks, rubrik penilaian" }
    },
    /* bab: เลขบทบนเว็บ (null = สัปดาห์ที่ไม่มีบท) · clos: ตามแผนรายสัปดาห์ · web: CLO ที่เว็บติดป้ายเพิ่ม (course.js หรือหัวข้อผลลัพธ์การเรียนรู้ของบท) */
    pelan: [
      { week: 1,  bab: 1,    clos: ["CLO1"],         web: ["CLO4"], th: "แบบทดสอบก่อนเรียน (ไม่คิดคะแนน)", ms: "Ujian pra (tidak diberi markah)" },
      { week: 2,  bab: 2,    clos: ["CLO1", "CLO2"], web: [],       th: "ใบงาน 1 วิเคราะห์หน่วยคำ", ms: "Lembaran kerja 1: analisis morfem" },
      { week: 3,  bab: 3,    clos: ["CLO2"],         web: ["CLO4"], th: "ใบงานจำแนกคำนามและสรรพนาม", ms: "Lembaran kerja: kata nama dan kata ganti nama" },
      { week: 4,  bab: 4,    clos: ["CLO2"],         web: ["CLO4"], th: "แบบฝึกในชั้นและ Exit ticket", ms: "Latihan dalam kelas dan exit ticket" },
      { week: 5,  bab: 5,    clos: ["CLO2", "CLO4"], web: ["CLO1"], th: "แบบทดสอบย่อย 1", ms: "Kuiz 1" },
      { week: 6,  bab: 6,    clos: ["CLO2"],         web: [],       th: "ใบงาน 2 การเติมหน่วยคำ", ms: "Lembaran kerja 2: pengimbuhan" },
      { week: 7,  bab: 7,    clos: ["CLO2", "CLO4"], web: [],       th: "ชิ้นงานกลุ่ม (โพสต์ประชาสัมพันธ์)", ms: "Tugasan kumpulan (hantaran promosi)" },
      { week: 8,  bab: null, clos: ["CLO1", "CLO2"], web: [],       th: "สอบกลางภาค: ส่วน CLO1 40 คะแนน, ส่วน CLO2 60 คะแนน", ms: "Peperiksaan pertengahan: bahagian CLO1 40 markah, bahagian CLO2 60 markah" },
      { week: 9,  bab: 8,    clos: ["CLO1", "CLO3"], web: [],       th: "แบบฝึกแยกส่วนประกอบประโยค", ms: "Latihan mencerakinkan unsur ayat" },
      { week: 10, bab: 9,    clos: ["CLO3"],         web: ["CLO4"], th: "ใบงาน 3 วิเคราะห์วลี", ms: "Lembaran kerja 3: analisis frasa" },
      { week: 11, bab: 10,   clos: ["CLO3"],         web: ["CLO4"], th: "แบบทดสอบย่อย 2", ms: "Kuiz 2" },
      { week: 12, bab: 11,   clos: ["CLO3", "CLO4"], web: ["CLO1"], th: "แบบฝึกในชั้นและประกาศของกลุ่ม", ms: "Latihan dalam kelas dan pengumuman kumpulan" },
      { week: 13, bab: 12,   clos: ["CLO3", "CLO4"], web: [],       th: "ใบงาน 4 วิเคราะห์ประโยค", ms: "Lembaran kerja 4: analisis ayat" },
      { week: 14, bab: 13,   clos: ["CLO3", "CLO4"], web: [],       th: "ชิ้นงานเขียนและปรับแก้ข้อความ (รูบริก)", ms: "Hasil penulisan dan pembetulan teks (rubrik)" },
      { week: 15, bab: null, clos: ["CLO4"],         web: [],       th: "การนำเสนอ (รูบริก) และแบบทดสอบหลังเรียน", ms: "Pembentangan (rubrik) dan ujian pasca" }
    ],
    /* ข้อเสนอ: กิจกรรมบนเว็บไซต์ → CLO (h = ลิงก์) */
    aktiviti: {
      CLO1: [
        { ms: "Benar atau Salah", th: "ถูกหรือผิด", h: "#/bab/1/latihan" },
        { ms: "Soalan Objektif (konsep)", th: "ปรนัย (แนวคิด)", h: "#/bab/1/latihan" },
        { ms: "Konsep dan Definisi · Rumusan", th: "แนวคิดและนิยาม · สรุป", h: "#/bab/8/konsep" },
        { ms: "Kuiz Penilaian A–B (Bab 1, 2, 8)", th: "แบบทดสอบท้ายบท ก–ข", h: "#/bab/2/kuiz" }
      ],
      CLO2: [
        { ms: "Kenal Pasti Golongan Kata", th: "ระบุชนิดของคำ", h: "#/bab/3/latihan" },
        { ms: "Isi Tempat Kosong (imbuhan dan kata tugas)", th: "เติมคำ (ปัจจัยและคำไวยากรณ์)", h: "#/bab/6/latihan" },
        { ms: "Alat Latihan: pengimbuhan kata dasar", th: "เครื่องมือฝึก: เติมปัจจัย", h: "#/alat" },
        { ms: "Kuiz Morfologi (Bab 1–7)", th: "แบบทดสอบภาควจีวิภาค", h: "#/kuiz/morfologi" }
      ],
      CLO3: [
        { ms: "Analisis Struktur Ayat", th: "วิเคราะห์โครงสร้างประโยค", h: "#/bab/9/latihan" },
        { ms: "Rajah pohon (Bab 8, Kuiz B)", th: "แผนภูมิต้นไม้", h: "#/bab/8/kuiz" },
        { ms: "Kajian Kes (Bab 8–13)", th: "กรณีศึกษา", h: "#/bab/12/latihan" },
        { ms: "Kuiz Sintaksis (Bab 8–13)", th: "แบบทดสอบภาควากยสัมพันธ์", h: "#/kuiz/sintaksis" }
      ],
      CLO4: [
        { ms: "Betulkan Kesalahan Ayat", th: "แก้ไขประโยคที่ผิด", h: "#/bab/5/latihan" },
        { ms: "Kesalahan Lazim", th: "ข้อผิดพลาดที่พบบ่อย", h: "#/bab/13/kesalahan" },
        { ms: "Alat Latihan: ayat aktif → pasif", th: "เครื่องมือฝึก: กรรตุ → กรรมวาจก", h: "#/alat" },
        { ms: "Soalan Pemikiran Kritis (Kuiz C) dan projek minggu 15", th: "โจทย์คิดวิเคราะห์ และโครงงานสัปดาห์ 15", h: "#/bab/13/kuiz" }
      ]
    }
  },

  grades: [["A","80–100","ดีเยี่ยม","Cemerlang"],["B+","75–79","ดีมาก","Sangat baik"],["B","70–74","ดี","Baik"],["C+","65–69","ค่อนข้างดี","Agak baik"],["C","60–64","พอใช้","Sederhana"],["D+","55–59","อ่อน","Lemah"],["D","50–54","อ่อนมาก","Sangat lemah"],["F","0–49","ไม่ผ่าน","Gagal"]],

  /* บทเรียน: no = เลขบท, part = ภาค (morfologi / sintaksis)
     struktur: 12 = บทที่เขียนตามโครงสร้างใหม่ 12 หัวข้อ (Tajuk Pelajaran … Rujukan) ถ้าไม่ใส่จะเป็นโครงสร้างเดิม 6 หัวข้อ */
  chapters: [
    { no: 1,  week: 1,  part: "morfologi", ms: "Pengenalan Tatabahasa", th: "บทนำ: ไวยากรณ์ภาษามลายูกับการสื่อสาร", clos: ["CLO1", "CLO4"], struktur: 12 },
    { no: 2,  week: 2,  part: "morfologi", ms: "Morfem dan Kata", th: "หน่วยคำและคำ", clos: ["CLO1", "CLO2"], struktur: 12 },
    { no: 3,  week: 3,  part: "morfologi", ms: "Kata Nama", th: "คำนาม", clos: ["CLO2", "CLO4"], struktur: 12 },
    { no: 4,  week: 4,  part: "morfologi", ms: "Kata Kerja dan Kata Adjektif", th: "คำกริยาและคำคุณศัพท์", clos: ["CLO2", "CLO4"], struktur: 12 },
    { no: 5,  week: 5,  part: "morfologi", ms: "Kata Tugas", th: "คำไวยากรณ์", clos: ["CLO2", "CLO4"], struktur: 12 },
    { no: 6,  week: 6,  part: "morfologi", ms: "Pengimbuhan I: Awalan", th: "การเติมปัจจัย I: อุปสรรค", clos: ["CLO2"], struktur: 12 },
    { no: 7,  week: 7,  part: "morfologi", ms: "Pengimbuhan II dan Pembentukan Kata Lain", th: "การเติมปัจจัย II และกระบวนการสร้างคำอื่น", clos: ["CLO2", "CLO4"], struktur: 12 },
    { no: 8,  week: 9,  part: "sintaksis", ms: "Pengenalan Sintaksis", th: "บทนำวากยสัมพันธ์", clos: ["CLO1", "CLO3"], struktur: 12 },
    { no: 9,  week: 10, part: "sintaksis", ms: "Frasa Nama dan Frasa Kerja", th: "วลีนามและวลีกริยา", clos: ["CLO3", "CLO4"], struktur: 12 },
    { no: 10, week: 11, part: "sintaksis", ms: "Frasa Adjektif dan Frasa Sendi Nama", th: "วลีคุณศัพท์และวลีบุพบท", clos: ["CLO3", "CLO4"], struktur: 12 },
    { no: 11, week: 12, part: "sintaksis", ms: "Ayat Dasar dan Jenis Ayat", th: "ประโยคพื้นฐานและชนิดของประโยค", clos: ["CLO3", "CLO4"], struktur: 12 },
    { no: 12, week: 13, part: "sintaksis", ms: "Ayat Tunggal dan Ayat Majmuk", th: "ประโยคเดี่ยวและประโยครวม", clos: ["CLO3", "CLO4"], struktur: 12 },
    { no: 13, week: 14, part: "sintaksis", ms: "Ragam, Susunan dan Transformasi Ayat", th: "วาจก การเรียงลำดับ และการแปลงประโยค", clos: ["CLO3", "CLO4"], struktur: 12 }
  ],
  /* สัปดาห์ที่ไม่ใช่บทเรียน */
  extraWeeks: [
    { week: 8,  ms: "Peperiksaan pertengahan semester (Bab 1–7)", th: "สอบกลางภาค (บทที่ 1–7)", note: "CLO1 · 30%", href: "#/kuiz/morfologi", linkMs: "Latihan soalan morfologi", link: "ฝึกทำข้อสอบภาควจีวิภาค" },
    { week: 15, ms: "Tatabahasa untuk komunikasi: pembentangan projek pembetulan teks sebenar dan ulang kaji", th: "ไวยากรณ์เพื่อการสื่อสาร: นำเสนอโครงงานแก้ไขข้อความจริงและทบทวน", note: "Menuju peperiksaan akhir · นำไปสู่สอบปลายภาค (CLO4 · 30%)", href: "#/bab/13/soalan", linkMs: "Lihat tugasan projek", link: "ดูโจทย์โครงงาน" }
  ],

  teachers: [
    { name: "ผศ.มูหำหมัด สาแลบิง", roleMs: "Penyelaras dan pensyarah kursus", role: "อาจารย์ผู้รับผิดชอบรายวิชาและผู้สอน", email: "smuhammad@tsu.ac.th" },
    { name: "อ.ดร.กูซม ยามิรูเด็ง", roleMs: "Penyelaras dan pensyarah kursus", role: "อาจารย์ผู้รับผิดชอบรายวิชาและผู้สอน", email: "kusom@tsu.ac.th" },
    { name: "อ.ซัมซียะห์ มะลาเฮง", roleMs: "Penyelaras dan pensyarah kursus", role: "อาจารย์ผู้รับผิดชอบรายวิชาและผู้สอน", email: "" }
  ],
  officeMs: "Rabu 13.00–16.00, bilik pensyarah 1316 (Penolong Profesor Muhammad Salaebing)",
  office: "วันพุธ 13.00–16.00 น. ห้องพักอาจารย์ 1316 (ผศ.มูหำหมัด สาแลบิง)",
  groups: [
    ["S101", "วันพฤหัสบดี คาบ 7–9 (14.00–17.10 น.)", "13532", "Khamis, waktu 7–9 (14.00–17.10)"],
    ["S102", "วันอังคาร คาบ 1–3 (08.00–11.10 น.)", "13507", "Selasa, waktu 1–3 (08.00–11.10)"],
    ["S103", "วันอังคาร คาบ 7–9 (14.00–17.10 น.)", "13505", "Selasa, waktu 7–9 (14.00–17.10)"],
    ["S104", "วันพุธ คาบ 1–3 (08.00–11.10 น.)", "15302", "Rabu, waktu 1–3 (08.00–11.10)"]
  ],
  books: [
    "มูหำหมัด สาแลบิง. (2569). <i>ไวยากรณ์ภาษามลายู</i>. สงขลา: หลักสูตรภาษามลายู คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยทักษิณ. (buku teks utama · ตำราหลัก)",
    "Abdullah Hassan. (2002). <i>Tatabahasa Bahasa Melayu: Morfologi dan Sintaksis untuk Guru dan Pelajar</i>. Pahang: PTS Publications &amp; Distributors.",
    "Alias Mohammad Yatim. (1998). <i>Mengenali Bahasa Melayu</i>. Penerbitan Sarlis.",
    "Nik Safiah Karim, Farid M. Onn, Hashim Haji Musa &amp; Abdul Hamid Mahmood. (2015). <i>Tatabahasa Dewan Edisi Ketiga</i>. Kuala Lumpur: Dewan Bahasa dan Pustaka.",
    "Sulaiman Masri &amp; Ahmad Khair Mohd. Nor. (2002). <i>Tatabahasa Melayu Mesra Pengguna</i>. Kuala Lumpur: Utusan Publications &amp; Distributors.",
    "Asmah Haji Omar. (2009). <i>Nahu Melayu Mutakhir</i> (Edisi Kelima). Kuala Lumpur: Dewan Bahasa dan Pustaka. (bacaan tambahan · อ่านเพิ่มเติม)"
  ],
  resources: [
    { th: "Pusat Rujukan Persuratan Melayu (PRPM), Dewan Bahasa dan Pustaka — kamus dan khidmat nasihat bahasa · พจนานุกรมและคำถามการใช้ภาษา", url: "https://prpm.dbp.gov.my/" },
    { th: "Dewan Bahasa dan Pustaka (DBP)", url: "https://www.dbp.gov.my/" }
  ]
};
