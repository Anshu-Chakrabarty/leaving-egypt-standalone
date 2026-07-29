function cleanSecret(value) {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .trim();
}

export default async function handler(req, res) {
  const expected = cleanSecret(process.env.CMS_PASSWORD);
  const token = cleanSecret(process.env.CMS_GITHUB_TOKEN || process.env.GITHUB_TOKEN);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(
    JSON.stringify({
      hasPassword: Boolean(expected),
      passwordLength: expected.length,
      hasGithubToken: Boolean(token),
      tokenLooksValid: token.length >= 20,
      tokenLength: token.length,
    })
  );
}
