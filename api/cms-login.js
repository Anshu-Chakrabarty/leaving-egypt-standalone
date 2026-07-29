import { timingSafeEqual } from 'node:crypto';

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const body = raw ? JSON.parse(raw) : {};
    const password = String(body.password || '');

    const expectedPassword = process.env.CMS_PASSWORD;
    const githubToken = process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

    if (!expectedPassword || !githubToken) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            'Password login is not configured yet. Use “Paste GitHub token” on the admin page, or set CMS_PASSWORD and CMS_GITHUB_TOKEN in Vercel.',
          code: 'NOT_CONFIGURED',
        })
      );
      return;
    }

    if (!password || !safeEqual(password, expectedPassword)) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Wrong password.', code: 'INVALID_PASSWORD' }));
      return;
    }

    // Verify token can read the repo before handing it to the browser
    const repo = 'Anshu-Chakrabarty/leaving-egypt-standalone';
    const check = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'leaving-egypt-cms',
      },
    });

    if (!check.ok) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error:
            'CMS_GITHUB_TOKEN is invalid or cannot access the repository. Create a new PAT with repo access and update the Vercel env var.',
          code: 'BAD_TOKEN',
        })
      );
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        token: githubToken,
        backendName: 'github',
      })
    );
  } catch (err) {
    console.error('cms-login error', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Login failed unexpectedly.', code: 'UNEXPECTED' }));
  }
}
