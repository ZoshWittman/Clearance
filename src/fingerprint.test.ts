import { describe, it, expect } from 'vitest';
import { writeFile, unlink, mkdir, rm } from 'fs/promises';
import { computeSHA256, verifySHA256, computeSHA256Sync } from './fingerprint.js';

describe('fingerprint', () => {
  const testDir = './test-tmp-fingerprint';

  it('computes SHA-256 hash of file content', async () => {
    const testFile = `${testDir}/test1.txt`;
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, 'hello world');
    const hash = await computeSHA256(testFile);
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    await rm(testDir, { recursive: true, force: true });
  });

  it('verifies matching SHA-256 hash', async () => {
    const testFile = `${testDir}/test2.txt`;
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, 'test content');
    const hash = await computeSHA256(testFile);
    const isValid = await verifySHA256(testFile, hash);
    expect(isValid).toBe(true);
    await rm(testDir, { recursive: true, force: true });
  });

  it('detects hash mismatch', async () => {
    const testFile = `${testDir}/test3.txt`;
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, 'original content');
    const originalHash = await computeSHA256(testFile);
    await writeFile(testFile, 'modified content');
    const isValid = await verifySHA256(testFile, originalHash);
    expect(isValid).toBe(false);
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns false for non-existent file', async () => {
    const isValid = await verifySHA256('./non-existent.txt', 'fakehash');
    expect(isValid).toBe(false);
  });

  it('computes SHA-256 synchronously from string', () => {
    const hash = computeSHA256Sync('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('computes SHA-256 synchronously from buffer', () => {
    const hash = computeSHA256Sync(Buffer.from('hello'));
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('is case-insensitive when verifying hashes', async () => {
    const testFile = `${testDir}/test4.txt`;
    await mkdir(testDir, { recursive: true });
    await writeFile(testFile, 'test');
    const hash = await computeSHA256(testFile);
    const upperHash = hash.toUpperCase();
    const isValid = await verifySHA256(testFile, upperHash);
    expect(isValid).toBe(true);
    await rm(testDir, { recursive: true, force: true });
  });
});
