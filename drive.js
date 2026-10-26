// Court Connect — Google Drive (har user apni Drive jodta hai). Server-side only; PAGES list mein NAHI.
// OAuth 2.0 authorization code flow, scope sirf drive.file (app sirf apni banayi files dekh sakta hai).
// Refresh token AES-256-GCM se encrypt hokar drive_tokens table mein; access token sirf memory mein.
const crypto = require('crypto');

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER = 'application/vnd.google-apps.folder';
const ROOT_NAME = 'Court Connect';

function makeDrive(db, env = process.env) {
  const { GOOGLE_CLIENT_ID: cid, GOOGLE_CLIENT_SECRET: secret, GOOGLE_REDIRECT_URI: redirect, DRIVE_TOKEN_KEY: tkey } = env;
  const enabled = !!(cid && secret && redirect && tkey && tkey.length >= 32);
  if (!enabled) return { enabled: false };
  const key = crypto.createHash('sha256').update('mcc-drive-enc|' + tkey).digest();      // 32 byte AES key
  const skey = crypto.createHash('sha256').update('mcc-drive-state|' + tkey).digest();   // state HMAC key (alag)
  const cache = new Map();   // user_id -> { tok, exp }

  const encrypt = plain => {
    const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
  };
  const decrypt = s => {
    const [v, iv, tag, ct] = String(s).split(':'); if (v !== 'v1') throw new Error('bad token format');
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64')); d.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([d.update(Buffer.from(ct, 'base64')), d.final()]).toString('utf8');
  };

  // state = base64url(json{u,n,e}).hmac — user se bandha, 10 minute, aur nonce cookie se milana zaroori (CSRF)
  const b64u = b => Buffer.from(b).toString('base64url');
  function makeState(uid) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const body = b64u(JSON.stringify({ u: uid, n: nonce, e: Date.now() + 10 * 60 * 1000 }));
    return { state: body + '.' + crypto.createHmac('sha256', skey).update(body).digest('base64url'), nonce };
  }
  function readState(state, nonce) {
    if (typeof state !== 'string' || state.length > 600) return null;
    const [body, sig] = state.split('.'); if (!body || !sig) return null;
    const want = crypto.createHmac('sha256', skey).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(want);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
    if (!p || typeof p.u !== 'string' || !(p.e > Date.now())) return null;
    const x = Buffer.from(String(nonce || '')), y = Buffer.from(String(p.n));
    if (x.length !== y.length || !crypto.timingSafeEqual(x, y)) return null;
    return p.u;
  }
  const authUrl = state => AUTH_URL + '?' + new URLSearchParams({ client_id: cid, redirect_uri: redirect, response_type: 'code', scope: SCOPE,
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'false', state }).toString();

  const form = o => ({ method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(o).toString() });
  async function exchange(code) {      // code -> { refresh_token, access_token, expires_in }
    const r = await globalThis.fetch(TOKEN_URL, form({ code, client_id: cid, client_secret: secret, redirect_uri: redirect, grant_type: 'authorization_code' }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.refresh_token || !j.access_token) throw new Error('Google token exchange fail: ' + r.status);
    return j;
  }
  async function aboutEmail(tok) {
    const r = await globalThis.fetch(API + '/about?fields=user(emailAddress)', { headers: { Authorization: 'Bearer ' + tok } });
    const j = await r.json().catch(() => ({}));
    return (j.user && j.user.emailAddress) || '';
  }
  async function connect(user, code) {
    const j = await exchange(code), email = String(await aboutEmail(j.access_token)).slice(0, 200);
    const row = { user_id: user.id, chamber_id: user.chamber_id, enc_refresh: encrypt(j.refresh_token), email, created_at: new Date().toISOString() };
    const { error } = await db.from('drive_tokens').upsert(row, { onConflict: 'user_id' }); if (error) throw error;
    cache.set(user.id, { tok: j.access_token, exp: Date.now() + (Math.max(60, +j.expires_in || 3600) - 60) * 1000 });
    return email;
  }
  async function tokenRow(uid, ch) {
    const { data } = await db.from('drive_tokens').select('user_id,chamber_id,enc_refresh,email').eq('user_id', uid).eq('chamber_id', ch).maybeSingle();
    return data || null;
  }
  async function status(user) { const r = await tokenRow(user.id, user.chamber_id); return r ? { connected: true, email: r.email || '' } : { connected: false }; }
  async function access(uid, ch) {      // uploader ka access token (refresh se), na ho to null
    const c = cache.get(uid); if (c && c.exp > Date.now()) return c.tok;
    const row = await tokenRow(uid, ch); if (!row) return null;
    const r = await globalThis.fetch(TOKEN_URL, form({ client_id: cid, client_secret: secret, refresh_token: decrypt(row.enc_refresh), grant_type: 'refresh_token' }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.access_token) {
      // invalid_grant = token khatam/revoke (jaise Testing mode mein 7 din baad): row hata do taaki app "Google Drive jodein" phir dikhaye
      if (j.error === 'invalid_grant') await db.from('drive_tokens').delete().eq('user_id', uid).eq('chamber_id', ch);
      throw new Error('Drive refresh fail: ' + r.status + ' ' + (j.error || ''));
    }
    cache.set(uid, { tok: j.access_token, exp: Date.now() + (Math.max(60, +j.expires_in || 3600) - 60) * 1000 });
    return j.access_token;
  }
  async function disconnect(user) {
    const row = await tokenRow(user.id, user.chamber_id); cache.delete(user.id);
    if (row) {
      try { await globalThis.fetch(REVOKE_URL, form({ token: decrypt(row.enc_refresh) })); } catch (e) { console.error('Drive revoke fail', e.message); }
      const { error } = await db.from('drive_tokens').delete().eq('user_id', user.id).eq('chamber_id', user.chamber_id); if (error) throw error;
    }
  }

  // ---- Drive v3 REST ----
  const qs = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  async function gj(tok, url, opt = {}) {
    const r = await globalThis.fetch(url, { ...opt, headers: { Authorization: 'Bearer ' + tok, ...(opt.headers || {}) } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error('Drive API fail: ' + r.status);
    return j;
  }
  async function folder(tok, name, parent) {   // parent ke andar is naam ka folder dhoondo, na mile to banao
    const q = `name='${qs(name)}' and mimeType='${FOLDER}' and trashed=false and '${qs(parent)}' in parents`;
    const l = await gj(tok, API + '/files?' + new URLSearchParams({ q, fields: 'files(id)', pageSize: '1', spaces: 'drive' }));
    if (l.files && l.files[0]) return l.files[0].id;
    const c = await gj(tok, API + '/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: FOLDER, parents: [parent] }) });
    return c.id;
  }
  const cleanName = s => String(s || '').replace(/[\\/\u0000-\u001f<>:"|?*]/g, '_').trim().slice(0, 100);
  // file uploader ki Drive mein "Court Connect/<case_no ya party>" folder mein. { id, webViewLink } lautata hai
  async function upload(user, caseLabel, name, buf, mime) {
    const tok = await access(user.id, user.chamber_id); if (!tok) return null;
    const root = await folder(tok, ROOT_NAME, 'root');
    const sub = await folder(tok, cleanName(caseLabel) || 'Case', root);
    const meta = { name, parents: [sub], mimeType: mime };
    if (buf.length > 5 * 1024 * 1024) {            // Google: multipart sirf 5 MB tak; badi file resumable se (2 request)
      const s = await globalThis.fetch(UPLOAD + '?uploadType=resumable&fields=id,webViewLink', { method: 'POST',
        headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime, 'X-Upload-Content-Length': String(buf.length) }, body: JSON.stringify(meta) });
      const loc = s.ok && s.headers.get('location');
      if (!loc || !loc.startsWith('https://www.googleapis.com/')) throw new Error('Drive resumable start fail: ' + s.status);
      const f = await gj(tok, loc, { method: 'PUT', headers: { 'Content-Type': mime }, body: buf });
      if (!f.id) throw new Error('Drive upload: id nahi mila');
      return { id: f.id, webViewLink: f.webViewLink || '' };
    }
    const bnd = 'mcc' + crypto.randomBytes(12).toString('hex');
    const body = Buffer.concat([
      Buffer.from(`--${bnd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${bnd}\r\nContent-Type: ${mime}\r\n\r\n`),
      buf, Buffer.from(`\r\n--${bnd}--`)]);
    const f = await gj(tok, UPLOAD + '?uploadType=multipart&fields=id,webViewLink', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${bnd}` }, body });
    if (!f.id) throw new Error('Drive upload: id nahi mila');
    return { id: f.id, webViewLink: f.webViewLink || '' };
  }
  async function fetchFile(uid, ch, fileId) {     // uploader ke token se file ke bytes (null = token nahi / file nahi)
    let tok; try { tok = await access(uid, ch); } catch (e) { console.error(e.message); return null; }
    if (!tok) return null;
    const r = await globalThis.fetch(`${API}/files/${encodeURIComponent(fileId)}?alt=media`, { headers: { Authorization: 'Bearer ' + tok } });
    if (!r.ok) { console.error('Drive download fail', r.status); return null; }
    return Buffer.from(await r.arrayBuffer());
  }
  async function remove(uid, ch, fileId) {        // best effort: token na ho to sirf row hategi
    const tok = await access(uid, ch); if (!tok) return false;
    const r = await globalThis.fetch(`${API}/files/${encodeURIComponent(fileId)}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + tok } });
    if (!r.ok && r.status !== 404) throw new Error('Drive delete fail: ' + r.status);
    return true;
  }
  return { enabled: true, makeState, readState, authUrl, connect, status, disconnect, upload, fetchFile, remove, _enc: { encrypt, decrypt } };
}
module.exports = { makeDrive, SCOPE };
