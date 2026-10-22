function wire(formId, outId, url, okMsg) {
  document.querySelector(formId).addEventListener('submit', async e => {
    e.preventDefault();
    const o = document.querySelector(outId), d = Object.fromEntries(new FormData(e.target)), key = d.key; delete d.key;
    o.style.color = ''; o.textContent = 'Ho raha hai... pehli baar 30-60 second lag sakte hain.';
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-setup-key': key }, body: JSON.stringify(d) });
      const j = await r.json().catch(() => ({}));
      o.style.color = r.ok ? '#0E7A5B' : '#C73E2C';
      o.textContent = r.ok ? okMsg : (j.error === 'Not allowed' ? 'Setup key galat hai.' : (j.error || 'Error aaya'));
      if (r.ok) e.target.reset();
    } catch { o.style.color = '#C73E2C'; o.textContent = 'Server se connect nahi hua. Net check karein.'; }
  });
}
wire('#f', '#out', '/api/setup', 'Ban gaya! Ab login page par jaakar isi email aur password se login karein.');
wire('#r', '#out2', '/api/reset-password', 'Password badal gaya. Ab naye password se login karein.');
