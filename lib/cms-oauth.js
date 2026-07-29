/**
 * Shared OAuth helpers for Sveltia CMS (GitHub authorization code flow).
 * Protocol matches https://github.com/sveltia/sveltia-cms-auth
 */

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function outputHTML({ provider = 'unknown', token, error, errorCode }) {
  const state = error ? 'error' : 'success';
  const content = error ? { provider, error, errorCode } : { provider, token };

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Authorizing…</title></head>
  <body>
    <p>Authorizing with ${provider}… you can close this window.</p>
    <script>
      (() => {
        const provider = ${JSON.stringify(provider)};
        const state = ${JSON.stringify(state)};
        const content = ${JSON.stringify(content)};
        window.addEventListener('message', ({ data, origin }) => {
          if (data === 'authorizing:' + provider) {
            window.opener?.postMessage(
              'authorization:' + provider + ':' + state + ':' + JSON.stringify(content),
              origin
            );
          }
        });
        window.opener?.postMessage('authorizing:' + provider, '*');
      })();
    </script>
  </body>
</html>`;
}

function domainAllowed(domain, allowedDomains) {
  if (!allowedDomains) return true;
  return allowedDomains.split(',').some((str) =>
    (domain ?? '').match(
      new RegExp(`^${escapeRegExp(str.trim()).replace('\\*', '.+')}$`)
    )
  );
}

module.exports = { outputHTML, domainAllowed };
