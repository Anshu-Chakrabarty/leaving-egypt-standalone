const PASS_KEY = 'le-cms-password';

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

let password = sessionStorage.getItem(PASS_KEY) || '';
let current = null;
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
  console.log('[CMS login] showApp', {
    loginHidden: loginView.hidden,
    appHidden: appView.hidden,
  });
  renderNav();
}

function showLogin() {
  password = '';
  sessionStorage.removeItem(PASS_KEY);
  current = null;
  dirty = false;
  btnSave.disabled = true;
  appView.hidden = true;
  loginView.hidden = false;
  document.getElementById('password').value = '';
}

function renderNav() {
  nav.innerHTML = '';
  for (const file of FILES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = file.label;
    if (current?.meta?.id === file.id) btn.classList.add('active');
    btn.addEventListener('click', () => openFile(file));
    nav.appendChild(btn);
  }
}

async function apiContent(payload) {
  const res = await fetch('/api/cms-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function pathKey(parts) {
  return parts.join('.');
}

function collectFields(value, parts = [], out = []) {
  if (typeof value === 'string') {
    out.push({
      path: [...parts],
      value,
      multiline: value.includes('\n') || value.length > 90,
    });
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (typeof item === 'string') {
        out.push({
          path: [...parts, String(index)],
          value: item,
          multiline: item.length > 90,
          listLabel: `${labelize(parts[parts.length - 1] || 'Item')} #${index + 1}`,
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

  for (const [group, groupFieldsList] of groups) {
    const section = document.createElement('section');
    section.className = 'section';
    const h = document.createElement('h3');
    h.textContent = group === '_root' ? 'General' : labelize(group);
    section.appendChild(h);

    for (const field of groupFieldsList) {
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
    const file = await apiContent({ action: 'get', path: meta.path });
    current = { meta, sha: file.sha, data: JSON.parse(file.content) };
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
  const value = document.getElementById('password').value.trim();
  const btn = loginForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  console.log('[CMS login] start', {
    passwordLength: value.length,
    url: '/api/cms-login',
  });

  try {
    const res = await fetch('/api/cms-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: value }),
    });

    const rawText = await res.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (parseErr) {
      console.error('[CMS login] response was not JSON', {
        status: res.status,
        rawText,
        parseErr,
      });
      showLoginError('Unexpected server response. Check console.');
      return;
    }

    console.log('[CMS login] response', {
      status: res.status,
      ok: res.ok,
      data,
    });

    if (!res.ok) {
      console.error('[CMS login] failed', data);
      showLoginError(data.error || 'Wrong password.');
      return;
    }

    password = value;
    sessionStorage.setItem(PASS_KEY, password);
    console.log('[CMS login] success — opening editor');
    showApp();
    setStatus('Signed in');
  } catch (err) {
    console.error('[CMS login] network/exception', err);
    showLoginError('Network error. Try again. (See console)');
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
    const result = await apiContent({
      action: 'put',
      path: current.meta.path,
      content,
      sha: current.sha,
      message: `Update ${current.meta.label} content via admin`,
    });
    current.sha = result.sha;
    dirty = false;
    setStatus('Published — site updates in 1–2 min', 'ok');
  } catch (err) {
    setStatus(err.message || 'Publish failed', 'error');
    btnSave.disabled = false;
  }
});

if (password) {
  showApp();
  setStatus('Signed in');
}
