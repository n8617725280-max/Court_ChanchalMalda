// eCourtsIndia (webapi.ecourtsindia.com) — CNR se live case status. Sirf server par chalta hai (PAGES list mein nahi).
// ECOURTSINDIA_KEY na ho to enabled = false aur poora feature chhupa rehta hai. Key kabhi response, header ya log mein nahi jaati.
const BASE = 'https://webapi.ecourtsindia.com';
const CNR_RE = /^[A-Z0-9]{16}$/;
const CACHE_MS = 12 * 60 * 60 * 1000;        // 12 ghante tak dobara API call nahi (paisa bachta hai)

// stable error codes -> HTTP status + Hinglish sandesh (app inhe 4 bhasha mein dikhata hai)
const ERR = {
  off: [404, 'Live status abhi band hai'],
  no_key: [503, 'eCourtsIndia key galat ya maujood nahi (Render mein ECOURTSINDIA_KEY dekhein)'],
  no_credit: [402, 'eCourtsIndia mein credit khatam ho gaya. Recharge karein'],
  bad_cnr: [400, 'CNR galat hai (16 akshar, jaise WBMD030004122026)'],
  not_found: [404, 'Is CNR ka case eCourtsIndia par nahi mila'],
  rate_limit: [429, 'eCourtsIndia abhi busy hai, thodi der baad try karein'],
  daily_limit: [429, 'Aaj ki live status seema poori ho gayi. Kal try karein'],
  timeout: [504, 'eCourtsIndia se jawab nahi aaya, dobara try karein'],
  upstream: [502, 'eCourtsIndia se data nahi mila, baad mein try karein']
};
class EcErr extends Error { constructor(code) { super(code); this.code = code; } }

const s = (v, m = 200) => (typeof v === 'string' || typeof v === 'number') ? String(v).trim().slice(0, m) : '';
const arr = v => Array.isArray(v) ? v : [];
const first = (...v) => v.find(x => x !== undefined && x !== null && x !== '');
const firstArr = (...v) => v.find(x => Array.isArray(x) && x.length) || [];
// koi bhi date format -> YYYY-MM-DD (samajh na aaye to '')
function day(v) {
  if (typeof v !== 'string' && typeof v !== 'number') return '';
  const t = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(t); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  const d = new Date(t); return isNaN(d) ? '' : d.toISOString().slice(0, 10);
}
const who = v => typeof v === 'string' ? s(v, 160) : v && typeof v === 'object' ? s(first(v.name, v.partyName, v.petitionerName, v.respondentName, v.judgeName, ''), 160) : '';
const names = v => arr(v).map(who).filter(Boolean).slice(0, 6);
const desc = (a, k) => a.sort((x, y) => (y[k] || '').localeCompare(x[k] || ''));

// API ke bade jawab se sirf kaam ki cheezein (DB mein chhota snapshot)
function trim(j) {
  const d = (j && typeof j === 'object' && j.data && typeof j.data === 'object') ? j.data : (j || {});
  const c = (d.courtCaseData && typeof d.courtCaseData === 'object') ? d.courtCaseData : d;
  const hs = firstArr(c.hearings, c.hearingHistory, c.history, c.caseHistory, d.hearings, d.hearingHistory, d.history, d.caseHistory)
    .filter(h => h && typeof h === 'object')
    .map(h => ({ date: day(first(h.hearingDate, h.businessOnDate, h.business_on_date, h.date, h.hearing_date, '')), purpose: s(first(h.purpose, h.purposeOfHearing, h.purposeOfListing, h.stage, h.businessDetails, ''), 160),
      judge: s(first(h.judge, h.judgeName, ''), 120), next: day(first(h.nextDate, h.nextHearingDate, '')) }))
    .filter(h => h.date || h.purpose);
  const os = arr(first(c.judgmentOrders, c.orders, d.judgmentOrders, d.orders)).filter(o => o && typeof o === 'object')
    .map(o => ({ date: day(first(o.orderDate, o.date, '')), type: s(first(o.orderType, o.type, o.title, 'Order'), 120) }));
  const nd = day(first(c.nextHearingDate, d.nextHearingDate, c.nextDate, d.nextDate, c.next_hearing_date, d.next_hearing_date, (hs.find(h => h.next) || {}).next, ''));
  return {
    cnr: s(c.cnr, 20), case_type: s(c.caseType, 120), status: s(first(c.caseStatus, c.status, ''), 80), court: s(c.courtName, 200), district: s(c.district, 80), state: s(c.state, 80),
    filing_no: s(c.filingNumber, 60), reg_no: s(c.registrationNumber, 60), decision_date: day(first(c.decisionDate, '')), disposal: s(c.disposalType, 120),
    judges: names(first(c.judges, c.judge && [c.judge])), petitioners: names(c.petitioners), respondents: names(c.respondents),
    next_date: nd, hearings: desc(hs, 'date').slice(0, 5), orders: desc(os, 'date').slice(0, 30), order_count: Number(c.orderCount) || os.length,
    modified: s(first(d.entityInfo && d.entityInfo.dateModified, j && j.entityInfo && j.entityInfo.dateModified, ''), 40)
  };
}

function makeEcourts(db, env = process.env) {
  const key = String(env.ECOURTSINDIA_KEY || '').trim();
  const limit = Math.max(1, Math.min(10000, parseInt(env.ECOURTS_DAILY_LIMIT, 10) || 30));
  const enabled = key.length > 0;
  const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);   // din IST ke hisaab se

  async function used(ch) {
    const { data } = await db.from('ecourts_usage').select('count').eq('chamber_id', ch).eq('day', today()).maybeSingle();
    return (data && data.count) || 0;
  }
  async function bump(ch) {               // sirf asli API call par ginti
    const n = await used(ch);
    const { error } = await db.from('ecourts_usage').upsert({ chamber_id: ch, day: today(), count: n + 1 }, { onConflict: 'chamber_id,day' });
    if (error) throw error;
  }
  async function call(ch, method, path) {
    await bump(ch);
    let r;
    try { r = await fetch(BASE + path, { method, headers: { Authorization: 'Bearer ' + key, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }); }
    catch (e) { throw new EcErr(e && (e.name === 'TimeoutError' || e.name === 'AbortError') ? 'timeout' : 'upstream'); }
    let j = null; try { j = await r.json(); } catch { /* khaali jawab */ }
    if (r.ok) return j;
    const st = r.status, code = String((j && (first(j.error && j.error.code, j.code, j.errorCode, j.error))) || '').toUpperCase();
    if (st === 401 || st === 403 || code === 'INVALID_TOKEN') throw new EcErr('no_key');
    if (st === 402 || code === 'INSUFFICIENT_CREDITS') throw new EcErr('no_credit');
    if (st === 400 || code === 'INVALID_CNR') throw new EcErr('bad_cnr');
    if (st === 404 || code === 'CASE_NOT_FOUND') throw new EcErr('not_found');
    if (st === 429) throw new EcErr('rate_limit');
    throw new EcErr('upstream');
  }
  const cleanCnr = v => String(v || '').toUpperCase().replace(/[\s-]/g, '').trim();

  // c = getCase() ka case (chamber/junior/client check ho chuka), u = user
  async function status(c, u, force) {
    const cnr = cleanCnr(c.cnr);
    if (!CNR_RE.test(cnr)) throw new EcErr('bad_cnr');
    const { data: old } = await db.from('ecourts_cache').select('case_id,cnr,snapshot,fetched_at').eq('case_id', c.id).eq('chamber_id', c.chamber_id).maybeSingle();
    const out = (snap, fetched_at, extra) => ({ cnr, snapshot: snap, fetched_at, stored_next: c.next_date || null,
      differs: !!(snap && snap.next_date && snap.next_date !== (c.next_date || '')), ...extra });
    if (!force && old && old.cnr === cnr && Date.now() - Date.parse(old.fetched_at) < CACHE_MS) return out(old.snapshot, old.fetched_at, { cached: true });
    const n = await used(c.chamber_id);
    if (n + (force ? 2 : 1) > limit) throw new EcErr('daily_limit');
    let queued = false;
    if (force) { await call(c.chamber_id, 'POST', `/api/partner/case/${cnr}/refresh`); queued = true; }
    const j = await call(c.chamber_id, 'GET', `/api/partner/case/${cnr}`);
    const snap = trim(j), fetched_at = new Date().toISOString();
    const { error } = await db.from('ecourts_cache').upsert({ case_id: c.id, chamber_id: c.chamber_id, cnr, snapshot: snap, fetched_at, fetched_by: u.id }, { onConflict: 'case_id' });
    if (error) throw error;
    return out(snap, fetched_at, { cached: false, queued });
  }
  return { enabled, limit, status };
}

module.exports = { makeEcourts, EcErr, ERR, trim, CNR_RE };
