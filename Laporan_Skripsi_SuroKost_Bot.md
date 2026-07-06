# [DRAFT PANDUAN SPESIFIK] LAPORAN AKADEMIS NASKAH SKRIPSI SUROKOST BOT
### PROGRAM STUDI D4 TEKNIK INFORMATIKA - FAKULTAS VOKASI - UNIVERSITAS AIRLANGGA

---

> [!IMPORTANT]  
> Naskah ini dirancang khusus sebagai panduan pengerjaan bagi kelompok yang terdiri dari 3 mahasiswa. Teks di dalam kotak merah bertanda **`[INSTRUKSI MAHASISWA ...]`** adalah perintah pengerjaan yang sangat spesifik, detail, dan tidak mengawang agar pembagian kerja seimbang dan adil.

---

## HALAMAN JUDUL
**RANCANGAN BANGUN CHATBOT INFORMASI PENCARIAN KOST DI SURABAYA MENGGUNAKAN METODE KEYWORD MATCHING DENGAN FALLBACK GENERATIVE AI (GEMINI)**

**LAPORAN TUGAS AKHIR**

*Disusun Oleh:*
1. **[Nama Mahasiswa A]** - NIM. **[15211128XXXX]** *(PJ: Bab I, Bab II, & Abstrak)*
2. **[Nama Mahasiswa B]** - NIM. **[15211128XXXX]** *(PJ: Bab III)*
3. **[Nama Mahasiswa C]** - NIM. **[15211128XXXX]** *(PJ: Bab IV, Bab V, & Bab VI)*

**PROGRAM STUDI D4 TEKNIK INFORMATIKA\nDEPARTEMEN TEKNIK\nFAKULTAS VOKASI\nUNIVERSITAS AIRLANGGA\n2026**

---

## ABSTRAK
> **`[INSTRUKSI MAHASISWA A]`**  
> Tulis naskah abstrak Indonesia dengan panjang **150 - 200 kata**, ditulis dalam **1 paragraf tunggal dengan spasi 1.0**. Paragraf abstrak wajib memuat kalimat-kalimat yang menjawab poin berikut secara runut:
> 1. *Latar Belakang*: Urgensi pencarian kost mahasiswa pendatang dekat UNAIR Kampus A & B Surabaya.
> 2. *Masalah*: Keterbatasan survei fisik manual dan mahalnya biaya pemanggilan API penuh pada chatbot AI.
> 3. *Metode*: Penerapan arsitektur hibrida (Local Keyword Matching NLP Engine + Gemini API Fallback) dikombinasikan dengan Leaflet.js untuk peta interaktif.
> 4. *Hasil & Pengujian*: Persentase keberhasilan parser lokal (tulis angka uji coba fungsional) dan rata-rata kecepatan respon lokal (< 10ms) dibandingkan Gemini API.
> 5. *Kesimpulan*: Chatbot hibrida ini efektif membantu mahasiswa dan menekan biaya pemakaian API Key.
>
> *Setelah paragraf selesai, tuliskan 3 hingga 5 kata kunci (keywords) yang dipisahkan oleh tanda koma.*

**Kata Kunci**: [Kata Kunci 1], [Kata Kunci 2], [Kata Kunci 3]

---

## ABSTRACT
> **`[INSTRUKSI MAHASISWA A]`**  
> Terjemahkan naskah abstrak di atas ke dalam bahasa Inggris akademik yang baik dan benar. Gunakan tenses *Present Tense* untuk fakta umum dan *Past Tense* untuk hasil pengujian yang telah selesai. Ditulis dalam **format cetak miring (italic) dan spasi 1.0**.

***Keywords***: [Keyword 1], [Keyword 2], [Keyword 3] (italic)

---

## KATA PENGANTAR
> **`[INSTRUKSI MAHASISWA A & KELOMPOK]`**  
> Tuliskan kata pengantar formal sepanjang **3-4 paragraf dengan spasi 1.5**. 
> - *Paragraf 1*: Ungkapan rasa syukur atas selesainya proyek SuroKost Bot untuk UAS Praktikum Data Mining.
> - *Paragraf 2*: Penjelasan singkat mengenai tujuan pembuatan aplikasi dan laporan skripsi ini.
> - *Paragraf 3*: Daftar ucapan terima kasih secara terstruktur kepada: (1) Dekan Fakultas Vokasi, (2) Dosen Pengampu Praktikum Data Mining, (3) Koordinator D4 TI, (4) Orang tua, dan (5) Anggota kelompok yang saling bekerja sama.
> - *Paragraf 4*: Harapan dan keterbukaan penulis terhadap kritik yang membangun.

Surabaya, 6 Juli 2026  
Penulis

---

## BAB I PENDAHULUAN
> **`[INSTRUKSI MAHASISWA A]`**  
> Mahasiswa A wajib menyusun pendahuluan secara logis dan ilmiah. Jangan menulis kalimat yang terlalu umum (mengawang). Ikuti instruksi detail per subbab berikut:

### 1.1 Latar Belakang
> Tuliskan latar belakang masalah minimal **4 paragraf (minimal 600 kata)** dengan susunan paragraf sebagai berikut:
> - **Paragraf 1 (Urgensi Spasial)**: Jelaskan pertumbuhan mahasiswa pendatang di Universitas Airlangga Surabaya setiap tahunnya. Sebutkan nama-mana kelurahan padat kost di sekitar Kampus A (Jalan Dharmawangsa, Pacar Kembang) dan Kampus B (Jalan Karangmenjangan, Gubeng, Mojo).
> - **Paragraf 2 (Kendala Manual)**: Uraikan kendala mahasiswa saat mencari kost secara fisik (lelah, memakan waktu berhari-hari, kesulitan membandingkan harga bulanan, dan keterbatasan informasi fasilitas seperti AC/WiFi secara akurat).
> - **Paragraf 3 (Gap Solusi & Chatbot Hibrida)**: Jelaskan keterbatasan chatbot rule-based biasa (kaku, jika input salah langsung error) dan chatbot LLM/AI murni (butuh koneksi internet stabil, ada latensi 1-2 detik, dan memakan biaya kuota API Key). Berikan argumentasi mengapa penggabungan *Keyword Matching* lokal dengan *fallback Gemini AI* (arsitektur hibrida) merupakan solusi terbaik dan paling efisien.
> - **Paragraf 4 (Deskripsi SuroKost Bot)**: Perkenalkan aplikasi SuroKost Bot yang mengintegrasikan dashboard chat asisten virtual dengan visualisasi peta spasial interaktif Leaflet.js untuk memudahkan navigasi langsung ke lokasi kost.

### 1.2 Rumusan Masalah
> Tuliskan **3 rumusan masalah** dalam bentuk kalimat tanya yang spesifik untuk proyek SuroKost Bot:
> 1. Bagaimana merancang dan mengimplementasikan arsitektur chatbot hibrida yang mengkombinasikan parser kata kunci lokal berbasis aturan dengan fallback Generative AI (Gemini)?
> 2. Bagaimana mengintegrasikan peta interaktif berbasis Leaflet.js untuk memvisualisasikan data lokasi kost dan menghitung estimasi jarak menggunakan rumus Haversine berdasarkan kueri dari asisten chat?
> 3. Bagaimana perbandingan performa (latensi dan akurasi informasi) antara pemrosesan kueri menggunakan Local NLP Engine dengan Gemini API?

### 1.3 Tujuan Penelitian
> Tuliskan **3 poin tujuan** penelitian yang menjawab secara presisi masing-masing rumusan masalah di atas:
> 1. Merancang dan membangun mesin chatbot hibrida yang memproses intent kueri secara lokal dan mengalihkan kueri semantik rumit ke model Gemini AI secara otomatis.
> 2. Menyajikan visualisasi lokasi kost pada peta interaktif Leaflet.js serta mengimplementasikan perhitungan rumus Haversine untuk memberikan estimasi jarak kost ke kampus UNAIR A & B.
> 3. Mengevaluasi performa fungsionalitas sistem hibrida berdasarkan latensi respon chat dan tingkat keakuratan data kost yang disajikan.

### 1.4 Manfaat Penelitian
> Jelaskan manfaat penelitian yang dibagi menjadi tiga poin berikut:
> 1. *Bagi Mahasiswa*: Memberikan efisiensi waktu dan kemudahan memfilter kriteria kost (harga, tipe gender, fasilitas) secara interaktif.
> 2. *Bagi Pengembang Aplikasi*: Menyediakan studi kasus nyata implementasi arsitektur hibrida NLP lokal + LLM Cloud yang hemat kuota/biaya API.
> 3. *Bagi Akademisi*: Menjadi referensi akademik terkait integrasi sistem informasi geografis (GIS) web dengan kecerdasan buatan LLM.

### 1.5 Batasan Masalah
> Batasi ruang lingkup laporan Anda dengan menuliskan **4 batasan masalah** berikut:
> 1. Wilayah penelitian dibatasi pada kost di sekitar Kampus A dan Kampus B Universitas Airlangga, Surabaya.
> 2. Dataset kost bersumber dari database lokal statis format CSV sebanyak 35 entri data kost (`kost - Fix.csv`).
> 3. Pengukuran jarak menggunakan formula Haversine yang menghitung jarak garis lurus (*as the crow flies*) dan tidak memperhitungkan rute jalan raya atau lalu lintas dinamis.
> 4. Model kecerdasan buatan fallback dibatasi menggunakan model Gemini (`gemini-2.5-flash`) via API Key resmi Google.

---

## BAB II TINJAUAN PUSTAKA
> **`[INSTRUKSI MAHASISWA A]`**  
> Tuliskan landasan teori yang kokoh. Kutip teori dari paper referensi *An Overview of Chatbot Technology* (Adamopoulou & Moussiades, 2020) yang telah dibaca. Jangan menggunakan definisi umum yang tidak ilmiah.

### 2.1 Chatbot dan NLU (Natural Language Understanding)
> Jelaskan konsep chatbot dan peranan penting modul NLU. Jelaskan apa itu **Intent** (maksud kueri) dan **Entity** (entitas parameter). 
> *Tugas Khusus*: Berikan contoh kueri dari SuroKost Bot, misalnya kueri *"Cari kost putri dekat Kampus B di bawah 1 juta"*, lalu petakan intent dan entitasnya:
> - Intent: `rekomendasi_kost`
> - Entity: `genderType: "Putri"`, `campusName: "Kampus B"`, `priceMax: 1000000`
> *Wajib menyertakan sitasi*: (Adamopoulou & Moussiades, 2020) pada subbab ini.

### 2.2 Keyword Matching (Pencocokan Kata Kunci)
> Jelaskan teori Keyword Matching. Terangkan bahwa metode ini mencocokkan ekspresi reguler (regex) atau kata kunci mentah (*string substring*) yang didefinisikan secara lokal. Bahas kelebihan (gratis, tanpa kuota, latensi < 10ms, offline) dan kelemahan (sensitif terhadap typo, tidak paham konteks kalimat panjang).

### 2.3 Generative AI dan LLM (Large Language Model)
> Jelaskan teori LLM berbasis arsitektur Transformer. Terangkan bagaimana Gemini API memproses input teks pengguna secara generatif menggunakan model probabilitas kata. Jelaskan kegunaan parameter `systemInstruction` dan context dataset untuk membatasi ruang kognitif AI agar data sewa dan kontak kost tetap akurat dan terhindar dari halusinasi data.

### 2.4 Penelitian Terdahulu
> Masukkan minimal 3 referensi penelitian terdahulu yang relevan. Isi kolom-kolom pada tabel berikut secara lengkap (jangan dikosongkan/mengawang):

##### Tabel 2.1 Perbandingan Penelitian Terdahulu Chatbot
| Peneliti & Tahun | Judul Penelitian | Metode yang Digunakan | Objek / Kasus | Hasil & Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| Adamopoulou & Moussiades (2020) | *An Overview of Chatbot Technology* | Analisis Komparatif Teoretis | Perkembangan & Arsitektur Chatbot Global | Mengklasifikasikan chatbot berbasis aturan dan generatif serta menyajikan arsitektur umum NLU. |
| **[Nama Peneliti 2 & Tahun]** | **[Tulis Judul Lengkap]** | **[Metode, misal: AIML / Pattern Match]** | **[Studi FAQ Kampus X]** | **[Tulis Kesimpulan Hasil Penelitian 2 secara spesifik]** |
| **[Nama Peneliti 3 & Tahun]** | **[Tulis Judul Lengkap]** | **[Metode, misal: NLP & LSA]** | **[FAQ E-commerce Y]** | **[Tulis Kesimpulan Hasil Penelitian 3 secara spesifik]** |
| **Kelompok Kami (2026)** | **SuroKost Bot** | **Keyword Matching + Gemini API Fallback (Hybrid)** | **Kost dekat UNAIR Surabaya** | **Menggabungkan efisiensi lokal dengan keluwesan kognitif Gemini AI.** |

> *Tulis ulasan 1 paragraf di bawah tabel yang membandingkan perbedaan utama sistem SuroKost Bot kelompok Anda (arsitektur hibrida) dengan 3 penelitian terdahulu di atas.*

---

## BAB III METODOLOGI PENELITIAN
> **`[INSTRUKSI MAHASISWA B]`**  
> Mahasiswa B bertanggung jawab penuh menyusun metodologi sistem, kalkulasi spasial, dan perancangan flowchart. Ikuti petunjuk teknis berikut:

### 3.1 Tempat dan Waktu Penelitian
> Jelaskan bahwa pengumpulan data spasial koordinat kost dilakukan di sekitar Jalan Dharmawangsa, Karangmenjangan, Gubeng, Mojo, dan Dharmahusada Surabaya. Rancang rentang waktu pengerjaan dari pengumpulan data hingga uji coba fungsional sistem (Mei 2026 - Juli 2026).

### 3.2 Alat dan Bahan Penelitian
> - **Perangkat Keras (Hardware)**: Tulis spesifikasi laptop Anda (misal: Laptop ASUS, RAM 16 GB, SSD 512 GB).
> - **Perangkat Lunak (Software)**: Tulis software pendukung: Windows 11, VS Code IDE, browser Google Chrome, library Leaflet.js (versi tile layer map), dan PapaParse.js (untuk memparsing CSV).
> - **Bahan (Dataset)**: Jelaskan bahwa data bersumber dari file CSV `kost - Fix.csv` dan `kampus_surabaya_latlng.csv`. Rincikan kolom-kolom data pada Tabel 3.1 berikut:

##### Tabel 3.1 Spesifikasi Atribut Dataset Kost (`kost - Fix.csv`)
| Nama Kolom CSV | Tipe Data | Deskripsi Fungsi | Contoh Data Riil |
| :--- | :---: | :--- | :--- |
| `title` | Text / String | Nama kost sebagai identitas utama pencarian | Griya Kost Ummi Sri |
| `price` | Integer / Numeric | Harga sewa kost per bulan (dalam rupiah) | 1200000 |
| `label` | Category / Text | Tipe gender penghuni kost (Putri/Putra/Campur) | Putri |
| `location/lat` | Float / Double | Koordinat lintang geografis lokasi kost | -7.26868 |
| `location/lng` | Float / Double | Koordinat bujur geografis lokasi kost | 112.7612 |
| `description` | Text / String | Daftar fasilitas kost (misal: AC, WiFi, Lemari) | AC, WiFi, Kasur, Lemari |
| `phone` | Text / String | Nomor kontak WhatsApp pengelola kost | 081234567890 |

### 3.3 Tahapan Penelitian
> Uraikan detail tahapan pengerjaan proyek kelompok Anda dalam **5 tahap**:
> 1. *Studi Pustaka*: Membaca panduan skripsi dan paper referensi.
> 2. *Pengumpulan & Pembersihan Data*: Mengumpulkan data koordinat kost UNAIR A & B dan membersihkan format koordinat yang tidak standar menggunakan helpers di JS.
> 3. *Perancangan Arsitektur Hibrida*: Merancang logika deteksi kueri lokal vs Gemini API.
> 4. *Implementasi & Coding*: Coding web frontend dan database parsing CSV lokal.
> 5. *Pengujian & Analisis*: Menjalankan skenario kueri Black-box dan menghitung latensi.

### 3.4 Rancangan Sistem
> - **Flowchart Sistem**: Rancang flowchart penanganan pesan chat pengguna. Jelaskan kapan sistem akan memproses kueri melalui fungsi `processLocalQuery` (pencocokan kata kunci lokal) dan kapan sistem akan mengalihkan kueri ke `processGeminiQuery` (API Gemini Cloud). Gambarkan diagram flowchart tersebut dengan jelas pada naskah skripsi Anda.
> - **Kalkulasi Spasial (Formula Haversine)**: Tuliskan rumus matematika Haversine:
>   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
>   Jelaskan kegunaan variabel-variabel di atas:
>   - $d$ = jarak antara dua koordinat (dalam km).
>   - $R$ = jari-jari bumi (6.371 km).
>   - $\Delta\phi$ = selisih latitude dalam radian ($\phi_2 - \phi_1$).
>   - $\Delta\lambda$ = selisih longitude dalam radian ($\lambda_2 - \lambda_1$).
>   Jelaskan bagaimana rumus ini diimplementasikan di JavaScript untuk menghitung jarak kost ke kampus terdekat.

### 3.5 Jadwal Penelitian
> Tentukan jadwal pelaksanaan kegiatan kelompok Anda dengan menandai centang (X) pada tabel berikut:

##### Tabel 3.2 Jadwal Pelaksanaan Proyek
| No | Detail Kegiatan Proyek | Mei 2026 | Juni 2026 | Juli 2026 |
| :--- | :--- | :---: | :---: | :---: |
| 1 | Analisis Kebutuhan & Desain Mockup UI | | | |
| 2 | Pengumpulan Data Spasial & Pembersihan CSV | | | |
| 3 | Coding Backend Local NLP & Map Leaflet.js | | | |
| 4 | Integrasi Gemini API & System Instruction | | | |
| 5 | Pengujian Sistem & Dokumentasi Laporan | | | |

---

## BAB IV HASIL
> **`[INSTRUKSI MAHASISWA C]`**  
> Mahasiswa C wajib mendokumentasikan implementasi teknis program JavaScript secara spesifik. Salin potongan kode penting dari file `app.js` Anda dan jelaskan logikanya.

### 4.1 Implementasi Antarmuka Sistem
> Tampilkan dan jelaskan tangkapan layar (screenshot) antarmuka SuroKost Bot Anda:
> 1. *Screenshot 1*: Tampilan dashboard utama saat pertama kali dibuka. Jelaskan tata letak jendela chat asisten virtual di sebelah kiri dan peta interaktif di sebelah kanan.
> 2. *Screenshot 2*: Tampilan peta saat terfokus pada kost pilihan. Jelaskan warna penanda (pin marker) kost: Pink untuk kost Putri, Cyan untuk kost Putra, dan Jingga untuk kost Campur.
> 3. *Screenshot 3*: Tampilan Sidebar Explorer (kost grid) saat tersaring berdasarkan kampus terdekat.

### 4.2 Implementasi Local NLP Engine (Fungsi `processLocalQuery`)
> Salin dan jelaskan potongan kode fungsi `processLocalQuery(query)` dari file `app.js` Anda. Terangkan bagaimana program mengekstrak intent dan entitas secara lokal menggunakan Javascript:
> - *Ekstraksi Gender*: Tunjukkan baris regex yang mengenali kata kunci "putri", "putra", "cewek", "cowok".
> - *Ekstraksi Harga*: Tunjukkan baris regex yang mengidentifikasi kata kunci harga ("jt", "juta", "ribu", "rb", "di bawah").
> - *Signature Matching*: Jelaskan logika pemecahan kata (tokenisasi) nama kost dengan mengabaikan stopwords umum (seperti "kost", "kos", "jalan") agar pencarian nama kost (misal: "Ivandio" atau "Ummi Sri") tetap akurat.

### 4.3 Implementasi Integrasi Gemini AI (Fungsi `processGeminiQuery`)
> Salin dan jelaskan potongan kode fungsi `processGeminiQuery(query)` dari file `app.js` Anda. Terangkan:
> 1. Cara mengirim HTTP POST request ke endpoint `googleapis.com` menggunakan model `gemini-2.5-flash`.
> 2. Jelaskan struktur teks prompt `systemInstruction` yang Anda rancang untuk menyuplai database kost dalam bentuk format JSON agar Gemini AI hanya menjawab sesuai data ril.
> 3. Jelaskan cara sistem mendeteksi string nama kost di dalam respon Gemini guna memicu pergerakan peta interaktif (fungsi `focusOnKost`) secara otomatis.

---

## BAB V PEMBAHASAN
> **`[INSTRUKSI MAHASISWA C]`**  
> Mahasiswa C wajib menjalankan pengujian fungsional sistem dan melakukan perbandingan performa. Catat data hasil uji coba secara faktual dan ilmiah.

### 5.1 Pengujian Fungsional (Black-box)
> Jalankan uji coba pada asisten chat SuroKost Bot dengan memasukkan 5 skenario kueri di bawah ini secara persis. Catat respon yang dikeluarkan oleh sistem dan statusnya (OK/Gagal jika ada error pada peta/chat) pada tabel berikut:

##### Tabel 5.1 Hasil Pengujian Black-Box SuroKost Bot
| No | Skenario Kueri Percakapan Pengguna | Ekspektasi Hasil Sistem | Respon Aktual Chat & Peta di Layar | Status |
| :--- | :--- | :--- | :--- | :---: |
| 1 | *"Rekomendasi kost putri dekat UNAIR Kampus B"* | Peta bergeser ke Kampus B, daftar kost tersaring hanya menampilkan tipe Putri dekat Kampus B. | `[PJ Mahasiswa C: Salin respon teks chatbot di sini]` | [OK/Fail] |
| 2 | *"Berapa harga sewa bulanan Kost Putra Ivandio?"* | Bot menampilkan nominal harga sewa riil Kost Ivandio. Peta otomatis bergeser (flyTo) ke lokasi Kost Ivandio. | `[PJ Mahasiswa C: Salin respon teks chatbot di sini]` | [OK/Fail] |
| 3 | *"Berapa jarak Griya Kost Ummi Sri ke UNAIR Kampus A?"*| Bot menghitung jarak (km) dan estimasi waktu tempuh jalan kaki & motor. Garis putus-putus rute tergambar di peta. | `[PJ Mahasiswa C: Salin respon teks chatbot di sini]` | [OK/Fail] |
| 4 | *"Apakah Kost Mawar memiliki fasilitas WiFi?"* | Bot mengkonfirmasi ketersediaan fasilitas WiFi (Ada/Tidak) berdasarkan deskripsi database. | `[PJ Mahasiswa C: Salin respon teks chatbot di sini]` | [OK/Fail] |
| 5 | *"Tolong jelaskan teori relativitas Einstein"* | Bot menolak menjawab kueri di luar domain kost secara sopan karena terdeteksi out of scope. | `[PJ Mahasiswa C: Salin respon teks chatbot di sini]` | [OK/Fail] |

### 5.2 Analisis Perbandingan Performa
> Uraikan hasil perbandingan performa kualitatif antara penggunaan Local NLP Engine dengan Gemini API. Isi data perbandingannya pada tabel di bawah ini secara spesifik:

##### Tabel 5.2 Analisis Perbandingan Karakteristik Kualitatif
| Aspek Evaluasi | Local NLP Engine (Pencocokan Kata Kunci) | Gemini API Fallback (Generative AI) |
| :--- | :--- | :--- |
| **Kecepatan Respon (Latensi)** | `[Jelaskan latensinya dalam milidetik (ms)]` | `[Jelaskan latensinya dalam detik]` |
| **Fleksibilitas Bahasa** | `[Jelaskan bagaimana jika user menginput kalimat salah ejaan / typo]` | `[Jelaskan keluwesan AI dalam mendeteksi typo & sinonim]` |
| **Keandalan Fakta Data** | `[Bagaimana tingkat kebenaran datanya?]` | `[Bahas risiko halusinasi data AI]` |
| **Koneksi Jaringan** | `[Apakah memerlukan internet?]` | `[Apakah memerlukan internet?]` |
| **Biaya Pemakaian** | `[Bahas biaya pemakaian server/local]` | `[Bahas biaya panggilan API Key]` |

---

## BAB VI KESIMPULAN DAN SARAN
> **`[INSTRUKSI MAHASISWA C & KELOMPOK]`**

### 6.1 Kesimpulan
> Rumuskan **3 kesimpulan** objektif berdasarkan hasil pengujian sistem:
> 1. Kesimpulan mengenai keberhasilan integrasi metode hibrida (Local Keyword Matching + Gemini API) dalam melayani berbagai variasi kueri mahasiswa.
> 2. Kesimpulan mengenai akurasi data jarak spasial yang dihitung dengan rumus Haversine serta fungsionalitas peta interaktif Leaflet.js.
> 3. Kesimpulan mengenai efisiensi penekanan biaya kuota API dengan menggunakan parser NLP lokal sebagai lapis utama pertahanan kueri.

### 6.2 Saran
> Rumuskan **2 saran konkret** untuk pengembangan aplikasi SuroKost Bot selanjutnya:
> 1. *Saran 1*: Integrasikan OSRM (Open Source Routing Machine) API agar peta dapat menghitung jarak tempuh berdasarkan rute jalan raya yang sebenarnya, bukan sekadar garis lurus Haversine.
> 2. *Saran 2*: Gunakan database dinamis berbasis cloud (seperti Supabase atau Firebase) agar pemilik kost dapat memperbarui ketersediaan kamar secara real-time.

---

## DAFTAR PUSTAKA
> **`[INSTRUKSI MAHASISWA A]`**  
> Susun daftar pustaka ilmiah yang diacu di dalam naskah menggunakan format standar **APA (American Psychological Association)**. Pastikan mencantumkan paper referensi berikut secara lengkap:
>
> *   Adamopoulou, E., & Moussiades, L. (2020). An Overview of Chatbot Technology. In I. Maglogiannis et al. (Eds.), *AIAI 2020, IFIP AICT 584*, pp. 373–383. Springer Nature Switzerland AG. https://doi.org/10.1007/978-3-030-49186-4_31
> *   `[Tuliskan minimal 2 referensi jurnal atau buku ilmiah pendukung lainnya...]`
