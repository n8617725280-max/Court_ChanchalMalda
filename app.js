'use strict';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const uid = () => crypto.randomUUID();
const tmp = id => String(id).startsWith('tmp-');

// ---------- bhasha: Hinglish / English / বাংলা ----------
const IDX = { hi: 0, en: 1, bn: 2 }, LOC = { hi: 'en-GB', en: 'en-GB', bn: 'bn-IN-u-nu-latn' };
let LANG = localStorage.getItem('lang') in IDX ? localStorage.getItem('lang') : 'hi';
const D = {
  tagline: ['Chamber ka case diary aur fee book', 'Case diary and fee book for your chamber', 'চেম্বারের কেস ডায়েরি ও ফি বই'],
  email: ['Email', 'Email', 'ইমেইল'], password: ['Password', 'Password', 'পাসওয়ার্ড'],
  loginbtn: ['Login karein', 'Log in', 'লগইন করুন'], logout: ['Logout', 'Log out', 'লগআউট'],
  tab_today: ['Aaj', 'Today', 'আজ'], tab_cases: ['Cases', 'Cases', 'কেস'], tab_fees: ['Fees', 'Fees', 'ফি'], tab_team: ['Team', 'Team', 'টিম'], tab_backup: ['Backup', 'Backup', 'ব্যাকআপ'], tab_mine: ['Mere cases', 'My cases', 'আমার কেস'],
  online: ['Online', 'Online', 'অনলাইন'], offline: ['Offline', 'Offline', 'অফলাইন'],
  pending: ['{0} entry sync baaki', '{0} entries waiting to sync', '{0} টি এন্ট্রি সিঙ্কের অপেক্ষায়'],
  nodate: ['Date nahi', 'No date', 'তারিখ নেই'],
  nextdate: ['Next date', 'Next date', 'পরবর্তী তারিখ'], closed: ['Case khatam', 'Case closed', 'কেস শেষ'],
  ecourts: ['View on eCourts', 'View on eCourts', 'eCourts-এ দেখুন'], fees: ['Fees', 'Fees', 'ফি'], due: ['baaki {0}', 'due {0}', 'বাকি {0}'],
  g_today: ['Aaj ki hearing', "Today's hearings", 'আজকের শুনানি'], g_tom: ['Kal', 'Tomorrow', 'আগামীকাল'],
  g_late: ['Date nikal gayi, nayi date daalein', 'Date passed, enter a new date', 'তারিখ পেরিয়ে গেছে, নতুন তারিখ দিন'], g_none: ['Date daalni baaki', 'Date not set', 'তারিখ দেওয়া বাকি'],
  empty_today: ['Aaj koi hearing nahi. Cases tab se naya case jodein.', 'No hearings today. Add a case from the Cases tab.', 'আজ কোনো শুনানি নেই। "কেস" ট্যাব থেকে নতুন কেস যোগ করুন।'],
  first100: ['Pehle 100 dikha rahe hain. Khoj se chhaantein.', 'Showing the first 100. Use search to narrow down.', 'প্রথম ১০০টি দেখানো হচ্ছে। সার্চ করে খুঁজুন।'],
  nocase: ['Koi case nahi mila.', 'No cases found.', 'কোনো কেস পাওয়া যায়নি।'],
  search: ['Case no, CNR, party ya thana se khojein', 'Search by case no, CNR, party or police station', 'কেস নম্বর, CNR, পক্ষ বা থানা দিয়ে খুঁজুন'],
  addcase: ['Naya case jodein', 'Add a new case', 'নতুন কেস যোগ করুন'],
  ph_caseno: ['Case no (jaise GR 123/24)', 'Case no (e.g. GR 123/24)', 'কেস নম্বর (যেমন GR 123/24)'], ph_cnr: ['CNR number', 'CNR number', 'CNR নম্বর'],
  ph_party: ['Party ka naam', 'Party name', 'পক্ষের নাম'], ph_court: ['Court', 'Court', 'কোর্ট'], ph_ps: ['Thana (PS)', 'Police station (PS)', 'থানা (PS)'], ph_stage: ['Stage', 'Stage', 'ধাপ (Stage)'],
  junior: ['Junior', 'Junior', 'জুনিয়র'], clogin: ['Client login', 'Client login', 'ক্লায়েন্টের লগইন'], none: ['Koi nahi', 'None', 'কেউ নেই'],
  savecase: ['Case save karein', 'Save case', 'কেস সেভ করুন'],
  totaldue: ['Kul baaki fees', 'Total fees due', 'মোট বাকি ফি'], got: ['Mili', 'Received', 'পাওয়া গেছে'], fixed: ['Tay hui', 'Charged', 'ধার্য হয়েছে'], rcpt: ['Receipt', 'Receipt', 'রসিদ'],
  nofees: ['Abhi koi fees entry nahi. Cases tab mein kisi case ka Fees button dabayein.', 'No fee entries yet. Tap the Fees button on a case in the Cases tab.', 'এখনো কোনো ফি এন্ট্রি নেই। "কেস" ট্যাবে কোনো কেসের ফি বোতাম চাপুন।'],
  addmember: ['Naya member jodein', 'Add a team member', 'নতুন সদস্য যোগ করুন'], ph_name: ['Naam', 'Name', 'নাম'], ph_mobile: ['Mobile', 'Mobile', 'মোবাইল'],
  r_senior: ['Senior', 'Senior', 'সিনিয়র'], r_junior: ['Junior', 'Junior', 'জুনিয়র'], r_munshi: ['Munshi', 'Munshi (clerk)', 'মুহুরি'], r_client: ['Client', 'Client', 'ক্লায়েন্ট'],
  ph_pw: ['Password (8+ akshar)', 'Password (8+ characters)', 'পাসওয়ার্ড (৮+ অক্ষর)'], mkmember: ['Member banayein', 'Create member', 'সদস্য তৈরি করুন'],
  inactive: ['band', 'disabled', 'বন্ধ'], deact: ['Band karein', 'Disable', 'বন্ধ করুন'], act: ['Chalu karein', 'Enable', 'চালু করুন'],
  bk_info: ['Apna data apne paas bhi rakhein. Har hafte ek baar download karke Google Drive ya pendrive mein daal dein.', 'Keep a copy of your data with you. Download it once a week and save it to Google Drive or a pen drive.', 'নিজের ডেটা নিজের কাছেও রাখুন। প্রতি সপ্তাহে একবার ডাউনলোড করে Google Drive বা পেনড্রাইভে রেখে দিন।'],
  bk_last: ['Aakhri backup: {0}', 'Last backup: {0}', 'শেষ ব্যাকআপ: {0}'], bk_never: ['abhi tak nahi', 'not yet', 'এখনো হয়নি'],
  bk_csv: ['Cases aur Fees (Excel)', 'Cases and Fees (Excel)', 'কেস ও ফি (Excel)'], bk_json: ['Poora backup (JSON)', 'Full backup (JSON)', 'পুরো ব্যাকআপ (JSON)'],
  fee_sum: ['Tay: {0} • Mili: {1} • Baaki: {2}', 'Charged: {0} • Received: {1} • Due: {2}', 'ধার্য: {0} • পাওয়া: {1} • বাকি: {2}'],
  fee_what: ['Kya darj karna hai', 'What do you want to record', 'কী এন্ট্রি করবেন'], fee_got: ['Fees mili', 'Fees received', 'ফি পাওয়া গেছে'], fee_set: ['Fees tay hui', 'Fees charged', 'ফি ধার্য হয়েছে'],
  amount: ['Rakam (₹)', 'Amount (₹)', 'টাকার পরিমাণ (₹)'], note: ['Note', 'Note', 'নোট'], note_ph: ['UPI / Cash', 'UPI / Cash', 'UPI / নগদ'],
  save: ['Save karein', 'Save', 'সেভ করুন'], close: ['Band karein', 'Close', 'বন্ধ করুন'],
  c_done: ['Is case ko khatam mark karein?', 'Mark this case as closed?', 'এই কেস শেষ হিসেবে চিহ্নিত করবেন?'],
  rejected: ['Ek entry reject hui: ', 'An entry was rejected: ', 'একটি এন্ট্রি গ্রহণ হয়নি: '],
  saved_off: ['Net nahi hai. Save ho gaya, net aate hi sync hoga.', 'No internet. Saved, it will sync when you are back online.', 'নেট নেই। সেভ হয়েছে, নেট এলে সিঙ্ক হবে।'],
  cnr_copied: ['CNR copy ho gaya. eCourts par paste karein.', 'CNR copied. Paste it on eCourts.', 'CNR কপি হয়েছে। eCourts-এ পেস্ট করুন।'],
  popup: ['Popup allow karein', 'Please allow popups', 'পপআপের অনুমতি দিন'], member_ok: ['Member ban gaya', 'Member created', 'সদস্য তৈরি হয়েছে'],
  noserver: ['Server se connect nahi ho paya. Net check karein.', 'Could not reach the server. Check your internet.', 'সার্ভারের সাথে যোগাযোগ হয়নি। নেট চেক করুন।'],
  rc_title: ['Fees Receipt', 'Fees Receipt', 'ফি রসিদ'], rc_date: ['Date', 'Date', 'তারিখ'], rc_no: ['Receipt no', 'Receipt no', 'রসিদ নম্বর'],
  rc_case: ['Case', 'Case', 'কেস'], rc_party: ['Party', 'Party', 'পক্ষ'], rc_amt: ['Mili rakam', 'Amount received', 'প্রাপ্ত টাকা']
};
const t = (k, ...a) => D[k][IDX[LANG]].replace(/\{(\d)\}/g, (_, i) => a[i]);
const E = {   // server ke Hinglish error ka anuvad
  'Login dobara karein': ['Please log in again', 'আবার লগইন করুন'], 'Account band hai': ['Account is disabled', 'অ্যাকাউন্ট বন্ধ আছে'],
  'Bahut koshish ho gayi. 15 minute baad try karein': ['Too many attempts. Try again after 15 minutes', 'অনেকবার চেষ্টা হয়েছে। ১৫ মিনিট পরে চেষ্টা করুন'],
  'Email ya password galat hai': ['Wrong email or password', 'ইমেইল বা পাসওয়ার্ড ভুল'], 'Server error, dobara try karein': ['Server error, please try again', 'সার্ভারে সমস্যা, আবার চেষ্টা করুন'],
  'Is kaam ki ijazat nahi hai': ['You are not allowed to do this', 'এই কাজের অনুমতি নেই'], 'Role galat hai': ['Invalid role', 'ভূমিকা (role) ভুল'],
  'Sahi email aur 8+ akshar ka password daalein': ['Enter a valid email and a password of 8+ characters', 'সঠিক ইমেইল ও ৮+ অক্ষরের পাসওয়ার্ড দিন'],
  'Ye email pehle se maujood hai': ['This email already exists', 'এই ইমেইল আগে থেকেই আছে'], 'User nahi ban paya': ['Could not create user', 'ব্যবহারকারী তৈরি হয়নি'],
  'Galat request': ['Invalid request', 'ভুল অনুরোধ'], 'User nahi mila': ['User not found', 'ব্যবহারকারী পাওয়া যায়নি'],
  'Case no ya CNR zaroori hai': ['Case no or CNR is required', 'কেস নম্বর বা CNR দেওয়া জরুরি'], 'Date galat hai': ['Invalid date', 'তারিখ ভুল'],
  'Junior/Client galat hai': ['Invalid junior/client', 'জুনিয়র/ক্লায়েন্ট ভুল'], 'Ye CNR is chamber mein pehle se hai': ['This CNR already exists in this chamber', 'এই CNR এই চেম্বারে আগে থেকেই আছে'],
  'Case save nahi hua': ['Case could not be saved', 'কেস সেভ হয়নি'], 'Case nahi mila': ['Case not found', 'কেস পাওয়া যায়নি'], 'User galat hai': ['Invalid user', 'ব্যবহারকারী ভুল'],
  'Kuch badla nahi': ['Nothing changed', 'কিছু বদলায়নি'], 'Rakam ya type galat hai': ['Invalid amount or type', 'টাকার পরিমাণ বা ধরন ভুল']
};
const se = m => (LANG !== 'hi' && E[m]) ? E[m][IDX[LANG] - 1] : m;
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString(LOC[LANG], { day: '2-digit', month: 'short', year: 'numeric' }) : t('nodate');
function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
  document.querySelectorAll('.lang').forEach(s => s.value = LANG);
}

const S = { user: JSON.parse(localStorage.getItem('u') || 'null'), cases: [], fees: [], users: [], tab: 'today', q: '', pending: 0 };
let TODAY = iso(new Date()), B = {};
const TABS = {
  senior: [['today', 'tab_today'], ['cases', 'tab_cases'], ['fees', 'tab_fees'], ['team', 'tab_team'], ['backup', 'tab_backup']],
  munshi: [['today', 'tab_today'], ['cases', 'tab_cases'], ['fees', 'tab_fees']],
  junior: [['today', 'tab_today'], ['cases', 'tab_cases']],
  client: [['cases', 'tab_mine']]
};
const canAdd = () => ['senior', 'munshi'].includes(S.user.role);
const canDate = () => S.user.role !== 'client';

// ---------- offline storage (IndexedDB) ----------
const idb = new Promise((ok, no) => {
  const r = indexedDB.open('mcc', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('ob', { keyPath: 'id' }); };
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const tx = async (s, m, f) => { const d = await idb; return new Promise((ok, no) => { const q = d.transaction(s, m), r = f(q.objectStore(s)); q.oncomplete = () => ok(r && r.result); q.onerror = () => no(q.error); }); };
const kv = { get: k => tx('kv', 'readonly', s => s.get(k)), set: (k, v) => tx('kv', 'readwrite', s => s.put(v, k)), clear: () => tx('kv', 'readwrite', s => s.clear()) };

let tt; const toast = m => { const e = $('#toast'); e.textContent = m; e.hidden = false; clearTimeout(tt); tt = setTimeout(() => e.hidden = true, 4000); };

// ---------- API + offline queue ----------
async function api(p, o = {}) {
  const r = await fetch('/api' + p, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('t') }, body: o.body ? JSON.stringify(o.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && p !== '/login') { logout(); throw Object.assign(new Error(se(d.error || 'Login dobara karein')), { server: true }); }
  if (!r.ok) throw Object.assign(new Error(se(d.error || 'Server error, dobara try karein')), { server: true });
  return d;
}
async function send(method, path, body) {      // net nahi to queue mein; null return hota hai
  try { return await api(path, { method, body }); }
  catch (e) {
    if (e.server) throw e;
    await tx('ob', 'readwrite', s => s.put({ id: uid(), method, path, body, ts: Date.now() }));
    await count(); toast(t('saved_off')); return null;
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
      catch (e) { if (!e.server) break; toast(t('rejected') + e.message); }
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
const bar = () => { const b = $('#bar'); if (b) b.textContent = t(navigator.onLine ? 'online' : 'offline') + (S.pending ? ' • ' + t('pending', S.pending) : ''); };
function buildBal() { B = {}; for (const f of S.fees) { const b = B[f.case_id] ??= { ch: 0, pd: 0 }; f.kind === 'charge' ? b.ch += +f.amount : b.pd += +f.amount; } }

function card(c) {
  const b = B[c.id] || { ch: 0, pd: 0 }, tm = tmp(c.id), late = c.status === 'pending' && c.next_date && c.next_date < TODAY;
  const meta = [c.court, c.ps_name, c.stage].filter(Boolean).map(esc).join(' • ');
  return `<article class="case${c.status === 'disposed' ? ' done' : ''}">
    <div class="dt${late ? ' late' : ''}"><b>${c.next_date ? esc(c.next_date.slice(8)) : '–'}</b><span>${c.next_date ? new Date(c.next_date + 'T00:00').toLocaleDateString(LOC[LANG], { month: 'short', year: '2-digit' }) : ''}</span></div>
    <div class="bd"><h3>${esc(c.case_no || c.cnr)}</h3><p>${esc(c.party_name)}</p>
      ${meta ? `<p class="m">${meta}</p>` : ''}${c.cnr ? `<p class="m">CNR ${esc(c.cnr)}</p>` : ''}${c.status === 'disposed' ? `<p class="m">${t('closed')}</p>` : ''}
      <div class="row">
        ${canDate() && c.status === 'pending' ? `<label>${t('nextdate')}<input type="date" data-nd="${esc(c.id)}" value="${esc(c.next_date || '')}" ${tm ? 'disabled' : ''}></label>` : ''}
        ${c.cnr ? `<button class="ghost" data-a="ec" data-cnr="${esc(c.cnr)}">${t('ecourts')}</button>` : ''}
        ${canAdd() && !tm ? `<button class="ghost" data-a="fee" data-id="${esc(c.id)}">${t('fees')}${b.ch ? ' • ' + t('due', money(b.ch - b.pd)) : ''}</button>` : ''}
        ${S.user.role === 'senior' && c.status === 'pending' && !tm ? `<button class="ghost" data-a="done" data-id="${esc(c.id)}">${t('closed')}</button>` : ''}
      </div></div></article>`;
}
const group = (h, a) => a.length ? `<h2>${h} <small>${a.length}</small></h2>${a.map(card).join('')}` : '';
function vToday() {
  const a = S.cases.filter(c => c.status === 'pending');
  return group(t('g_today'), a.filter(c => c.next_date === TODAY)) + group(t('g_tom'), a.filter(c => c.next_date === addDays(1)))
    + group(t('g_late'), a.filter(c => c.next_date && c.next_date < TODAY)) + group(t('g_none'), a.filter(c => !c.next_date))
    || `<p class="empty">${t('empty_today')}</p>`;
}
function caseCards() {
  const q = S.q.toLowerCase(), a = S.cases.filter(c => !q || [c.case_no, c.cnr, c.party_name, c.ps_name].some(x => (x || '').toLowerCase().includes(q)));
  return a.slice(0, 100).map(card).join('') + (a.length > 100 ? `<p class="empty">${t('first100')}</p>` : '') || `<p class="empty">${t('nocase')}</p>`;
}
function addForm() {
  const opt = a => `<option value="">${t('none')}</option>` + a.map(u => `<option value="${esc(u.id)}">${esc(u.name || u.email)}</option>`).join('');
  return `<details class="add"><summary>${t('addcase')}</summary><form data-f="case">
    <input name="case_no" placeholder="${t('ph_caseno')}" maxlength="60"><input name="cnr" placeholder="${t('ph_cnr')}" maxlength="40">
    <input name="party_name" placeholder="${t('ph_party')}" maxlength="160"><input name="court" placeholder="${t('ph_court')}" maxlength="60">
    <input name="ps_name" placeholder="${t('ph_ps')}" maxlength="80"><input name="stage" placeholder="${t('ph_stage')}" maxlength="80">
    <label>${t('nextdate')}<input type="date" name="next_date"></label>
    <label>${t('junior')}<select name="assigned_to">${opt(S.users.filter(u => u.role === 'junior' && u.active))}</select></label>
    <label>${t('clogin')}<select name="client_user_id">${opt(S.users.filter(u => u.role === 'client' && u.active))}</select></label>
    <button class="pri">${t('savecase')}</button></form></details>`;
}
const vCases = () => (canAdd() ? addForm() : '') + `<input id="q" type="search" placeholder="${t('search')}" value="${esc(S.q)}"><div id="list">${caseCards()}</div>`;
function vFees() {
  const due = Object.values(B).reduce((a, b) => a + Math.max(b.ch - b.pd, 0), 0);
  const nm = id => { const c = S.cases.find(x => x.id === id); return c ? (c.case_no || c.cnr) : ''; };
  return `<div class="sum"><span>${t('totaldue')}</span><b>${money(due)}</b></div>` + (S.fees.slice(0, 100).map(f =>
    `<div class="fe"><div><b>${f.kind === 'payment' ? t('got') : t('fixed')} ${money(f.amount)}</b><p class="m">${esc(nm(f.case_id))} • ${fmt(f.created_at.slice(0, 10))} ${esc(f.note || '')}</p></div>
    ${f.kind === 'payment' && !tmp(f.id) ? `<button class="ghost" data-a="rcpt" data-id="${esc(f.id)}">${t('rcpt')}</button>` : ''}</div>`).join('')
    || `<p class="empty">${t('nofees')}</p>`);
}
const vTeam = () => `<details class="add"><summary>${t('addmember')}</summary><form data-f="user">
  <input name="name" placeholder="${t('ph_name')}" required><input name="email" type="email" placeholder="${t('email')}" required><input name="phone" placeholder="${t('ph_mobile')}">
  <select name="role"><option value="junior">${t('r_junior')}</option><option value="munshi">${t('r_munshi')}</option><option value="client">${t('r_client')}</option></select>
  <input name="password" type="password" minlength="8" placeholder="${t('ph_pw')}" autocomplete="new-password" required>
  <button class="pri">${t('mkmember')}</button></form></details>` + S.users.map(u =>
  `<div class="fe"><div><b>${esc(u.name || u.email)}</b><p class="m">${t('r_' + u.role)} • ${esc(u.email)}${u.active ? '' : ' • ' + t('inactive')}</p></div>
  ${u.id !== S.user.id ? `<button class="ghost" data-a="act" data-id="${esc(u.id)}" data-on="${u.active ? 0 : 1}">${u.active ? t('deact') : t('act')}</button>` : ''}</div>`).join('');
const vBackup = () => `<p>${t('bk_info')}</p>
  <p class="m">${t('bk_last', localStorage.getItem('bk') ? esc(fmt(localStorage.getItem('bk'))) : t('bk_never'))}</p>
  <div class="row"><button class="pri" data-a="csv">${t('bk_csv')}</button><button class="ghost" data-a="json">${t('bk_json')}</button></div>`;

function render() {
  TODAY = iso(new Date());
  $('#login').hidden = !!S.user; $('#app').hidden = !S.user;
  if (!S.user) return;
  const tabs = TABS[S.user.role]; if (!tabs.some(x => x[0] === S.tab)) S.tab = tabs[0][0];
  $('#who').textContent = (S.user.chamber ? S.user.chamber + ' • ' : '') + (S.user.name || S.user.email);
  $('#tabs').innerHTML = tabs.map(([k, l]) => `<button data-a="tab" data-k="${k}" class="${k === S.tab ? 'on' : ''}">${t(l)}</button>`).join('');
  buildBal();
  $('#view').innerHTML = { today: vToday, cases: vCases, fees: vFees, team: vTeam, backup: vBackup }[S.tab](); bar();
}

// ---------- backup helpers (CSV ke headings hamesha English, Excel ke liye) ----------
const csv = rows => '\ufeff' + rows.map(r => r.map(v => { v = v ?? ''; if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v; return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
const dl = (name, txt, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e4); localStorage.setItem('bk', TODAY); };

// ---------- actions ----------
const ACT = {
  tab: ({ k }) => { S.tab = k; render(); },
  out: () => logout(),
  x: () => $('#dlg').close(),
  ec: ({ cnr }) => { navigator.clipboard?.writeText(cnr); window.open('https://services.ecourts.gov.in/ecourtindia_v6/', '_blank', 'noopener'); toast(t('cnr_copied')); },
  fee: ({ id }) => {
    const c = S.cases.find(x => x.id === id), b = B[id] || { ch: 0, pd: 0 };
    $('#dlg').innerHTML = `<form data-f="fee" data-id="${esc(id)}"><h3>${esc(c.case_no || c.cnr)}</h3>
      <p class="m">${t('fee_sum', money(b.ch), money(b.pd), money(b.ch - b.pd))}</p>
      <label>${t('fee_what')}<select name="kind"><option value="payment">${t('fee_got')}</option><option value="charge">${t('fee_set')}</option></select></label>
      <label>${t('amount')}<input name="amount" type="number" min="1" step="0.01" inputmode="decimal" required></label>
      <label>${t('note')}<input name="note" maxlength="200" placeholder="${t('note_ph')}"></label>
      <div class="row"><button class="pri">${t('save')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>`;
    $('#dlg').showModal();
  },
  done: async ({ id }) => {
    if (!confirm(t('c_done'))) return;
    await api('/cases/' + id, { method: 'PATCH', body: { status: 'disposed' } });
    S.cases.find(c => c.id === id).status = 'disposed'; await kv.set('cases', S.cases); render();
  },
  act: async ({ id, on }) => { await api('/users/' + id, { method: 'PATCH', body: { active: on === '1' } }); S.users = await api('/users'); render(); },
  rcpt: ({ id }) => {
    const f = S.fees.find(x => x.id === id), c = S.cases.find(x => x.id === f.case_id) || {}, w = window.open('', '_blank');
    if (!w) return toast(t('popup'));
    w.document.write(`<title>${t('rc_title')}</title><body style="font:16px system-ui,'Nirmala UI';max-width:420px;margin:30px auto"><h2>${esc(S.user.chamber || t('rc_title'))}</h2><h3>${t('rc_title')}</h3>
      <p>${t('rc_date')}: ${esc(fmt(f.created_at.slice(0, 10)))}<br>${t('rc_no')}: ${esc(f.id.slice(0, 8))}</p><p>${t('rc_case')}: ${esc(c.case_no || c.cnr)}<br>${t('rc_party')}: ${esc(c.party_name)}</p>
      <h3>${t('rc_amt')}: ${money(f.amount)}</h3><p>${esc(f.note)}</p>`);
    w.document.close(); w.focus(); w.print();
  },
  csv: () => {
    dl('cases.csv', csv([['Case no', 'CNR', 'Party', 'Court', 'PS', 'Stage', 'Next date', 'Status', 'Fees charged', 'Fees received', 'Due'],
      ...S.cases.map(c => { const b = B[c.id] || { ch: 0, pd: 0 }; return [c.case_no, c.cnr, c.party_name, c.court, c.ps_name, c.stage, c.next_date, c.status, b.ch, b.pd, b.ch - b.pd]; })]), 'text/csv');
    setTimeout(() => dl('fees.csv', csv([['Date', 'Case', 'Type', 'Amount', 'Note'], ...S.fees.map(f => { const c = S.cases.find(x => x.id === f.case_id) || {}; return [f.created_at.slice(0, 10), c.case_no || c.cnr, f.kind === 'payment' ? 'Received' : 'Charged', f.amount, f.note]; })]), 'text/csv'), 600);
  },
  json: async () => dl('backup-' + TODAY + '.json', JSON.stringify(await api('/backup'), null, 1), 'application/json')
};
const FORM = {
  login: async f => {
    $('#err').textContent = '';
    try {
      const d = await api('/login', { method: 'POST', body: Object.fromEntries(new FormData(f)) });
      localStorage.setItem('t', d.token); localStorage.setItem('u', JSON.stringify(d.user)); S.user = d.user; f.reset(); S.tab = 'today'; await start();
    } catch (e) { $('#err').textContent = e.server ? e.message : t('noserver'); }
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
  user: async f => { await api('/users', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); S.users = await api('/users'); toast(t('member_ok')); render(); }
};
function logout() { localStorage.removeItem('t'); localStorage.removeItem('u'); S.user = null; S.cases = []; S.fees = []; S.users = []; kv.clear(); render(); }

document.addEventListener('click', async e => { const b = e.target.closest('[data-a]'); if (b) try { await ACT[b.dataset.a](b.dataset); } catch (x) { toast(x.message); } });
document.addEventListener('submit', async e => { e.preventDefault(); const f = e.target; try { await FORM[f.dataset.f](f); } catch (x) { toast(x.message); } });
document.addEventListener('input', e => { if (e.target.id === 'q') { S.q = e.target.value; $('#list').innerHTML = caseCards(); } });
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.classList.contains('lang')) {
    LANG = el.value; localStorage.setItem('lang', LANG); if ($('#dlg').open) $('#dlg').close();
    applyStatic(); $('#err').textContent = ''; render(); return;
  }
  const id = el.dataset.nd; if (!id || !el.value) return;
  try {
    await send('PATCH', `/cases/${id}/next-date`, { next_date: el.value });
    S.cases.find(c => c.id === id).next_date = el.value; await kv.set('cases', S.cases); render();
  } catch (x) { toast(x.message); }
});
addEventListener('online', () => { bar(); flush(); }); addEventListener('offline', bar);
setInterval(flush, 30000);

async function start() { applyStatic(); render(); if (!S.user) return; await count(); await flush(); await load(); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
start();
