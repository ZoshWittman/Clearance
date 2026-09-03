#!/usr/bin/env node

/**
 * Clearance CLI
 */

import { readFile } from 'fs/promises';
import { verifyPacket } from './verifier.js';
import { loadPacket, savePacket, updatePacketAcceptance } from './packet.js';
import { Packet } from './types.js';

const commands = {
  verify: verifyCommand,
  accept: acceptCommand,
  reject: rejectCommand,
  'request-changes': requestChangesCommand,
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] as keyof typeof commands;

  if (!command || !commands[command]) {
    console.error('Usage: clearance <command> [options]');
    console.error('Commands:');
    console.error('  verify <packet-file>       Verify a packet');
    console.error('  accept <packet-id>         Accept a packet');
    console.error('  reject <packet-id>         Reject a packet');
    console.error('  request-changes <packet-id> Request changes on a packet');
    process.exit(1);
  }

  try {
    await commands[command](args.slice(1));
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function verifyCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: clearance verify <packet-file>');
    process.exit(1);
  }

  const packetFile = args[0];
  const content = await readFile(packetFile, 'utf-8');
  const packet: Packet = JSON.parse(content);

  console.log(`Verifying packet: ${packet.id}`);
  console.log(`Ask: ${packet.ask}`);
  console.log(`Evidence items: ${packet.evidence.length}`);
  console.log('');

  const result = await verifyPacket(packet);

  console.log(`Verdict: ${result.verdict}`);
  console.log(`Reason: ${result.reason}`);
  console.log('');

  console.log('Evidence checks:');
  result.evidenceChecks.forEach((check, index) => {
    const status = check.exists && check.fingerprintValid ? '✓' : '✗';
    console.log(`  ${status} ${check.evidence.type}: ${check.evidence.path || check.evidence.url || 'inline'}`);
    if (check.error) {
      console.log(`    Error: ${check.error}`);
    }
  });

  packet.verdict = result.verdict;
  packet.verdictReason = result.reason;
  await savePacket(packet);

  console.log('');
  console.log(`Packet saved to: data/packets/${packet.id}.json`);

  if (result.verdict === 'DONE') {
    console.log('');
    console.log('Packet is DONE. Run `clearance accept <packet-id>` to accept.');
  }
}

async function acceptCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: clearance accept <packet-id>');
    process.exit(1);
  }

  const packetId = args[0];
  const packet = await loadPacket(packetId);

  if (!packet) {
    console.error(`Packet not found: ${packetId}`);
    process.exit(1);
  }

  if (packet.verdict !== 'DONE' && packet.verdict !== 'NEEDS_HUMAN') {
    console.error(`Cannot accept packet with verdict: ${packet.verdict}`);
    process.exit(1);
  }

  await updatePacketAcceptance(packetId, 'accepted', 'cli-user');
  console.log(`Packet ${packetId} accepted`);
}

async function rejectCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: clearance reject <packet-id> [reason]');
    process.exit(1);
  }

  const packetId = args[0];
  const reason = args.slice(1).join(' ') || 'Rejected by user';

  const packet = await loadPacket(packetId);

  if (!packet) {
    console.error(`Packet not found: ${packetId}`);
    process.exit(1);
  }

  await updatePacketAcceptance(packetId, 'rejected', 'cli-user', reason);
  console.log(`Packet ${packetId} rejected`);
}

async function requestChangesCommand(args: string[]) {
  if (args.length === 0) {
    console.error('Usage: clearance request-changes <packet-id> [reason]');
    process.exit(1);
  }

  const packetId = args[0];
  const reason = args.slice(1).join(' ') || 'Changes requested';

  const packet = await loadPacket(packetId);

  if (!packet) {
    console.error(`Packet not found: ${packetId}`);
    process.exit(1);
  }

  await updatePacketAcceptance(packetId, 'changes_requested', 'cli-user', reason);
  console.log(`Changes requested for packet ${packetId}`);
}

main();
