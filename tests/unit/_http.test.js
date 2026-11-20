import { describe, expect, it } from 'vitest';
import {
  buildCookie,
  clean,
  isEmail,
  isPhone,
  normalizeEmail,
  parseCookies,
  rateLimit,
  rateLimitClient,
  readBody,
  referenceId,
  sha256,
} from '../../server/api/_http.js';

function mockReq(chunks, headers = {}, socket = { remoteAddress: '203.0.113.7' }) {
  return {
    headers,
    socket,
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) yield Buffer.from(chunk);
    },
  };
}

describe('readBody', () => {
  it('parses a JSON body from an async iterable', async () => {
    const body = await readBody(mockReq(['{"name":"Ada Lovelace","n":2}']));
    expect(body).toEqual({ name: 'Ada Lovelace', n: 2 });
  });

  it('returns {} for malformed JSON instead of throwing', async () => {
    expect(await readBody(mockReq(['{not json']))).toEqual({});
  });

  it('returns {} for an empty body', async () => {
    expect(await readBody(mockReq([]))).toEqual({});
  });

  it('parses x-www-form-urlencoded bodies', async () => {
    const req = mockReq(['a=1&b=two words'], { 'content-type': 'application/x-www-form-urlencoded' });
    expect(await readBody(req)).toEqual({ a: '1', b: 'two words' });
  });

  it('flags and returns {} for bodies above the 128 KiB limit', async () => {
    const req = mockReq(['x'.repeat(200 * 1024)]);
    expect(await readBody(req)).toEqual({});
    expect(req.bodyTooLarge).toBe(true);
  });
});

describe('clean', () => {
  it('strips control characters and trims', () => {
    expect(clean('  \u0000hello\u0007  ')).toBe('hello');
  });

  it('defaults to "" for missing values and slices to the limit', () => {
    expect(clean(undefined)).toBe('');
    expect(clean(null)).toBe('');
    expect(clean('x'.repeat(200))).toHaveLength(120);
    expect(clean('abc', 2)).toBe('ab');
  });
});

describe('isEmail / isPhone / normalizeEmail', () => {
  it('accepts real addresses and rejects junk', () => {
    expect(isEmail('ada@example.com')).toBe(true);
    expect(isEmail('ada@example.co')).toBe(true);
    expect(isEmail('ada@example.com.org')).toBe(true);
    expect(isEmail('ada@example')).toBe(false);
    expect(isEmail('ada@example.c')).toBe(false); // TLD needs 2+ letters
    expect(isEmail('not-an-email')).toBe(false);
  });

  it('accepts 7–15 digits', () => {
    expect(isPhone('+91 98765 43210')).toBe(true);
    expect(isPhone('9876543210')).toBe(true);
    expect(isPhone('1234567')).toBe(true);
    expect(isPhone('1234')).toBe(false);
    expect(isPhone('12345678901234567')).toBe(false);
  });

  it('lowercases and trims emails', () => {
    expect(normalizeEmail('  ADA@Example.COM ')).toBe('ada@example.com');
    expect(normalizeEmail(undefined)).toBe('');
  });
});

describe('sha256 / referenceId', () => {
  it('matches the well-known SHA-256 of "abc"', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('generates NGD-<9 uppercase alphanumerics>', () => {
    expect(referenceId()).toMatch(/^NGD-[A-Z0-9]{9}$/);
  });
});

describe('parseCookies / buildCookie', () => {
  it('parses cookies from a header', () => {
    expect(parseCookies({ headers: { cookie: 'ngd_admin=abc123; other=two' } })).toEqual({
      ngd_admin: 'abc123',
      other: 'two',
    });
    expect(parseCookies({ headers: {} })).toEqual({});
  });

  it('builds HttpOnly, SameSite=Strict cookies', () => {
    const cookie = buildCookie('ngd_admin', 'tok v', { maxAge: 3600 });
    expect(cookie).toContain('ngd_admin=tok%20v');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Max-Age=3600');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Secure'); // secure by default
    expect(buildCookie('x', 'y', { secure: false })).not.toContain('Secure');
  });
});

describe('rateLimit', () => {
  it('allows up to `limit` calls per window then rejects', () => {
    const results = [1, 2, 3, 4].map(() => rateLimit('unit-rate-limit', 3, 1000).allowed);
    expect(results).toEqual([true, true, true, false]);
  });

  it('resets after the window elapses', async () => {
    expect(rateLimit('unit-rate-limit-window', 1, 30).allowed).toBe(true);
    expect(rateLimit('unit-rate-limit-window', 1, 30).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 45));
    expect(rateLimit('unit-rate-limit-window', 1, 30).allowed).toBe(true);
  });
});

describe('rateLimitClient', () => {
  const clientReq = (xff, remoteAddress = '203.0.113.7') => ({
    headers: xff ? { 'x-forwarded-for': xff } : {},
    socket: { remoteAddress },
  });

  it('rejects when the per-client bucket is exhausted', () => {
    const results = [0, 1, 2, 3].map(() => rateLimitClient(clientReq('198.51.100.5'), 'unit-rc-1', 2, 60000).allowed);
    expect(results).toEqual([true, true, false, false]);
  });

  it('fails closed: rotating X-Forwarded-For cannot lift the global peer bucket', () => {
    const allowed = [];
    for (let i = 0; i < 8; i += 1) {
      allowed.push(rateLimitClient(clientReq(`198.51.100.${100 + i}`), 'unit-rc-2', 100, 60000, 4, 60000).allowed);
    }
    // With the global limit at 4, the first 4 rotate-XFF calls pass and the
    // rest are rejected — the peer bucket keys on the socket address, not the
    // header, so the cap cannot be dodged by rotating the header.
    expect(allowed.slice(0, 4).every(Boolean)).toBe(true);
    expect(allowed.slice(4).every((v) => !v)).toBe(true);
  });
});
