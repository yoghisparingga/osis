import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Candidate, ElectionSettings, ElectionStats, VoteRecord } from '../types/voting.ts';

export function exportToPDF(
  stats: ElectionStats,
  candidates: Candidate[],
  settings: ElectionSettings,
  voterLogs: (VoteRecord & { candidateName?: string })[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentTimeStr = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // 1. Kop Surat Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('KOMISI PEMILIHAN UMUM OSIS', pageWidth / 2, 16, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Tahun Ajaran ${settings.academicYear} · Sistem E-Voting Daring Real-Time`, pageWidth / 2, 27, { align: 'center' });

  // Garis Pembatas Kop
  doc.setLineWidth(0.8);
  doc.line(14, 30, pageWidth - 14, 30);
  doc.setLineWidth(0.2);
  doc.line(14, 31, pageWidth - 14, 31);

  // 2. Judul Dokumen Berita Acara
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BERITA ACARA REKAPITULASI HASIL PEMILIHAN KETUA OSIS', pageWidth / 2, 38, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nomor Dokumen: BA-EVOTE/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`, pageWidth / 2, 43, { align: 'center' });
  doc.text(`Waktu Pengesahan Data: ${currentDateStr}, Pukul ${currentTimeStr} WIB`, pageWidth / 2, 47, { align: 'center' });

  // 3. Tabel Rekapitulasi Suara Paslon
  const paslonTableRows = stats.summaries.map(s => [
    `Paslon 0${s.candidateNumber}`,
    `${s.chairmanName}\n& ${s.viceChairmanName}`,
    `${s.votes} Suara`,
    `${s.percentage.toFixed(1)}%`
  ]);

  autoTable(doc, {
    startY: 52,
    head: [['No. Urut', 'Pasangan Calon Ketua & Wakil', 'Perolehan Suara', 'Persentase']],
    body: paslonTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138], // Dark Indigo
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
      1: { halign: 'left', cellWidth: 90 },
      2: { halign: 'center', cellWidth: 38, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  const lastTableY = (doc as any).lastAutoTable.finalY || 95;

  // 4. Ringkasan Partisipasi Pemilih
  const participationData = [
    ['Total Siswa Terdaftar (DPT)', `${stats.totalEligibleVoters} Siswa`],
    ['Total Suara Masuk', `${stats.totalVotes} Suara`],
    ['Tingkat Partisipasi Pemilih', `${stats.participationRate.toFixed(1)}%`],
    ['Paslon Unggul Terpilih', stats.leadingCandidate ? `Paslon 0${stats.leadingCandidate.candidateNumber} (${stats.leadingCandidate.chairmanName} & ${stats.leadingCandidate.viceChairmanName})` : 'Belum ada suara masuk'],
    ['Status Pelaksanaan', settings.isVotingOpen ? 'Pemungutan Suara Sedang Berlangsung' : 'Pemungutan Suara Telah Ditutup Resmi']
  ];

  autoTable(doc, {
    startY: lastTableY + 6,
    head: [['Indikator Pemilihan', 'Keterangan Hasil']],
    body: participationData,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105], // Slate
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 65, fontStyle: 'bold' },
      1: { cellWidth: 119 }
    },
    styles: {
      fontSize: 9,
      cellPadding: 2.5
    }
  });

  const summaryTableY = (doc as any).lastAutoTable.finalY || 140;

  // 5. Lampiran Sampel Log Pemilih (15 Terakhir di Halaman 1 atau Buat Halaman Lampiran)
  if (voterLogs.length > 0) {
    doc.addPage();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('LAMPIRAN: DAFTAR AUDIT LOG PEMILIH MASUK', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Total data terekam: ${voterLogs.length} pemilih (Data divalidasi anti-ganda 24 jam)`, 14, 21);

    const logRows = voterLogs.map((log, idx) => [
      String(idx + 1),
      new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      log.voterName,
      // Privasi nomor WA (sensor 3 digit tengah)
      log.voterPhone.length > 6 ? `${log.voterPhone.slice(0, 4)}****${log.voterPhone.slice(-3)}` : log.voterPhone,
      `Paslon 0${log.candidateNumber}`,
      log.receiptCode
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['No', 'Waktu', 'Nama Siswa', 'No. WhatsApp', 'Pilihan', 'Kode Resi']],
      body: logRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: 255,
        fontSize: 8,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 22 },
        2: { halign: 'left', cellWidth: 62 },
        3: { halign: 'center', cellWidth: 28 },
        4: { halign: 'center', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 38 }
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2
      }
    });
  }

  // Kolom Pengesahan Tanda Tangan
  const sigPage = voterLogs.length > 0 ? doc.internal.pages.length - 1 : 1;
  doc.setPage(sigPage);
  const sigStartY = Math.max((doc as any).lastAutoTable.finalY + 12, 230);

  // Jika mentok bawah, buat halaman baru untuk tanda tangan
  if (sigStartY > 260) {
    doc.addPage();
    renderSignatures(doc, pageWidth, 30, currentDateStr, settings);
  } else {
    renderSignatures(doc, pageWidth, sigStartY, currentDateStr, settings);
  }

  doc.save(`Berita_Acara_Hasil_Pemilihan_OSIS_${new Date().getFullYear()}.pdf`);
}

function renderSignatures(doc: jsPDF, pageWidth: number, y: number, dateStr: string, settings: ElectionSettings) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Ditetapkan secara sah pada: ${dateStr}`, pageWidth - 14, y, { align: 'right' });

  const sigY = y + 8;
  // Kolom Kiri: Pembina OSIS
  doc.text('Mengetahui / Mengesahkan,', 20, sigY);
  doc.text('Pembina OSIS', 20, sigY + 5);
  doc.text('(..................................................)', 20, sigY + 28);
  doc.setFontSize(8);
  doc.text('NIP. ...........................................', 20, sigY + 33);

  // Kolom Kanan: Ketua KPU OSIS
  doc.setFontSize(9);
  doc.text('Panitia Pelaksana,', pageWidth - 70, sigY);
  doc.text('Ketua KPU Pemilihan OSIS', pageWidth - 70, sigY + 5);
  doc.text('(..................................................)', pageWidth - 70, sigY + 28);
  doc.setFontSize(8);
  doc.text('NISN. ........................................', pageWidth - 70, sigY + 33);
}

export function exportToExcel(
  stats: ElectionStats,
  candidates: Candidate[],
  settings: ElectionSettings,
  voterLogs: (VoteRecord & { candidateName?: string })[]
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Rekapitulasi
  const rekapData = [
    ['LAPORAN REKAPITULASI HASIL PEMILIHAN KETUA OSIS'],
    [settings.schoolName.toUpperCase()],
    [`Periode ${settings.academicYear}`],
    [`Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`],
    [],
    ['PEROLEHAN SUARA KANDIDAT'],
    ['Nomor Urut', 'Calon Ketua OSIS', 'Calon Wakil Ketua OSIS', 'Jumlah Suara', 'Persentase (%)'],
    ...stats.summaries.map(s => [
      `Paslon 0${s.candidateNumber}`,
      s.chairmanName,
      s.viceChairmanName,
      s.votes,
      `${s.percentage.toFixed(1)}%`
    ]),
    [],
    ['STATISTIK PARTISIPASI'],
    ['Total DPT Siswa', settings.totalEligibleVoters],
    ['Total Suara Masuk', stats.totalVotes],
    ['Persentase Partisipasi', `${stats.participationRate.toFixed(1)}%`],
    ['Kandidat Terpilih', stats.leadingCandidate ? `Paslon 0${stats.leadingCandidate.candidateNumber} (${stats.leadingCandidate.chairmanName})` : 'Belum Ada Suara'],
    ['Status TPS', settings.isVotingOpen ? 'BUKA' : 'TUTUP']
  ];

  const wsRekap = XLSX.utils.aoa_to_sheet(rekapData);
  // Lebar kolom
  wsRekap['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 30 }, { wch: 16 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi Suara');

  // 2. Sheet Log Pemilih
  const logHeader = ['No', 'Kode Resi', 'Waktu Voting', 'Nama Siswa', 'Nomor WhatsApp', 'Pilihan Paslon', 'Alamat IP'];
  const logRows = voterLogs.map((log, index) => [
    index + 1,
    log.receiptCode,
    new Date(log.timestamp).toLocaleString('id-ID'),
    log.voterName,
    log.voterPhone,
    `Paslon 0${log.candidateNumber}`,
    log.ipAddress || '127.0.0.1'
  ]);

  const wsLogs = XLSX.utils.aoa_to_sheet([
    ['LOG DATA AUDIT PEMILIH RESMI'],
    [`Total Catatan: ${voterLogs.length} Pemilih`],
    [],
    logHeader,
    ...logRows
  ]);
  wsLogs['!cols'] = [{ wch: 6 }, { wch: 20 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsLogs, 'Daftar Pemilih');

  XLSX.writeFile(wb, `Laporan_Hasil_Pemilihan_OSIS_${new Date().getFullYear()}.xlsx`);
}

export function exportToCSV(voterLogs: (VoteRecord & { candidateName?: string })[]) {
  const headers = ['No', 'Kode Resi', 'Waktu Voting', 'Nama Siswa', 'Nomor WhatsApp', 'Pilihan Paslon', 'Alamat IP'];
  
  const rows = voterLogs.map((log, index) => [
    index + 1,
    `"${log.receiptCode}"`,
    `"${new Date(log.timestamp).toLocaleString('id-ID')}"`,
    `"${log.voterName.replace(/"/g, '""')}"`,
    `"${log.voterPhone}"`,
    `"Paslon 0${log.candidateNumber}"`,
    `"${log.ipAddress || ''}"`
  ]);

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `data_log_pemilih_osis_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadVoterCardPDF(pass: any, schoolName: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [148, 105] // A6 Card Format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background card styling
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header band
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 22, 'F');

  // Header text
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text('KARTU BUKTI PEMILIHAN SUARA DARING (OSIS)', pageWidth / 2, 9, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 15, { align: 'center' });

  // Border frame
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

  // Status Stamp Box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(pageWidth - 45, 26, 38, 14, 2, 2, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('STATUS RESMI:', pageWidth - 26, 31, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('SUARA SAH', pageWidth - 26, 37, { align: 'center' });

  // Voter Info
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('IDENTITAS PEMILIH', 12, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Nama Siswa', 12, 36);
  doc.text('Nomor WhatsApp', 12, 42);
  doc.text('Waktu Coblos', 12, 48);
  doc.text('Pilihan Paslon', 12, 54);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`: ${pass.voterName}`, 42, 36);
  doc.text(`: ${pass.voterPhone}`, 42, 42);
  
  const dateStr = new Date(pass.timestamp).toLocaleString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`: ${dateStr} WIB`, 42, 48);
  doc.setTextColor(30, 58, 138);
  doc.text(`: Paslon 0${pass.candidateNumber} (${pass.candidateChairman || ''})`, 42, 54);

  // Receipt Code Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(12, 60, pageWidth - 24, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('KODE RESI AUDIT RESMI (PERANGKAT TERKUNCI 24 JAM):', pageWidth / 2, 66, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(pass.receiptCode, pageWidth / 2, 74, { align: 'center' });

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Simpan kartu ini sebagai bukti resmi partisipasi pemilihan Ketua OSIS untuk wali kelas.', pageWidth / 2, 88, { align: 'center' });

  doc.save(`Kartu_Bukti_Pemilih_OSIS_${pass.receiptCode}.pdf`);
}

