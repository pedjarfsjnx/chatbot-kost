# Rencana Pembagian Kerja Kelompok (3 Anggota)
## Proyek: Rancangan Bangun SuroKost Bot & Laporan Skripsi

Untuk memastikan beban kerja terbagi secara adil dan proporsional berdasarkan keahlian masing-masing anggota, tugas dibagi menjadi 3 peran: **Analis & Penulis Teori (Mahasiswa A)**, **Perancang Sistem & Database (Mahasiswa B)**, dan **Programmer & Penguji Sistem (Mahasiswa C)**.

---

### **Anggota A: Analis & Penulis Teori (Mahasiswa A)**
* **Fokus Utama**: Studi Literatur, Latar Belakang Masalah, dan Dokumentasi Akademik (Bab I, Bab II, & Abstrak).
* **Tanggung Jawab**:
  1. **Abstrak & Abstract (Bahasa Inggris)**: Menyusun ringkasan akhir laporan setelah seluruh bab selesai ditulis.
  2. **BAB I: PENDAHULUAN**:
     - Menyusun **Latar Belakang** mengenai urgensi pencarian kost mahasiswa dekat UNAIR Kampus A & B serta tantangan pencarian manual.
     - Merumuskan **Rumusan Masalah**, **Tujuan**, **Manfaat**, dan **Batasan Masalah** proyek.
  3. **BAB II: TINJAUAN PUSTAKA**:
     - Menulis teori dasar mengenai *Chatbot*, *Natural Language Understanding* (NLU), *Keyword Matching*, dan *Generative AI*.
     - Melakukan review paper referensi *An Overview of Chatbot Technology* (Adamopoulou & Moussiades, 2020) dan memasukannya ke dalam **Tabel Penelitian Terdahulu**.
     - Menyusun **Daftar Pustaka** format APA.

---

### **Anggota B: Perancang Sistem & Database (Mahasiswa B)**
* **Fokus Utama**: Metodologi Penelitian, Struktur Data Spasial, dan Alur Logika Sistem (Bab III).
* **Tanggung Jawab**:
  1. **BAB III: METODOLOGI PENELITIAN**:
     - Menjelaskan **Tempat & Waktu Penelitian** serta penyusunan jadwal pelaksanaan proyek.
     - Mendokumentasikan **Alat & Bahan**: Spesifikasi hardware/software dan mendeskripsikan struktur dataset CSV (`kost - Fix.csv` & `kampus_surabaya_latlng.csv`).
     - Menggambar **Diagram Alir Sistem (Flowchart)**: Menjelaskan alur keputusan chatbot ketika membedakan kueri lokal vs fallback Gemini AI.
     - Menuliskan dan menjelaskan **Formula Haversine** yang digunakan untuk menghitung jarak koordinat kost ke kampus.

---

### **Anggota C: Programmer & Penguji Sistem (Mahasiswa C)**
* **Fokus Utama**: Implementasi Teknis, Pengujian Fungsionalitas, dan Analisis Performa (Bab IV & Bab V).
* **Tanggung Jawab**:
  1. **BAB IV: HASIL (IMPLEMENTASI)**:
     - Mendokumentasikan **Antarmuka (UI)** SuroKost Bot dengan menyertakan screenshot dashboard chat dan peta interaktif.
     - Menjelaskan implementasi kode Javascript **Local NLP Engine** (fungsi `processLocalQuery` di `app.js`) dan bagaimana ekstraksi entitas gender/harga bekerja.
     - Menjelaskan implementasi integrasi **Gemini AI Fallback** dan mekanisme pemrosesan instruksi sistem.
  2. **BAB V: PEMBAHASAN (PENGUJIAN)**:
     - Melakukan **Pengujian Black-Box**: Menguji kueri percakapan dan mengisi tabel hasil pengujian.
     - Melakukan analisis perbandingan performa kualitatif antara pemrosesan lokal (*Keyword Matching*) dengan AI generatif (*Gemini API*) dari aspek kecepatan, biaya, dan fleksibilitas bahasa.

---

### **Matriks Kontribusi Bab Laporan**

| Bab Laporan | Penanggung Jawab Utama | Kontributor Pendukung |
| :--- | :---: | :---: |
| **Cover & Abstrak** | Mahasiswa A | Mahasiswa B & C |
| **BAB I: Pendahuluan** | Mahasiswa A | Mahasiswa B |
| **BAB II: Tinjauan Pustaka** | Mahasiswa A | Mahasiswa C |
| **BAB III: Metodologi** | Mahasiswa B | Mahasiswa A |
| **BAB IV: Hasil & Implementasi** | Mahasiswa C | Mahasiswa B |
| **BAB V: Pembahasan & Uji Coba** | Mahasiswa C | Mahasiswa A |
| **BAB VI: Kesimpulan & Saran** | Mahasiswa A, B, C | - |
