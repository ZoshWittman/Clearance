# Clearance Demo

This document walks through a complete demonstration of Clearance.

## Setup

```bash
# Install and build
npm install
npm run build
npm test  # Verify all 33 tests pass
```

## Demo Flow

### 1. Verify a DONE packet

```bash
$ npx clearance verify fixtures/clear-done.json

Verifying packet: pkt_clear_done_001
Ask: Implement user authentication system
Evidence items: 2

Verdict: DONE
Reason: All evidence verified (2 items checked)

Evidence checks:
  ✓ file: fixtures/evidence/auth-impl.txt
  ✓ text: inline

Packet saved to: data/packets/pkt_clear_done_001.json

Packet is DONE. Run `clearance accept <packet-id>` to accept.
```

**Result**: ✓ All evidence present, fingerprints match, verdict is DONE

### 2. Verify a packet with missing evidence

```bash
$ npx clearance verify fixtures/missing-evidence.json

Verifying packet: pkt_missing_evidence_001
Ask: Deploy production database backup system
Evidence items: 3

Verdict: NOT_DONE
Reason: Missing 3 evidence item(s)

Evidence checks:
  ✗ file: fixtures/evidence/backup-config.txt
    Error: File does not exist
  ✗ file: fixtures/evidence/deployment-logs.txt
    Error: File does not exist
  ✗ file: fixtures/evidence/test-results.txt
    Error: File does not exist
```

**Result**: ✗ Files are missing, verdict is NOT_DONE

### 3. Verify a packet requiring human review

```bash
$ npx clearance verify fixtures/needs-human.json

Verifying packet: pkt_needs_human_001
Ask: Redesign landing page with new brand guidelines
Evidence items: 2

Verdict: NEEDS_HUMAN
Reason: Partial verification - human review required

Evidence checks:
  ✓ file: fixtures/evidence/design-mockup.txt
  ✓ text: inline
```

**Result**: ⚠️ Evidence valid but humanReviewRequired=true, verdict is NEEDS_HUMAN

### 4. Verify a packet with tampered evidence

```bash
$ npx clearance verify fixtures/tampered.json

Verifying packet: pkt_tampered_001
Ask: Implement security patches for CVE-2026-1234
Evidence items: 1

Verdict: NOT_DONE
Reason: Fingerprint mismatch detected in 1 item(s)

Evidence checks:
  ✗ file: fixtures/evidence/security-patch.txt
    Error: SHA-256 fingerprint mismatch
```

**Result**: ✗ SHA-256 fingerprint doesn't match, verdict is NOT_DONE

### 5. Accept a DONE packet

```bash
$ npx clearance accept pkt_clear_done_001
Packet pkt_clear_done_001 accepted
```

**Result**: Packet marked as accepted

### 6. View packets in web interface

```bash
$ npm run web
Clearance web desk running on http://localhost:43126
```

Open http://localhost:43126 to see:
- List of all packets
- Verdict badges (color-coded)
- Acceptance status
- Evidence counts

## Key Takeaways

1. **Deterministic Verdicts**: Same input always produces same verdict
2. **Cryptographic Verification**: SHA-256 prevents evidence tampering
3. **Human-in-the-Loop**: Final acceptance requires human action
4. **Evidence Types**: Supports files (with fingerprints), text, and URLs
5. **Audit Trail**: All verifications and acceptances are recorded

## Creating Your Own Packet

Create a JSON file (e.g., `my-packet.json`):

```json
{
  "id": "pkt_my_work_001",
  "ask": "Describe the work done",
  "evidence": [
    {
      "type": "file",
      "path": "./path/to/deliverable.txt",
      "sha256": "computed-hash-here"
    },
    {
      "type": "text",
      "content": "Tests: 100% passing"
    }
  ],
  "createdAt": "2026-09-03T12:00:00.000Z",
  "humanReviewRequired": false
}
```

To compute the SHA-256 hash:

```bash
shasum -a 256 ./path/to/deliverable.txt
```

Then verify:

```bash
npx clearance verify my-packet.json
```
