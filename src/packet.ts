/**
 * Packet management
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { Packet, AcceptanceStatus } from './types.js';

const PACKETS_DIR = './data/packets';

export async function savePacket(packet: Packet): Promise<void> {
  await mkdir(PACKETS_DIR, { recursive: true });
  const filePath = `${PACKETS_DIR}/${packet.id}.json`;
  await writeFile(filePath, JSON.stringify(packet, null, 2));
}

export async function loadPacket(packetId: string): Promise<Packet | null> {
  const filePath = `${PACKETS_DIR}/${packetId}.json`;
  if (!existsSync(filePath)) {
    return null;
  }
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function updatePacketAcceptance(
  packetId: string,
  status: AcceptanceStatus,
  actor?: string,
  reason?: string
): Promise<Packet | null> {
  const packet = await loadPacket(packetId);
  if (!packet) {
    return null;
  }

  packet.acceptanceStatus = status;
  packet.acceptedAt = new Date().toISOString();
  if (actor) {
    packet.acceptedBy = actor;
  }
  if (reason) {
    packet.rejectionReason = reason;
  }

  await savePacket(packet);
  return packet;
}

export function createPacket(ask: string, evidence: Packet['evidence']): Packet {
  return {
    id: generatePacketId(),
    ask,
    evidence,
    createdAt: new Date().toISOString(),
    acceptanceStatus: 'pending',
  };
}

function generatePacketId(): string {
  return `pkt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
