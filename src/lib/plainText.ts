/** Escape text, then turn simple Markdown links into anchors. */
export function plainTextToHtml(input: string): string {
  const escaped = String(input)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

  const withLinks = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, href: string) =>
      `<a href="${href.replaceAll('"', '&quot;')}">${label}</a>`
  );

  return withLinks
    .split(/\n{2,}/)
    .map((para) => `<p>${para.replaceAll('\n', '<br />')}</p>`)
    .join('');
}
