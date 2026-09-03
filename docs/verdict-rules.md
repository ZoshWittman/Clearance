# Verdict Rules

This document describes the deterministic rules used by Clearance to compute verdicts.

## Verdict Types

### DONE

A packet receives a `DONE` verdict when:

1. **All evidence exists**: Every evidence item can be located
2. **All fingerprints match**: SHA-256 hashes of files match expected values
3. **No human review required**: `humanReviewRequired` is `false` or `undefined`

**Example:**

```json
{
  "ask": "Implement login feature",
  "evidence": [
    { "type": "file", "path": "./src/login.ts", "sha256": "abc..." },
    { "type": "text", "content": "Tests: 10/10 passing" }
  ],
  "humanReviewRequired": false
}
```

**Verdict**: `DONE` ✓

### NOT_DONE

A packet receives a `NOT_DONE` verdict when:

1. **Evidence is missing**: One or more evidence items cannot be located
2. **Fingerprint mismatch**: A file's actual SHA-256 doesn't match the expected hash
3. **Invalid evidence**: Evidence lacks required fields (e.g., file evidence without path)

**Example (missing file):**

```json
{
  "ask": "Deploy database",
  "evidence": [
    { "type": "file", "path": "./deploy-logs.txt" }
  ]
}
```

If `deploy-logs.txt` doesn't exist: **Verdict**: `NOT_DONE` ✗

**Example (tampered file):**

```json
{
  "ask": "Security patch",
  "evidence": [
    { "type": "file", "path": "./patch.txt", "sha256": "expected-hash" }
  ]
}
```

If `patch.txt` was modified after the hash was computed: **Verdict**: `NOT_DONE` ✗

### NEEDS_HUMAN

A packet receives a `NEEDS_HUMAN` verdict when:

1. **Human review explicitly required**: `humanReviewRequired` is `true`
2. **Evidence is valid**: All evidence exists and fingerprints match

**Example:**

```json
{
  "ask": "Redesign landing page",
  "evidence": [
    { "type": "file", "path": "./design.html", "sha256": "xyz..." },
    { "type": "text", "content": "Visual design complete" }
  ],
  "humanReviewRequired": true
}
```

**Verdict**: `NEEDS_HUMAN` ⚠️

## Evidence Verification Logic

### File Evidence

```typescript
if (evidence.type === 'file') {
  // Check 1: Does the file exist?
  const exists = existsSync(evidence.path);
  if (!exists) return NOT_DONE;

  // Check 2: If SHA-256 provided, does it match?
  if (evidence.sha256) {
    const actual = computeSHA256(evidence.path);
    if (actual !== evidence.sha256) return NOT_DONE;
  }
}
```

### Text Evidence

```typescript
if (evidence.type === 'text') {
  // Check: Is content present?
  const exists = !!evidence.content;
  if (!exists) return NOT_DONE;
}
```

### URL Evidence

```typescript
if (evidence.type === 'url') {
  // Check: Is URL present? (not validated)
  const exists = !!evidence.url;
  if (!exists) return NOT_DONE;
}
```

## Priority Order

When multiple conditions apply, verdicts are determined in this priority:

1. **Fingerprint mismatch** → `NOT_DONE` (highest priority)
2. **Missing evidence** → `NOT_DONE`
3. **Human review required** → `NEEDS_HUMAN`
4. **All checks pass** → `DONE`

## Acceptance vs. Verdict

**Verdict** is computed automatically by Clearance based on evidence.

**Acceptance** is a human action:

- `pending`: Awaiting human review
- `accepted`: Human approves the deliverable
- `rejected`: Human rejects the deliverable
- `changes_requested`: Human requests modifications

Only packets with `DONE` or `NEEDS_HUMAN` verdicts can be accepted. Packets with `NOT_DONE` verdicts must be corrected before acceptance.

## Examples

### Example 1: Clear Success

**Packet:**

```json
{
  "ask": "Add logout button",
  "evidence": [
    { "type": "file", "path": "./components/logout.tsx", "sha256": "valid-hash" }
  ]
}
```

**Checks:**

- File exists: ✓
- SHA-256 matches: ✓
- Human review required: No

**Verdict:** `DONE`

---

### Example 2: Partial Evidence

**Packet:**

```json
{
  "ask": "Migrate database schema",
  "evidence": [
    { "type": "file", "path": "./migration-001.sql", "sha256": "valid" },
    { "type": "file", "path": "./migration-002.sql" }
  ]
}
```

**Checks:**

- migration-001.sql exists: ✓
- migration-001.sql SHA-256 matches: ✓
- migration-002.sql exists: ✗

**Verdict:** `NOT_DONE` (reason: "Missing 1 evidence item(s)")

---

### Example 3: Tampered Evidence

**Packet:**

```json
{
  "ask": "Security audit",
  "evidence": [
    { "type": "file", "path": "./audit-report.pdf", "sha256": "original-hash" }
  ]
}
```

**Checks:**

- File exists: ✓
- SHA-256 matches: ✗ (file was modified)

**Verdict:** `NOT_DONE` (reason: "Fingerprint mismatch detected in 1 item(s)")

---

### Example 4: Human Review

**Packet:**

```json
{
  "ask": "Design new logo",
  "evidence": [
    { "type": "file", "path": "./logo.svg", "sha256": "valid" }
  ],
  "humanReviewRequired": true
}
```

**Checks:**

- File exists: ✓
- SHA-256 matches: ✓
- Human review required: ✓

**Verdict:** `NEEDS_HUMAN` (reason: "Partial verification - human review required")

## Testing Verdicts

Run the fixtures to see each verdict in action:

```bash
npx clearance verify fixtures/clear-done.json       # DONE
npx clearance verify fixtures/missing-evidence.json # NOT_DONE
npx clearance verify fixtures/needs-human.json      # NEEDS_HUMAN
npx clearance verify fixtures/tampered.json         # NOT_DONE
```
