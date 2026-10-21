document.querySelector('#f').addEventListener('submit', async e => {
  e.preventDefault();
  const o = document.querySelector('#out'), d = Object.fromEntries(new FormData(e.target)), key = d.key; delete d.key;
  o.style.color = ''; o.textContent = 'Ban raha hai... pehli baar 30-60 second lag sakte hain.';
  try {
    const r = await fetch('/api/setup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-setup-key': key }, body: JSON.stringify(d) });
    const j = await r.json().catch(() => ({}));
    o.style.color = r.ok ? '#2F6B4F' : '#8C2F39';
    o.textContent = r.ok ? 'Ban gaya! Ab login page par jaakar isi email aur password se login karein.' : (j.error === 'Not allowed' ? 'Setup key galat hai.' : (j.error || 'Error aaya'));
    if (r.ok) e.target.reset();
  } catch { o.style.color = '#8C2F39'; o.textContent = 'Server se connect nahi hua. Net check karein.'; }
});
