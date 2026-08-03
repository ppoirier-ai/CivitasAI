import { describe, it, expect } from 'vitest';
import { checkRateLimit } from '../rate-limit';

describe('checkRateLimit (VULN-05 guard)', () => {
  it('allows up to max attempts within the window', () => {
    const key = `rl:allow-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key).ok).toBe(true);
    }
  });

  it('blocks the attempt after the limit is reached', () => {
    const key = `rl:block-${Date.now()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(key);
    const res = checkRateLimit(key);
    expect(res.ok).toBe(false);
    expect(res.retryAfterSeconds).toBeGreaterThan(0);
    // Still blocked on subsequent attempts.
    expect(checkRateLimit(key).ok).toBe(false);
  });

  it('opens the window again once it elapses', async () => {
    const key = `rl:expire-${Date.now()}`;
    const windowMs = 50;
    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, windowMs);
    expect(checkRateLimit(key, 5, windowMs).ok).toBe(false);
    await new Promise((r) => setTimeout(r, windowMs + 20));
    expect(checkRateLimit(key, 5, windowMs).ok).toBe(true);
  });

  it('tracks keys independently', () => {
    const a = `rl:a-${Date.now()}`;
    const b = `rl:b-${Date.now()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(a);
    expect(checkRateLimit(a).ok).toBe(false);
    expect(checkRateLimit(b).ok).toBe(true);
  });
});
