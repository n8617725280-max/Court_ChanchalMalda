// Court Connect — document storage (server-side only; ye file PAGES list mein NAHI hai)
// Do backend: 'supabase' (default, private bucket) aur 'r2' (Cloudflare R2, S3-compatible API).
// Har document row mein uska backend likha hota hai, isliye backend badalne ke baad bhi purani files khulti hain.
// R2 ke liye AWS Signature V4 yahin Node crypto se bana hai (koi naya npm package nahi).
const crypto = require('crypto');

const BUCKET = 'case-docs', MAXDOC = 10 * 1024 * 1024;
const LIMITS = { supabase: 1024 * 1024 * 1024, r2: 10 * 1024 * 1024 * 1024 };   // free plan: Supabase 1 GB, R2 10 GB
const MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

// ---------- AWS SigV4 (S3) ----------
const sha256 = d => crypto.createHash('sha256').update(d).digest('hex');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
// RFC 3986 encoding jaisa AWS chahta hai
const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
const encPath = p => p.split('/').map(enc).join('/');
const amzDate = d => d.toISOString().replace(/[:-]|\.\d{3}/g, '');          // 20130524T000000Z
function signingKey(secret, date8, region, service) {
  return hmac(hmac(hmac(hmac('AWS4' + secret, date8), region), service), 'aws4_request');
}
const canonQuery = q => Object.keys(q).sort().map(k => enc(k) + '=' + enc(String(q[k]))).join('&');
// Header-based signing. headers: lowercase naam -> value (host shamil hona chahiye). Authorization header lautata hai.
function signHeaders({ method, path, query = {}, headers, payloadHash, accessKey, secretKey, region, service = 's3', date }) {
  const t = amzDate(date), d8 = t.slice(0, 8);
  const h = { ...headers, 'x-amz-date': t, 'x-amz-content-sha256': payloadHash };
  const names = Object.keys(h).map(k => k.toLowerCase()).sort();
  const lower = Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), String(v).trim().replace(/\s+/g, ' ')]));
  const signed = names.join(';');
  const creq = [method, encPath(path), canonQuery(query), names.map(n => n + ':' + lower[n]).join('\n') + '\n', signed, payloadHash].join('\n');
  const scope = `${d8}/${region}/${service}/aws4_request`;
  const sts = ['AWS4-HMAC-SHA256', t, scope, sha256(creq)].join('\n');
  const sig = hmac(signingKey(secretKey, d8, region, service), sts).toString('hex');
  return { headers: { ...h, authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signed}, Signature=${sig}` }, signature: sig, canonical: creq };
}
// Query-string (presigned) URL, sirf host header signed, UNSIGNED-PAYLOAD
function presign({ method = 'GET', host, path, query = {}, accessKey, secretKey, region, service = 's3', date, expires = 60 }) {
  const t = amzDate(date), d8 = t.slice(0, 8), scope = `${d8}/${region}/${service}/aws4_request`;
  const q = { ...query, 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256', 'X-Amz-Credential': `${accessKey}/${scope}`, 'X-Amz-Date': t, 'X-Amz-Expires': String(expires), 'X-Amz-SignedHeaders': 'host' };
  const creq = [method, encPath(path), canonQuery(q), `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const sts = ['AWS4-HMAC-SHA256', t, scope, sha256(creq)].join('\n');
  const sig = hmac(signingKey(secretKey, d8, region, service), sts).toString('hex');
  return { url: `https://${host}${encPath(path)}?${canonQuery(q)}&X-Amz-Signature=${sig}`, signature: sig };
}
const disposition = name => `attachment; filename*=UTF-8''${enc(name || 'document')}`;

// ---------- backends ----------
function supabaseBackend(db) {
  return {
    name: 'supabase',
    async ensure() {           // bucket na ho to bana do (hamesha private)
      try {
        const { data, error } = await db.storage.getBucket(BUCKET);
        if (error || !data) {
          const r = await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAXDOC, allowedMimeTypes: MIMES });
          if (r.error) console.error('Storage bucket nahi bana:', r.error.message); else console.log('Storage bucket bana: ' + BUCKET);
        } else if (data.public) {
          await db.storage.updateBucket(BUCKET, { public: false, fileSizeLimit: MAXDOC, allowedMimeTypes: MIMES });
          console.log('Storage bucket ko private kiya: ' + BUCKET);
        }
      } catch (e) { console.error('Storage check fail:', e.message); }
    },
    async put(path, buf, mime) { const r = await db.storage.from(BUCKET).upload(path, buf, { contentType: mime, upsert: false }); if (r.error) throw r.error; },
    async del(path) { const r = await db.storage.from(BUCKET).remove([path]); if (r.error) throw r.error; },
    async url(path, name) { const r = await db.storage.from(BUCKET).createSignedUrl(path, 60, { download: name }); if (r.error) throw r.error; return r.data.signedUrl; }
  };
}
function r2Backend(env) {
  const { R2_ACCOUNT_ID: acct, R2_ACCESS_KEY_ID: accessKey, R2_SECRET_ACCESS_KEY: secretKey, R2_BUCKET: bucket } = env;
  const host = `${acct}.r2.cloudflarestorage.com`, region = 'auto';
  const key = p => `/${bucket}/${p}`;                     // path-style: /<bucket>/<chamber>/<case>/<uuid>.ext
  async function call(method, path, body, extra = {}) {
    const payloadHash = body ? sha256(body) : sha256('');
    const { headers } = signHeaders({ method, path: key(path), headers: { host, ...extra }, payloadHash, accessKey, secretKey, region, date: new Date() });
    delete headers.host;                                   // fetch khud host lagata hai
    const r = await globalThis.fetch(`https://${host}${encPath(key(path))}`, { method, headers, body });
    if (!r.ok && !(method === 'DELETE' && r.status === 404)) throw new Error(`R2 ${method} fail: ${r.status}`);
    return r;
  }
  return {
    name: 'r2',
    async ensure() {},
    async put(path, buf, mime) { await call('PUT', path, buf, { 'content-type': mime }); },   // content-length fetch khud lagata hai
    async del(path) { await call('DELETE', path); },
    async url(path, name) {
      return presign({ host, path: key(path), query: { 'response-content-disposition': disposition(name) }, accessKey, secretKey, region, date: new Date(), expires: 60 }).url;
    }
  };
}
const r2Ready = env => !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);

// current = naye uploads kahan jayenge; get(name) = purani row ke backend se file kholna
function makeStorage(db, env = process.env) {
  const want = String(env.STORAGE || 'supabase').toLowerCase();
  if (want === 'r2' && !r2Ready(env)) throw new Error('STORAGE=r2 ke liye R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET zaroori hain');
  if (!['supabase', 'r2'].includes(want)) throw new Error('STORAGE sirf supabase ya r2 ho sakta hai');
  const B = { supabase: supabaseBackend(db) };
  if (r2Ready(env)) B.r2 = r2Backend(env);
  return {
    current: B[want], limit: LIMITS[want],
    get: name => B[name || 'supabase'] || null      // purani rows (backend null) = supabase
  };
}

module.exports = { makeStorage, MAXDOC, LIMITS, BUCKET, sigv4: { signHeaders, presign, signingKey, sha256, enc } };
