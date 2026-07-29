import { checkPassword, githubToken, readBody, json } from '../lib/cms-auth-server.js';

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
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const body = await readBody(req);
    const auth = checkPassword(body.password);
    if (!auth.ok) {
      return json(res, auth.status, { error: auth.error, code: auth.code });
    }

    const path = String(body.path || '');
    if (!allowedPath(path)) {
      return json(res, 400, { error: 'That file path is not editable.', code: 'BAD_PATH' });
    }

    const token = githubToken();
    const action = body.action === 'put' ? 'put' : 'get';

    if (action === 'get') {
      const gh = await fetch(
        `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
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
        return json(res, 502, {
          error:
            data.message ||
            `GitHub could not read ${path}. Check CMS_GITHUB_TOKEN (Contents: Read and write).`,
          code: 'GITHUB_GET_FAILED',
        });
      }
      const content = Buffer.from(data.content || '', 'base64').toString('utf8');
      return json(res, 200, { path, sha: data.sha, content });
    }

    const content = String(body.content ?? '');
    const sha = String(body.sha || '');
    const message = String(body.message || `Update ${path} via admin`);
    if (!sha) return json(res, 400, { error: 'Missing file sha.', code: 'MISSING_SHA' });

    const gh = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'leaving-egypt-cms',
      },
      body: JSON.stringify({
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        sha,
        branch: BRANCH,
      }),
    });
    const data = await gh.json().catch(() => ({}));
    if (!gh.ok) {
      return json(res, 502, {
        error:
          data.message ||
          'GitHub save failed. Token may lack Contents: Read and write.',
        code: 'GITHUB_PUT_FAILED',
      });
    }
    return json(res, 200, { path, sha: data.content?.sha, ok: true });
  } catch (err) {
    console.error('cms-content', err);
    return json(res, 500, { error: 'Server error while saving content.', code: 'UNEXPECTED' });
  }
}
