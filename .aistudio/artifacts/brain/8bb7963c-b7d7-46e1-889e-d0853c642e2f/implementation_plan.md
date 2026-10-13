# E-Voting OSIS Real-Time (Mobile-First & Remote Voting)

Sistem pemungutan suara elektronik (E-Voting) pemilihan Ketua dan Wakil Ketua OSIS yang dirancang **100% Mobile-First** untuk skenario pemilihan daring/jarak jauh di mana seluruh siswa dan guru/panitia mengakses via smartphone dari rumah. Siswa cukup memasukkan Nama Lengkap dan Nomor WhatsApp, memilih kandidat dengan cepat, dan mendapatkan tanda bukti digital instan tanpa reload halaman. Dilengkapi sistem proteksi anti-ganda 24 jam (kombinasi identitas WA unik, sidik jari peramban HP, dan kontrol IP), dasbor pemantauan real-time di smartphone panitia, serta ekspor laporan resmi (PDF, Excel, CSV).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> Penyesuaian Utama Berdasarkan Arahan: **"Semuanya menggunakan HP karena tidak ada siswa yang ke sekolah"**

- **Desain Khusus Smartphone (Mobile-First Ergonomics)**:
  - Seluruh alur (registrasi, eksplorasi visi-misi paslon, bilik suara, dan bukti digital) dioptimalkan untuk ukuran layar ponsel ($375\text{px}$–$430\text{px}$) dengan zona jempol (*thumb zone*), tombol sentuh minimal $44\text{px}$, *bottom sheet* konfirmasi, dan tampilan hemat kuota data.
  - Dasbor Admin juga didesain khusus agar Pembina dan Panitia OSIS dapat memantau perolehan suara secara real-time langsung dari layar smartphone mereka di rumah tanpa perlu membuka laptop.
- **Strategi Anti-Ganda Khusus Jaringan Rumah & Data Seluler**:
  - Siswa yang berada di rumah sering menggunakan paket data seluler (dynamic IP / Carrier-Grade NAT) atau Wi-Fi keluarga bersama saudara (kakak-adik satu sekolah).
  - Oleh karena itu, proteksi 24 jam menggabungkan:
    1. **Validasi Identitas Mutlak**: Nomor WhatsApp & Nama Siswa unik di database. Tidak ada siswa yang dapat menggunakan nomor WA atau nama yang sama dua kali.
    2. **Kunci Perangkat HP (Hardware/Browser Fingerprint + Token 24 Jam)**: Ponsel yang sudah dipakai mencoblos otomatis terkunci selama 24 jam penuh (dilengkapi layar hitung mundur informatif), mencegah satu HP dipakai berulang kali.
    3. **Pencatatan IP Address & Log Audit**: Mencatat alamat IP dan waktu vote untuk mendeteksi anomali.
- **Tanda Bukti Digital Pemilih (Digital E-Vote Pass)**:
  - Setelah memilih, siswa menerima kartu bukti digital (berisi nomor resi unik, nama siswa, tanggal & jam vote) dengan tombol cepat *"Bagikan / Simpan Bukti"* untuk dilaporkan ke wali kelas/grup WhatsApp kelas sebagai bukti partisipasi dari rumah.
- **Ekspor Dokumen Langsung di Ponsel**:
  - Panitia dapat mengunduh Berita Acara PDF, file Excel (.xlsx), dan CSV langsung tersimpan di folder *Download* smartphone mereka.

---

## 1. Overview & Core Concept

### Apa yang Dibangun?
1. **Bilik Suara Mobile (Bilik Suara di Genggaman Siswa)**:
   - Formulir pendaftaran cepat 2 bidang: Nama Lengkap dan No. WhatsApp aktif (+62 / 08xx).
   - Kartu Paslon 01, 02, dan 03 berformat vertikal yang nyaman di-scroll dengan satu tangan.
   - Modal geser bawah (*Bottom Sheet Drawer*) untuk membaca visi-misi dan program kerja tanpa pindah halaman.
   - Konfirmasi pilihan dengan sentuhan taktil untuk mencegah salah klik.
   - Bukti hak suara digital (*E-Voting Receipt*) yang aman dan elegan.
2. **Mesin Real-Time Tanpa Reload (Live Socket / SSE Stream)**:
   - Suara yang masuk dihitung otomatis detik itu juga.
   - Grafik perolehan suara di dasbor admin bergerak secara langsung tanpa perlu menyegarkan (*refresh*) halaman peramban HP.
3. **Dasbor Pengawas Mobile untuk Panitia OSIS**:
   - Kartu ringkasan KPI (Total Suara, Tingkat Partisipasi, Paslon Pemimpin).
   - Diagram batang dan donat responsif yang pas di layar HP vertikal.
   - Log pemilih real-time (update per detik saat siswa di rumah submit).
   - Tombol ekspor dokumen instan (PDF Berita Acara resmi lengkap tanda tangan panitia, Excel, dan CSV).
   - Akses diproteksi dengan PIN Admin (`2026`).

---

## 2. User Experience & Visual Design (Mobile-First)

### Alur Antarmuka Pengguna di Ponsel
```
[ Tampilan Siswa di HP ]
┌────────────────────────────────────────────────────────┐
│ 1. Header Ringkas (Logo Sekolah & Pemilihan OSIS)      │
│ 2. Form Cepat (Nama Siswa & No WhatsApp)               │
│ 3. Pilihan 3 Kartu Paslon (Foto, Nomor Urut, Nama)     │
│    - Tombol "Lihat Visi Misi" (Munculkan Bottom Sheet) │
│    - Tombol "Pilih Paslon Ini" (Aksen Utama)           │
│ 4. Konfirmasi Akhir (Dialog Lembar Bawah)              │
│ 5. Layar Bukti Pemilih Digital + Kunci 24 Jam          │
└────────────────────────────────────────────────────────┘

[ Tampilan Admin di HP ]
┌────────────────────────────────────────────────────────┐
│ 1. Top Bar: Status TPS (BUKA / TUTUP) & Tombol PIN     │
│ 2. Ringkasan Suara: Kartu KPI Angka Besar Tabular      │
│ 3. Grafik Hasil: Diagram Donat & Batang Mobile         │
│ 4. Feed Suara Masuk: Log pemilih real-time teratas     │
│ 5. Tindakan Cepat Bawah: Ekspor PDF, Excel, CSV        │
└────────────────────────────────────────────────────────┘
```

### Pedoman Desain & Ergonomi Sentuhan (Touch Ergonomics)
- **Ukuran Sentuh (Touch Hitbox)**: Seluruh tombol berukuran minimal $48\text{px}$ tinggi untuk kenyamanan jempol.
- **Zona Jempol (Thumb Zone)**: Tombol aksi utama (Pilih Paslon, Konfirmasi, Ekspor) diposisikan di 40% bagian bawah layar agar mudah dijangkau satu tangan.
- **Palet Warna**:
  - Latar Belakang: Soft Off-White / Light Canvas (`#F8FAFC`) untuk keterbacaan tinggi di layar HP siang hari, dengan kontras teks slate-900.
  - Paslon 01: Emerald Green (`#059669`)
  - Paslon 02: Amber Royal (`#D97706`)
  - Paslon 03: Indigo Violet (`#6366F1`)
- **Tipografi**:
  - Judul & Label: `Plus Jakarta Sans` tegas, modern, dan tidak melelahkan mata di layar HP.
  - Angka Hasil & Waktu: `font-mono tabular-nums` agar visual angka stabil dan presisi saat suara bertambah.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Proteksi 24 Jam Ramah Jaringan Seluler (Cellular-Aware)
- **Tantangan**: Di Indonesia, siswa di rumah menggunakan IP dinamis seluler (Telkomsel/Indosat/XL/dll.) atau Wi-Fi bersama dengan saudara satu sekolah. Jika hanya mengandalkan IP publik, ada risiko adik-kakak di satu rumah terblokir tidak sengaja.
- **Solusi Kami**:
  - **Level 1**: Validasi Nomor WhatsApp + Nama Siswa (wajib unik di database).
  - **Level 2**: Kunci Perangkat Fisik (*Browser Device Fingerprint* unik + Token Enkripsi 24 Jam di LocalStorage). Jika satu HP mencoba memasukkan siswa lain, HP tersebut langsung menolak dengan notifikasi *"Perangkat ini telah digunakan memilih dalam 24 jam terakhir"*.
  - **Level 3**: Pencatatan IP + Audit Log untuk mendeteksi banjir request atau serangan bot.

### 2. Live Update Tanpa Reload di HP
- **Solusi**: Memanfaatkan Server-Sent Events (SSE) dengan auto-reconnect fallback ke polling instan.
- **Keunggulan**: Sangat ramah kuota data siswa dan baterai ponsel, tidak ada kedipan layar (*zero flickering*), dan perolehan suara terbarui otomatis dalam pecahan detik.

### 3. Ekspor Laporan Resmi Langsung dari HP
- **PDF Berita Acara**: Dokumen formal dengan kop surat sekolah, rekap perolehan suara, persentase, nomor TPS daring, serta tanda tangan Ketua KPU OSIS dan Pembina OSIS.
- **Excel (.xlsx)**: File rapi dengan tab *Rekapitulasi* dan tab *Daftar Pemilih*.
- **CSV**: Format data mentah untuk arsip sekolah.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MOBILE-FIRST E-VOTING ARCHITECTURE                   │
└────────────────────────────────────────────────────────────────────────┘

 [ Mobile Clients (HP Siswa & HP Panitia) ]
 ┌──────────────────────────────────────┐  ┌─────────────────────────────┐
 │           HP Siswa (Home)            │  │      HP Panitia/Admin       │
 │  - Responsive Touch Viewport (390px) │  │  - Real-time Mobile Monitor │
 │  - Validasi Format WA Indonesia      │  │  - Touch-friendly Charts    │
 │  - Bottom-Sheet Visi & Misi          │  │  - Live Voter Feed Stream   │
 │  - Digital Voting Pass & Timer 24 Jam│  │  - Unduh PDF, Excel, CSV    │
 └──────────────────┬───────────────────┘  └──────────────┬──────────────┘
                    │                                     │
                    ▼                                     ▼
 [ Express Server & API Real-Time Streaming ]
 ┌───────────────────────────────────────────────────────────────────────┐
 │  - POST /api/vote (Cek WA unik, Device ID, IP, simpan suara)          │
 │  - GET  /api/stream (SSE Broadcast ke seluruh HP secara live)         │
 │  - GET  /api/admin/stats (Rekapitulasi lengkap + Log Pemilih)         │
 │  - POST /api/admin/candidates (Kelola Visi Misi Paslon)               │
 │  - POST /api/admin/reset (Gladi Bersih / Reset Suara Percobaan)       │
 └──────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
 [ Data Storage ]
 ┌───────────────────────────────────────────────────────────────────────┐
 │  - 3 Pasangan Calon Default (Dapat diedit panitia)                    │
 │  - Suara Masuk & Riwayat Pemilih (Hash WA, Nama, Timestamp, DeviceID) │
 │  - Tabel Kunci Perangkat (Expired in 24 Hours)                        │
 └───────────────────────────────────────────────────────────────────────┘
```

---

## Rencana Langkah Eksekusi (Implementation Steps)

1. **Setup Backend Server & Real-Time Engine**:
   - Express server dengan endpoint voting, validasi identitas ganda (WA & Nama), perekaman IP & Device Token 24 jam.
   - Endpoint streaming SSE (`/api/stream`) untuk siaran pembaruan suara langsung ke semua HP yang membuka web.
2. **Data Awal 3 Pasangan Calon (Kandidat OSIS)**:
   - Paslon 01, 02, dan 03 dengan profil realistis OSIS, foto representatif, visi, misi, dan program kerja unggulan.
3. **Bilik Suara Siswa Mobile-First**:
   - Layout ramah jempol untuk layar HP.
   - Form Nama & No WhatsApp dengan validasi format Indonesia.
   - Drawer Visi Misi yang mulus, modal konfirmasi sebelum submit.
   - Layar Bukti Digital Pemilih (*Digital E-Vote Pass*) dengan kode resi unik dan hitung mundur kunci 24 jam jika dibuka kembali.
4. **Dasbor Pemantauan Real-time di HP Admin**:
   - Layout responsif optimal di layar smartphone panitia.
   - Kartu angka cepat (*KPI cards*), grafik batang dan grafik lingkaran persentase suara.
   - Tabel audit log pemilih langsung bertambah tiap ada siswa yang submit.
   - Proteksi akses PIN Admin.
5. **Modul Ekspor Laporan Resmi**:
   - Download PDF Berita Acara Pemilihan OSIS resmi siap cetak/arsip.
   - Download Excel (.xlsx) dengan tabel rekap & log pemilih.
   - Download CSV untuk olah data spreadsheet.
6. **Verifikasi & Pengujian Lengkap**:
   - Uji coba penolakan nomor WA dobel, nama dobel, dan perangkat yang sama dalam 24 jam.
   - Uji coba update real-time tanpa refresh layar.
   - Uji coba unduh PDF, Excel, dan CSV langsung di perangkat seluler.
