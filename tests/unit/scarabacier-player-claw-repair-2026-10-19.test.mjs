import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Exact approved rear claw clean-up output. Prevents silent restoration
// of the detached foot fragment while keeping existing asset ID stable.
test('Scarabacier player rear claw: approved real WebP binary is retained', () => {
  const path = new URL('../../assets/library/capture/creatures/scarabacier/runtime/scarabacier_player.webp', import.meta.url);
  const data = readFileSync(path);
  assert.equal(data.toString('ascii', 0, 4), 'RIFF');
  assert.equal(data.toString('ascii', 8, 12), 'WEBP');
  assert.equal(data.toString('ascii', 12, 16), 'VP8X');
  assert.equal(1 + data.readUIntLE(24, 3), 1024);
  assert.equal(1 + data.readUIntLE(27, 3), 1024);
  assert.ok((data[20] & 0x10) !== 0, 'must preserve real alpha');
  assert.equal(createHash('sha256').update(data).digest('hex'),
    '2f6475c0b2b26be1fe67aaaa93c2d34bcc319fab2d181aa6e3fabe77d2e505a3');
});
