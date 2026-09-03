import { describe, it, expect, beforeEach } from 'vitest';
import { rm } from 'fs/promises';
import { createPacket, savePacket, loadPacket, updatePacketAcceptance } from './packet.js';

describe('packet', () => {
  beforeEach(async () => {
    await rm('./data', { recursive: true, force: true });
  });

  it('creates packet with generated ID', () => {
    const packet = createPacket('Test ask', [
      { type: 'text', content: 'evidence' },
    ]);

    expect(packet.id).toMatch(/^pkt_/);
    expect(packet.ask).toBe('Test ask');
    expect(packet.evidence).toHaveLength(1);
    expect(packet.acceptanceStatus).toBe('pending');
    expect(packet.createdAt).toBeDefined();
  });

  it('saves and loads packet', async () => {
    const packet = createPacket('Test task', [
      { type: 'file', path: './test.txt' },
    ]);

    await savePacket(packet);
    const loaded = await loadPacket(packet.id);

    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe(packet.id);
    expect(loaded?.ask).toBe(packet.ask);
  });

  it('returns null for non-existent packet', async () => {
    const loaded = await loadPacket('non-existent-id');
    expect(loaded).toBeNull();
  });

  it('updates packet acceptance status', async () => {
    const packet = createPacket('Test task', []);
    await savePacket(packet);

    const updated = await updatePacketAcceptance(packet.id, 'accepted', 'test-user');

    expect(updated).toBeDefined();
    expect(updated?.acceptanceStatus).toBe('accepted');
    expect(updated?.acceptedBy).toBe('test-user');
    expect(updated?.acceptedAt).toBeDefined();
  });

  it('updates packet with rejection reason', async () => {
    const packet = createPacket('Test task', []);
    await savePacket(packet);

    const updated = await updatePacketAcceptance(
      packet.id,
      'rejected',
      'test-user',
      'Does not meet requirements'
    );

    expect(updated?.acceptanceStatus).toBe('rejected');
    expect(updated?.rejectionReason).toBe('Does not meet requirements');
  });

  it('returns null when updating non-existent packet', async () => {
    const updated = await updatePacketAcceptance('fake-id', 'accepted');
    expect(updated).toBeNull();
  });

  it('generates unique packet IDs', () => {
    const packet1 = createPacket('Task 1', []);
    const packet2 = createPacket('Task 2', []);

    expect(packet1.id).not.toBe(packet2.id);
  });

  it('preserves evidence array when saving and loading', async () => {
    const evidence = [
      { type: 'file' as const, path: './file1.txt' },
      { type: 'text' as const, content: 'text evidence' },
      { type: 'url' as const, url: 'https://example.com' },
    ];

    const packet = createPacket('Multi-evidence task', evidence);
    await savePacket(packet);
    const loaded = await loadPacket(packet.id);

    expect(loaded?.evidence).toHaveLength(3);
    expect(loaded?.evidence[0].type).toBe('file');
    expect(loaded?.evidence[1].type).toBe('text');
    expect(loaded?.evidence[2].type).toBe('url');
  });
});
