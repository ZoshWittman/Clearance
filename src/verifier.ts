/**
 * Deterministic verdict engine
 */

import { existsSync } from 'fs';
import { Evidence, Packet, VerificationResult, VerdictType } from './types.js';
import { verifySHA256 } from './fingerprint.js';

export async function verifyPacket(packet: Packet): Promise<VerificationResult> {
  const evidenceChecks = await Promise.all(
    packet.evidence.map(async (evidence) => {
      const check = {
        evidence,
        exists: false,
        fingerprintValid: false,
        error: undefined as string | undefined,
      };

      try {
        if (evidence.type === 'file') {
          if (!evidence.path) {
            check.error = 'File evidence missing path';
            return check;
          }

          check.exists = existsSync(evidence.path);

          if (!check.exists) {
            check.error = 'File does not exist';
            return check;
          }

          if (evidence.sha256) {
            check.fingerprintValid = await verifySHA256(evidence.path, evidence.sha256);
            if (!check.fingerprintValid) {
              check.error = 'SHA-256 fingerprint mismatch';
            }
          } else {
            check.fingerprintValid = true;
          }
        } else if (evidence.type === 'text') {
          check.exists = !!evidence.content;
          check.fingerprintValid = true;
        } else if (evidence.type === 'url') {
          check.exists = !!evidence.url;
          check.fingerprintValid = true;
        }
      } catch (error) {
        check.error = error instanceof Error ? error.message : 'Unknown error';
      }

      return check;
    })
  );

  const verdict = determineVerdict(evidenceChecks, packet);
  const reason = generateVerdictReason(verdict, evidenceChecks);

  return {
    verdict,
    reason,
    evidenceChecks,
  };
}

function determineVerdict(
  evidenceChecks: VerificationResult['evidenceChecks'],
  packet: Packet
): VerdictType {
  const allExist = evidenceChecks.every((check) => check.exists);
  const allFingerprintsValid = evidenceChecks.every((check) => check.fingerprintValid);
  const anyMissing = evidenceChecks.some((check) => !check.exists);
  const anyFingerprintInvalid = evidenceChecks.some(
    (check) => check.exists && !check.fingerprintValid
  );

  if (anyFingerprintInvalid) {
    return 'NOT_DONE';
  }

  if (anyMissing) {
    return 'NOT_DONE';
  }

  if (allExist && allFingerprintsValid) {
    if (packet.humanReviewRequired) {
      return 'NEEDS_HUMAN';
    }
    return 'DONE';
  }

  return 'NEEDS_HUMAN';
}

function generateVerdictReason(
  verdict: VerdictType,
  evidenceChecks: VerificationResult['evidenceChecks']
): string {
  if (verdict === 'DONE') {
    return `All evidence verified (${evidenceChecks.length} items checked)`;
  }

  const missingEvidence = evidenceChecks.filter((check) => !check.exists);
  const invalidFingerprints = evidenceChecks.filter(
    (check) => check.exists && !check.fingerprintValid
  );

  if (invalidFingerprints.length > 0) {
    return `Fingerprint mismatch detected in ${invalidFingerprints.length} item(s)`;
  }

  if (missingEvidence.length > 0) {
    return `Missing ${missingEvidence.length} evidence item(s)`;
  }

  return 'Partial verification - human review required';
}
