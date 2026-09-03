/**
 * Core types for Clearance packets and verdicts
 */

export type VerdictType = 'DONE' | 'NOT_DONE' | 'NEEDS_HUMAN';

export type AcceptanceStatus = 'pending' | 'accepted' | 'rejected' | 'changes_requested';

export interface Evidence {
  type: 'file' | 'url' | 'text';
  path?: string;
  url?: string;
  content?: string;
  sha256?: string;
}

export interface Packet {
  id: string;
  ask: string;
  evidence: Evidence[];
  createdAt: string;
  verdict?: VerdictType;
  verdictReason?: string;
  humanReviewRequired?: boolean;
  acceptanceStatus?: AcceptanceStatus;
  acceptedAt?: string;
  acceptedBy?: string;
  rejectionReason?: string;
}

export interface VerificationResult {
  verdict: VerdictType;
  reason: string;
  evidenceChecks: {
    evidence: Evidence;
    exists: boolean;
    fingerprintValid: boolean;
    error?: string;
  }[];
}

export interface AcceptanceResult {
  status: AcceptanceStatus;
  packetId: string;
  timestamp: string;
  actor?: string;
  reason?: string;
}
