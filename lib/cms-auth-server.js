import { timingSafeEqual } from 'node:crypto';

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function readBody(req) {
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
  res.end(JSON.stringify(payload));
}

export function checkPassword(password) {
  const expected = String(process.env.CMS_PASSWORD || '').trim();
  const given = String(password || '').trim();
  if (!expected) {
    return {
      ok: false,
      status: 503,
      error:
        'CMS_PASSWORD is not set in Vercel Environment Variables. Add it, then Redeploy.',
      code: 'NOT_CONFIGURED',
    };
  }
  if (!process.env.CMS_GITHUB_TOKEN && !process.env.GITHUB_TOKEN) {
    return {
      ok: false,
      status: 503,
      error:
        'CMS_GITHUB_TOKEN is not set in Vercel. Add your GitHub token, then Redeploy.',
      code: 'NOT_CONFIGURED',
    };
  }
  if (!given || !safeEqual(given, expected)) {
    return {
      ok: false,
      status: 401,
      error:
        'Wrong password. Use the exact CMS_PASSWORD value from Vercel (check for typos/spaces).',
      code: 'INVALID_PASSWORD',
    };
  }
  return { ok: true };
}

export function githubToken() {
  return process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
}
