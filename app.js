'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Date nahi';
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const uid = () => crypto.randomUUID();
const tmp = id => String(id).startsWith('tmp-');

const S = { user: JSON.parse(localStorage.getItem('u') || 'null'), cases: [], fees: [], users: [], tab: 'today', q: '', pending: 0 };
let TODAY = iso(new Date()), B = {};
const TABS = {
  senior: [['today', 'Aaj'], ['cases', 'Cases'], ['fees', 'Fees'], ['team', 'Team'], ['backup', 'Backup']],
  munshi: [['today', 'Aaj'], ['cases', 'Cases'], ['fees', 'Fees']],
  junior: [['today', 'Aaj'], ['cases', 'Cases']],
  client: [['cases', 'Mere cases']]
};
const canAdd = () => ['senior', 'munshi'].includes(S.user.role);
const canDate = () => S.user.role !== 'client';

// ---------- offline storage (IndexedDB) ----------
const idb = new Promise((ok, no) => {
  const r = indexedDB.open('mcc', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('ob', { keyPath: 'id' }); };
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const tx = async (s, m, f) => { const d = await idb; return new Promise((ok, no) => { const t = d.transaction(s, m), r = f(t.objectStore(s)); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); }); };
const kv = { get: k => tx('kv', 'readonly', s => s.get(k)), set: (k, v) => tx('kv', 'readwrite', s => s.put(v, k)), clear: () => tx('kv', 'readwrite', s => s.clear()) };

let tt; const toast = m => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 4000); };

// ---------- API + offline queue ----------
async function api(p, o = {}) {
  const r = await fetch('/api' + p, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('t') }, body: o.body ? JSON.stringify(o.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && p !== '/login') { logout(); throw Object.assign(new Error(d.error || 'Login dobara karein'), { server: true }); }
  if (!r.ok) throw Object.assign(new Error(d.error || 'Error'), { server: true });
  return d;
}
async function send(method, path, body) {      // net nahi to queue mein; null return hota hai
  try { return await api(path, { method, body }); }
  catch (e) {
    if (e.server) throw e;
    await tx('ob', 'readwrite', s => s.put({ id: uid(), method, path, body, ts: Date.now() }));
    await count(); toast('Net nahi hai. Save ho gaya, net aate hi sync hoga.'); return null;
  }
}
async function count() { S.pending = await tx('ob', 'readonly', s => s.count()); bar(); }
let busy = false;
async function flush() {
  if (busy || !navigator.onLine || !S.user) return; busy = true;
  try {
    const q = (await tx('ob', 'readonly', s => s.getAll())).sort((a, b) => a.ts - b.ts);
    for (const j of q) {
      try { await api(j.path, { method: j.method, body: j.body }); }
      catch (e) { if (!e.server) break; toast('Ek entry reject hui: ' + e.message); }
      await tx('ob', 'readwrite', s => s.delete(j.id));
    }
    if (q.length) { await count(); await load(); }
  } finally { busy = false; }
}
async function load() {
  try {
    S.cases = await api('/cases'); await kv.set('cases', S.cases);
    if (canAdd()) {
      S.fees = await api('/fees'); await kv.set('fees', S.fees);
      S.users = await api('/users'); await kv.set('users', S.users);
    }
  } catch (e) {
    if (e.server) toast(e.message);
    else { S.cases = (await kv.get('cases')) || []; S.fees = (await kv.get('fees')) || []; S.users = (await kv.get('users')) || []; }
  }
  render();
}

// ---------- views ----------
const bar = () => { const b = $('#bar'); if (b) b.textContent = (navigator.onLine ? 'Online' : 'Offline') + (S.pending ? ` • ${S.pending} entry sync baaki` : ''); };
function buildBal() { B = {}; for (const f of S.fees) { const b = B[f.case_id] ??= { ch: 0, pd: 0 }; f.kind === 'charge' ? b.ch += +f.amount : b.pd += +f.amount; } }

function card(c) {
  const b = B[c.id] || { ch: 0, pd: 0 }, t = tmp(c.id), late = c.status === 'pending' && c.next_date && c.next_date < TODAY;
  const meta = [c.court, c.ps_name, c.stage].filter(Boolean).map(esc).join(' • ');
  return `<article class="case${c.status === 'disposed' ? ' done' : ''}">
    <div class="dt${late ? ' late' : ''}"><b>${c.next_date ? esc(c.next_date.slice(8)) : '–'}</b><span>${c.next_date ? new Date(c.next_date + 'T00:00').toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : ''}</span></div>
    <div class="bd"><h3>${esc(c.case_no || c.cnr)}</h3><p>${esc(c.party_name)}</p>
      ${meta ? `<p class="m">${meta}</p>` : ''}${c.cnr ? `<p class="m">CNR ${esc(c.cnr)}</p>` : ''}${c.status === 'disposed' ? '<p class="m">Case khatam</p>' : ''}
      <div class="row">
        ${canDate() && c.status === 'pending' ? `<label>Next date<input type="date" data-nd="${esc(c.id)}" value="${esc(c.next_date || '')}" ${t ? 'disabled' : ''}></label>` : ''}
        ${c.cnr ? `<button class="ghost" data-a="ec" data-cnr="${esc(c.cnr)}">View on eCourts</button>` : ''}
        ${canAdd() && !t ? `<button class="ghost" data-a="fee" data-id="${esc(c.id)}">Fees${b.ch ? ' • baaki ' + money(b.ch - b.pd) : ''}</button>` : ''}
        ${S.user.role === 'senior' && c.status === 'pending' && !t ? `<button class="ghost" data-a="done" data-id="${esc(c.id)}">Case khatam</button>` : ''}
      </div></div></article>`;
}
const group = (t, a) => a.length ? `<h2>${t} <small>${a.length}</small></h2>${a.map(card).join('')}` : '';
function vToday() {
  const a = S.cases.filter(c => c.status === 'pending');
  return group('Aaj ki hearing', a.filter(c => c.next_date === TODAY)) + group('Kal', a.filter(c => c.next_date === addDays(1)))
    + group('Date nikal gayi, nayi date daalein', a.filter(c => c.next_date && c.next_date < TODAY)) + group('Date daalni baaki', a.filter(c => !c.next_date))
    || '<p class="empty">Aaj koi hearing nahi. Cases tab se naya case jodein.</p>';
}
function caseCards() {
  const q = S.q.toLowerCase(), a = S.cases.filter(c => !q || [c.case_no, c.cnr, c.party_name, c.ps_name].some(x => (x || '').toLowerCase().includes(q)));
  return a.slice(0, 100).map(card).join('') + (a.length > 100 ? `<p class="empty">Pehle 100 dikha rahe hain. Khoj se chhaantein.</p>` : '') || '<p class="empty">Koi case nahi mila.</p>';
}
function addForm() {
  const opt = a => '<option value="">Koi nahi</option>' + a.map(u => `<option value="${esc(u.id)}">${esc(u.name || u.email)}</option>`).join('');
  return `<details class="add"><summary>Naya case jodein</summary><form data-f="case">
    <input name="case_no" placeholder="Case no (jaise GR 123/24)" maxlength="60"><input name="cnr" placeholder="CNR number" maxlength="40">
    <input name="party_name" placeholder="Party ka naam" maxlength="160"><input name="court" placeholder="Court" maxlength="60">
    <input name="ps_name" placeholder="Thana (PS)" maxlength="80"><input name="stage" placeholder="Stage" maxlength="80">
    <label>Next date<input type="date" name="next_date"></label>
    <label>Junior<select name="assigned_to">${opt(S.users.filter(u => u.role === 'junior' && u.active))}</select></label>
    <label>Client login<select name="client_user_id">${opt(S.users.filter(u => u.role === 'client' && u.active))}</select></label>
    <button class="pri">Case save karein</button></form></details>`;
}
const vCases = () => (canAdd() ? addForm() : '') + `<input id="q" type="search" placeholder="Case no, CNR, party ya thana se khojein" value="${esc(S.q)}"><div id="list">${caseCards()}</div>`;
function vFees() {
  const due = Object.values(B).reduce((a, b) => a + Math.max(b.ch - b.pd, 0), 0);
  const nm = id => { const c = S.cases.find(x => x.id === id); return c ? (c.case_no || c.cnr) : ''; };
  return `<div class="sum"><span>Kul baaki fees</span><b>${money(due)}</b></div>` + (S.fees.slice(0, 100).map(f =>
    `<div class="fe"><div><b>${f.kind === 'payment' ? 'Mili' : 'Tay hui'} ${money(f.amount)}</b><p class="m">${esc(nm(f.case_id))} • ${fmt(f.created_at.slice(0, 10))} ${esc(f.note || '')}</p></div>
    ${f.kind === 'payment' && !tmp(f.id) ? `<button class="ghost" data-a="rcpt" data-id="${esc(f.id)}">Receipt</button>` : ''}</div>`).join('')
    || '<p class="empty">Abhi koi fees entry nahi. Cases tab mein kisi case ka Fees button dabayein.</p>');
}
const vTeam = () => `<details class="add"><summary>Naya member jodein</summary><form data-f="user">
  <input name="name" placeholder="Naam" required><input name="email" type="email" placeholder="Email" required><input name="phone" placeholder="Mobile">
  <select name="role"><option value="junior">Junior</option><option value="munshi">Munshi</option><option value="client">Client</option></select>
  <input name="password" type="password" minlength="8" placeholder="Password (8+ akshar)" autocomplete="new-password" required>
  <button class="pri">Member banayein</button></form></details>` + S.users.map(u =>
  `<div class="fe"><div><b>${esc(u.name || u.email)}</b><p class="m">${esc(u.role)} • ${esc(u.email)}${u.active ? '' : ' • band'}</p></div>
  ${u.id !== S.user.id ? `<button class="ghost" data-a="act" data-id="${esc(u.id)}" data-on="${u.active ? 0 : 1}">${u.active ? 'Band karein' : 'Chalu karein'}</button>` : ''}</div>`).join('');
const vBackup = () => `<p>Apna data apne paas bhi rakhein. Har hafte ek baar download karke Google Drive ya pendrive mein daal dein.</p>
  <p class="m">Aakhri backup: ${localStorage.getItem('bk') ? esc(fmt(localStorage.getItem('bk'))) : 'abhi tak nahi'}</p>
  <div class="row"><button class="pri" data-a="csv">Cases aur Fees (Excel)</button><button class="ghost" data-a="json">Poora backup (JSON)</button></div>`;

function render() {
  TODAY = iso(new Date());
  $('#login').hidden = !!S.user; $('#app').hidden = !S.user;
  if (!S.user) return;
  const tabs = TABS[S.user.role]; if (!tabs.some(t => t[0] === S.tab)) S.tab = tabs[0][0];
  $('#who').textContent = (S.user.chamber ? S.user.chamber + ' • ' : '') + (S.user.name || S.user.email);
  $('#tabs').innerHTML = tabs.map(([k, l]) => `<button data-a="tab" data-k="${k}" class="${k === S.tab ? 'on' : ''}">${l}</button>`).join('');
  buildBal();
  $('#view').innerHTML = { today: vToday, cases: vCases, fees: vFees, team: vTeam, backup: vBackup }[S.tab](); bar();
}

// ---------- backup helpers ----------
const csv = rows => '\ufeff' + rows.map(r => r.map(v => { v = v ?? ''; if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v; return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
const dl = (name, txt, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e4); localStorage.setItem('bk', TODAY); };

// ---------- actions ----------
const ACT = {
  tab: ({ k }) => { S.tab = k; render(); },
  out: () => logout(),
  x: () => $('#dlg').close(),
  ec: ({ cnr }) => { navigator.clipboard?.writeText(cnr); window.open('https://services.ecourts.gov.in/ecourtindia_v6/', '_blank', 'noopener'); toast('CNR copy ho gaya. eCourts par paste karein.'); },
  fee: ({ id }) => {
    const c = S.cases.find(x => x.id === id), b = B[id] || { ch: 0, pd: 0 };
    $('#dlg').innerHTML = `<form data-f="fee" data-id="${esc(id)}"><h3>${esc(c.case_no || c.cnr)}</h3>
      <p class="m">Tay: ${money(b.ch)} • Mili: ${money(b.pd)} • Baaki: ${money(b.ch - b.pd)}</p>
      <label>Kya darj karna hai<select name="kind"><option value="payment">Fees mili</option><option value="charge">Fees tay hui</option></select></label>
      <label>Rakam (₹)<input name="amount" type="number" min="1" step="0.01" inputmode="decimal" required></label>
      <label>Note<input name="note" maxlength="200" placeholder="UPI / Cash"></label>
      <div class="row"><button class="pri">Save karein</button><button type="button" class="ghost" data-a="x">Band karein</button></div></form>`;
    $('#dlg').showModal();
  },
  done: async ({ id }) => {
    if (!confirm('Is case ko khatam mark karein?')) return;
    await api('/cases/' + id, { method: 'PATCH', body: { status: 'disposed' } });
    S.cases.find(c => c.id === id).status = 'disposed'; await kv.set('cases', S.cases); render();
  },
  act: async ({ id, on }) => { await api('/users/' + id, { method: 'PATCH', body: { active: on === '1' } }); S.users = await api('/users'); render(); },
  rcpt: ({ id }) => {
    const f = S.fees.find(x => x.id === id), c = S.cases.find(x => x.id === f.case_id) || {}, w = window.open('', '_blank');
    if (!w) return toast('Popup allow karein');
    w.document.write(`<title>Receipt</title><body style="font:16px system-ui;max-width:420px;margin:30px auto"><h2>${esc(S.user.chamber || 'Fees Receipt')}</h2><h3>Fees Receipt</h3>
      <p>Date: ${esc(fmt(f.created_at.slice(0, 10)))}<br>Receipt no: ${esc(f.id.slice(0, 8))}</p><p>Case: ${esc(c.case_no || c.cnr)}<br>Party: ${esc(c.party_name)}</p>
      <h3>Mili rakam: ${money(f.amount)}</h3><p>${esc(f.note)}</p>`);
    w.document.close(); w.focus(); w.print();
  },
  csv: () => {
    dl('cases.csv', csv([['Case no', 'CNR', 'Party', 'Court', 'Thana', 'Stage', 'Next date', 'Status', 'Fees tay', 'Fees mili', 'Baaki'],
      ...S.cases.map(c => { const b = B[c.id] || { ch: 0, pd: 0 }; return [c.case_no, c.cnr, c.party_name, c.court, c.ps_name, c.stage, c.next_date, c.status, b.ch, b.pd, b.ch - b.pd]; })]), 'text/csv');
    setTimeout(() => dl('fees.csv', csv([['Date', 'Case', 'Type', 'Rakam', 'Note'], ...S.fees.map(f => { const c = S.cases.find(x => x.id === f.case_id) || {}; return [f.created_at.slice(0, 10), c.case_no || c.cnr, f.kind === 'payment' ? 'Mili' : 'Tay', f.amount, f.note]; })]), 'text/csv'), 600);
  },
  json: async () => dl('backup-' + TODAY + '.json', JSON.stringify(await api('/backup'), null, 1), 'application/json')
};
const FORM = {
  login: async f => {
    $('#err').textContent = '';
    try {
      const d = await api('/login', { method: 'POST', body: Object.fromEntries(new FormData(f)) });
      localStorage.setItem('t', d.token); localStorage.setItem('u', JSON.stringify(d.user)); S.user = d.user; f.reset(); S.tab = 'today'; await start();
    } catch (e) { $('#err').textContent = e.server ? e.message : 'Server se connect nahi ho paya. Net check karein.'; }
  },
  case: async f => {
    const b = Object.fromEntries(new FormData(f)); for (const k in b) if (b[k] === '') delete b[k];
    b.client_ref = uid(); const r = await send('POST', '/cases', b);
    if (r && !r.id) await load(); else S.cases.unshift(r || { ...b, id: 'tmp-' + b.client_ref, status: 'pending' });
    await kv.set('cases', S.cases); render();
  },
  fee: async f => {
    const b = Object.fromEntries(new FormData(f)); b.case_id = f.dataset.id; b.amount = Number(b.amount); b.client_ref = uid();
    const r = await send('POST', '/fees', b); $('#dlg').close();
    if (r && !r.id) await load(); else S.fees.unshift(r || { ...b, id: 'tmp-' + b.client_ref, created_at: new Date().toISOString() });
    await kv.set('fees', S.fees); render();
  },
  user: async f => { await api('/users', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); S.users = await api('/users'); toast('Member ban gaya'); render(); }
};
function logout() { localStorage.removeItem('t'); localStorage.removeItem('u'); S.user = null; S.cases = []; S.fees = []; S.users = []; kv.clear(); render(); }

document.addEventListener('click', async e => { const b = e.target.closest('[data-a]'); if (b) try { await ACT[b.dataset.a](b.dataset); } catch (x) { toast(x.message); } });
document.addEventListener('submit', async e => { e.preventDefault(); const f = e.target; try { await FORM[f.dataset.f](f); } catch (x) { toast(x.message); } });
document.addEventListener('input', e => { if (e.target.id === 'q') { S.q = e.target.value; $('#list').innerHTML = caseCards(); } });
document.addEventListener('change', async e => {
  const el = e.target, id = el.dataset.nd; if (!id || !el.value) return;
  try {
    await send('PATCH', `/cases/${id}/next-date`, { next_date: el.value });
    S.cases.find(c => c.id === id).next_date = el.value; await kv.set('cases', S.cases); render();
  } catch (x) { toast(x.message); }
});
addEventListener('online', () => { bar(); flush(); }); addEventListener('offline', bar);
setInterval(flush, 30000);

async function start() { render(); if (!S.user) return; await count(); await flush(); await load(); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
start();
