import { outputHTML } from '../lib/cms-oauth.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url, `${proto}://${host}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const cookie = req.headers.cookie || '';
    const match = cookie.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/);
    const provider = match?.[1];
    const csrfToken = match?.[2];

    const send = (opts) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html;charset=UTF-8');
      res.setHeader(
        'Set-Cookie',
        'csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure'
      );
      res.end(outputHTML(opts));
    };

    if (provider !== 'github') {
      send({
        error: 'Your Git backend is not supported by the authenticator.',
        errorCode: 'UNSUPPORTED_BACKEND',
      });
      return;
    }

    if (!code || !state) {
      send({
        provider,
        error: 'Failed to receive an authorization code. Please try again later.',
        errorCode: 'AUTH_CODE_REQUEST_FAILED',
      });
      return;
    }

    if (!csrfToken || state !== csrfToken) {
      send({
        provider,
        error: 'Potential CSRF attack detected. Authentication flow aborted.',
        errorCode: 'CSRF_DETECTED',
      });
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      send({
        provider,
        error:
          'OAuth is not configured yet. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel Environment Variables, then redeploy.',
        errorCode: 'MISCONFIGURED_CLIENT',
      });
      return;
    }

    let token = '';
    let error = '';

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      const data = await response.json();
      token = data.access_token || '';
      error = data.error || '';
    } catch {
      send({
        provider,
        error: 'Failed to request an access token. Please try again later.',
        errorCode: 'TOKEN_REQUEST_FAILED',
      });
      return;
    }

    send({ provider, token, error });
  } catch (err) {
    console.error('callback error', err);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    res.end(
      outputHTML({
        provider: 'github',
        error: err instanceof Error ? err.message : 'Unexpected callback error',
        errorCode: 'UNEXPECTED',
      })
    );
  }
}
