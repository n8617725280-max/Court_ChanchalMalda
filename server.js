require('dotenv').config();
const express = require('express'), path = require('path'), crypto = require('crypto');
const bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken');
const helmet = require('helmet'), rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET, SETUP_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_KEY aur 32+ akshar ka JWT_SECRET zaroori hain. Server band.');
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
const DUMMY = bcrypt.hashSync('dummy-password', 10);

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }));
app.use(express.json({ limit: '1mb' }));
// Saari files ek hi folder mein hain. Sirf ye allowed files bahar dikhengi (server.js, package.json wagairah nahi).
const PAGES = ['index.html', 'app.js', 'app.css', 'sw.js', 'setup.html', 'setup.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'owner.html', 'owner.js'];
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
async function getCase(q, id) {          // case isi chamber ka ho; junior ko sirf apna assigned
  if (!isId(id)) return null;
  const { data } = await db.from('cases').select('id,chamber_id,assigned_to,next_date').eq('id', id).eq('chamber_id', q.user.chamber_id).maybeSingle();
  if (!data || (q.user.role === 'junior' && data.assigned_to !== q.user.id)) return null;
  return data;
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
const CF = 'id,cnr,case_no,party_name,court,ps_name,stage,next_date,status,notes,assigned_to,client_user_id,client_phone,created_at';
app.get('/api/cases', auth, wrap(async (q, s) => {
  const u = q.user;
  const rows = await all(() => {
    let x = db.from('cases').select(CF).eq('chamber_id', u.chamber_id).order('created_at').order('id');
    if (u.role === 'junior') x = x.eq('assigned_to', u.id);
    if (u.role === 'client') x = x.eq('client_user_id', u.id);
    return x;
  });
  if (u.role === 'client') rows.forEach(c => { delete c.notes; delete c.assigned_to; delete c.client_user_id; delete c.client_phone; });
  s.json(rows);
}));
app.post('/api/cases', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const b = q.body, ch = q.user.chamber_id;
  const row = { chamber_id: ch, created_by: q.user.id, cnr: str(b.cnr, 40).toUpperCase() || null, case_no: str(b.case_no, 60), party_name: str(b.party_name, 160),
    court: str(b.court, 60), ps_name: str(b.ps_name, 80), stage: str(b.stage, 80), notes: str(b.notes, 1000), client_phone: phone(b.client_phone), client_ref: isId(b.client_ref) ? b.client_ref : null };
  if (!row.case_no && !row.cnr) return s.status(400).json({ error: 'Case no ya CNR zaroori hai' });
  if (b.next_date) { if (!isDate(b.next_date)) return s.status(400).json({ error: 'Date galat hai' }); row.next_date = b.next_date; }
  for (const [k, role] of [['assigned_to', 'junior'], ['client_user_id', 'client']])
    if (b[k]) { if (!isId(b[k]) || !(await inChamber(b[k], ch, role))) return s.status(400).json({ error: 'Junior/Client galat hai' }); row[k] = b[k]; }
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
  if (q.user.role === 'senior' && ['pending', 'disposed'].includes(b.status)) u.status = b.status;
  for (const [k, role] of (q.user.role === 'senior' ? [['assigned_to', 'junior'], ['client_user_id', 'client']] : [])) {
    if (b[k] === null) u[k] = null;
    else if (b[k]) { if (!isId(b[k]) || !(await inChamber(b[k], c.chamber_id, role))) return s.status(400).json({ error: 'User galat hai' }); u[k] = b[k]; }
  }
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  ok(await db.from('cases').update(u).eq('id', c.id).eq('chamber_id', c.chamber_id));
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
  const ch = q.user.chamber_id, get = t => all(() => db.from(t).select('*').eq('chamber_id', ch).order('id'));
  const [cases, fees, hearing_log] = await Promise.all([get('cases'), get('fees'), get('hearing_log')]);
  s.json({ exported_at: new Date().toISOString(), cases, fees, hearing_log });
}));

app.listen(process.env.PORT || 10000, () => console.log('Malda Court Connect chalu hai'));
