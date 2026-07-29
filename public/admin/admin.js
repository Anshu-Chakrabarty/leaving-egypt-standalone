const REPO = 'Anshu-Chakrabarty/leaving-egypt-standalone';
const BRANCH = 'main';
const TOKEN_KEY = 'le-cms-token';

function decodeBase64(content) {
  const bin = atob(String(content).replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

const FILES = [
  { id: 'settings', label: 'Site Settings', path: 'src/content/settings/site.json' },
  { id: 'faq', label: 'FAQ', path: 'src/content/faq/items.json' },
  { id: 'home', label: 'Home', path: 'src/content/copy/home.json' },
  { id: 'about', label: 'About', path: 'src/content/copy/about.json' },
  { id: 'pillars', label: 'The Four Pillars', path: 'src/content/copy/pillars.json' },
  { id: 'programs', label: 'Brotherhood & Programs', path: 'src/content/copy/programs.json' },
  { id: 'resources', label: 'Resources', path: 'src/content/copy/resources.json' },
  { id: 'contact', label: 'Contact', path: 'src/content/copy/contact.json' },
  { id: 'statement-of-faith', label: 'Statement of Faith', path: 'src/content/copy/statement-of-faith.json' },
  { id: 'privacy', label: 'Privacy Policy', path: 'src/content/copy/privacy.json' },
  { id: 'terms', label: 'Terms & Conditions', path: 'src/content/copy/terms.json' },
  { id: 'disclaimer', label: 'Disclaimer', path: 'src/content/copy/disclaimer.json' },
  { id: 'accessibility', label: 'Accessibility', path: 'src/content/copy/accessibility.json' },
  { id: 'thank-you', label: 'Thank You', path: 'src/content/copy/thank-you.json' },
];

const loginView = document.getElementById('login-view');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const loginErr = document.getElementById('login-err');
const nav = document.getElementById('nav');
const editorEmpty = document.getElementById('editor-empty');
const editorPanel = document.getElementById('editor-panel');
const editorTitle = document.getElementById('editor-title');
const editorForm = document.getElementById('editor-form');
const btnSave = document.getElementById('btn-save');
const btnLogout = document.getElementById('btn-logout');
const statusEl = document.getElementById('status');

let token = sessionStorage.getItem(TOKEN_KEY) || '';
let current = null; // { meta, sha, data }
let dirty = false;

function setStatus(text, kind = '') {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

function showLoginError(msg) {
  loginErr.textContent = msg;
  loginErr.classList.add('show');
}

function labelize(key) {
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
  renderNav();
}

function showLogin() {
  token = '';
  sessionStorage.removeItem(TOKEN_KEY);
  current = null;
  dirty = false;
  btnSave.disabled = true;
  appView.hidden = true;
  loginView.hidden = false;
}

function renderNav() {
  nav.innerHTML = '';
  for (const file of FILES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = file.label;
    btn.dataset.id = file.id;
    if (current?.meta?.id === file.id) btn.classList.add('active');
    btn.addEventListener('click', () => openFile(file));
    nav.appendChild(btn);
  }
}

async function ghGet(path) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Could not load ${path}`);
  }
  return res.json();
}

async function ghPut(path, content, sha, message) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: encodeBase64(content),
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Save failed');
  }
  return res.json();
}

function pathKey(parts) {
  return parts.join('.');
}

function collectFields(value, parts = [], out = []) {
  if (typeof value === 'string') {
    out.push({ path: [...parts], value, multiline: value.includes('\n') || value.length > 90 });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === 'string') {
        out.push({
          path: [...parts, String(index)],
          value: item,
          multiline: item.length > 90,
          listLabel: `${labelize(parts[parts.length - 1] || 'item')} #${index + 1}`,
        });
      } else if (item && typeof item === 'object') {
        collectFields(item, [...parts, String(index)], out);
      }
    });
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      collectFields(v, [...parts, k], out);
    }
  }
  return out;
}

function setByPath(obj, parts, value) {
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    if (cur[key] === undefined) {
      cur[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

function groupFields(fields) {
  const groups = new Map();
  for (const field of fields) {
    const group = field.path.length > 1 ? field.path[0] : '_root';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(field);
  }
  return groups;
}

function renderEditor() {
  if (!current) return;
  editorEmpty.hidden = true;
  editorPanel.hidden = false;
  editorTitle.textContent = current.meta.label;
  editorForm.innerHTML = '';

  const fields = collectFields(current.data);
  const groups = groupFields(fields);

  for (const [group, groupFields] of groups) {
    const section = document.createElement('section');
    section.className = 'section';
    const h = document.createElement('h3');
    h.textContent = group === '_root' ? 'General' : labelize(group);
    section.appendChild(h);

    for (const field of groupFields) {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      const label = document.createElement('label');
      const leaf = field.path[field.path.length - 1];
      const mid = field.path.slice(1, -1).map(labelize).join(' › ');
      label.textContent = field.listLabel
        ? field.listLabel
        : mid
          ? `${mid} › ${labelize(leaf)}`
          : labelize(leaf);
      wrap.appendChild(label);

      const input = field.multiline
        ? document.createElement('textarea')
        : document.createElement('input');
      if (!field.multiline) input.type = 'text';
      input.value = field.value;
      input.dataset.path = pathKey(field.path);
      input.addEventListener('input', () => {
        setByPath(current.data, field.path, input.value);
        dirty = true;
        btnSave.disabled = false;
        setStatus('Unsaved changes');
      });
      wrap.appendChild(input);
      section.appendChild(wrap);
    }

    editorForm.appendChild(section);
  }

  renderNav();
}

async function openFile(meta) {
  if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
  try {
    setStatus('Loading…', 'busy');
    btnSave.disabled = true;
    const file = await ghGet(meta.path);
    const json = JSON.parse(decodeBase64(file.content));
    current = { meta, sha: file.sha, data: json };
    dirty = false;
    renderEditor();
    setStatus('Ready');
  } catch (err) {
    setStatus(err.message || 'Load failed', 'error');
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginErr.classList.remove('show');
  const password = document.getElementById('password').value;
  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const res = await fetch('/api/cms-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showLoginError(data.error || 'Wrong password.');
      return;
    }
    token = data.token;
    sessionStorage.setItem(TOKEN_KEY, token);
    showApp();
    setStatus('Signed in');
  } catch {
    showLoginError('Network error. Try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});

btnLogout.addEventListener('click', () => {
  if (dirty && !confirm('Discard unsaved changes and sign out?')) return;
  showLogin();
});

btnSave.addEventListener('click', async () => {
  if (!current || !dirty) return;
  btnSave.disabled = true;
  setStatus('Publishing…', 'busy');
  try {
    const content = JSON.stringify(current.data, null, 2) + '\n';
    const message = `Update ${current.meta.label} content via admin`;
    const result = await ghPut(current.meta.path, content, current.sha, message);
    current.sha = result.content.sha;
    dirty = false;
    setStatus('Published — site will update in 1–2 min', 'ok');
  } catch (err) {
    setStatus(err.message || 'Publish failed', 'error');
    btnSave.disabled = false;
  }
});

if (token) {
  showApp();
  setStatus('Signed in');
}
