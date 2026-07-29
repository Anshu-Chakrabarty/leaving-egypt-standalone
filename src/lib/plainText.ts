/** Turn plain text (paragraphs separated by blank lines) into HTML. */
export function paragraphsToHtml(input: string): string {
  return String(input || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const escaped = p
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replace(/\n/g, '<br />')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      return `<p>${escaped}</p>`;
    })
    .join('\n');
}

export function nl2brTitle(input: string): string {
  return String(input || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replace(/\n/g, '<br />');
}
