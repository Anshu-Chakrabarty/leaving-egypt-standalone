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

function checkPassword(password) {
  const expected = cleanSecret(process.env.CMS_PASSWORD);
  const given = cleanSecret(password);
  const token = cleanSecret(process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN);
  if (!expected) {
    return { ok: false, status: 503, error: 'Editor access is not fully configured.', code: 'NO_PASSWORD_ENV' };
  }
  if (!token || token.length < 20) {
    return { ok: false, status: 503, error: 'Editor access is not fully configured.', code: 'NO_TOKEN_ENV' };
  }
  if (!given || !safeEqual(given, expected)) {
    return {
      ok: false,
      status: 401,
      error: 'Wrong password.',
      code: 'INVALID_PASSWORD',
    };
  }
  return { ok: true, token };
}

const REPO = 'Anshu-Chakrabarty/leaving-egypt-standalone';
const BRANCH = 'main';
const ALLOWED_PREFIXES = [
  'src/content/settings/',
  'src/content/faq/',
  'src/content/copy/',
  'src/content/pages/',
];

function allowedPath(path) {
  const p = String(path || '');
  if (p.includes('..') || p.startsWith('/') || p.includes('\\')) return false;
  return ALLOWED_PREFIXES.some((prefix) => p.startsWith(prefix) && p.endsWith('.json'));
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

    const body = await readJson(req);
    const auth = checkPassword(body.password);
    if (!auth.ok) {
      return send(res, auth.status, {
        error: auth.error,
        code: auth.code,
        debug: auth.debug,
      });
    }

    const path = String(body.path || '');
    if (!allowedPath(path)) {
      return send(res, 400, { error: 'That file path is not editable.', code: 'BAD_PATH' });
    }

    const token = auth.token;
    const action = body.action === 'put' ? 'put' : 'get';

    if (action === 'get') {
      const gh = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'leaving-egypt-cms',
          },
        }
      );
      const data = await gh.json().catch(() => ({}));
      if (!gh.ok) {
        return send(res, 502, {
          error: data.message || `GitHub could not read file (${gh.status}).`,
          code: 'GITHUB_GET_FAILED',
        });
      }
      const content = Buffer.from(data.content || '', 'base64').toString('utf8');
      return send(res, 200, { path, sha: data.sha, content });
    }

    const content = String(body.content ?? '');
    const sha = String(body.sha || '');
    if (!sha) return send(res, 400, { error: 'Missing file sha.', code: 'MISSING_SHA' });

    const gh = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${encodeURI(path)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'User-Agent': 'leaving-egypt-cms',
        },
        body: JSON.stringify({
          message: String(body.message || `Update ${path} via admin`),
          content: Buffer.from(content, 'utf8').toString('base64'),
          sha,
          branch: BRANCH,
        }),
      }
    );
    const data = await gh.json().catch(() => ({}));
    if (!gh.ok) {
      return send(res, 502, {
        error: data.message || `GitHub save failed (${gh.status}).`,
        code: 'GITHUB_PUT_FAILED',
      });
    }
    return send(res, 200, { path, sha: data.content?.sha, ok: true });
  } catch (err) {
    console.error('cms-content fatal', err);
    return send(res, 500, {
      error: 'Server error: ' + (err?.message || 'unknown'),
      code: 'UNEXPECTED',
    });
  }
}
