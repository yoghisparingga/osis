export interface Candidate {
  id: string;
  number: number;
  chairmanName: string;
  viceChairmanName: string;
  chairmanClass: string;
  viceChairmanClass: string;
  slogan: string;
  vision: string;
  missions: string[];
  workPrograms: string[];
  color: string;
  avatarUrl?: string;
}

export interface VoteRecord {
  id: string;
  candidateId: string;
  candidateNumber: number;
  voterName: string;
  voterPhone: string;
  timestamp: number;
  ipAddress: string;
  deviceFingerprint: string;
  receiptCode: string;
}

export interface ElectionSettings {
  title: string;
  schoolName: string;
  academicYear: string;
  isVotingOpen: boolean;
  totalEligibleVoters: number;
  adminPin: string;
  ipLockoutHours: number;
}

export interface VoteSummary {
  candidateId: string;
  candidateNumber: number;
  chairmanName: string;
  viceChairmanName: string;
  votes: number;
  percentage: number;
  color: string;
}

export interface ElectionStats {
  totalVotes: number;
  totalEligibleVoters: number;
  participationRate: number;
  leadingCandidate: VoteSummary | null;
  summaries: VoteSummary[];
  isVotingOpen: boolean;
  lastUpdated: number;
}

export interface VoterPassData {
  receiptCode: string;
  voterName: string;
  voterPhone: string;
  candidateNumber: number;
  candidateChairman: string;
  candidateVice: string;
  timestamp: number;
}
