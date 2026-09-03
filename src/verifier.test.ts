import { describe, it, expect, beforeEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { verifyPacket } from './verifier.js';
import { Packet } from './types.js';
import { computeSHA256 } from './fingerprint.js';

describe('verifier', () => {
  const testDir = './test-tmp-verifier';

  beforeEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    await mkdir(testDir, { recursive: true });
  });

  it('returns DONE for valid packet with all evidence present', async () => {
    const testFile = `${testDir}/evidence.txt`;
    await writeFile(testFile, 'evidence content');
    const hash = await computeSHA256(testFile);

    const packet: Packet = {
      id: 'test-1',
      ask: 'Test task',
      evidence: [
        { type: 'file', path: testFile, sha256: hash },
        { type: 'text', content: 'inline evidence' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('DONE');
    expect(result.evidenceChecks).toHaveLength(2);
    expect(result.evidenceChecks[0].exists).toBe(true);
    expect(result.evidenceChecks[0].fingerprintValid).toBe(true);
  });

  it('returns NOT_DONE for missing file evidence', async () => {
    const packet: Packet = {
      id: 'test-2',
      ask: 'Test task',
      evidence: [
        { type: 'file', path: './non-existent.txt' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('NOT_DONE');
    expect(result.reason).toContain('Missing');
  });

  it('returns NOT_DONE for fingerprint mismatch', async () => {
    const testFile = `${testDir}/tampered.txt`;
    await writeFile(testFile, 'original content');
    const originalHash = await computeSHA256(testFile);
    await writeFile(testFile, 'modified content');

    const packet: Packet = {
      id: 'test-3',
      ask: 'Test task',
      evidence: [
        { type: 'file', path: testFile, sha256: originalHash },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('NOT_DONE');
    expect(result.reason).toContain('Fingerprint mismatch');
    expect(result.evidenceChecks[0].fingerprintValid).toBe(false);
  });

  it('returns NEEDS_HUMAN when humanReviewRequired is true', async () => {
    const testFile = `${testDir}/review.txt`;
    await writeFile(testFile, 'content');
    const hash = await computeSHA256(testFile);

    const packet: Packet = {
      id: 'test-4',
      ask: 'Test task',
      evidence: [
        { type: 'file', path: testFile, sha256: hash },
      ],
      createdAt: new Date().toISOString(),
      humanReviewRequired: true,
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('NEEDS_HUMAN');
  });

  it('verifies text evidence', async () => {
    const packet: Packet = {
      id: 'test-5',
      ask: 'Test task',
      evidence: [
        { type: 'text', content: 'Some text evidence' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('DONE');
    expect(result.evidenceChecks[0].exists).toBe(true);
  });

  it('verifies URL evidence', async () => {
    const packet: Packet = {
      id: 'test-6',
      ask: 'Test task',
      evidence: [
        { type: 'url', url: 'https://example.com/evidence' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('DONE');
    expect(result.evidenceChecks[0].exists).toBe(true);
  });

  it('handles file evidence without SHA-256', async () => {
    const testFile = `${testDir}/no-hash.txt`;
    await writeFile(testFile, 'content');

    const packet: Packet = {
      id: 'test-7',
      ask: 'Test task',
      evidence: [
        { type: 'file', path: testFile },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('DONE');
    expect(result.evidenceChecks[0].fingerprintValid).toBe(true);
  });

  it('handles file evidence missing path', async () => {
    const packet: Packet = {
      id: 'test-8',
      ask: 'Test task',
      evidence: [
        { type: 'file' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('NOT_DONE');
    expect(result.evidenceChecks[0].error).toContain('missing path');
  });

  it('handles empty text evidence as missing', async () => {
    const packet: Packet = {
      id: 'test-9',
      ask: 'Test task',
      evidence: [
        { type: 'text', content: '' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('NOT_DONE');
  });

  it('handles empty URL evidence as missing', async () => {
    const packet: Packet = {
      id: 'test-10',
      ask: 'Test task',
      evidence: [
        { type: 'url', url: '' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('NOT_DONE');
  });

  it('processes multiple evidence items correctly', async () => {
    const testFile1 = `${testDir}/file1.txt`;
    const testFile2 = `${testDir}/file2.txt`;
    await writeFile(testFile1, 'file1');
    await writeFile(testFile2, 'file2');
    const hash1 = await computeSHA256(testFile1);
    const hash2 = await computeSHA256(testFile2);

    const packet: Packet = {
      id: 'test-11',
      ask: 'Test task',
      evidence: [
        { type: 'file', path: testFile1, sha256: hash1 },
        { type: 'file', path: testFile2, sha256: hash2 },
        { type: 'text', content: 'text evidence' },
        { type: 'url', url: 'https://example.com' },
      ],
      createdAt: new Date().toISOString(),
    };

    const result = await verifyPacket(packet);
    expect(result.verdict).toBe('DONE');
    expect(result.evidenceChecks).toHaveLength(4);
    expect(result.evidenceChecks.every(c => c.exists && c.fingerprintValid)).toBe(true);
  });
});
