# Malda Court Connect v3

Case diary, next date, fees ledger aur backup. Laptop aur mobile dono par chalta hai. Net na ho to entry phone mein save hoti hai aur net aate hi sync hoti hai.

## Files (sab ek hi jagah, koi folder nahi)
```
server.js  package.json  supabase.sql  .env.example  .gitignore  README.md
index.html  app.js  app.css  sw.js  setup.html  setup.js
```

## 1. Supabase
1. supabase.com mein naya project banayein.
2. SQL Editor mein `supabase.sql` paste karke Run karein.
3. Project Settings > API se **Project URL** aur **service_role key** copy karein. Ye key SECRET hai. Sirf Render ya apni `.env` mein rakhein, kabhi GitHub par nahi.

## 2. Laptop par test
```
copy .env.example .env      (Windows)   |   cp .env.example .env
npm install
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   <- ye JWT_SECRET ke liye
```
`.env` mein URL, service key, JWT_SECRET aur SETUP_KEY (16+ akshar, aapki apni) bharein. Phir `npm start` aur browser mein http://localhost:10000

## 3. Naya chamber aur senior vakil banana (sirf aap kar sakte hain)
Browser mein `/setup.html` kholein (jaise https://aapka-app.onrender.com/setup.html), form bharein aur apni SETUP_KEY daalein. Har naye customer vakil ke liye yahi page dobara use karein. Phir vakil khud Team tab se junior, munshi aur client ke login banayega.

## 4. GitHub aur Render
1. Folder GitHub par push karein (`.env` apne aap ignore hoti hai).
2. Render: New Web Service, repo chunein. Build `npm install`, Start `npm start`.
3. Environment mein 4 cheezein daalein: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `SETUP_KEY`.
4. Live link ke `/setup.html` se pehla chamber banayein.

## Dhyan rakhein
- Free Render kuch der idle rehne par sust ho jata hai. Free Supabase 7 din inactive rehne par pause ho jata hai. Paying vakilon ke liye paid plan lein.
- Backup tab se har hafte Excel/JSON download karwayein.
- Sab data sirf apne chamber ka dikhta hai: junior ko sirf assigned cases, client ko sirf apne cases.

## Update 1 (v3d): naye features
Pehle Supabase SQL Editor mein `update-1.sql` ek baar Run karein, phir saari files GitHub par dobara upload karein.
Naya: WhatsApp reminder, case edit, Excel/CSV import, Kaam (tasks), Calendar, password reset (Team tab), Install App button.
Software support: 7602292599
