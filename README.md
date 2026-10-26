# Court Connect v5

Case diary, next date, fees ledger aur backup. Laptop aur mobile dono par chalta hai. Net na ho to entry phone mein save hoti hai aur net aate hi sync hoti hai.

## Files (sab ek hi jagah; sirf backup.yml `.github/workflows/` folder mein)
```
server.js  storage.js  drive.js  package.json  supabase.sql  update-3.sql  update-4.sql  .env.example  .gitignore  README.md  BACKUP.md
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
   - GitHub commit ke baad Render khud naya version banata hai (2-5 minute). Render dashboard > Logs mein "Court Connect v5 chalu hai" dikhe to ho gaya.
   - Agar auto-deploy band hai: Render > service > **Manual Deploy > Deploy latest commit**.
   - Koi naya environment variable nahi chahiye; purane 4 hi kaafi hain.
4. **Test karein**
   - App kholein, ek baar page refresh karein (purana cache hatane ke liye; mobile app band karke dobara kholein).
   - Senior se login > Dashboard aur "Court Connect mein swagat" popup dikhe (sirf pehli baar). Madad / Guide tab khulna chahiye.
   - Team > Chamber settings: vakil ka naam aur UPI ID save karein.
   - Clients > naya client; Cases > naya case (Criminal chunein, FIR bharein).
   - Case > Kholein > ek chhoti PDF upload, phir Download.
   - Drafts > Bail arzi > Print / PDF.
   - BNS khoj mein 302 likhein > BNS 103(1) aaye.
   - Fees > baaki rakam par QR dikhe, UPI app se scan karke (₹1 test) check karein.
   - Koi error aaye to Render Logs ka screenshot lein aur support: 7602292599.

Dhyan dein: Supabase free plan mein 1 GB file storage hai. Dashboard par "Documents ki jagah" dekhte rahein. Badi photo ki jagah PDF scan (kam MB) behtar hai.


## Update 4 (v5.1): kam jagah, zyada vakil (100-200 advocates)
Naya kya hai:
1. **Photo apne aap chhoti**: upload se pehle phone/computer hi photo ko 1600px aur JPEG (quality 0.75) bana deta hai. 4 MB ki photo lagbhag 0.3-0.5 MB. PDF waise hi jaati hai. Upload ke baad "Photo chhoti ki: 1.7 MB → 358 KB" dikhta hai. Server limit 10 MB hi hai.
2. **Case > Documents mein bade button**: "📷 Photo/PDF daalein" (phone par camera ya file, dono), "🔗 Link chipkayein", aur (agar setup kiya hai) "Google Drive jodein (ek baar)". Judne ke baad "✓ Drive judi hai (email)".
3. **Link chipkayein**: Google Drive mein pehle se padi file ka link case mein jod dein. App ki koi jagah nahi lagti. Sirf `https://` link; drive.google.com / docs.google.com ke alawa koi aur site ho to app chetavni deta hai.
4. **Google Drive jodein**: har vakil/munshi/junior apni Google Drive ek baar jod sakta hai. Phir uski upload ki files uski Drive mein "Court Connect/<case no>" folder mein jaati hain. Team aur client app se hi file khol lete hain (server uploader ki taraf se file laata hai), Drive share karne ki zaroorat nahi.
5. **Cloudflare R2 (10 GB free)** ka option, jab Supabase ka 1 GB bharne lage.
6. **Dashboard tile**: "Documents ki jagah" ab backend ke hisaab se: Supabase 1 GB ya R2 10 GB, kitna % bhara. 80% par laal. (Drive aur link ginti mein nahi aate, kyunki wo app ki jagah nahi lete.)
7. `/healthz` (Render ko jagaye rakhne ke liye).

### Update 4 kaise upload karein
1. **Pehle Supabase**: SQL Editor > New query > `update-4.sql` ka poora text paste > **Run**. Ye documents table mein `backend`, `url`, `drive_file_id` column jodta hai, purani sab files ko `supabase` maanta hai, aur `drive_tokens` table banata hai (RLS ON, anon/authenticated ke liye band). Dobara chalana safe hai, koi data delete nahi hota.
   (Bilkul naya project ho to pehle `supabase.sql`, phir `update-4.sql`.)
2. **Phir GitHub**: ye files upload/replace karein: `server.js`, `storage.js` (naya), `drive.js` (naya), `app.js`, `app.css`, `sw.js`, `package.json`, `update-4.sql` (naya), `README.md`, `.env.example`. Koi naya npm package nahi hai.
3. Render apne aap deploy karega. Koi naya env variable zaroori nahi: bina kuch daale app pehle jaisa Supabase par chalta hai, Drive button chhupa rehta hai.
4. App ek baar refresh karein (cache `mcc-v8`).

### Naye environment variables (sab optional)
| Variable | Kab | Kya |
|---|---|---|
| `STORAGE` | R2 chalu karne par | `r2` (khaali/`supabase` = purana tareeka) |
| `R2_ACCOUNT_ID` | R2 | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 | R2 API token ki Access Key ID |
| `R2_SECRET_ACCESS_KEY` | R2 | R2 API token ki Secret Access Key (SECRET) |
| `R2_BUCKET` | R2 | bucket ka naam, jaise `court-docs` |
| `GOOGLE_CLIENT_ID` | Drive | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Drive | Google OAuth Client secret (SECRET) |
| `GOOGLE_REDIRECT_URI` | Drive | `https://court-chanchalmalda.onrender.com/api/drive/callback` |
| `DRIVE_TOKEN_KEY` | Drive | 32+ random akshar; isi se Drive tokens encrypt hote hain. Ek baar rakh kar mat badlein (badla to sabko Drive dobara jodni padegi) |

Chaaron `GOOGLE_*`/`DRIVE_TOKEN_KEY` mein se ek bhi na ho to Drive wala feature poora chhupa rehta hai. `STORAGE=r2` ho aur R2 ka koi variable chhoot jaye to server start hi nahi hoga (Logs mein saaf likha aayega).
`DRIVE_TOKEN_KEY` banane ke liye: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Render ko jagaye rakhein
Free Render 15 minute bina request ke so jaata hai, phir pehli baar khulne mein 30-60 second lagte hain. Isliye har 10 minute ek "ping":
1. https://cron-job.org par free account banayein (email se).
2. **Create cronjob** > Title: `Court Connect jagao`.
3. URL: `https://court-chanchalmalda.onrender.com/healthz`
4. Schedule: **Every 10 minutes**. Save.
5. Test: browser mein wahi URL kholein, `{"ok":true}` dikhna chahiye. `/healthz` na login maangta hai na database chhoota hai, isliye bilkul halka hai.

Render free plan mein har mahine 750 instance hours milte hain. Ek service poore mahine (31 din x 24 = 744 ghante) chale to bhi isme aa jaati hai. Dhyan: isi account mein doosri free service bhi jagaye rakhi to 750 ghante kam padenge.

## R2 kab aur kaise chalu karein
**Kab**: jab Dashboard par "Documents ki jagah" 70-80% (Supabase 1 GB) ke paas pahunche. R2 mein 10 GB free hai aur download (egress) ka paisa nahi lagta.
**Pehle jaan lein**: Cloudflare R2 chalu karne ke liye card (debit/credit) dena padta hai. Kuch logon ne bataya hai ki card verify karte waqt lagbhag $5 ka temporary authorization hold aata hai jo baad mein wapas ho jaata hai. Free limit (10 GB, 10 lakh write, 1 crore read har mahine) ke andar raho to bill nahi aata; Cloudflare dashboard mein usage dekhte rahein.

Steps:
1. dash.cloudflare.com par account > left menu **R2 Object Storage** > card daal kar R2 chalu karein.
2. **Create bucket** > naam jaise `court-docs` > Location Automatic > Create. Bucket **public NA karein** (koi custom domain / public access nahi chahiye; app 60 second ke signed link deta hai).
3. R2 page par **Manage R2 API Tokens** (ya "API" > Manage API tokens) > **Create API token**:
   - Permissions: **Object Read & Write**
   - Specify bucket: sirf `court-docs`
   - TTL: Forever (ya apni marzi) > Create.
   - Dikhne wali **Access Key ID** aur **Secret Access Key** turant copy kar lein (secret dobara nahi dikhega). Account ID R2 page ke right side par hota hai.
4. Render > service > **Environment** mein daalein: `STORAGE=r2`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=court-docs` > Save (Render redeploy karega).
5. `update-4.sql` pehle hi Run kar chuke hain na? Nahi to abhi Run karein (zaroori hai).
6. Test: ek case mein chhoti PDF upload > Download. Cloudflare R2 bucket mein `<chamber>/<case>/...pdf` dikhegi.

**Purani files**: jo files Supabase mein hain wo wahin rahengi aur waise hi download/delete hongi (har file ke saath likha hai wo kahan hai). Sirf nayi files R2 mein jayengi. Wapas Supabase par aana ho to `STORAGE` hata dein; R2 wali files tab bhi khulengi jab tak R2 ke variable lage hain.

## Google Drive jodna: Google Cloud setup (sirf aap, ek baar)
1. https://console.cloud.google.com par apne Gmail se login > upar project list > **New project** > naam `Court Connect` > Create.
2. **APIs & Services > Library** > "Google Drive API" khojein > **Enable**.
3. **APIs & Services > OAuth consent screen** (naye console mein "Google Auth Platform"):
   - User type: **External** > Create.
   - App name `Court Connect`, support email (aapka), developer contact email (aapka). App domain/homepage mein `https://court-chanchalmalda.onrender.com` daal sakte hain.
   - **Scopes / Data access** > Add scope > `https://www.googleapis.com/auth/drive.file` (".../auth/drive.file — See, edit, create and delete only the specific Google Drive files you use with this app") > Save. Koi aur scope NA jodein.
   - **Test users** > Add users: jin vakilon/munshiyon ko abhi chalana hai unke Gmail (Testing mein max 100 log).
4. **Publishing / verification**:
   - "Testing" mein sirf test users jod sakte hain, aur Google **7 din baad token khatam** kar deta hai: tab app khud "Google Drive jodein (ek baar)" dobara dikhayega (us beech ki uploads app storage mein jayengi). Isliye trial ke baad **Publish app > In production** kar dein.
   - `drive.file` "non-sensitive" scope hai, isliye aam taur par Google ka lamba verification nahi lagta. Agar logo ya brand dikhana ho to Google brand verification maang sakta hai (privacy policy page ka link wagairah). Jab tak verify na ho, Allow screen par app ka naam/email dikhega, ye normal hai.
5. **APIs & Services > Credentials > Create credentials > OAuth client ID**:
   - Application type: **Web application**, naam `Court Connect web`.
   - **Authorized redirect URIs** > Add URI: `https://court-chanchalmalda.onrender.com/api/drive/callback` (bilkul yahi, `https` ke saath, aakhir mein `/` nahi).
   - Create > **Client ID** aur **Client secret** copy karein.
6. Render > Environment mein daalein: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=https://court-chanchalmalda.onrender.com/api/drive/callback`, `DRIVE_TOKEN_KEY` (32+ random akshar) > Save.
7. `update-4.sql` Run kiya ho (drive_tokens table). Test: senior login > koi case > Documents > "Google Drive jodein (ek baar)" > Gmail chunein > Allow > wapas app mein "Google Drive jud gayi". Photo daalein, phir apni Drive mein "Court Connect" folder dekhein.

**Suraksha**: app sirf `drive.file` maangta hai, yaani sirf wahi files dekh/bana sakta hai jo app ne khud banayi. Vakil ki baaki Drive app ko nahi dikhti. Refresh token server par AES-256-GCM se encrypt hokar rakha jaata hai. "Drive hatayein" dabane par Google se token revoke hota hai aur row delete. Kisi ne Drive hata di ho to uski upload ki Drive files app se nahi khulengi (Drive mein unke paas surakshit rahengi); wahi Gmail dobara jodne par phir khulne lagti hain.

**Vakil ko kya batana hai**: "Kisi bhi case > Documents > Google Drive jodein (ek baar) > apna Gmail chunein > Allow." Phone aur computer dono par yahi. Bas.

## Update 5 (v5.2): CNR se case status

**Free buttons (bina key ke chalte hain)**
- "eCourts par dekhein": CNR copy hota hai aur official eCourts site khulti hai. Wahan CAPTCHA bharna padega, paste karke search karein.
- "eCourts App mein kholein": CNR copy hota hai aur phone ka official eCourts Services app khulta hai (na ho to Play Store). App mein "Search by CNR" pe paste karein. App apne aap CNR nahi bharta.

**Live status dekhein (optional, eCourtsIndia private service, paid)**
1. https://ecourtsindia.com/auth/register pe free account banayein. ₹200 ka free credit milta hai, card nahi lagta.
2. Dashboard → API keys (https://ecourtsindia.com/dashboard/api/keys) → naya token banayein (`eci_live_...` se shuru).
3. Render → apni service → Environment → `ECOURTSINDIA_KEY` = woh token. Chahein to `ECOURTS_DAILY_LIMIT` (default 30 lookup prati chamber prati din).
4. Supabase SQL Editor mein `update-5.sql` chalayein (dobara chalana safe hai).
5. Render redeploy karein, app ek baar refresh karein.

Kharcha (Pay As You Go, Oct 2026): Case Detail ₹1.50, Refresh ₹0.15. Packs ₹1,000–5,000 + 18% GST. Fail hui call ka paisa nahi katta. Ek case ka result 12 ghante cache rehta hai, us beech dobara dekhna free.

Dhyan rahein: key kabhi GitHub ya app mein na daalein, sirf Render Environment mein. Yeh sarkari service nahi hai; zaroori faisle se pehle official eCourts pe verify karein. "Abhi refresh" (sirf senior) mein naya data aane mein kuch minute lag sakte hain.

**SQL kram:** `supabase.sql` (sirf nayi install) → `update-3.sql` → `update-4.sql` → `update-5.sql` → `update-6.sql` → `grants.sql`

**Zaroori (30 Oct 2026 se):** Supabase ab nayi tables ko apne aap API nahi deta. Saari SQL ke baad `grants.sql` ek baar Run karein, warna "permission denied" aayega. Dobara chalana safe hai.


## v5.3: Case Ref (judgment ka hawala + jude hue case)

Har case ke andar ab "Case Ref" hissa hai (senior, munshi, aur assigned junior ko dikhta hai; client ko nahi).
- **+ Judgment ka hawala**: citation (jaise `(2014) 8 SCC 273`), case ka naam (Arnesh Kumar vs State of Bihar) aur kis baat ke liye.
- **+ Juda case**: case number (Bail Misc 120/2026, appeal, ya CNR), court (Sessions Court Malda, Calcutta High Court) aur rishta/note.
- **Copy** button hawala copy karta hai, seedha draft ya petition mein paste karein.
- Junior sirf apna joda hua ref hata sakta hai; senior/munshi koi bhi.

**Lagane ka kram:**
1. Supabase SQL Editor mein `update-6.sql` Run karein (ek column jodta hai, dobara chalana safe). Phir `grants.sql`.
2. GitHub pe badli files daalein: `server.js`, `app.js`, `app.css`, `sw.js`, `package.json`, `supabase.sql`, `update-6.sql` (naya), `grants.sql`, `README.md`.
3. Agar `update-6.sql` bhool gaye, app chalta rahega, bas Case Ref save karte waqt "Pehle Supabase mein update-6.sql chalayein" aayega.
