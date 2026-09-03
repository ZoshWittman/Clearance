import { describe, it, expect } from 'vitest';
import type { VerdictType, AcceptanceStatus, Evidence, Packet } from './types.js';

describe('types', () => {
  it('defines valid verdict types', () => {
    const verdicts: VerdictType[] = ['DONE', 'NOT_DONE', 'NEEDS_HUMAN'];
    expect(verdicts).toHaveLength(3);
  });

  it('defines valid acceptance statuses', () => {
    const statuses: AcceptanceStatus[] = [
      'pending',
      'accepted',
      'rejected',
      'changes_requested',
    ];
    expect(statuses).toHaveLength(4);
  });

  it('creates file evidence', () => {
    const evidence: Evidence = {
      type: 'file',
      path: './test.txt',
      sha256: 'abc123',
    };
    expect(evidence.type).toBe('file');
  });

  it('creates text evidence', () => {
    const evidence: Evidence = {
      type: 'text',
      content: 'Some text',
    };
    expect(evidence.type).toBe('text');
  });

  it('creates url evidence', () => {
    const evidence: Evidence = {
      type: 'url',
      url: 'https://example.com',
    };
    expect(evidence.type).toBe('url');
  });

  it('creates packet with minimal fields', () => {
    const packet: Packet = {
      id: 'test-1',
      ask: 'Do something',
      evidence: [],
      createdAt: new Date().toISOString(),
    };
    expect(packet.id).toBe('test-1');
    expect(packet.evidence).toHaveLength(0);
  });

  it('creates packet with all optional fields', () => {
    const packet: Packet = {
      id: 'test-2',
      ask: 'Complete task',
      evidence: [{ type: 'text', content: 'done' }],
      createdAt: new Date().toISOString(),
      verdict: 'DONE',
      verdictReason: 'All checks passed',
      humanReviewRequired: false,
      acceptanceStatus: 'accepted',
      acceptedAt: new Date().toISOString(),
      acceptedBy: 'user@example.com',
      rejectionReason: undefined,
    };
    expect(packet.verdict).toBe('DONE');
    expect(packet.acceptanceStatus).toBe('accepted');
  });
});
