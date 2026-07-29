const { outputHTML, domainAllowed } = require('../lib/cms-oauth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const url = new URL(req.url, `${proto}://${host}`);
  const provider = url.searchParams.get('provider');
  const domain = url.searchParams.get('site_id');

  if (provider !== 'github') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    res.end(
      outputHTML({
        error: 'Your Git backend is not supported by the authenticator.',
        errorCode: 'UNSUPPORTED_BACKEND',
      })
    );
    return;
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const allowed = process.env.ALLOWED_DOMAINS || 'leaving-egypt-standalone.vercel.app';

  if (!domainAllowed(domain, allowed)) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    res.end(
      outputHTML({
        provider,
        error: 'Your domain is not allowed to use the authenticator.',
        errorCode: 'UNSUPPORTED_DOMAIN',
      })
    );
    return;
  }

  if (!clientId || !clientSecret) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html;charset=UTF-8');
    res.end(
      outputHTML({
        provider,
        error: 'OAuth app client ID or secret is not configured on Vercel.',
        errorCode: 'MISCONFIGURED_CLIENT',
      })
    );
    return;
  }

  const csrfToken = crypto.randomUUID().replaceAll('-', '');
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo,user',
    state: csrfToken,
  });

  res.setHeader(
    'Set-Cookie',
    `csrf-token=github_${csrfToken}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`
  );
  res.statusCode = 302;
  res.setHeader('Location', `https://github.com/login/oauth/authorize?${params.toString()}`);
  res.end();
};
