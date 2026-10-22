'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let KEY = sessionStorage.getItem('ok') || '', CH = [], OPEN = null, USERS = [];
const say = (m, bad) => { const e = $('#msg'); e.textContent = m; e.style.color = bad ? '#C73E2C' : '#0E7A5B'; };
async function call(url, o = {}) {
  const r = await fetch(url, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', 'x-setup-key': KEY }, body: o.body ? JSON.stringify(o.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error === 'Not allowed' ? 'Setup key galat hai' : (d.error || 'Error aaya'));
  return d;
}
const api = (p, o) => call('/api/owner' + p, o);
async function refresh() { CH = await api('/chambers'); USERS = OPEN ? await api(`/chambers/${OPEN}/users`) : []; render(); }

const TA = 'style="width:100%;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px"';
function usersBlock(c) {
  const rows = USERS.map(u => `<div class="fe"><div><b>${esc(u.name || u.email)}</b><p class="m">${esc(u.role)} • ${esc(u.email)}${u.phone ? ' • ' + esc(u.phone) : ''}${u.active ? '' : ' • band'}</p></div>
    <div class="row"><button class="ghost" data-a="upw" data-id="${esc(u.id)}">Password</button><button class="ghost" data-a="ued" data-id="${esc(u.id)}">Edit</button>
    <button class="ghost" data-a="uact" data-id="${esc(u.id)}" data-on="${u.active ? 0 : 1}">${u.active ? 'Band' : 'Chalu'}</button></div></div>`).join('');
  return `<div style="margin:0 0 16px 10px">${rows}
    <details class="add"><summary>Naya user</summary><form data-f="adduser" data-id="${esc(c.id)}">
      <input name="name" placeholder="Naam" required><input name="email" type="email" placeholder="Email" required><input name="phone" placeholder="Mobile">
      <select name="role"><option value="junior">Junior</option><option value="munshi">Munshi</option><option value="client">Client</option><option value="senior">Senior</option></select>
      <input name="password" type="password" minlength="8" placeholder="Password (8+ akshar)" required autocomplete="new-password"><button class="pri">User banayein</button></form></details>
    <details class="add"><summary>Ek saath bahut users</summary><form data-f="bulk" data-id="${esc(c.id)}">
      <p class="m">Har line mein: Naam, email, role, password, mobile. Role: senior / junior / munshi / client. Password mein comma (,) mat daalna.</p>
      <textarea name="text" rows="6" ${TA} placeholder="Rahim Sk, rahim@gmail.com, junior, Pass@1234, 98xxxxxxxx"></textarea><button class="pri">Sab banayein</button></form></details></div>`;
}
function render() {
  $('#list').innerHTML = CH.map(c => `<div class="fe"><div><b>${esc(c.name)}</b>${c.active ? '' : ' <span class="m">(BAND)</span>'}<p class="m">${esc(c.senior || 'senior nahi')} • ${c.users} users • ${c.cases} cases</p></div>
    <div class="row"><button class="ghost" data-a="open" data-id="${esc(c.id)}">${OPEN === c.id ? 'Chhupayein' : 'Users'}</button>
    <button class="ghost" data-a="cact" data-id="${esc(c.id)}" data-on="${c.active ? 0 : 1}">${c.active ? 'Band karein' : 'Chalu karein'}</button></div></div>${OPEN === c.id ? usersBlock(c) : ''}`).join('')
    || '<p class="empty">Abhi koi chamber nahi.</p>';
}
const ACT = {
  lock: () => { sessionStorage.removeItem('ok'); KEY = ''; $('#panel').hidden = true; $('#lock').hidden = false; },
  open: async ({ id }) => { OPEN = OPEN === id ? null : id; await refresh(); },
  cact: async ({ id, on }) => { if (!confirm(on === '1' ? 'Chamber chalu karein?' : 'Is chamber ke saare log login nahi kar payenge. Band karein?')) return; await api('/chambers/' + id, { method: 'PATCH', body: { active: on === '1' } }); await refresh(); },
  uact: async ({ id, on }) => { await api('/users/' + id, { method: 'PATCH', body: { active: on === '1' } }); await refresh(); },
  upw: async ({ id }) => { const p = prompt('Naya password (8+ akshar)'); if (!p) return; await api('/users/' + id, { method: 'PATCH', body: { password: p } }); say('Password badal gaya'); },
  ued: async ({ id }) => {
    const u = USERS.find(x => x.id === id), name = prompt('Naam', u.name || ''); if (name === null) return;
    const email = prompt('Email', u.email); if (email === null) return; const phone = prompt('Mobile', u.phone || ''); if (phone === null) return;
    await api('/users/' + id, { method: 'PATCH', body: { name, email, phone } }); say('Save ho gaya'); await refresh();
  }
};
const FORM = {
  newch: async f => { await call('/api/setup', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); say('Chamber aur senior ban gaya'); f.reset(); await refresh(); },
  adduser: async f => { const b = Object.fromEntries(new FormData(f)); b.chamber_id = f.dataset.id; await api('/users', { method: 'POST', body: b }); say('User ban gaya'); f.reset(); await refresh(); },
  bulk: async f => {
    const rows = String(new FormData(f).get('text')).split('\n').map(l => l.split(',').map(x => x.trim())).filter(a => a[1])
      .map(a => ({ name: a[0], email: a[1], role: (a[2] || 'junior').toLowerCase(), password: a[3], phone: a[4] || '' }));
    const r = await api('/users/bulk', { method: 'POST', body: { chamber_id: f.dataset.id, rows } });
    say(`${r.created} user ban gaye` + (r.failed.length ? `, ${r.failed.length} nahi bane: ` + r.failed.map(x => `${x.email} (${x.error})`).join('; ') : ''), r.failed.length > 0);
    if (!r.failed.length) f.reset(); await refresh();
  }
};
document.addEventListener('click', async e => { const b = e.target.closest('[data-a]'); if (b) try { await ACT[b.dataset.a](b.dataset); } catch (x) { say(x.message, true); } });
document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target;
  if (f.id === 'lk') { KEY = $('#key').value; try { await refresh(); sessionStorage.setItem('ok', KEY); $('#lock').hidden = true; $('#panel').hidden = false; $('#lerr').textContent = ''; $('#key').value = ''; } catch (x) { KEY = ''; $('#lerr').textContent = x.message; } return; }
  try { await FORM[f.dataset.f](f); } catch (x) { say(x.message, true); }
});
if (KEY) refresh().then(() => { $('#lock').hidden = true; $('#panel').hidden = false; }).catch(() => { KEY = ''; sessionStorage.removeItem('ok'); });

