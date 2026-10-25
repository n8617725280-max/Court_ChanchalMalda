# Malda Court Connect v5

Case diary, next date, fees ledger aur backup. Laptop aur mobile dono par chalta hai. Net na ho to entry phone mein save hoti hai aur net aate hi sync hoti hai.

## Files (sab ek hi jagah; sirf backup.yml `.github/workflows/` folder mein)
```
server.js  package.json  supabase.sql  update-3.sql  .env.example  .gitignore  README.md  BACKUP.md
index.html  app.js  app.css  sw.js  qr.js  law-sections.json  manifest.json  icon-192.png  icon-512.png
setup.html  setup.js  owner.html  owner.js
.github/workflows/backup.yml
```
(Purani `update-1.sql` / `update-2.sql` agar repo mein hain to rehne dein, koi nuksaan nahi.)

## 1. Supabase
1. supabase.com mein naya project banayein.
2. SQL Editor mein `supabase.sql` paste karke Run karein (naye project ke liye ye poora schema hai, v5 sahit).
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

## Update 2 (v3f): Owner Panel
Pehle Supabase SQL Editor mein `update-2.sql` Run karein, phir saari files upload karein.
Owner Panel: /owner.html (Setup key se khulta hai). Chamber banana/band karna, kisi bhi chamber mein user banana (ek saath bahut bhi), password/naam/email/mobile badalna.

## Version 5: kya naya hai
1. **Dashboard** (naya pehla tab): aaj ki hearing, nikli hui date (laal), agle 7 din, khule kaam, kul baaki fees, haal mein badli dates, documents ki jagah (Free plan 1 GB). Jaldi kaam ke button.
2. **Clients tab**: har muvakkil ka profile (naam, mobile, pita/pati ka naam, pata, note), uske saare cases, kul baaki fees, Call aur WhatsApp button. Naya case jodte waqt client ka naam likhte hi list aati hai; naya naam ho to client apne aap ban jata hai. Purane cases (party name, mobile) waise hi chalte hain.
3. **Document vault**: har case mein PDF/JPG/PNG (10 MB tak) upload. File private Supabase Storage bucket `case-docs` mein jati hai; download 60 second ke link se, wo bhi permission check ke baad. Hataana sirf senior. Client login apne case ke documents dekh sakta hai.
4. **Drafting**: Vakalatnama, Affidavit (English + Bangla), Legal notice, Bail arzi BNSS 480 (English + Bangla), Agrim zamaanat BNSS 482, Time/adjournment petition, Hazira. Case aur client ki jaankari apne aap bhar jati hai, text badal kar Save aur Print/PDF (A4). Har draft par likha hai: "Draft — advocate must review before filing."
5. **BNS khoj**: 302 ya "murder" ya 103 likhein, IPC/CrPC/Evidence Act ka naya BNS/BNSS/BSA section dikhega (NCRB ki official table se). "Case mein jodein" se section case mein jud jata hai. Hamesha India Code par milaayein.
6. **UPI**: Team tab > Chamber settings mein apni UPI ID daalein. Fees dialog aur case page par baaki rakam ka QR code aur "UPI se payment" button, WhatsApp par UPI link bhejne ka button. Receipt par bhi baaki rakam ka QR.
7. **Notes**: judgment citation, precedent, munshi ke sandesh. Tag aur khoj. "Private" note sirf senior dekhta hai.
8. **Criminal jaankari**: case type Criminal chunne par FIR no/date, dhaara, bail ki sthiti, chargesheet date, shikaayatkarta (IP), jaanch adhikari (IO).

9. **Madad / Guide tab** (har role ko, sirf uske kaam ke card): har feature ka ek card, 2-4 step "Kaise karein", aur "Kholein" button jo seedha us tab par le jata hai. Upar "Kya naya hai (v5)", senior ke liye "Shuru kaise karein" checklist (apne aap ✓ lagta hai), neeche support: SK Nuruddin, Call/WhatsApp 7602292599.
10. **Swagat popup**: har user ko pehli baar login par ek chhota swagat sandesh (5-6 fayde) aur "Guide dekhein" / "Shuru karein". Madad tab se dobara khul sakta hai.
11. **Hint line**: har tab ke upar ek line ki samjhaish. "?" se Madad ka wahi card khulta hai, "×" se chhupa sakte hain (isi phone par yaad rehta hai; Madad tab se wapas la sakte hain).
12. **4 bhasha**: English, বাংলা, हिन्दी (Devanagari), Hinglish. Pehli baar phone ki bhasha dekhta hai: Bangla phone par বাংলা, Hindi phone par हिन्दी, baaki sab par বাংলা. Chuni hui bhasha phone mein yaad rehti hai. Login page par sabse upar globe wala "Bhasha / Language" dabba. (Draft ka kanooni text English/Bangla hi rehta hai; BNS khoj ka vivran English/Hinglish mein.)

## v5 kaise upload karein (purana app chal raha hai to yahi karein)
**Pehle Supabase, phir GitHub.** Ulta kiya to beech mein app error dega.

1. **Supabase SQL Editor mein `update-3.sql` Run karein**
   - supabase.com > apna project > SQL Editor > New query.
   - `update-3.sql` ka poora text paste karke **Run**. "Success. No rows returned" aaye to sahi.
   - Ye sirf naye column aur table jodta hai (clients, documents, drafts, notes) aur private bucket `case-docs` banata hai. Koi purana data delete ya change nahi hota. Dobara chalana bhi safe hai.
   - Storage > Buckets mein `case-docs` dikhega, uske aage "Public" NAHI likha hona chahiye.
2. **GitHub par files upload/replace karein**
   - Repo kholein > **Add file > Upload files** > is zip ki saari files (folder ke andar wali) ek saath drag karein > **Commit changes**. Same naam wali files replace ho jayengi.
   - Naye: `update-3.sql`, `qr.js`, `law-sections.json`. Badle: `server.js`, `app.js`, `app.css`, `index.html`, `sw.js`, `package.json`, `supabase.sql`, `README.md`, `icon-192.png`, `icon-512.png` (ab asli PNG).
   - **v5 pehle hi upload kar chuke hain? (Madad/Guide + हिन्दी wala update)**: sirf ye 4 files dobara upload karein: `app.js`, `app.css`, `index.html`, `sw.js` (aur chahein to `README.md`). SQL ya Render mein kuch nahi karna. Upload ke baad app ek baar refresh karein.
   - `.github/workflows/backup.yml` pehle se hai to chhod dein; nahi hai to BACKUP.md dekhein.
   - `.env` ya koi password wali file kabhi upload na karein.
3. **Render apne aap deploy karega**
   - GitHub commit ke baad Render khud naya version banata hai (2-5 minute). Render dashboard > Logs mein "Malda Court Connect v5 chalu hai" dikhe to ho gaya.
   - Agar auto-deploy band hai: Render > service > **Manual Deploy > Deploy latest commit**.
   - Koi naya environment variable nahi chahiye; purane 4 hi kaafi hain.
4. **Test karein**
   - App kholein, ek baar page refresh karein (purana cache hatane ke liye; mobile app band karke dobara kholein).
   - Senior se login > Dashboard aur "Malda Court Connect mein swagat" popup dikhe (sirf pehli baar). Madad / Guide tab khulna chahiye.
   - Team > Chamber settings: vakil ka naam aur UPI ID save karein.
   - Clients > naya client; Cases > naya case (Criminal chunein, FIR bharein).
   - Case > Kholein > ek chhoti PDF upload, phir Download.
   - Drafts > Bail arzi > Print / PDF.
   - BNS khoj mein 302 likhein > BNS 103(1) aaye.
   - Fees > baaki rakam par QR dikhe, UPI app se scan karke (₹1 test) check karein.
   - Koi error aaye to Render Logs ka screenshot lein aur support: 7602292599.

Dhyan dein: Supabase free plan mein 1 GB file storage hai. Dashboard par "Documents ki jagah" dekhte rahein. Badi photo ki jagah PDF scan (kam MB) behtar hai.
