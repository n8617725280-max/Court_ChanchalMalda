// Malda Court Connect v5 — server
require('dotenv').config();
const express = require('express'), path = require('path'), crypto = require('crypto');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const helmet = require('helmet'), rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { makeStorage, MAXDOC } = require('./storage');   // server-side modules: PAGES list mein nahi, bahar nahi dikhte
const { makeDrive } = require('./drive');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, SETUP_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_KEY aur 32+ akshar ka JWT_SECRET zaroori hain. Server band.');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const DUMMY = bcrypt.hashSync('dummy-password', 10);
let store; try { store = makeStorage(db); } catch (e) { console.error(e.message + '. Server band.'); process.exit(1); }
const drive = makeDrive(db);     // GOOGLE_* aur DRIVE_TOKEN_KEY na hon to drive.enabled = false (feature chhupa rahega)

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }));
app.use(express.json({ limit: '1mb' }));
// Keep-awake ping (cron-job.org har 10 minute). Na login, na database.
app.get('/healthz', (q, s) => s.set('Cache-Control', 'no-store').json({ ok: true }));
// Saari files ek hi folder mein hain. Sirf ye allowed files bahar dikhengi (server.js, package.json wagairah nahi).
const PAGES = ['index.html', 'app.js', 'app.css', 'sw.js', 'setup.html', 'setup.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'owner.html', 'owner.js', 'qr.js', 'law-sections.json'];
app.get('/', (q, s) => s.sendFile('index.html', { root: __dirname }));
PAGES.forEach(f => app.get('/' + f, (q, s) => s.sendFile(f, { root: __dirname })));

// ---------- helpers ----------
const wrap = f => (q, s, n) => Promise.resolve(f(q, s, n)).catch(e => { console.error(e); s.status(500).json({ error: 'Server error, dobara try karein' }); });
const str = (v, m = 200) => typeof v === 'string' ? v.trim().slice(0, m) : '';
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
const isId = v => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const phone = v => str(v, 20).replace(/[^\d+]/g, '');
const pwOk = p => typeof p === 'string' && p.length >= 8 && p.length <= 100;
const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const ok = r => { if (r.error) throw r.error; return r; };
async function all(mk) { let out = [], from = 0; for (;;) { const { data, error } = await mk().range(from, from + 999); if (error) throw error; out = out.concat(data); if (data.length < 1000) return out; from += 1000; } }

const auth = wrap(async (q, s, n) => {
  let p; try { p = jwt.verify((q.headers.authorization || '').split(' ')[1], JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return s.status(401).json({ error: 'Login dobara karein' }); }
  const { data: u } = await db.from('users').select('id,role,chamber_id,name,active').eq('id', p.id).maybeSingle();
  if (!u || !u.active) return s.status(401).json({ error: 'Account band hai' });
  const { data: chm, error: chErr } = await db.from('chambers').select('active').eq('id', u.chamber_id).maybeSingle();
  if (!chErr && chm && chm.active === false) return s.status(401).json({ error: 'Chamber band hai. Support se baat karein' });
  q.user = u; n();
});
const need = (...r) => (q, s, n) => r.includes(q.user.role) ? n() : s.status(403).json({ error: 'Is kaam ki ijazat nahi hai' });

async function inChamber(id, ch, role) {
  const { data } = await db.from('users').select('id').eq('id', id).eq('chamber_id', ch).in('role', [].concat(role)).eq('active', true).maybeSingle();
  return !!data;
}
async function getCase(q, id, extra = '') {   // case isi chamber ka ho; junior ko sirf assigned, client ko sirf apna
  if (!isId(id)) return null;
  const { data } = await db.from('cases').select('id,chamber_id,assigned_to,client_user_id,next_date' + extra).eq('id', id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!data) return null;
  if (q.user.role === 'junior' && data.assigned_to !== q.user.id) return null;
  if (q.user.role === 'client' && data.client_user_id !== q.user.id) return null;
  return data;
}
async function clientInChamber(id, ch) {
  if (!isId(id)) return false;
  const { data } = await db.from('clients').select('id').eq('id', id).eq('chamber_id', ch).maybeSingle();
  return !!data;
}
async function mkUser(chamber_id, b, role) {
  const email = str(b.email, 120).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || !pwOk(b.password)) return { error: 'Sahi email aur 8+ akshar ka password daalein' };
  const password_hash = await bcrypt.hash(b.password, 10);
  const { data, error } = await db.from('users').insert({ email, password_hash, role, name: str(b.name, 80), phone: str(b.phone, 20), chamber_id })
    .select('id,email,name,role,phone,active').single();
  return error ? { error: error.code === '23505' ? 'Ye email pehle se maujood hai' : 'User nahi ban paya' } : { data };
}

// ---------- login / setup ----------
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: { error: 'Bahut koshish ho gayi. 15 minute baad try karein' } });
app.post('/api/login', loginLimit, wrap(async (q, s) => {
  const email = str(q.body.email, 120).toLowerCase(), pw = typeof q.body.password === 'string' ? q.body.password : '';
  const { data: u } = await db.from('users').select('*').eq('email', email).maybeSingle();
  const match = await bcrypt.compare(pw, u ? u.password_hash : DUMMY);
  if (!u || !u.active || !match) return s.status(401).json({ error: 'Email ya password galat hai' });
  const { data: ch } = await db.from('chambers').select('name,active').eq('id', u.chamber_id).maybeSingle();
  if (ch && ch.active === false) return s.status(403).json({ error: 'Chamber band hai. Support se baat karein' });
  s.json({ token: jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '12h' }), user: { id: u.id, name: u.name, email: u.email, role: u.role, chamber: ch && ch.name } });
}));

// Naya chamber + senior sirf aap (SETUP_KEY ke saath) bana sakte hain
app.post('/api/setup', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), wrap(async (q, s) => {
  if (!SETUP_KEY || SETUP_KEY.length < 16 || !same(q.headers['x-setup-key'], SETUP_KEY)) return s.status(403).json({ error: 'Not allowed' });
  const name = str(q.body.chamber, 100); if (!name) return s.status(400).json({ error: 'chamber ka naam zaroori hai' });
  const { data: ch } = ok(await db.from('chambers').insert({ name }).select('id').single());
  const r = await mkUser(ch.id, q.body, 'senior');
  if (r.error) { await db.from('chambers').delete().eq('id', ch.id); return s.status(400).json({ error: r.error }); }
  s.json({ chamber_id: ch.id, senior: r.data });
}));

// ---------- OWNER PANEL (sirf SETUP_KEY se) ----------
const ROLES = ['senior', 'junior', 'munshi', 'client'];
const ownerLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: { error: 'Bahut koshish ho gayi. 15 minute baad try karein' } });
const owner = (q, s, n) => (SETUP_KEY && SETUP_KEY.length >= 16 && same(q.headers['x-setup-key'], SETUP_KEY)) ? n() : s.status(403).json({ error: 'Not allowed' });
app.use('/api/owner', ownerLimit, owner);
app.get('/api/owner/chambers', wrap(async (q, s) => {
  const chs = await all(() => db.from('chambers').select('id,name,active,created_at').order('created_at').order('id'));
  const us = await all(() => db.from('users').select('id,chamber_id,role,name,email').order('created_at').order('id'));
  const cnt = await Promise.all(chs.map(c => db.from('cases').select('id', { count: 'exact', head: true }).eq('chamber_id', c.id)));
  s.json(chs.map((c, i) => { const mine = us.filter(u => u.chamber_id === c.id), sr = mine.find(u => u.role === 'senior'); return { ...c, users: mine.length, cases: cnt[i].count || 0, senior: sr ? `${sr.name || ''} ${sr.email}`.trim() : '' }; }));
}));
app.get('/api/owner/chambers/:id/users', wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  s.json(ok(await db.from('users').select('id,email,name,role,phone,active').eq('chamber_id', q.params.id).order('created_at')).data);
}));
app.patch('/api/owner/chambers/:id', wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const u = {}; if ('active' in q.body) u.active = !!q.body.active; if (typeof q.body.name === 'string' && q.body.name.trim()) u.name = str(q.body.name, 100);
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  ok(await db.from('chambers').update(u).eq('id', q.params.id)); s.json({ ok: 1 });
}));
app.post('/api/owner/users', wrap(async (q, s) => {
  const b = q.body;
  if (!isId(b.chamber_id) || !ROLES.includes(b.role)) return s.status(400).json({ error: 'Role galat hai' });
  const r = await mkUser(b.chamber_id, b, b.role); r.error ? s.status(400).json({ error: r.error }) : s.json(r.data);
}));
app.post('/api/owner/users/bulk', wrap(async (q, s) => {
  const rows = Array.isArray(q.body.rows) ? q.body.rows.slice(0, 100) : [];
  if (!isId(q.body.chamber_id)) return s.status(400).json({ error: 'Galat request' });
  let created = 0; const failed = [];
  for (const b of rows) {
    if (!ROLES.includes(b.role)) { failed.push({ email: b.email, error: 'Role galat hai' }); continue; }
    const r = await mkUser(q.body.chamber_id, b, b.role); r.error ? failed.push({ email: b.email, error: r.error }) : created++;
  }
  s.json({ created, failed });
}));
app.patch('/api/owner/users/:id', wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const b = q.body, u = {};
  if ('active' in b) u.active = !!b.active;
  if (b.password !== undefined) { if (!pwOk(b.password)) return s.status(400).json({ error: 'Password 8+ akshar ka hona chahiye' }); u.password_hash = await bcrypt.hash(b.password, 10); }
  if (typeof b.name === 'string') u.name = str(b.name, 80);
  if (typeof b.phone === 'string') u.phone = str(b.phone, 20);
  if (typeof b.email === 'string') { const e = str(b.email, 120).toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(e)) return s.status(400).json({ error: 'Email galat hai' }); u.email = e; }
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  const { data, error } = await db.from('users').update(u).eq('id', q.params.id).select('id').maybeSingle();
  if (error) return s.status(400).json({ error: error.code === '23505' ? 'Ye email pehle se maujood hai' : 'Save nahi hua' });
  data ? s.json({ ok: 1 }) : s.status(404).json({ error: 'User nahi mila' });
}));

// Vakil ka password bhool jaye: sirf aap (SETUP_KEY ke saath) naya password daal sakte hain
app.post('/api/reset-password', rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), wrap(async (q, s) => {
  if (!SETUP_KEY || SETUP_KEY.length < 16 || !same(q.headers['x-setup-key'], SETUP_KEY)) return s.status(403).json({ error: 'Not allowed' });
  if (!pwOk(q.body.password)) return s.status(400).json({ error: 'Password 8+ akshar ka hona chahiye' });
  const { data } = ok(await db.from('users').update({ password_hash: await bcrypt.hash(q.body.password, 10) }).eq('email', str(q.body.email, 120).toLowerCase()).select('id').maybeSingle());
  data ? s.json({ ok: 1 }) : s.status(404).json({ error: 'User nahi mila' });
}));
// Har user apna password khud badal sakta hai
app.post('/api/me/password', auth, loginLimit, wrap(async (q, s) => {
  const { data: u } = await db.from('users').select('password_hash').eq('id', q.user.id).single();
  if (!(await bcrypt.compare(String(q.body.current || ''), u.password_hash))) return s.status(400).json({ error: 'Abhi ka password galat hai' });
  if (!pwOk(q.body.password)) return s.status(400).json({ error: 'Password 8+ akshar ka hona chahiye' });
  ok(await db.from('users').update({ password_hash: await bcrypt.hash(q.body.password, 10) }).eq('id', q.user.id));
  s.json({ ok: 1 });
}));

// ---------- users (chamber ke andar) ----------
app.get('/api/users', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  s.json(ok(await db.from('users').select('id,email,name,role,phone,active').eq('chamber_id', q.user.chamber_id).order('created_at')).data);
}));
app.post('/api/users', auth, need('senior'), wrap(async (q, s) => {
  const role = q.body.role;
  if (!['junior', 'munshi', 'client'].includes(role)) return s.status(400).json({ error: 'Role galat hai' });
  const r = await mkUser(q.user.chamber_id, q.body, role);
  r.error ? s.status(400).json({ error: r.error }) : s.json(r.data);
}));
app.patch('/api/users/:id', auth, need('senior'), wrap(async (q, s) => {
  if (!isId(q.params.id) || q.params.id === q.user.id) return s.status(400).json({ error: 'Galat request' });
  const upd = {};
  if ('active' in q.body) upd.active = !!q.body.active;
  if (q.body.password !== undefined) { if (!pwOk(q.body.password)) return s.status(400).json({ error: 'Password 8+ akshar ka hona chahiye' }); upd.password_hash = await bcrypt.hash(q.body.password, 10); }
  if (!Object.keys(upd).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  const { data } = ok(await db.from('users').update(upd).eq('id', q.params.id).eq('chamber_id', q.user.chamber_id).select('id').maybeSingle());
  data ? s.json({ ok: 1 }) : s.status(404).json({ error: 'User nahi mila' });
}));

// ---------- cases ----------
const CF = 'id,cnr,case_no,party_name,court,ps_name,stage,next_date,status,notes,assigned_to,client_user_id,client_phone,created_at,'
  + 'client_id,case_type,fir_no,fir_date,sections,bail_status,chargesheet_date,ip_name,io_name';
const CASE_TYPES = ['civil', 'criminal', 'other'];
// naye (v5) case fields: text + date. Galat date par error string lautata hai
function caseExtra(b, row) {
  for (const [k, m] of [['fir_no', 60], ['sections', 500], ['bail_status', 80], ['ip_name', 160], ['io_name', 160]]) if (typeof b[k] === 'string') row[k] = str(b[k], m) || null;
  for (const k of ['fir_date', 'chargesheet_date']) {
    if (b[k] === null || b[k] === '') row[k] = null;
    else if (b[k] !== undefined) { if (!isDate(b[k])) return 'Date galat hai'; row[k] = b[k]; }
  }
  if (b.case_type === null || b.case_type === '') row.case_type = null;
  else if (b.case_type !== undefined) { if (!CASE_TYPES.includes(b.case_type)) return 'Case type galat hai'; row.case_type = b.case_type; }
  return null;
}
async function newClient(ch, uid, b) {      // case ke saath naya client (auto-create)
  const name = str(b.client_name, 120); if (!name) return null;
  const { data, error } = await db.from('clients').insert({ chamber_id: ch, created_by: uid, name, phone: phone(b.client_phone) || null }).select('id').single();
  if (error) throw error;
  return data.id;
}
app.get('/api/cases', auth, wrap(async (q, s) => {
  const u = q.user;
  const rows = await all(() => {
    let x = db.from('cases').select(CF).eq('chamber_id', u.chamber_id).order('created_at').order('id');
    if (u.role === 'junior') x = x.eq('assigned_to', u.id);
    if (u.role === 'client') x = x.eq('client_user_id', u.id);
    return x;
  });
  if (u.role === 'client') rows.forEach(c => { delete c.notes; delete c.assigned_to; delete c.client_user_id; delete c.client_phone; delete c.client_id; });
  s.json(rows);
}));
app.post('/api/cases', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const b = q.body, ch = q.user.chamber_id;
  const row = { chamber_id: ch, created_by: q.user.id, cnr: str(b.cnr, 40).toUpperCase() || null, case_no: str(b.case_no, 60), party_name: str(b.party_name, 160),
    court: str(b.court, 60), ps_name: str(b.ps_name, 80), stage: str(b.stage, 80), notes: str(b.notes, 1000), client_phone: phone(b.client_phone), client_ref: isId(b.client_ref) ? b.client_ref : null };
  if (!row.case_no && !row.cnr) return s.status(400).json({ error: 'Case no ya CNR zaroori hai' });
  if (b.next_date) { if (!isDate(b.next_date)) return s.status(400).json({ error: 'Date galat hai' }); row.next_date = b.next_date; }
  const bad = caseExtra(b, row); if (bad) return s.status(400).json({ error: bad });
  for (const [k, role] of [['assigned_to', 'junior'], ['client_user_id', 'client']])
    if (b[k]) { if (!isId(b[k]) || !(await inChamber(b[k], ch, role))) return s.status(400).json({ error: 'Junior/Client galat hai' }); row[k] = b[k]; }
  if (b.client_id) { if (!(await clientInChamber(b.client_id, ch))) return s.status(400).json({ error: 'Client nahi mila' }); row.client_id = b.client_id; }
  // offline retry: pehle check karein ki ye client_ref pehle hi save to nahi hua (warna duplicate client banta)
  if (row.client_ref) { const { data: had } = await db.from('cases').select('id').eq('chamber_id', ch).eq('client_ref', row.client_ref).maybeSingle(); if (had) return s.json({ ok: 1, dup: true }); }
  if (!row.client_id && b.make_client) row.client_id = await newClient(ch, q.user.id, b);
  const { data, error } = await db.from('cases').upsert(row, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true }).select(CF).maybeSingle();
  if (error) return s.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Ye CNR is chamber mein pehle se hai' : 'Case save nahi hua' });
  s.json(data || { ok: 1, dup: true });
}));
app.post('/api/cases/import', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const rows = Array.isArray(q.body.rows) ? q.body.rows.slice(0, 200) : [], ch = q.user.chamber_id, seen = new Set(), out = [];
  for (const b of rows) {
    const cnr = str(b.cnr, 40).toUpperCase() || null, case_no = str(b.case_no, 60);
    if (!cnr && !case_no) continue;
    if (cnr) { if (seen.has(cnr)) continue; seen.add(cnr); }
    out.push({ chamber_id: ch, created_by: q.user.id, cnr, case_no, party_name: str(b.party_name, 160), court: str(b.court, 60), ps_name: str(b.ps_name, 80),
      stage: str(b.stage, 80), client_phone: phone(b.client_phone), next_date: isDate(b.next_date) ? b.next_date : null });
  }
  let added = 0;
  if (out.length) { const { data, error } = await db.from('cases').upsert(out, { onConflict: 'chamber_id,cnr', ignoreDuplicates: true }).select('id'); if (error) throw error; added = data.length; }
  s.json({ added, total: rows.length });
}));
app.patch('/api/cases/:id/next-date', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  if (!isDate(q.body.next_date)) return s.status(400).json({ error: 'Date galat hai' });
  const upd = { next_date: q.body.next_date }; if (typeof q.body.stage === 'string') upd.stage = str(q.body.stage, 80);
  ok(await db.from('cases').update(upd).eq('id', c.id).eq('chamber_id', c.chamber_id));
  ok(await db.from('hearing_log').insert({ chamber_id: c.chamber_id, case_id: c.id, old_date: c.next_date, new_date: q.body.next_date, changed_by: q.user.id }));
  s.json({ ok: 1 });
}));
app.patch('/api/cases/:id', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const b = q.body, u = {};
  for (const [k, m] of [['case_no', 60], ['party_name', 160], ['court', 60], ['ps_name', 80], ['stage', 80], ['notes', 1000]]) if (typeof b[k] === 'string') u[k] = str(b[k], m);
  if (typeof b.client_phone === 'string') u.client_phone = phone(b.client_phone);
  const bad = caseExtra(b, u); if (bad) return s.status(400).json({ error: bad });
  if (b.client_id === null || b.client_id === '') u.client_id = null;
  else if (b.client_id) { if (!(await clientInChamber(b.client_id, c.chamber_id))) return s.status(400).json({ error: 'Client nahi mila' }); u.client_id = b.client_id; }
  if (q.user.role === 'senior' && ['pending', 'disposed'].includes(b.status)) u.status = b.status;
  for (const [k, role] of (q.user.role === 'senior' ? [['assigned_to', 'junior'], ['client_user_id', 'client']] : [])) {
    if (b[k] === null) u[k] = null;
    else if (b[k]) { if (!isId(b[k]) || !(await inChamber(b[k], c.chamber_id, role))) return s.status(400).json({ error: 'User galat hai' }); u[k] = b[k]; }
  }
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  ok(await db.from('cases').update(u).eq('id', c.id).eq('chamber_id', c.chamber_id));
  s.json({ ok: 1 });
}));
// BNS finder se "case mein jodein": section list mein jodta hai (junior bhi apne assigned case mein)
app.post('/api/cases/:id/sections', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id, ',sections'); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const add = str(q.body.sec, 60); if (!add) return s.status(400).json({ error: 'Galat request' });
  const list = (c.sections || '').split(',').map(x => x.trim()).filter(Boolean);
  if (!list.some(x => x.toLowerCase() === add.toLowerCase())) list.push(add);
  const sections = list.join(', ');
  if (sections.length > 500) return s.status(400).json({ error: 'Bahut zyada sections' });
  ok(await db.from('cases').update({ sections }).eq('id', c.id).eq('chamber_id', c.chamber_id));
  s.json({ ok: 1, sections });
}));

// ---------- clients (muvakkil) ----------
const CL = 'id,name,phone,address,guardian,notes,created_at';
function clientRow(b, row) {
  for (const [k, m] of [['name', 120], ['address', 300], ['guardian', 120], ['notes', 1000]]) if (typeof b[k] === 'string') row[k] = str(b[k], m);
  if (typeof b.phone === 'string') row.phone = phone(b.phone);
  return row;
}
app.get('/api/clients', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  s.json(await all(() => db.from('clients').select(CL).eq('chamber_id', q.user.chamber_id).order('name').order('id')));
}));
app.post('/api/clients', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const row = clientRow(q.body, { chamber_id: q.user.chamber_id, created_by: q.user.id, client_ref: isId(q.body.client_ref) ? q.body.client_ref : null });
  if (!row.name) return s.status(400).json({ error: 'Client ka naam zaroori hai' });
  const { data, error } = await db.from('clients').upsert(row, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true }).select(CL).maybeSingle();
  if (error) throw error;
  s.json(data || { ok: 1, dup: true });
}));
app.patch('/api/clients/:id', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  if (!(await clientInChamber(q.params.id, q.user.chamber_id))) return s.status(404).json({ error: 'Client nahi mila' });
  const u = clientRow(q.body, {});
  if ('name' in u && !u.name) return s.status(400).json({ error: 'Client ka naam zaroori hai' });
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  ok(await db.from('clients').update(u).eq('id', q.params.id).eq('chamber_id', q.user.chamber_id));
  s.json({ ok: 1 });
}));

// ---------- chamber settings (vakil ka naam, UPI) ----------
const CHF = 'name,adv_name,adv_enrol,address,upi_id,upi_name';
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;
app.get('/api/chamber', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  s.json(ok(await db.from('chambers').select(CHF).eq('id', q.user.chamber_id).single()).data);
}));
app.patch('/api/chamber', auth, need('senior'), wrap(async (q, s) => {
  const b = q.body, u = {};
  for (const [k, m] of [['adv_name', 120], ['adv_enrol', 60], ['address', 300], ['upi_name', 80]]) if (typeof b[k] === 'string') u[k] = str(b[k], m) || null;
  if (typeof b.upi_id === 'string') { const v = str(b.upi_id, 120); if (v && !UPI_RE.test(v)) return s.status(400).json({ error: 'UPI ID galat hai (jaise naam@okhdfcbank)' }); u.upi_id = v || null; }
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  ok(await db.from('chambers').update(u).eq('id', q.user.chamber_id));
  s.json({ ok: 1 });
}));

// ---------- dashboard ----------
app.get('/api/dashboard', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const u = q.user;
  let recent = ok(await db.from('hearing_log').select('case_id,old_date,new_date,changed_at,changed_by').eq('chamber_id', u.chamber_id)
    .order('changed_at', { ascending: false }).limit(u.role === 'junior' ? 200 : 15)).data;
  if (u.role === 'junior') {
    const mine = new Set((await all(() => db.from('cases').select('id').eq('chamber_id', u.chamber_id).eq('assigned_to', u.id).order('id'))).map(c => c.id));
    recent = recent.filter(r => mine.has(r.case_id));
  }
  const nm = await names(u.chamber_id);
  const out = { recent: recent.slice(0, 15).map(r => ({ ...r, by: nm[r.changed_by] || '' })) };
  if (u.role !== 'junior') {     // sirf abhi wale backend (Supabase 1 GB / R2 10 GB) ki jagah; Drive aur link ginti mein nahi
    const cur = store.current.name;
    out.storage_bytes = (await all(() => db.from('documents').select('size,backend').eq('chamber_id', u.chamber_id).order('id')))
      .filter(d => (d.backend || 'supabase') === cur).reduce((a, d) => a + (+d.size || 0), 0);
    out.storage_backend = cur; out.storage_limit = store.limit;
  }
  s.json(out);
}));

// ---------- document vault (Supabase Storage / Cloudflare R2 / Google Drive / link) ----------
// Har row mein backend: 'supabase' (purani rows null = supabase), 'r2', 'gdrive', 'link'
const DF = 'id,case_id,name,mime,size,backend,uploaded_by,created_at';
const LINK_MIME = 'text/uri-list';
const sniff = b => {                      // file ka type uske pehle bytes (magic bytes) se, naam/extension par bharosa nahi
  if (b.length > 4 && b.slice(0, 5).toString('latin1') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' };
  if (b.length > 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b.length > 8 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return { mime: 'image/png', ext: 'png' };
  return null;
};
const fileName = (raw, ext) => {
  let name = ''; try { name = decodeURIComponent(String(raw || '')); } catch { name = ''; }
  return str(name.replace(/[\\/\u0000-\u001f<>"]/g, '_'), 120) || ('document.' + ext);
};
const upLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false, message: { error: 'Bahut koshish ho gayi. 15 minute baad try karein' } });
const dlLimit = rateLimit({ windowMs: 5 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Bahut koshish ho gayi. 15 minute baad try karein' } });
app.get('/api/cases/:id/docs', auth, wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const rows = ok(await db.from('documents').select(DF).eq('chamber_id', c.chamber_id).eq('case_id', c.id).order('created_at', { ascending: false })).data;
  s.json(rows.map(d => ({ ...d, backend: d.backend || 'supabase' })));
}));
// Upload: body = file ke raw bytes (application/octet-stream), naam header x-file-name mein. Sirf isi route par 10 MB limit.
// Uploader ne Google Drive jodi hai to file uski Drive mein, warna app storage (Supabase/R2) mein.
app.post('/api/cases/:id/docs', auth, need('senior', 'munshi', 'junior'), upLimit, express.raw({ type: 'application/octet-stream', limit: MAXDOC }), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id, ',case_no,party_name'); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const buf = q.body;
  if (!Buffer.isBuffer(buf) || !buf.length) return s.status(400).json({ error: 'File khaali hai' });
  if (buf.length > MAXDOC) return s.status(413).json({ error: 'File 10 MB se badi hai' });
  const kind = sniff(buf); if (!kind) return s.status(400).json({ error: 'Sirf PDF, JPG ya PNG file chalegi' });
  const name = fileName(q.headers['x-file-name'], kind.ext);
  const base = { chamber_id: c.chamber_id, case_id: c.id, name, mime: kind.mime, size: buf.length, uploaded_by: q.user.id };
  let fallback = false;
  if (drive.enabled) {
    let f = null;
    try { f = await drive.upload(q.user, c.case_no || c.party_name || 'Case', name, buf, kind.mime); }
    catch (e) { console.error('Drive upload fail, app storage mein rakh rahe hain:', e.message); fallback = true; }
    if (f) {
      const { data, error } = await db.from('documents').insert({ ...base, path: 'gdrive/' + f.id, backend: 'gdrive', drive_file_id: f.id, url: f.webViewLink || null }).select(DF).single();
      if (error) { try { await drive.remove(q.user.id, c.chamber_id, f.id); } catch { /* best effort */ } throw error; }
      return s.json(data);
    }
  }
  const be = store.current, path = `${c.chamber_id}/${c.id}/${crypto.randomUUID()}.${kind.ext}`;
  try { await be.put(path, buf, kind.mime); } catch (e) { console.error(e); return s.status(500).json({ error: 'Upload nahi hua, dobara try karein' }); }
  const { data, error } = await db.from('documents').insert({ ...base, path, backend: be.name }).select(DF).single();
  if (error) { try { await be.del(path); } catch { /* best effort */ } throw error; }
  s.json(fallback ? { ...data, fallback: true } : data);
}));
// Link chipkayein: sirf https. drive.google.com / docs.google.com seedhe; baaki https chalega par warn: true
const GOOGLE_HOSTS = ['drive.google.com', 'docs.google.com'];
app.post('/api/cases/:id/links', auth, need('senior', 'munshi', 'junior'), upLimit, wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const raw = str(q.body.url, 1000); let u;
  try { u = new URL(raw); } catch { u = null; }
  if (!u || u.protocol !== 'https:' || u.username || u.password || !u.hostname.includes('.')) return s.status(400).json({ error: 'Sirf https:// wala sahi link chalega' });
  const warn = !GOOGLE_HOSTS.includes(u.hostname.toLowerCase());
  const name = str(String(q.body.name || '').replace(/[\u0000-\u001f<>"]/g, '_'), 120) || u.hostname;
  const { data, error } = await db.from('documents').insert({ chamber_id: c.chamber_id, case_id: c.id, name, mime: LINK_MIME, size: 0, path: 'link/' + crypto.randomUUID(),
    backend: 'link', url: u.href, uploaded_by: q.user.id }).select(DF).single();
  if (error) throw error;
  s.json({ ...data, warn });
}));
async function docFor(q, id, f = 'id,case_id,name,mime,path,backend,url,drive_file_id,uploaded_by,chamber_id') {
  if (!isId(id)) return null;
  const { data: d } = await db.from('documents').select(f).eq('id', id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!d || !(await getCase(q, d.case_id))) return null;
  return d;
}
// Download: access check ke baad 60 second ka signed URL (Supabase / R2), link ke liye wahi link (naye tab mein),
// Drive ke liye apne server ka 60 second wala token-link (server uploader ke token se file laata hai)
app.get('/api/docs/:id/url', auth, dlLimit, wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const d = await docFor(q, q.params.id); if (!d) return s.status(404).json({ error: 'Document nahi mila' });
  const b = d.backend || 'supabase';
  if (b === 'link') return s.json({ url: d.url, open: true });
  if (b === 'gdrive') {
    if (!drive.enabled) return s.status(503).json({ error: 'Google Drive abhi band hai' });
    const t = jwt.sign({ p: 'dl', d: d.id, u: q.user.id }, JWT_SECRET, { algorithm: 'HS256', expiresIn: 60 });
    return s.json({ url: `/api/docs/${d.id}/raw?t=${encodeURIComponent(t)}`, open: d.uploaded_by === q.user.id && !!d.url });
  }
  const be = store.get(b); if (!be) return s.status(503).json({ error: 'Ye file abhi nahi khul sakti (storage setting dekhein)' });
  s.json({ url: await be.url(d.path, d.name) });
}));
// Drive file: token (60 s, isi user aur isi document ke liye) + dobara permission check. Uploader ko seedha Drive par (302).
app.get('/api/docs/:id/raw', dlLimit, wrap(async (q, s) => {
  if (!drive.enabled || !isId(q.params.id)) return s.status(404).json({ error: 'Document nahi mila' });
  let p; try { p = jwt.verify(String(q.query.t || ''), JWT_SECRET, { algorithms: ['HS256'] }); } catch { return s.status(401).json({ error: 'Link purana ho gaya, dobara Download dabayein' }); }
  if (!p || p.p !== 'dl' || p.d !== q.params.id || !isId(p.u)) return s.status(401).json({ error: 'Link purana ho gaya, dobara Download dabayein' });
  const { data: u } = await db.from('users').select('id,role,chamber_id,name,active').eq('id', p.u).maybeSingle();
  if (!u || !u.active) return s.status(401).json({ error: 'Account band hai' });
  const { data: chm } = await db.from('chambers').select('active').eq('id', u.chamber_id).maybeSingle();
  if (chm && chm.active === false) return s.status(401).json({ error: 'Chamber band hai. Support se baat karein' });
  const d = await docFor({ user: u }, q.params.id);
  if (!d || d.backend !== 'gdrive') return s.status(404).json({ error: 'Document nahi mila' });
  if (d.uploaded_by === u.id && d.url && /^https:\/\/(drive|docs)\.google\.com\//.test(d.url)) return s.redirect(302, d.url);
  const buf = await drive.fetchFile(d.uploaded_by, d.chamber_id, d.drive_file_id);
  if (!buf) return s.status(410).json({ error: 'Drive se file nahi mil rahi (upload karne wale ne Drive hata di?)' });
  s.set({ 'Content-Type': d.mime, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(d.name)}`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  s.send(buf);
}));
app.delete('/api/docs/:id', auth, need('senior'), wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const { data: d } = await db.from('documents').select('id,path,backend,drive_file_id,uploaded_by,chamber_id').eq('id', q.params.id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!d) return s.status(404).json({ error: 'Document nahi mila' });
  const b = d.backend || 'supabase';
  if (b === 'gdrive') { if (drive.enabled) { try { await drive.remove(d.uploaded_by, d.chamber_id, d.drive_file_id); } catch (e) { console.error(e.message); } } }
  else if (b !== 'link') { const be = store.get(b); if (!be) return s.status(503).json({ error: 'Ye file abhi nahi khul sakti (storage setting dekhein)' }); await be.del(d.path); }
  ok(await db.from('documents').delete().eq('id', d.id).eq('chamber_id', q.user.chamber_id));
  s.json({ ok: 1 });
}));

// ---------- Google Drive jodein (har user apni) ----------
const driveLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false, message: { error: 'Bahut koshish ho gayi. 15 minute baad try karein' } });
const cookie = (q, k) => { const m = String(q.headers.cookie || '').split(/;\s*/).find(x => x.startsWith(k + '=')); return m ? decodeURIComponent(m.slice(k.length + 1)) : ''; };
const DCK = 'mcc_ds';
const dcookie = (q, v, age) => `${DCK}=${v}; Path=/api/drive; HttpOnly; SameSite=Lax; Max-Age=${age}${q.secure ? '; Secure' : ''}`;
const driveOn = (q, s, n) => drive.enabled ? n() : s.status(404).json({ error: 'Google Drive abhi band hai' });
app.get('/api/drive/status', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  if (!drive.enabled) return s.json({ enabled: false });
  s.json({ enabled: true, ...(await drive.status(q.user)) });
}));
app.post('/api/drive/connect', auth, need('senior', 'munshi', 'junior'), driveOn, driveLimit, wrap(async (q, s) => {
  const { state, nonce } = drive.makeState(q.user.id);
  s.set('Set-Cookie', dcookie(q, nonce, 600)).json({ url: drive.authUrl(state) });
}));
// Google yahan wapas bhejta hai (browser redirect, Authorization header nahi): state ka HMAC + cookie ka nonce + user dobara check
app.get('/api/drive/callback', driveOn, driveLimit, wrap(async (q, s) => {
  const back = r => s.set('Set-Cookie', dcookie(q, '', 0)).redirect(302, '/?drive=' + r);
  const uid = drive.readState(q.query.state, cookie(q, DCK));
  if (!uid || !isId(uid)) return back('err');
  if (q.query.error) return back('no');
  if (typeof q.query.code !== 'string' || !q.query.code || q.query.code.length > 2000) return back('err');
  const { data: u } = await db.from('users').select('id,role,chamber_id,active').eq('id', uid).maybeSingle();
  if (!u || !u.active || !['senior', 'munshi', 'junior'].includes(u.role)) return back('err');
  const { data: chm } = await db.from('chambers').select('active').eq('id', u.chamber_id).maybeSingle();
  if (chm && chm.active === false) return back('err');
  try { await drive.connect(u, q.query.code); } catch (e) { console.error(e.message); return back('err'); }
  back('ok');
}));
app.post('/api/drive/disconnect', auth, need('senior', 'munshi', 'junior'), driveOn, wrap(async (q, s) => {
  await drive.disconnect(q.user); s.json({ ok: 1 });
}));

// ---------- drafts (Vakalatnama, affidavit, bail wagairah) ----------
const DRAFT_KINDS = ['vakalatnama', 'affidavit', 'affidavit_bn', 'notice', 'bail_480', 'bail_482', 'bail_bn', 'adjourn', 'hazira', 'other'];
const DRF = 'id,case_id,kind,title,body,created_by,created_at,updated_at';
app.get('/api/cases/:id/drafts', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  s.json(ok(await db.from('drafts').select(DRF).eq('chamber_id', c.chamber_id).eq('case_id', c.id).order('updated_at', { ascending: false })).data);
}));
app.post('/api/drafts', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const b = q.body, c = await getCase(q, b.case_id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const body = typeof b.body === 'string' ? b.body.slice(0, 20000) : '';
  if (!body.trim()) return s.status(400).json({ error: 'Draft khaali hai' });
  const row = { chamber_id: c.chamber_id, case_id: c.id, kind: DRAFT_KINDS.includes(b.kind) ? b.kind : 'other', title: str(b.title, 120) || 'Draft', body,
    created_by: q.user.id, client_ref: isId(b.client_ref) ? b.client_ref : null };
  const { data, error } = await db.from('drafts').upsert(row, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true }).select(DRF).maybeSingle();
  if (error) throw error;
  s.json(data || { ok: 1, dup: true });
}));
app.patch('/api/drafts/:id', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const { data: d } = await db.from('drafts').select('id,case_id').eq('id', q.params.id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!d || !(await getCase(q, d.case_id))) return s.status(404).json({ error: 'Draft nahi mila' });
  const u = { updated_at: new Date().toISOString() };
  if (typeof q.body.title === 'string') u.title = str(q.body.title, 120) || 'Draft';
  if (typeof q.body.body === 'string') { if (!q.body.body.trim()) return s.status(400).json({ error: 'Draft khaali hai' }); u.body = q.body.body.slice(0, 20000); }
  ok(await db.from('drafts').update(u).eq('id', d.id).eq('chamber_id', q.user.chamber_id));
  s.json({ ok: 1 });
}));
app.delete('/api/drafts/:id', auth, need('senior'), wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const { data } = ok(await db.from('drafts').delete().eq('id', q.params.id).eq('chamber_id', q.user.chamber_id).select('id').maybeSingle());
  data ? s.json({ ok: 1 }) : s.status(404).json({ error: 'Draft nahi mila' });
}));

// ---------- chamber notes / knowledge base ----------
const NF = 'id,title,body,tag,case_id,private,created_by,created_at,updated_at';
async function noteFor(q, id) {          // note isi chamber ka; private sirf senior; junior sirf apne cases ke
  if (!isId(id)) return null;
  const { data: n } = await db.from('notes').select(NF).eq('id', id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!n || (n.private && q.user.role !== 'senior')) return null;
  if (n.case_id && q.user.role === 'junior' && !(await getCase(q, n.case_id))) return null;
  return n;
}
app.get('/api/notes', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const u = q.user;
  let rows = await all(() => {
    let x = db.from('notes').select(NF).eq('chamber_id', u.chamber_id).order('updated_at', { ascending: false }).order('id');
    if (u.role !== 'senior') x = x.eq('private', false);
    return x;
  });
  if (u.role === 'junior') {
    const mine = new Set((await all(() => db.from('cases').select('id').eq('chamber_id', u.chamber_id).eq('assigned_to', u.id).order('id'))).map(c => c.id));
    rows = rows.filter(n => !n.case_id || mine.has(n.case_id));
  }
  const nm = await names(u.chamber_id);
  s.json(rows.map(n => ({ ...n, by: nm[n.created_by] || '' })));
}));
app.post('/api/notes', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const b = q.body, u = q.user;
  const row = { chamber_id: u.chamber_id, title: str(b.title, 160), body: typeof b.body === 'string' ? b.body.trim().slice(0, 5000) : '', tag: str(b.tag, 40).toLowerCase() || null,
    private: u.role === 'senior' && !!b.private, created_by: u.id, client_ref: isId(b.client_ref) ? b.client_ref : null };
  if (!row.title && !row.body) return s.status(400).json({ error: 'Note khaali hai' });
  if (!row.title) row.title = row.body.slice(0, 60);
  if (b.case_id) { const c = await getCase(q, b.case_id); if (!c) return s.status(404).json({ error: 'Case nahi mila' }); row.case_id = c.id; }
  const { data, error } = await db.from('notes').upsert(row, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true }).select(NF).maybeSingle();
  if (error) throw error;
  s.json(data ? { ...data, by: u.name || '' } : { ok: 1, dup: true });
}));
app.patch('/api/notes/:id', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const n = await noteFor(q, q.params.id);
  if (!n || (q.user.role !== 'senior' && n.created_by !== q.user.id)) return s.status(404).json({ error: 'Note nahi mila' });
  const b = q.body, u = { updated_at: new Date().toISOString() };
  if (typeof b.title === 'string') u.title = str(b.title, 160);
  if (typeof b.body === 'string') u.body = b.body.trim().slice(0, 5000);
  if (typeof b.tag === 'string') u.tag = str(b.tag, 40).toLowerCase() || null;
  if (q.user.role === 'senior' && 'private' in b) u.private = !!b.private;
  if (b.case_id === null || b.case_id === '') u.case_id = null;
  else if (b.case_id) { const c = await getCase(q, b.case_id); if (!c) return s.status(404).json({ error: 'Case nahi mila' }); u.case_id = c.id; }
  ok(await db.from('notes').update(u).eq('id', n.id).eq('chamber_id', q.user.chamber_id));
  s.json({ ok: 1 });
}));
app.delete('/api/notes/:id', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const n = await noteFor(q, q.params.id);
  if (!n || (q.user.role !== 'senior' && n.created_by !== q.user.id)) return s.status(404).json({ error: 'Note nahi mila' });
  ok(await db.from('notes').delete().eq('id', n.id).eq('chamber_id', q.user.chamber_id));
  s.json({ ok: 1 });
}));

// ---------- tasks (kaam) ----------
const TK = 'id,title,due_date,priority,assigned_to,created_by,done,created_at';
async function names(ch) { const { data } = await db.from('users').select('id,name,email').eq('chamber_id', ch); return Object.fromEntries((data || []).map(u => [u.id, u.name || u.email])); }
app.get('/api/tasks', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const u = q.user;
  const rows = await all(() => {
    let x = db.from('tasks').select(TK).eq('chamber_id', u.chamber_id).order('created_at', { ascending: false }).order('id');
    if (u.role !== 'senior') x = x.or(`assigned_to.eq.${u.id},created_by.eq.${u.id}`);
    return x;
  });
  const nm = await names(u.chamber_id);
  s.json(rows.map(r => ({ ...r, assignee: nm[r.assigned_to] || '' })));
}));
app.post('/api/tasks', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const b = q.body, ch = q.user.chamber_id, title = str(b.title, 160), to = b.assigned_to || q.user.id;
  if (!title) return s.status(400).json({ error: 'Kaam ka naam zaroori hai' });
  if (!isId(to) || !(await inChamber(to, ch, ['senior', 'junior', 'munshi']))) return s.status(400).json({ error: 'User galat hai' });
  const row = { chamber_id: ch, title, priority: ['low', 'medium', 'high'].includes(b.priority) ? b.priority : 'medium', assigned_to: to, created_by: q.user.id, client_ref: isId(b.client_ref) ? b.client_ref : null };
  if (b.due_date) { if (!isDate(b.due_date)) return s.status(400).json({ error: 'Date galat hai' }); row.due_date = b.due_date; }
  const { data, error } = await db.from('tasks').upsert(row, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true }).select(TK).maybeSingle();
  if (error) throw error;
  s.json(data ? { ...data, assignee: (await names(ch))[data.assigned_to] || '' } : { ok: 1, dup: true });
}));
app.patch('/api/tasks/:id', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  if (!isId(q.params.id)) return s.status(400).json({ error: 'Galat request' });
  const { data: k } = await db.from('tasks').select('id,assigned_to,created_by').eq('id', q.params.id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!k || (q.user.role !== 'senior' && k.assigned_to !== q.user.id && k.created_by !== q.user.id)) return s.status(404).json({ error: 'Kaam nahi mila' });
  ok(await db.from('tasks').update({ done: !!q.body.done }).eq('id', k.id));
  s.json({ ok: 1 });
}));

// ---------- fees ----------
app.get('/api/fees', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  s.json(await all(() => db.from('fees').select('id,case_id,kind,amount,note,created_at').eq('chamber_id', q.user.chamber_id).order('created_at', { ascending: false }).order('id')));
}));
app.post('/api/fees', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const b = q.body, c = await getCase(q, b.case_id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const amount = Number(b.amount);
  if (!['charge', 'payment'].includes(b.kind) || !(amount > 0) || amount > 1e8) return s.status(400).json({ error: 'Rakam ya type galat hai' });
  const { data, error } = await db.from('fees').upsert({ chamber_id: c.chamber_id, case_id: c.id, kind: b.kind, amount: Math.round(amount * 100) / 100, note: str(b.note, 200),
    created_by: q.user.id, client_ref: isId(b.client_ref) ? b.client_ref : null }, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true })
    .select('id,case_id,kind,amount,note,created_at').maybeSingle();
  if (error) throw error;
  s.json(data || { ok: 1, dup: true });
}));

// ---------- backup (sirf senior, sirf apna chamber) ----------
app.get('/api/backup', auth, need('senior'), wrap(async (q, s) => {
  const ch = q.user.chamber_id, get = (t, f = '*') => all(() => db.from(t).select(f).eq('chamber_id', ch).order('id'));
  const [cases, fees, hearing_log, clients, tasks, notes, drafts, documents] = await Promise.all([get('cases'), get('fees'), get('hearing_log'), get('clients'), get('tasks'),
    get('notes'), get('drafts'), get('documents', 'id,case_id,name,mime,size,path,backend,url,drive_file_id,uploaded_by,created_at')]);
  s.json({ exported_at: new Date().toISOString(), version: 5, cases, fees, hearing_log, clients, tasks, notes, drafts, documents });
}));

// galat JSON / badi file ka saaf jawab
app.use((e, q, s, n) => {
  if (e && e.type === 'entity.too.large') return s.status(413).json({ error: 'File 10 MB se badi hai' });
  if (e && e.type === 'entity.parse.failed') return s.status(400).json({ error: 'Galat request' });
  console.error(e); s.status(500).json({ error: 'Server error, dobara try karein' });
});

if (require.main === module) {
  store.current.ensure();
  app.listen(process.env.PORT || 10000, () => console.log('Malda Court Connect v5 chalu hai'));
}
module.exports = app;
