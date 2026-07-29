/**
 * Generate Sveltia CMS config from src/content/copy/*.json
 */
import fs from 'node:fs';
import path from 'node:path';

function labelize(name) {
  return String(name)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function fieldsFromValue(value, name) {
  if (typeof value === 'string') {
    const multiline = value.includes('\n') || value.length > 80;
    return {
      label: labelize(name),
      name,
      widget: multiline ? 'text' : 'string',
    };
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return { label: labelize(name), name, widget: 'string' };
  }
  if (Array.isArray(value)) {
    if (value.length === 0 || typeof value[0] === 'string') {
      return {
        label: labelize(name),
        name,
        widget: 'list',
        field: { label: 'Item', name: 'item', widget: 'string' },
      };
    }
    const first = value[0];
    let summary = '{{fields.item}}';
    if (first && typeof first === 'object') {
      if ('title' in first) summary = '{{fields.title}}';
      else if ('heading' in first) summary = '{{fields.heading}}';
      else if ('question' in first) summary = '{{fields.question}}';
      else if ('name' in first) summary = '{{fields.name}}';
      else if ('id' in first) summary = '{{fields.id}}';
    }
    return {
      label: labelize(name),
      name,
      widget: 'list',
      summary,
      fields: Object.entries(first).map(([k, v]) => fieldsFromValue(v, k)),
    };
  }
  if (value && typeof value === 'object') {
    return {
      label: labelize(name),
      name,
      widget: 'object',
      collapsed: name !== 'hero',
      fields: Object.entries(value).map(([k, v]) => fieldsFromValue(v, k)),
    };
  }
  return { label: labelize(name), name, widget: 'string', required: false };
}

function dumpFields(fields, indent) {
  const pad = ' '.repeat(indent);
  let out = '';
  for (const f of fields) {
    out += `${pad}- label: ${JSON.stringify(f.label)}\n`;
    out += `${pad}  name: ${JSON.stringify(f.name)}\n`;
    out += `${pad}  widget: ${JSON.stringify(f.widget)}\n`;
    if (f.required === false) out += `${pad}  required: false\n`;
    if (typeof f.collapsed === 'boolean') out += `${pad}  collapsed: ${f.collapsed}\n`;
    if (f.summary) out += `${pad}  summary: ${JSON.stringify(f.summary)}\n`;
    if (f.hint) out += `${pad}  hint: ${JSON.stringify(f.hint)}\n`;
    if (f.field) {
      out += `${pad}  field:\n`;
      out += `${pad}    label: ${JSON.stringify(f.field.label)}\n`;
      out += `${pad}    name: ${JSON.stringify(f.field.name)}\n`;
      out += `${pad}    widget: ${JSON.stringify(f.field.widget)}\n`;
    }
    if (f.fields) {
      out += `${pad}  fields:\n`;
      out += dumpFields(f.fields, indent + 4);
    }
  }
  return out;
}

const copyDir = 'src/content/copy';
const pages = fs.readdirSync(copyDir).filter((f) => f.endsWith('.json')).sort();

const labelMap = {
  home: 'Home',
  about: 'About',
  pillars: 'The Four Pillars',
  programs: 'Brotherhood & Programs',
  resources: 'Resources',
  contact: 'Contact',
  'statement-of-faith': 'Statement of Faith',
  privacy: 'Privacy Policy',
  terms: 'Terms & Conditions',
  disclaimer: 'Disclaimer',
  accessibility: 'Accessibility',
  'thank-you': 'Thank You',
};

let yaml = `# yaml-language-server: $schema=https://unpkg.com/@sveltia/cms/schema/sveltia-cms.json
# Plain-text page editing — no HTML.

backend:
  name: github
  repo: Anshu-Chakrabarty/leaving-egypt-standalone
  branch: main
  auth_methods: [token]
  skip_ci: false

media_folder: public/assets/images/uploads
public_folder: /assets/images/uploads

collections:
  - name: settings
    label: Site Settings
    files:
      - name: site
        label: Site Settings
        file: src/content/settings/site.json
        fields:
          - { label: Organization Name, name: orgName, widget: string }
          - { label: Tagline, name: tagline, widget: string }
          - { label: Short Mission, name: shortMission, widget: text }
          - { label: Footer Mission, name: footerMission, widget: text }
          - { label: Domain (https://...), name: domain, widget: string }
          - { label: Form Recipient Email, name: formEmail, widget: string }
          - { label: Phone, name: phone, widget: string, required: false }
          - { label: Mailing Address, name: mailingAddress, widget: string, required: false }
          - label: Social Links
            name: social
            widget: object
            fields:
              - { label: Instagram URL, name: instagram, widget: string }
              - { label: Facebook URL, name: facebook, widget: string }
              - { label: YouTube URL, name: youtube, widget: string }

  - name: page_meta
    label: Page SEO
    label_singular: Page
    folder: src/content/pages
    extension: json
    create: false
    slug: "{{slug}}"
    fields:
      - { label: Slug, name: slug, widget: hidden }
      - { label: Browser Title, name: title, widget: string }
      - { label: Meta Description, name: description, widget: text }
      - { label: Path, name: path, widget: hidden }

  - name: faq
    label: FAQ
    files:
      - name: faq_items
        label: FAQ Items
        file: src/content/faq/items.json
        fields:
          - label: Questions
            name: items
            widget: list
            summary: "{{fields.question}}"
            fields:
              - { label: Question, name: question, widget: string }
              - { label: Answer, name: answer, widget: text, hint: "Normal sentences. Link example: [Privacy Policy](/privacy)" }

  - name: page_copy
    label: Page Content
    description: Edit the words on each page as normal text (no HTML).
    files:
`;

for (const file of pages) {
  const slug = file.replace(/\.json$/, '');
  const data = JSON.parse(fs.readFileSync(path.join(copyDir, file), 'utf8'));
  const fields = Object.entries(data).map(([k, v]) => fieldsFromValue(v, k));
  yaml += `      - name: ${slug}\n`;
  yaml += `        label: ${JSON.stringify(labelMap[slug] || slug)}\n`;
  yaml += `        file: src/content/copy/${file}\n`;
  yaml += `        fields:\n`;
  yaml += dumpFields(fields, 10);
  yaml += `\n`;
}

fs.writeFileSync('public/admin/config.yml', yaml);
console.log('OK', pages.length, 'pages,', yaml.split('\n').length, 'lines');
