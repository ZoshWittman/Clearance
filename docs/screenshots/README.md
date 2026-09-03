# Screenshots

## Web Desk Interface

The Clearance web desk runs on http://localhost:43126

### Main View

The main view displays all packets with:
- Packet ID (monospace font)
- Verdict badge (DONE in green, NOT_DONE in red, NEEDS_HUMAN in yellow)
- Ask description
- Evidence count (📎 icon)
- Acceptance status badge

### Packet List Features

- **Visual Verdicts**: Color-coded badges for quick status identification
- **Hover Effects**: Cards lift slightly on hover for better interaction feedback
- **Real-time Updates**: Auto-refresh every 5 seconds to show new packets
- **Empty State**: Friendly message when no packets exist yet

### Example Display

```
┌─────────────────────────────────────────────────────────────┐
│ Clearance Desk                                               │
│ Done + evidence + human-accept desk for agent deliverables   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ pkt_clear_done_001                          [DONE - Green]   │
│                                                               │
│ Implement user authentication system                          │
│                                                               │
│ 📎 2 evidence items    [PENDING - Gray]                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ pkt_missing_evidence_001                [NOT_DONE - Red]     │
│                                                               │
│ Deploy production database backup system                      │
│                                                               │
│ 📎 3 evidence items    [PENDING - Gray]                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ pkt_needs_human_001                    [NEEDS_HUMAN - Yellow]│
│                                                               │
│ Redesign landing page with new brand guidelines               │
│                                                               │
│ 📎 2 evidence items    [PENDING - Gray]                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ pkt_tampered_001                           [NOT_DONE - Red]  │
│                                                               │
│ Implement security patches for CVE-2026-1234                  │
│                                                               │
│ 📎 1 evidence item     [PENDING - Gray]                      │
└─────────────────────────────────────────────────────────────┘
```

## CLI Output

### Verify Command

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

### Accept Command

```bash
$ npx clearance accept pkt_clear_done_001
Packet pkt_clear_done_001 accepted
```

### Reject Command

```bash
$ npx clearance reject pkt_example_001 "Incomplete tests"
Packet pkt_example_001 rejected
```

## To Generate Real Screenshots

1. Start the web server:
   ```bash
   npm run web
   ```

2. Open http://localhost:43126 in a browser

3. Verify some fixtures first to populate data:
   ```bash
   npx clearance verify fixtures/clear-done.json
   npx clearance verify fixtures/missing-evidence.json
   npx clearance verify fixtures/needs-human.json
   npx clearance verify fixtures/tampered.json
   ```

4. Take screenshots of the web interface showing the packet list
