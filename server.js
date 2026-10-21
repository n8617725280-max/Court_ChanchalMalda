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
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- helpers ----------
const wrap = f => (q, s, n) => Promise.resolve(f(q, s, n)).catch(e => { console.error(e); s.status(500).json({ error: 'Server error, dobara try karein' }); });
const str = (v, m = 200) => typeof v === 'string' ? v.trim().slice(0, m) : '';
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
const isId = v => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
const pwOk = p => typeof p === 'string' && p.length >= 8 && p.length <= 100;
const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const ok = r => { if (r.error) throw r.error; return r; };
async function all(mk) { let out = [], from = 0; for (;;) { const { data, error } = await mk().range(from, from + 999); if (error) throw error; out = out.concat(data); if (data.length < 1000) return out; from += 1000; } }

const auth = wrap(async (q, s, n) => {
  let p; try { p = jwt.verify((q.headers.authorization || '').split(' ')[1], JWT_SECRET, { algorithms: ['HS256'] }); }
  catch { return s.status(401).json({ error: 'Login dobara karein' }); }
  const { data: u } = await db.from('users').select('id,role,chamber_id,name,active').eq('id', p.id).maybeSingle();
  if (!u || !u.active) return s.status(401).json({ error: 'Account band hai' });
  q.user = u; n();
});
const need = (...r) => (q, s, n) => r.includes(q.user.role) ? n() : s.status(403).json({ error: 'Is kaam ki ijazat nahi hai' });

async function inChamber(id, ch, role) {
  const { data } = await db.from('users').select('id').eq('id', id).eq('chamber_id', ch).eq('role', role).eq('active', true).maybeSingle();
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
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Bahut koshish ho gayi. 15 minute baad try karein' } });
app.post('/api/login', loginLimit, wrap(async (q, s) => {
  const email = str(q.body.email, 120).toLowerCase(), pw = typeof q.body.password === 'string' ? q.body.password : '';
  const { data: u } = await db.from('users').select('*').eq('email', email).maybeSingle();
  const match = await bcrypt.compare(pw, u ? u.password_hash : DUMMY);
  if (!u || !u.active || !match) return s.status(401).json({ error: 'Email ya password galat hai' });
  const { data: ch } = await db.from('chambers').select('name').eq('id', u.chamber_id).maybeSingle();
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
  const { data } = ok(await db.from('users').update({ active: !!q.body.active }).eq('id', q.params.id).eq('chamber_id', q.user.chamber_id).select('id').maybeSingle());
  data ? s.json({ ok: 1 }) : s.status(404).json({ error: 'User nahi mila' });
}));

// ---------- cases ----------
const CF = 'id,cnr,case_no,party_name,court,ps_name,stage,next_date,status,notes,assigned_to,client_user_id,created_at';
app.get('/api/cases', auth, wrap(async (q, s) => {
  const u = q.user;
  const rows = await all(() => {
    let x = db.from('cases').select(CF).eq('chamber_id', u.chamber_id).order('created_at').order('id');
    if (u.role === 'junior') x = x.eq('assigned_to', u.id);
    if (u.role === 'client') x = x.eq('client_user_id', u.id);
    return x;
  });
  if (u.role === 'client') rows.forEach(c => { delete c.notes; delete c.assigned_to; delete c.client_user_id; });
  s.json(rows);
}));
app.post('/api/cases', auth, need('senior', 'munshi'), wrap(async (q, s) => {
  const b = q.body, ch = q.user.chamber_id;
  const row = { chamber_id: ch, created_by: q.user.id, cnr: str(b.cnr, 40).toUpperCase() || null, case_no: str(b.case_no, 60), party_name: str(b.party_name, 160),
    court: str(b.court, 60), ps_name: str(b.ps_name, 80), stage: str(b.stage, 80), notes: str(b.notes, 1000), client_ref: isId(b.client_ref) ? b.client_ref : null };
  if (!row.case_no && !row.cnr) return s.status(400).json({ error: 'Case no ya CNR zaroori hai' });
  if (b.next_date) { if (!isDate(b.next_date)) return s.status(400).json({ error: 'Date galat hai' }); row.next_date = b.next_date; }
  for (const [k, role] of [['assigned_to', 'junior'], ['client_user_id', 'client']])
    if (b[k]) { if (!isId(b[k]) || !(await inChamber(b[k], ch, role))) return s.status(400).json({ error: 'Junior/Client galat hai' }); row[k] = b[k]; }
  const { data, error } = await db.from('cases').upsert(row, { onConflict: 'chamber_id,client_ref', ignoreDuplicates: true }).select(CF).maybeSingle();
  if (error) return s.status(error.code === '23505' ? 409 : 500).json({ error: error.code === '23505' ? 'Ye CNR is chamber mein pehle se hai' : 'Case save nahi hua' });
  s.json(data || { ok: 1, dup: true });
}));
app.patch('/api/cases/:id/next-date', auth, need('senior', 'munshi', 'junior'), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  if (!isDate(q.body.next_date)) return s.status(400).json({ error: 'Date galat hai' });
  const upd = { next_date: q.body.next_date }; if (typeof q.body.stage === 'string') upd.stage = str(q.body.stage, 80);
  ok(await db.from('cases').update(upd).eq('id', c.id).eq('chamber_id', c.chamber_id));
  ok(await db.from('hearing_log').insert({ chamber_id: c.chamber_id, case_id: c.id, old_date: c.next_date, new_date: q.body.next_date, changed_by: q.user.id }));
  s.json({ ok: 1 });
}));
app.patch('/api/cases/:id', auth, need('senior'), wrap(async (q, s) => {
  const c = await getCase(q, q.params.id); if (!c) return s.status(404).json({ error: 'Case nahi mila' });
  const b = q.body, u = {};
  for (const [k, m] of [['case_no', 60], ['party_name', 160], ['court', 60], ['ps_name', 80], ['stage', 80], ['notes', 1000]]) if (typeof b[k] === 'string') u[k] = str(b[k], m);
  if (['pending', 'disposed'].includes(b.status)) u.status = b.status;
  for (const [k, role] of [['assigned_to', 'junior'], ['client_user_id', 'client']]) {
    if (b[k] === null) u[k] = null;
    else if (b[k]) { if (!isId(b[k]) || !(await inChamber(b[k], c.chamber_id, role))) return s.status(400).json({ error: 'User galat hai' }); u[k] = b[k]; }
  }
  if (!Object.keys(u).length) return s.status(400).json({ error: 'Kuch badla nahi' });
  ok(await db.from('cases').update(u).eq('id', c.id).eq('chamber_id', c.chamber_id));
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
