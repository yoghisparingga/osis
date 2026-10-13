import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Candidate, VoteRecord, ElectionSettings, ElectionStats, VoteSummary } from './src/types/voting.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const DATA_FILE = path.join(DATA_DIR, 'evoting_data.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default candidates
const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'paslon-1',
    number: 1,
    chairmanName: 'Muhammad Fathir Al-Ghifari',
    viceChairmanName: 'Amanda Zahra Putri',
    chairmanClass: 'XI MIPA 1',
    viceChairmanClass: 'XI IPS 2',
    slogan: 'OSIS Progresif: Berakhlak, Berprestasi, dan Berdaya Saing Global',
    vision: 'Mewujudkan OSIS sebagai wadah aspirasi siswa yang inklusif, kolaboratif, dan inovatif berlandaskan integritas dan kepedulian lingkungan.',
    missions: [
      'Meningkatkan partisipasi aktif seluruh siswa dalam kegiatan ekstrakurikuler dan akademik.',
      'Mengembangkan platform digital aspirasi siswa yang transparan dan responsif.',
      'Menyelenggarakan festival seni, literasi teknologi, dan kompetisi sains antar-kelas.',
      'Mempererat solidaritas antar angkatan melalui program mentoring sebaya yang berkelanjutan.'
    ],
    workPrograms: [
      'School Innovation Hub & Podcast Pelajar Inspiratif',
      'Green School Eco-Action & Duta Lingkungan Berkelanjutan',
      'Pekan Olahraga & Seni Terpadu (PORSENI Kreatif)'
    ],
    color: '#059669' // Emerald Green
  },
  {
    id: 'paslon-2',
    number: 2,
    chairmanName: 'Raditya Arya Pratama',
    viceChairmanName: 'Nadhira Keisha Salsabila',
    chairmanClass: 'XI MIPA 3',
    viceChairmanClass: 'XI MIPA 2',
    slogan: 'Satu Tekad, Satu Langkah: OSIS Harmonis & Berkarakter Unggul',
    vision: 'Membangun ekosistem sekolah yang hangat, adaptif terhadap kemajuan zaman, dan melahirkan kader pemimpin berjiwa kepemimpinan tinggi.',
    missions: [
      'Menjembatani aspirasi siswa dan pihak sekolah secara santun, cepat, dan solutif.',
      'Mengoptimalkan publikasi media sosial OSIS untuk transparansi setiap kegiatan dan anggaran.',
      'Mengadakan pelatihan kepemimpinan pemuda (Youth Leadership Camp) dan kewirausahaan siswa.',
      'Memperkuat kegiatan kerohanian dan toleransi antar sesama warga sekolah.'
    ],
    workPrograms: [
      'Voice of Students: Kanal Aspirasi & Survei Siswa Bulanan',
      'Workshop Digital Skills & Pelatihan Literasi Masa Depan',
      'Bakti Sosial & Gerakan Kasih Peduli Sesama'
    ],
    color: '#D97706' // Amber
  },
  {
    id: 'paslon-3',
    number: 3,
    chairmanName: 'Farhan Dwi Kurniawan',
    viceChairmanName: 'Clarissa Aurelia Stephanie',
    chairmanClass: 'XI IPS 1',
    viceChairmanClass: 'XI MIPA 4',
    slogan: 'Kreasi Tanpa Batas: OSIS Aktif, Tanggap, dan Kolaboratif',
    vision: 'Menjadikan OSIS pusat kolaborasi karya kreatif, wadah talenta non-akademik, serta pelindung kesejahteraan mental dan potensi siswa.',
    missions: [
      'Mendukung penuh pengembangan bakat minat siswa di bidang olahraga, esport, musik, dan desain grafis.',
      'Menyediakan forum konseling sebaya dan ruang berbagi kesehatan mental siswa bekerjasama dengan BK.',
      'Menggencarkan pameran karya kreatif dan eksposisi ekstrakurikuler di tiap akhir semester.',
      'Membangun sinergi dan studi banding positif dengan OSIS sekolah lain se-wilayah.'
    ],
    workPrograms: [
      'Student Wellness & Peer Support Circle',
      'Creative Arts & Youth Esports Championship',
      'OSIS Youth Expo & Kolaborasi Lintas Komunitas'
    ],
    color: '#6366F1' // Indigo
  }
];

const DEFAULT_SETTINGS: ElectionSettings = {
  title: 'Pemilihan Ketua & Wakil Ketua OSIS Periode 2026/2027',
  schoolName: 'SMA / SMK NEGERI TELADAN',
  academicYear: '2026/2027',
  isVotingOpen: true,
  totalEligibleVoters: 750, // Estimasi total siswa pemilih
  adminPin: '2026',
  ipLockoutHours: 24
};

interface StoredData {
  candidates: Candidate[];
  votes: VoteRecord[];
  settings: ElectionSettings;
}

// In-memory state
let candidates: Candidate[] = [...DEFAULT_CANDIDATES];
let votes: VoteRecord[] = [];
let settings: ElectionSettings = { ...DEFAULT_SETTINGS };

// Load persistent data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: StoredData = JSON.parse(raw);
    if (parsed.candidates && Array.isArray(parsed.candidates)) candidates = parsed.candidates;
    if (parsed.votes && Array.isArray(parsed.votes)) votes = parsed.votes;
    if (parsed.settings) settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
  }
} catch (e) {
  console.warn('Could not load saved e-voting data, using defaults.', e);
}

function persistData() {
  try {
    const data: StoredData = { candidates, votes, settings };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing evoting data file:', err);
  }
}

// Active SSE client streams
const sseClients = new Set<express.Response>();

function calculateStats(): ElectionStats {
  const totalVotes = votes.length;
  const summaries: VoteSummary[] = candidates.map(c => {
    const cVotes = votes.filter(v => v.candidateId === c.id).length;
    const percentage = totalVotes > 0 ? Number(((cVotes / totalVotes) * 100).toFixed(1)) : 0;
    return {
      candidateId: c.id,
      candidateNumber: c.number,
      chairmanName: c.chairmanName,
      viceChairmanName: c.viceChairmanName,
      votes: cVotes,
      percentage,
      color: c.color
    };
  });

  // Sort leading candidate
  let leading: VoteSummary | null = null;
  if (totalVotes > 0) {
    const sorted = [...summaries].sort((a, b) => b.votes - a.votes);
    if (sorted[0] && sorted[0].votes > 0) {
      leading = sorted[0];
    }
  }

  const participationRate = settings.totalEligibleVoters > 0 
    ? Number(((totalVotes / settings.totalEligibleVoters) * 100).toFixed(1)) 
    : 0;

  return {
    totalVotes,
    totalEligibleVoters: settings.totalEligibleVoters,
    participationRate,
    leadingCandidate: leading,
    summaries,
    isVotingOpen: settings.isVotingOpen,
    lastUpdated: Date.now()
  };
}

function broadcastEvent(type: string, payload: any) {
  const data = `data: ${JSON.stringify({ type, payload, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) {
    return '0' + digits.substring(2);
  }
  return digits;
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded)) {
    return forwarded[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. SSE Stream endpoint for instant real-time auto-reload without refreshing
  app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initial state push
    const initialPayload = {
      stats: calculateStats(),
      candidates,
      settings: {
        title: settings.title,
        schoolName: settings.schoolName,
        academicYear: settings.academicYear,
        isVotingOpen: settings.isVotingOpen,
        totalEligibleVoters: settings.totalEligibleVoters,
        ipLockoutHours: settings.ipLockoutHours
      }
    };
    res.write(`data: ${JSON.stringify({ type: 'INIT_STATE', payload: initialPayload, timestamp: Date.now() })}\n\n`);

    sseClients.add(res);

    // Heartbeat every 15s to keep mobile connections open
    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  // 2. Initial state & status check for student
  app.get('/api/state', (req, res) => {
    const clientIp = getClientIp(req);
    const deviceFingerprint = req.query.deviceFingerprint as string || '';
    const now = Date.now();
    const lockoutPeriod = (settings.ipLockoutHours || 24) * 60 * 60 * 1000;

    let deviceLocked = false;
    let lockRemainingMs = 0;
    let matchedVote: VoteRecord | undefined;

    // Check device fingerprint lockout
    if (deviceFingerprint) {
      matchedVote = votes.find(v => v.deviceFingerprint === deviceFingerprint && (now - v.timestamp) < lockoutPeriod);
      if (matchedVote) {
        deviceLocked = true;
        lockRemainingMs = lockoutPeriod - (now - matchedVote.timestamp);
      }
    }

    res.json({
      candidates,
      settings: {
        title: settings.title,
        schoolName: settings.schoolName,
        academicYear: settings.academicYear,
        isVotingOpen: settings.isVotingOpen,
        totalEligibleVoters: settings.totalEligibleVoters,
        ipLockoutHours: settings.ipLockoutHours
      },
      stats: calculateStats(),
      clientIp,
      deviceLocked,
      lockRemainingMs: Math.max(0, lockRemainingMs),
      voterPass: matchedVote ? {
        receiptCode: matchedVote.receiptCode,
        voterName: matchedVote.voterName,
        voterPhone: matchedVote.voterPhone,
        candidateNumber: matchedVote.candidateNumber,
        timestamp: matchedVote.timestamp
      } : null
    });
  });

  // 2.5 POST /api/check-voter: Validate registration before choosing candidates
  app.post('/api/check-voter', (req, res) => {
    if (!settings.isVotingOpen) {
      return res.status(403).json({
        success: false,
        message: 'Pemungutan suara sedang ditutup atau dijeda oleh panitia OSIS.'
      });
    }

    const { voterName, voterPhone, deviceFingerprint } = req.body;

    if (!voterName || typeof voterName !== 'string' || voterName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        field: 'voterName',
        message: 'Nama lengkap siswa harus diisi dengan benar (minimal 3 karakter sesuai absen).'
      });
    }

    if (!voterPhone || typeof voterPhone !== 'string') {
      return res.status(400).json({
        success: false,
        field: 'voterPhone',
        message: 'Nomor WhatsApp / HP wajib diisi.'
      });
    }

    const cleanPhone = normalizePhone(voterPhone);
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      return res.status(400).json({
        success: false,
        field: 'voterPhone',
        message: 'Format nomor WhatsApp tidak valid. Masukkan nomor aktif minimal 10 digit (contoh: 081234567890).'
      });
    }

    const cleanName = voterName.trim().toLowerCase();
    const now = Date.now();
    const lockoutPeriod = (settings.ipLockoutHours || 24) * 60 * 60 * 1000;

    // Check duplicate phone
    const existingPhoneVote = votes.find(v => normalizePhone(v.voterPhone) === cleanPhone);
    if (existingPhoneVote) {
      return res.status(409).json({
        success: false,
        field: 'voterPhone',
        message: `Nomor WhatsApp (${voterPhone}) sudah terdaftar dalam sistem dan telah digunakan memilih pada ${new Date(existingPhoneVote.timestamp).toLocaleTimeString('id-ID')} WIB. Nomor tidak boleh sama. Silakan perbaiki nomor Anda.`,
        alreadyVoted: true
      });
    }

    // Check duplicate name
    const existingNameVote = votes.find(v => v.voterName.trim().toLowerCase() === cleanName);
    if (existingNameVote) {
      return res.status(409).json({
        success: false,
        field: 'voterName',
        message: `Siswa atas nama "${voterName.trim()}" telah tercatat menggunakan hak suara sebelumnya. Nama tidak boleh ganda.`,
        alreadyVoted: true
      });
    }

    // Check device lockout
    if (deviceFingerprint) {
      const existingDeviceVote = votes.find(v => v.deviceFingerprint === deviceFingerprint && (now - v.timestamp) < lockoutPeriod);
      if (existingDeviceVote) {
        const remainingHours = Math.ceil((lockoutPeriod - (now - existingDeviceVote.timestamp)) / (1000 * 60 * 60));
        return res.status(429).json({
          success: false,
          field: 'device',
          message: `Perangkat smartphone ini telah digunakan memilih dalam 24 jam terakhir. Silakan coba kembali dalam ${remainingHours} jam.`,
          deviceLocked: true
        });
      }
    }

    return res.json({
      success: true,
      message: `Pendaftaran berhasil! Identitas "${voterName.trim()}" terverifikasi sah. Silakan lanjutkan memilih pasangan calon.`,
      voter: {
        voterName: voterName.trim(),
        voterPhone: cleanPhone
      }
    });
  });

  // 3. POST /api/vote: Student submits vote
  app.post('/api/vote', (req, res) => {
    if (!settings.isVotingOpen) {
      return res.status(403).json({
        success: false,
        message: 'Pemungutan suara sedang ditutup atau dijeda oleh panitia OSIS.'
      });
    }

    const { voterName, voterPhone, candidateId, deviceFingerprint } = req.body;

    if (!voterName || typeof voterName !== 'string' || voterName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap siswa harus diisi dengan benar (minimal 3 karakter).'
      });
    }

    if (!voterPhone || typeof voterPhone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp / HP wajib diisi.'
      });
    }

    const cleanPhone = normalizePhone(voterPhone);
    if (cleanPhone.length < 9 || cleanPhone.length > 15) {
      return res.status(400).json({
        success: false,
        message: 'Nomor WhatsApp tidak valid. Masukkan nomor HP aktif (contoh: 08123456789).'
      });
    }

    const targetCandidate = candidates.find(c => c.id === candidateId);
    if (!targetCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Kandidat yang dipilih tidak ditemukan dalam daftar paslon.'
      });
    }

    const now = Date.now();
    const lockoutPeriod = (settings.ipLockoutHours || 24) * 60 * 60 * 1000;
    const clientIp = getClientIp(req);
    const cleanName = voterName.trim().toLowerCase();

    // Check duplicate phone number in database
    const existingPhoneVote = votes.find(v => normalizePhone(v.voterPhone) === cleanPhone);
    if (existingPhoneVote) {
      return res.status(409).json({
        success: false,
        message: `Nomor WhatsApp (${voterPhone}) sudah pernah digunakan untuk memilih pada ${new Date(existingPhoneVote.timestamp).toLocaleString('id-ID')}. Hak suara hanya 1 kali.`,
        alreadyVoted: true
      });
    }

    // Check duplicate student name in database
    const existingNameVote = votes.find(v => v.voterName.trim().toLowerCase() === cleanName);
    if (existingNameVote) {
      return res.status(409).json({
        success: false,
        message: `Siswa dengan nama "${voterName.trim()}" telah tercatat menggunakan hak suara. Nama tidak boleh ganda.`,
        alreadyVoted: true
      });
    }

    // Check device fingerprint 24h lockout
    if (deviceFingerprint) {
      const existingDeviceVote = votes.find(v => v.deviceFingerprint === deviceFingerprint && (now - v.timestamp) < lockoutPeriod);
      if (existingDeviceVote) {
        const remainingHours = Math.ceil((lockoutPeriod - (now - existingDeviceVote.timestamp)) / (1000 * 60 * 60));
        return res.status(429).json({
          success: false,
          message: `Perangkat smartphone / browser ini telah digunakan memilih dalam 24 jam terakhir. Coba lagi dalam ${remainingHours} jam.`,
          deviceLocked: true
        });
      }
    }

    // Generate cryptographic-styled receipt code: EVT-OSIS-XXXXXX
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const receiptCode = `EVT-OSIS-${randomHex}`;

    const newVote: VoteRecord = {
      id: 'vote-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      candidateId: targetCandidate.id,
      candidateNumber: targetCandidate.number,
      voterName: voterName.trim(),
      voterPhone: cleanPhone,
      timestamp: now,
      ipAddress: clientIp,
      deviceFingerprint: deviceFingerprint || 'anon-' + Math.random().toString(36).substring(2, 8),
      receiptCode
    };

    votes.push(newVote);
    persistData();

    const stats = calculateStats();

    // Broadcast instant update to all connected mobile clients & admin dashboards!
    broadcastEvent('VOTE_CAST', {
      stats,
      recentVote: {
        receiptCode,
        voterName: newVote.voterName,
        candidateNumber: targetCandidate.number,
        timestamp: newVote.timestamp
      }
    });

    return res.json({
      success: true,
      message: 'Hak suara Anda berhasil dicatat secara resmi!',
      voterPass: {
        receiptCode,
        voterName: newVote.voterName,
        voterPhone: newVote.voterPhone,
        candidateNumber: targetCandidate.number,
        candidateChairman: targetCandidate.chairmanName,
        candidateVice: targetCandidate.viceChairmanName,
        timestamp: newVote.timestamp
      },
      stats
    });
  });

  // 4. Admin PIN login verification
  app.post('/api/admin/verify-pin', (req, res) => {
    const { pin } = req.body;
    if (pin === settings.adminPin) {
      return res.json({ success: true, message: 'Autentikasi admin berhasil' });
    }
    return res.status(401).json({ success: false, message: 'PIN Admin salah. Silakan coba lagi.' });
  });

  // 5. Admin: Update candidates
  app.post('/api/admin/candidates', (req, res) => {
    const { pin, candidate } = req.body;
    if (pin !== settings.adminPin) {
      return res.status(401).json({ success: false, message: 'Akses ditolak.' });
    }

    const idx = candidates.findIndex(c => c.id === candidate.id);
    if (idx !== -1) {
      candidates[idx] = { ...candidates[idx], ...candidate };
    } else {
      candidates.push(candidate);
    }
    persistData();

    const stats = calculateStats();
    broadcastEvent('CANDIDATES_UPDATED', { candidates, stats });
    return res.json({ success: true, candidates, stats });
  });

  // 6. Admin: Toggle voting open/closed
  app.post('/api/admin/toggle-status', (req, res) => {
    const { pin, isVotingOpen } = req.body;
    if (pin !== settings.adminPin) {
      return res.status(401).json({ success: false, message: 'Akses ditolak.' });
    }

    settings.isVotingOpen = typeof isVotingOpen === 'boolean' ? isVotingOpen : !settings.isVotingOpen;
    persistData();

    const stats = calculateStats();
    broadcastEvent('SETTINGS_UPDATED', { settings, stats });
    return res.json({ success: true, settings, stats });
  });

  // 7. Admin: Update settings (School name, PIN, total eligible voters)
  app.post('/api/admin/settings', (req, res) => {
    const { pin, newSettings } = req.body;
    if (pin !== settings.adminPin) {
      return res.status(401).json({ success: false, message: 'Akses ditolak.' });
    }

    if (newSettings.schoolName) settings.schoolName = newSettings.schoolName;
    if (newSettings.title) settings.title = newSettings.title;
    if (newSettings.academicYear) settings.academicYear = newSettings.academicYear;
    if (newSettings.totalEligibleVoters) settings.totalEligibleVoters = Number(newSettings.totalEligibleVoters);
    if (newSettings.adminPin) settings.adminPin = newSettings.adminPin;
    if (newSettings.ipLockoutHours) settings.ipLockoutHours = Number(newSettings.ipLockoutHours);

    persistData();
    const stats = calculateStats();
    broadcastEvent('SETTINGS_UPDATED', { settings, stats });
    return res.json({ success: true, settings, stats });
  });

  // 8. Admin: Reset votes (for rehearsals / gladi bersih)
  app.post('/api/admin/reset-votes', (req, res) => {
    const { pin, confirmText } = req.body;
    if (pin !== settings.adminPin) {
      return res.status(401).json({ success: false, message: 'Akses ditolak.' });
    }

    if (confirmText !== 'RESET_SEMUA_SUARA') {
      return res.status(400).json({ success: false, message: 'Konfirmasi reset tidak sesuai.' });
    }

    votes = [];
    persistData();

    const stats = calculateStats();
    broadcastEvent('VOTES_RESET', { stats });
    return res.json({ success: true, message: 'Seluruh suara telah di-reset.', stats });
  });

  // 9. Admin: Get audit logs (full list of voters for export)
  app.post('/api/admin/logs', (req, res) => {
    const { pin } = req.body;
    if (pin !== settings.adminPin) {
      return res.status(401).json({ success: false, message: 'Akses ditolak.' });
    }

    const logsWithCandidateInfo = votes.map(v => {
      const cand = candidates.find(c => c.id === v.candidateId);
      return {
        ...v,
        candidateName: cand ? `Paslon ${cand.number}: ${cand.chairmanName} & ${cand.viceChairmanName}` : `Paslon ${v.candidateNumber}`
      };
    });

    return res.json({
      success: true,
      votes: logsWithCandidateInfo,
      stats: calculateStats(),
      candidates,
      settings
    });
  });

  // Vite middleware in development or static serve in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[E-VOTING OSIS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start E-Voting server:', err);
  process.exit(1);
});
