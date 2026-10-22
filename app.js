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
  rc_case: ['Case', 'Case', 'কেস'], rc_party: ['Party', 'Party', 'পক্ষ'], rc_amt: ['Mili rakam', 'Amount received', 'প্রাপ্ত টাকা'],
  support: ['Software support', 'Software support', 'সফটওয়্যার সহায়তা'], install: ['App install karein', 'Install app', 'অ্যাপ ইনস্টল করুন'],
  ph_cphone: ['Client ka mobile (WhatsApp)', 'Client mobile (WhatsApp)', 'ক্লায়েন্টের মোবাইল (WhatsApp)'], edit: ['Badlav', 'Edit', 'এডিট'],
  wa: ['WhatsApp reminder', 'WhatsApp reminder', 'WhatsApp রিমাইন্ডার'],
  wa_msg: ['Namaste, aapke case {0} ki agli hearing {1} ko hai. - {2}', 'Hello, the next hearing of your case {0} is on {1}. - {2}', 'নমস্কার, আপনার কেস {0}-এর পরবর্তী শুনানি {1} তারিখে। - {2}'],
  imp_title: ['Purane cases Excel/CSV se daalein', 'Import old cases from Excel/CSV', 'Excel/CSV থেকে পুরনো কেস আনুন'],
  imp_help: ['Excel file ko "CSV UTF-8" mein save karein. Pehli line mein heading: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile.', 'Save your Excel file as "CSV UTF-8". First row headings: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile.', 'Excel ফাইলটি "CSV UTF-8" হিসেবে সেভ করুন। প্রথম সারিতে হেডিং দিন: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile।'],
  imp_sample: ['Sample CSV', 'Sample CSV', 'নমুনা CSV'],
  imp_done: ['{0} case jude, {1} chhoote (pehle se the ya galat)', '{0} cases added, {1} skipped (already exist or invalid)', '{0}টি কেস যোগ হয়েছে, {1}টি বাদ (আগে থেকেই আছে বা ভুল)'],
  imp_empty: ['File mein koi case nahi mila', 'No cases found in the file', 'ফাইলে কোনো কেস পাওয়া যায়নি'],
  resetpw: ['Password badlein', 'Reset password', 'পাসওয়ার্ড বদলান'], newpw: ['Naya password (8+ akshar)', 'New password (8+ characters)', 'নতুন পাসওয়ার্ড (৮+ অক্ষর)'],
  pw_ok: ['Password badal gaya', 'Password changed', 'পাসওয়ার্ড বদলেছে'],
  tab_tasks: ['Kaam', 'Tasks', 'কাজ'], tab_cal: ['Calendar', 'Calendar', 'ক্যালেন্ডার'],
  addtask: ['Naya kaam jodein', 'Add a task', 'নতুন কাজ যোগ করুন'], ph_task: ['Kaam ka naam (jaise Affidavit draft)', 'Task (e.g. Affidavit draft)', 'কাজের নাম (যেমন Affidavit draft)'],
  duedate: ['Aakhri tareekh', 'Due date', 'শেষ তারিখ'], assign: ['Kise dena hai', 'Assign to', 'কাকে দেবেন'],
  p_low: ['Kam', 'Low', 'কম'], p_medium: ['Medium', 'Medium', 'মাঝারি'], p_high: ['Zaroori', 'High', 'বেশি'],
  no_tasks: ['Koi kaam baaki nahi.', 'No pending tasks.', 'কোনো কাজ বাকি নেই।'], done_h: ['Ho gaye', 'Done', 'সম্পন্ন'],
  cal_none: ['Is din koi hearing nahi.', 'No hearings on this day.', 'এই দিনে কোনো শুনানি নেই।'],
  mypw: ['Mera password badlein', 'Change my password', 'আমার পাসওয়ার্ড বদলান'], curpw: ['Abhi ka password', 'Current password', 'বর্তমান পাসওয়ার্ড']
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
  'Password 8+ akshar ka hona chahiye': ['Password must be 8+ characters', 'পাসওয়ার্ড ৮+ অক্ষরের হতে হবে'], 'Kaam ka naam zaroori hai': ['Task name is required', 'কাজের নাম দেওয়া জরুরি'], 'Kaam nahi mila': ['Task not found', 'কাজ পাওয়া যায়নি'], 'Abhi ka password galat hai': ['Current password is wrong', 'বর্তমান পাসওয়ার্ড ভুল'], 'Chamber band hai. Support se baat karein': ['This chamber is disabled. Please contact support', 'এই চেম্বার বন্ধ আছে। সহায়তার সাথে যোগাযোগ করুন'],
  'Kuch badla nahi': ['Nothing changed', 'কিছু বদলায়নি'], 'Rakam ya type galat hai': ['Invalid amount or type', 'টাকার পরিমাণ বা ধরন ভুল']
};
const se = m => (LANG !== 'hi' && E[m]) ? E[m][IDX[LANG] - 1] : m;
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString(LOC[LANG], { day: '2-digit', month: 'short', year: 'numeric' }) : t('nodate');
function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
  document.querySelectorAll('.lang').forEach(s => s.value = LANG);
}

const S = { user: JSON.parse(localStorage.getItem('u') || 'null'), cases: [], fees: [], users: [], tasks: [], cal: null, tab: 'today', q: '', pending: 0 };
let TODAY = iso(new Date()), B = {};
const TABS = {
  senior: [['today', 'tab_today'], ['cal', 'tab_cal'], ['cases', 'tab_cases'], ['tasks', 'tab_tasks'], ['fees', 'tab_fees'], ['team', 'tab_team'], ['backup', 'tab_backup']],
  munshi: [['today', 'tab_today'], ['cal', 'tab_cal'], ['cases', 'tab_cases'], ['tasks', 'tab_tasks'], ['fees', 'tab_fees']],
  junior: [['today', 'tab_today'], ['cal', 'tab_cal'], ['cases', 'tab_cases'], ['tasks', 'tab_tasks']],
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
    if (S.user.role !== 'client') { S.tasks = await api('/tasks'); await kv.set('tasks', S.tasks); }
  } catch (e) {
    if (e.server) toast(e.message);
    else { S.cases = (await kv.get('cases')) || []; S.fees = (await kv.get('fees')) || []; S.users = (await kv.get('users')) || []; S.tasks = (await kv.get('tasks')) || []; }
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
        ${canAdd() && c.client_phone && c.next_date && c.status === 'pending' ? `<button class="ghost" data-a="wa" data-id="${esc(c.id)}">${t('wa')}</button>` : ''}
        ${canAdd() && !tm ? `<button class="ghost" data-a="edit" data-id="${esc(c.id)}">${t('edit')}</button>` : ''}
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
    <input name="ps_name" placeholder="${t('ph_ps')}" maxlength="80"><input name="stage" placeholder="${t('ph_stage')}" maxlength="80"><input name="client_phone" placeholder="${t('ph_cphone')}" maxlength="20" inputmode="tel">
    <label>${t('nextdate')}<input type="date" name="next_date"></label>
    <label>${t('junior')}<select name="assigned_to">${opt(S.users.filter(u => u.role === 'junior' && u.active))}</select></label>
    <label>${t('clogin')}<select name="client_user_id">${opt(S.users.filter(u => u.role === 'client' && u.active))}</select></label>
    <button class="pri">${t('savecase')}</button></form></details>`;
}
const vCases = () => (canAdd() ? addForm() + importBox() : '') + `<input id="q" type="search" placeholder="${t('search')}" value="${esc(S.q)}"><div id="list">${caseCards()}</div>`;
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
  ${u.id !== S.user.id ? `<button class="ghost" data-a="pw" data-id="${esc(u.id)}">${t('resetpw')}</button><button class="ghost" data-a="act" data-id="${esc(u.id)}" data-on="${u.active ? 0 : 1}">${u.active ? t('deact') : t('act')}</button>` : ''}</div>`).join('');
const vBackup = () => `<p>${t('bk_info')}</p>
  <p class="m">${t('bk_last', localStorage.getItem('bk') ? esc(fmt(localStorage.getItem('bk'))) : t('bk_never'))}</p>
  <div class="row"><button class="pri" data-a="csv">${t('bk_csv')}</button><button class="ghost" data-a="json">${t('bk_json')}</button></div>`;

// ---------- import, tasks, calendar ----------
const importBox = () => `<details class="add"><summary>${t('imp_title')}</summary><p class="m">${t('imp_help')}</p><input type="file" id="imp" accept=".csv,text/csv"><div class="row"><button type="button" class="ghost" data-a="sample">${t('imp_sample')}</button></div></details>`;
function parseCSV(txt) {
  txt = txt.replace(/^\ufeff/, ''); const l1 = txt.split('\n', 1)[0];
  const d = l1.includes('\t') ? '\t' : (l1.split(';').length > l1.split(',').length ? ';' : ',');
  const rows = []; let r = [], v = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { v += '"'; i++; } else q = false; } else v += c; }
    else if (c === '"') q = true;
    else if (c === d) { r.push(v); v = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; r.push(v); v = ''; if (r.some(x => x.trim())) rows.push(r); r = []; }
    else v += c;
  }
  r.push(v); if (r.some(x => x.trim())) rows.push(r); return rows;
}
const hk = h => { h = h.toLowerCase(); return /cnr/.test(h) ? 'cnr' : /mobile|phone|whatsapp/.test(h) ? 'client_phone' : /date/.test(h) ? 'next_date' : /\bps\b|thana|police|station/.test(h) ? 'ps_name' : /court/.test(h) ? 'court' : /stage/.test(h) ? 'stage' : /party|name|naam/.test(h) ? 'party_name' : /case/.test(h) ? 'case_no' : null; };
const toIso = v => { v = (v || '').trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; const m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); return m ? `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
async function importCSV(file) {
  const rows = parseCSV(await file.text()); if (rows.length < 2) return toast(t('imp_empty'));
  const keys = rows[0].map(hk);
  const data = rows.slice(1).map(r => { const o = {}; keys.forEach((k, i) => { if (k && String(r[i] ?? '').trim()) o[k] = String(r[i]).trim(); }); if (o.next_date) { o.next_date = toIso(o.next_date); if (!o.next_date) delete o.next_date; } return o; }).filter(o => o.case_no || o.cnr);
  if (!data.length) return toast(t('imp_empty'));
  let add = 0; for (let i = 0; i < data.length; i += 200) add += (await api('/cases/import', { method: 'POST', body: { rows: data.slice(i, i + 200) } })).added;
  toast(t('imp_done', add, data.length - add)); await load();
}
const taskForm = () => `<details class="add"><summary>${t('addtask')}</summary><form data-f="task">
  <input name="title" placeholder="${t('ph_task')}" maxlength="160" required>
  <label>${t('duedate')}<input type="date" name="due_date"></label>
  <label>${t('assign')}<select name="assigned_to">${S.users.filter(u => u.role !== 'client' && u.active).map(u => `<option value="${esc(u.id)}"${u.id === S.user.id ? ' selected' : ''}>${esc(u.name || u.email)}</option>`).join('')}</select></label>
  <select name="priority"><option value="medium">${t('p_medium')}</option><option value="high">${t('p_high')}</option><option value="low">${t('p_low')}</option></select>
  <button class="pri">${t('save')}</button></form></details>`;
const taskRow = x => `<div class="fe task${x.done ? ' dn' : ''}"><button class="ck" data-a="tk" data-id="${esc(x.id)}" data-on="${x.done ? 0 : 1}" aria-label="done">${x.done ? '✓' : ''}</button>
  <div><b>${esc(x.title)}</b><p class="m">${esc(x.assignee || '')} • ${t('p_' + x.priority)}${x.due_date ? ' • ' + esc(fmt(x.due_date)) : ''}</p></div></div>`;
function vTasks() {
  const open = S.tasks.filter(x => !x.done), dn = S.tasks.filter(x => x.done);
  return (canAdd() ? taskForm() : '') + (open.map(taskRow).join('') || `<p class="empty">${t('no_tasks')}</p>`)
    + (dn.length ? `<h2>${t('done_h')} <small>${dn.length}</small></h2>` + dn.slice(0, 20).map(taskRow).join('') : '');
}
function vCal() {
  const { y, m, sel } = S.cal, pre = `${y}-${String(m + 1).padStart(2, '0')}-`, n = new Date(y, m + 1, 0).getDate(), cnt = {};
  S.cases.forEach(c => { if (c.status === 'pending' && c.next_date && c.next_date.startsWith(pre)) cnt[c.next_date] = (cnt[c.next_date] || 0) + 1; });
  let cells = '<i></i>'.repeat(new Date(y, m, 1).getDay());
  for (let d = 1; d <= n; d++) { const k = pre + String(d).padStart(2, '0'); cells += `<button class="cd${k === TODAY ? ' td' : ''}${k === sel ? ' sel' : ''}" data-a="day" data-k="${k}">${d}${cnt[k] ? `<small>${cnt[k]}</small>` : ''}</button>`; }
  const wd = [...Array(7)].map((_, i) => `<b>${new Date(2023, 0, 1 + i).toLocaleDateString(LOC[LANG], { weekday: 'narrow' })}</b>`).join('');
  const list = S.cases.filter(c => c.status === 'pending' && c.next_date === sel);
  return `<div class="calh"><button class="ghost" data-a="cm" data-d="-1">‹</button><h2>${new Date(y, m, 1).toLocaleDateString(LOC[LANG], { month: 'long', year: 'numeric' })}</h2><button class="ghost" data-a="cm" data-d="1">›</button></div>
    <div class="cal">${wd}${cells}</div><h2>${fmt(sel)} <small>${list.length}</small></h2>${list.map(card).join('') || `<p class="empty">${t('cal_none')}</p>`}`;
}

function render() {
  TODAY = iso(new Date()); S.cal ??= { y: new Date().getFullYear(), m: new Date().getMonth(), sel: TODAY };
  $('#login').hidden = !!S.user; $('#app').hidden = !S.user;
  if (!S.user) return;
  const tabs = TABS[S.user.role]; if (!tabs.some(x => x[0] === S.tab)) S.tab = tabs[0][0];
  $('#who').textContent = (S.user.chamber ? S.user.chamber + ' • ' : '') + (S.user.name || S.user.email);
  $('#tabs').innerHTML = tabs.map(([k, l]) => `<button data-a="tab" data-k="${k}" class="${k === S.tab ? 'on' : ''}">${t(l)}</button>`).join('');
  buildBal();
  $('#view').innerHTML = { today: vToday, cal: vCal, cases: vCases, tasks: vTasks, fees: vFees, team: vTeam, backup: vBackup }[S.tab](); bar();
}

// ---------- backup helpers (CSV ke headings hamesha English, Excel ke liye) ----------
const csv = rows => '\ufeff' + rows.map(r => r.map(v => { v = v ?? ''; if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v; return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
const dl = (name, txt, type, mark = true) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e4); if (mark) localStorage.setItem('bk', TODAY); };

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
  wa: ({ id }) => {
    const c = S.cases.find(x => x.id === id); let p = (c.client_phone || '').replace(/\D/g, ''); if (p.length === 10) p = '91' + p;
    window.open('https://wa.me/' + p + '?text=' + encodeURIComponent(t('wa_msg', c.case_no || c.cnr, fmt(c.next_date), S.user.chamber || '')), '_blank', 'noopener');
  },
  edit: ({ id }) => {
    const c = S.cases.find(x => x.id === id), f = (n, p, m) => `<input name="${n}" placeholder="${p}" value="${esc(c[n])}" maxlength="${m}">`;
    $('#dlg').innerHTML = `<form data-f="edit" data-id="${esc(id)}"><h3>${esc(c.case_no || c.cnr)}</h3>${f('case_no', t('ph_caseno'), 60)}${f('party_name', t('ph_party'), 160)}${f('court', t('ph_court'), 60)}${f('ps_name', t('ph_ps'), 80)}${f('stage', t('ph_stage'), 80)}${f('client_phone', t('ph_cphone'), 20)}${f('notes', t('note'), 1000)}
      <div class="row"><button class="pri">${t('save')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>`;
    $('#dlg').showModal();
  },
  mypw: async () => { const c = prompt(t('curpw')); if (!c) return; const p = prompt(t('newpw')); if (!p) return; await api('/me/password', { method: 'POST', body: { current: c, password: p } }); toast(t('pw_ok')); },
  pw: async ({ id }) => { const p = prompt(t('newpw')); if (!p) return; await api('/users/' + id, { method: 'PATCH', body: { password: p } }); toast(t('pw_ok')); },
  sample: () => dl('sample.csv', csv([['Case no', 'CNR', 'Party', 'Court', 'PS', 'Stage', 'Next date', 'Mobile'], ['GR 123/24', 'WBMD010012342024', 'Md. Rahim vs State', 'ACJM Malda', 'Chanchal', 'Evidence', '2026-11-15', '9876543210']]), 'text/csv', false),
  tk: async ({ id, on }) => { if (tmp(id)) return; await send('PATCH', '/tasks/' + id, { done: on === '1' }); S.tasks.find(x => x.id === id).done = on === '1'; await kv.set('tasks', S.tasks); render(); },
  day: ({ k }) => { S.cal.sel = k; render(); },
  cm: ({ d }) => { let m = S.cal.m + +d, y = S.cal.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } S.cal.m = m; S.cal.y = y; render(); },
  inst: async () => { if (!DIP) return; DIP.prompt(); await DIP.userChoice; DIP = null; $('#inst').hidden = true; },
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
  edit: async f => {
    const b = Object.fromEntries(new FormData(f)), c = S.cases.find(x => x.id === f.dataset.id);
    await send('PATCH', '/cases/' + c.id, b); Object.assign(c, b); await kv.set('cases', S.cases); $('#dlg').close(); render();
  },
  task: async f => {
    const b = Object.fromEntries(new FormData(f)); if (!b.due_date) delete b.due_date; b.client_ref = uid();
    const r = await send('POST', '/tasks', b), me = S.users.find(u => u.id === b.assigned_to);
    if (r && !r.id) await load(); else S.tasks.unshift(r || { ...b, id: 'tmp-' + b.client_ref, done: false, assignee: me ? (me.name || me.email) : '' });
    await kv.set('tasks', S.tasks); render();
  },
  user: async f => { await api('/users', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); S.users = await api('/users'); toast(t('member_ok')); render(); }
};
function logout() { localStorage.removeItem('t'); localStorage.removeItem('u'); S.user = null; S.cases = []; S.fees = []; S.users = []; S.tasks = []; kv.clear(); render(); }

document.addEventListener('click', async e => { const b = e.target.closest('[data-a]'); if (b) try { await ACT[b.dataset.a](b.dataset); } catch (x) { toast(x.message); } });
document.addEventListener('submit', async e => { e.preventDefault(); const f = e.target; try { await FORM[f.dataset.f](f); } catch (x) { toast(x.message); } });
document.addEventListener('input', e => { if (e.target.id === 'q') { S.q = e.target.value; $('#list').innerHTML = caseCards(); } });
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.classList.contains('lang')) {
    LANG = el.value; localStorage.setItem('lang', LANG); if ($('#dlg').open) $('#dlg').close();
    applyStatic(); $('#err').textContent = ''; render(); return;
  }
  if (el.id === 'imp') { const fl = el.files[0]; el.value = ''; if (fl) try { await importCSV(fl); } catch (x) { toast(x.server ? x.message : t('noserver')); } return; }
  const id = el.dataset.nd; if (!id || !el.value) return;
  try {
    await send('PATCH', `/cases/${id}/next-date`, { next_date: el.value });
    S.cases.find(c => c.id === id).next_date = el.value; await kv.set('cases', S.cases); render();
  } catch (x) { toast(x.message); }
});
addEventListener('online', () => { bar(); flush(); }); addEventListener('offline', bar);
let DIP; addEventListener('beforeinstallprompt', e => { e.preventDefault(); DIP = e; const b = $('#inst'); if (b) b.hidden = false; });
setInterval(flush, 30000);

async function start() { applyStatic(); render(); if (!S.user) return; await count(); await flush(); await load(); }
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
start();
