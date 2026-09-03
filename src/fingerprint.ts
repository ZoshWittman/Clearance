/**
 * SHA-256 fingerprint verification
 */

import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

export async function computeSHA256(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex');
}

export async function verifySHA256(filePath: string, expectedHash: string): Promise<boolean> {
  try {
    const actualHash = await computeSHA256(filePath);
    return actualHash.toLowerCase() === expectedHash.toLowerCase();
  } catch (error) {
    return false;
  }
}

export function computeSHA256Sync(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}
