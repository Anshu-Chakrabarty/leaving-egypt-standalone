import { timingSafeEqual } from 'node:crypto';

function cleanSecret(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

async function readJson(req) {
  if (req.body != null && req.body !== '') {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    const text = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body);
    if (text) return JSON.parse(text);
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  try {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== 'POST') {
      return send(res, 405, { error: 'Method not allowed' });
    }

    let body = {};
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { error: 'Invalid JSON body', code: 'BAD_JSON' });
    }

    const expected = cleanSecret(process.env.CMS_PASSWORD);
    const given = cleanSecret(body.password);
    const token = cleanSecret(process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN);

    if (!expected) {
      return send(res, 503, {
        error: 'CMS_PASSWORD missing in Vercel env. Add it and Redeploy.',
        code: 'NO_PASSWORD_ENV',
      });
    }
    if (!token) {
      return send(res, 503, {
        error: 'CMS_GITHUB_TOKEN missing in Vercel env. Add it and Redeploy.',
        code: 'NO_TOKEN_ENV',
      });
    }
    if (!given || !safeEqual(given, expected)) {
      return send(res, 401, {
        error: 'Wrong password.',
        code: 'INVALID_PASSWORD',
        debug: { typedLength: given.length, configuredLength: expected.length },
      });
    }

    return send(res, 200, { ok: true });
  } catch (err) {
    console.error('cms-login fatal', err);
    return send(res, 500, {
      error: 'Login crashed: ' + (err?.message || 'unknown'),
      code: 'UNEXPECTED',
    });
  }
}
