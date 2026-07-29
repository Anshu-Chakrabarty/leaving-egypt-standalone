import { checkPassword, readBody, json } from '../lib/cms-auth-server.js';

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
    const result = checkPassword(body.password);
    if (!result.ok) {
      return json(res, result.status, {
        error: result.error,
        code: result.code,
        debug: result.debug,
      });
    }
    return json(res, 200, { ok: true });
  } catch (err) {
    console.error('cms-login', err);
    return json(res, 500, {
      error: 'Login failed unexpectedly: ' + (err?.message || 'unknown'),
      code: 'UNEXPECTED',
    });
  }
}
