import { timingSafeEqual } from 'node:crypto';

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Remove accidental quotes/spaces from Vercel env values */
export function cleanSecret(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

export function readBody(req) {
  // Vercel sometimes pre-parses JSON onto req.body
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (Buffer.isBuffer(req.body)) {
      try {
        return Promise.resolve(JSON.parse(req.body.toString('utf8') || '{}'));
      } catch {
        return Promise.resolve({});
      }
    }
    if (typeof req.body === 'object') {
      return Promise.resolve(req.body);
    }
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(req.body || '{}'));
      } catch {
        return Promise.resolve({});
      }
    }
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export function checkPassword(password) {
  const expected = cleanSecret(process.env.CMS_PASSWORD);
  const given = cleanSecret(password);

  if (!expected) {
    return {
      ok: false,
      status: 503,
      error:
        'CMS_PASSWORD is not set in Vercel. Add Environment Variable CMS_PASSWORD, then Redeploy.',
      code: 'NOT_CONFIGURED',
    };
  }
  if (!cleanSecret(process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN)) {
    return {
      ok: false,
      status: 503,
      error:
        'CMS_GITHUB_TOKEN is not set in Vercel. Add it, then Redeploy.',
      code: 'NOT_CONFIGURED',
    };
  }
  if (!given || !safeEqual(given, expected)) {
    return {
      ok: false,
      status: 401,
      error:
        'Wrong password. After changing CMS_PASSWORD in Vercel you must Redeploy. Use the exact value (Egypt@2025 has no spaces).',
      code: 'INVALID_PASSWORD',
      // lengths only — helps debug without revealing the secret
      debug: {
        typedLength: given.length,
        configuredLength: expected.length,
      },
    };
  }
  return { ok: true };
}

export function githubToken() {
  return cleanSecret(process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN);
}
