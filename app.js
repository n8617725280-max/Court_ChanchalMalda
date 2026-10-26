'use strict';
// Court Connect v5 — frontend (plain JS, koi framework/build nahi)
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = d => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
const uid = () => crypto.randomUUID();
const tmp = id => String(id).startsWith('tmp-');

// ---------- bhasha: Hinglish / English / বাংলা / हिन्दी ----------
// hi = Hinglish (Roman), hd = हिन्दी (Devanagari). Pehli baar: phone ki bhasha bn -> বাংলা, hi -> हिन्दी, warna বাংলা.
const IDX = { hi: 0, en: 1, bn: 2, hd: 3 }, LOC = { hi: 'en-GB', en: 'en-GB', bn: 'bn-IN-u-nu-latn', hd: 'hi-IN-u-nu-latn' }, HTML_LANG = { hi: 'hi-Latn', en: 'en', bn: 'bn', hd: 'hi' };
const firstLang = () => { for (const l of navigator.languages || [navigator.language || '']) { const p = String(l).toLowerCase().split('-')[0]; if (p === 'bn') return 'bn'; if (p === 'hi') return 'hd'; } return 'bn'; };
let LANG = localStorage.getItem('lang') in IDX ? localStorage.getItem('lang') : firstLang();
const D = {
  tagline: ['Chamber ka case diary aur fee book', 'Case diary and fee book for your chamber', 'চেম্বারের কেস ডায়েরি ও ফি বই'],
  email: ['Email', 'Email', 'ইমেইল'], password: ['Password', 'Password', 'পাসওয়ার্ড'],
  loginbtn: ['Login karein', 'Log in', 'লগইন করুন'], logout: ['Logout', 'Log out', 'লগআউট'],
  tab_today: ['Aaj', 'Today', 'আজ'], tab_cases: ['Cases', 'Cases', 'কেস'], tab_fees: ['Fees', 'Fees', 'ফি'], tab_team: ['Team', 'Team', 'টিম'], tab_backup: ['Backup', 'Backup', 'ব্যাকআপ'], tab_mine: ['Mere cases', 'My cases', 'আমার কেস'],
  online: ['Online', 'Online', 'অনলাইন'], offline: ['Offline', 'Offline', 'অফলাইন'],
  pending: ['{0} entry sync baaki', '{0} entries waiting to sync', '{0} টি এন্ট্রি সিঙ্কের অপেক্ষায়'],
  nodate: ['Date nahi', 'No date', 'তারিখ নেই'],
  nextdate: ['Next date', 'Next date', 'পরবর্তী তারিখ'], closed: ['Case khatam', 'Case closed', 'কেস শেষ'],
  ecourts: ['View on eCourts', 'View on eCourts', 'eCourts-এ দেখুন'], fees: ['Fees', 'Fees', 'ফি'], due: ['baaki {0}', 'due {0}', 'বাকি {0}'],
  g_today: ['Aaj ki hearing', "Today's hearings", 'আজকের শুনানি'], g_tom: ['Kal', 'Tomorrow', 'আগামীকাল'],
  g_late: ['Date nikal gayi, nayi date daalein', 'Date passed, enter a new date', 'তারিখ পেরিয়ে গেছে, নতুন তারিখ দিন'], g_none: ['Date daalni baaki', 'Date not set', 'তারিখ দেওয়া বাকি'],
  empty_today: ['Aaj koi hearing nahi. Cases tab se naya case jodein.', 'No hearings today. Add a case from the Cases tab.', 'আজ কোনো শুনানি নেই। "কেস" ট্যাব থেকে নতুন কেস যোগ করুন।'],
  first100: ['Pehle 100 dikha rahe hain. Khoj se chhaantein.', 'Showing the first 100. Use search to narrow down.', 'প্রথম ১০০টি দেখানো হচ্ছে। সার্চ করে খুঁজুন।'],
  nocase: ['Koi case nahi mila.', 'No cases found.', 'কোনো কেস পাওয়া যায়নি।'],
  search: ['Case no, CNR, party ya thana se khojein', 'Search by case no, CNR, party or police station', 'কেস নম্বর, CNR, পক্ষ বা থানা দিয়ে খুঁজুন'],
  addcase: ['Naya case jodein', 'Add a new case', 'নতুন কেস যোগ করুন'],
  ph_caseno: ['Case no (jaise GR 123/24)', 'Case no (e.g. GR 123/24)', 'কেস নম্বর (যেমন GR 123/24)'], ph_cnr: ['CNR number', 'CNR number', 'CNR নম্বর'],
  ph_party: ['Party ka naam', 'Party name', 'পক্ষের নাম'], ph_court: ['Court', 'Court', 'কোর্ট'], ph_ps: ['Thana (PS)', 'Police station (PS)', 'থানা (PS)'], ph_stage: ['Stage', 'Stage', 'ধাপ (Stage)'],
  junior: ['Junior', 'Junior', 'জুনিয়র'], clogin: ['Client login', 'Client login', 'ক্লায়েন্টের লগইন'], none: ['Koi nahi', 'None', 'কেউ নেই'],
  savecase: ['Case save karein', 'Save case', 'কেস সেভ করুন'],
  totaldue: ['Kul baaki fees', 'Total fees due', 'মোট বাকি ফি'], got: ['Mili', 'Received', 'পাওয়া গেছে'], fixed: ['Tay hui', 'Charged', 'ধার্য হয়েছে'], rcpt: ['Receipt', 'Receipt', 'রসিদ'],
  nofees: ['Abhi koi fees entry nahi. Cases tab mein kisi case ka Fees button dabayein.', 'No fee entries yet. Tap the Fees button on a case in the Cases tab.', 'এখনো কোনো ফি এন্ট্রি নেই। "কেস" ট্যাবে কোনো কেসের ফি বোতাম চাপুন।'],
  addmember: ['Naya member jodein', 'Add a team member', 'নতুন সদস্য যোগ করুন'], ph_name: ['Naam', 'Name', 'নাম'], ph_mobile: ['Mobile', 'Mobile', 'মোবাইল'],
  r_senior: ['Senior', 'Senior', 'সিনিয়র'], r_junior: ['Junior', 'Junior', 'জুনিয়র'], r_munshi: ['Munshi', 'Munshi (clerk)', 'মুহুরি'], r_client: ['Client', 'Client', 'ক্লায়েন্ট'],
  ph_pw: ['Password (8+ akshar)', 'Password (8+ characters)', 'পাসওয়ার্ড (৮+ অক্ষর)'], mkmember: ['Member banayein', 'Create member', 'সদস্য তৈরি করুন'],
  inactive: ['band', 'disabled', 'বন্ধ'], deact: ['Band karein', 'Disable', 'বন্ধ করুন'], act: ['Chalu karein', 'Enable', 'চালু করুন'],
  bk_info: ['Apna data apne paas bhi rakhein. Har hafte ek baar download karke Google Drive ya pendrive mein daal dein.', 'Keep a copy of your data with you. Download it once a week and save it to Google Drive or a pen drive.', 'নিজের ডেটা নিজের কাছেও রাখুন। প্রতি সপ্তাহে একবার ডাউনলোড করে Google Drive বা পেনড্রাইভে রেখে দিন।'],
  bk_last: ['Aakhri backup: {0}', 'Last backup: {0}', 'শেষ ব্যাকআপ: {0}'], bk_never: ['abhi tak nahi', 'not yet', 'এখনো হয়নি'],
  bk_csv: ['Cases aur Fees (Excel)', 'Cases and Fees (Excel)', 'কেস ও ফি (Excel)'], bk_json: ['Poora backup (JSON)', 'Full backup (JSON)', 'পুরো ব্যাকআপ (JSON)'],
  fee_sum: ['Tay: {0} • Mili: {1} • Baaki: {2}', 'Charged: {0} • Received: {1} • Due: {2}', 'ধার্য: {0} • পাওয়া: {1} • বাকি: {2}'],
  fee_what: ['Kya darj karna hai', 'What do you want to record', 'কী এন্ট্রি করবেন'], fee_got: ['Fees mili', 'Fees received', 'ফি পাওয়া গেছে'], fee_set: ['Fees tay hui', 'Fees charged', 'ফি ধার্য হয়েছে'],
  amount: ['Rakam (₹)', 'Amount (₹)', 'টাকার পরিমাণ (₹)'], note: ['Note', 'Note', 'নোট'], note_ph: ['UPI / Cash', 'UPI / Cash', 'UPI / নগদ'],
  save: ['Save karein', 'Save', 'সেভ করুন'], close: ['Band karein', 'Close', 'বন্ধ করুন'],
  c_done: ['Is case ko khatam mark karein?', 'Mark this case as closed?', 'এই কেস শেষ হিসেবে চিহ্নিত করবেন?'],
  rejected: ['Ek entry reject hui: ', 'An entry was rejected: ', 'একটি এন্ট্রি গ্রহণ হয়নি: '],
  saved_off: ['Net nahi hai. Save ho gaya, net aate hi sync hoga.', 'No internet. Saved, it will sync when you are back online.', 'নেট নেই। সেভ হয়েছে, নেট এলে সিঙ্ক হবে।'],
  cnr_copied: ['CNR copy ho gaya. eCourts par paste karein.', 'CNR copied. Paste it on eCourts.', 'CNR কপি হয়েছে। eCourts-এ পেস্ট করুন।'],
  popup: ['Popup allow karein', 'Please allow popups', 'পপআপের অনুমতি দিন'], member_ok: ['Member ban gaya', 'Member created', 'সদস্য তৈরি হয়েছে'],
  noserver: ['Server se connect nahi ho paya. Net check karein.', 'Could not reach the server. Check your internet.', 'সার্ভারের সাথে যোগাযোগ হয়নি। নেট চেক করুন।'],
  rc_title: ['Fees Receipt', 'Fees Receipt', 'ফি রসিদ'], rc_date: ['Date', 'Date', 'তারিখ'], rc_no: ['Receipt no', 'Receipt no', 'রসিদ নম্বর'],
  rc_case: ['Case', 'Case', 'কেস'], rc_party: ['Party', 'Party', 'পক্ষ'], rc_amt: ['Mili rakam', 'Amount received', 'প্রাপ্ত টাকা'],
  support: ['Software support', 'Software support', 'সফটওয়্যার সহায়তা'], install: ['App install karein', 'Install app', 'অ্যাপ ইনস্টল করুন'],
  ph_cphone: ['Client ka mobile (WhatsApp)', 'Client mobile (WhatsApp)', 'ক্লায়েন্টের মোবাইল (WhatsApp)'], edit: ['Badlav', 'Edit', 'এডিট'],
  wa: ['WhatsApp reminder', 'WhatsApp reminder', 'WhatsApp রিমাইন্ডার'],
  wa_msg: ['Namaste, aapke case {0} ki agli hearing {1} ko hai. - {2}', 'Hello, the next hearing of your case {0} is on {1}. - {2}', 'নমস্কার, আপনার কেস {0}-এর পরবর্তী শুনানি {1} তারিখে। - {2}'],
  imp_title: ['Purane cases Excel/CSV se daalein', 'Import old cases from Excel/CSV', 'Excel/CSV থেকে পুরনো কেস আনুন'],
  imp_help: ['Excel file ko "CSV UTF-8" mein save karein. Pehli line mein heading: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile.', 'Save your Excel file as "CSV UTF-8". First row headings: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile.', 'Excel ফাইলটি "CSV UTF-8" হিসেবে সেভ করুন। প্রথম সারিতে হেডিং দিন: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile।'],
  imp_sample: ['Sample CSV', 'Sample CSV', 'নমুনা CSV'],
  imp_done: ['{0} case jude, {1} chhoote (pehle se the ya galat)', '{0} cases added, {1} skipped (already exist or invalid)', '{0}টি কেস যোগ হয়েছে, {1}টি বাদ (আগে থেকেই আছে বা ভুল)'],
  imp_empty: ['File mein koi case nahi mila', 'No cases found in the file', 'ফাইলে কোনো কেস পাওয়া যায়নি'],
  resetpw: ['Password badlein', 'Reset password', 'পাসওয়ার্ড বদলান'], newpw: ['Naya password (8+ akshar)', 'New password (8+ characters)', 'নতুন পাসওয়ার্ড (৮+ অক্ষর)'],
  pw_ok: ['Password badal gaya', 'Password changed', 'পাসওয়ার্ড বদলেছে'],
  tab_tasks: ['Kaam', 'Tasks', 'কাজ'], tab_cal: ['Calendar', 'Calendar', 'ক্যালেন্ডার'],
  addtask: ['Naya kaam jodein', 'Add a task', 'নতুন কাজ যোগ করুন'], ph_task: ['Kaam ka naam (jaise Affidavit draft)', 'Task (e.g. Affidavit draft)', 'কাজের নাম (যেমন Affidavit draft)'],
  duedate: ['Aakhri tareekh', 'Due date', 'শেষ তারিখ'], assign: ['Kise dena hai', 'Assign to', 'কাকে দেবেন'],
  p_low: ['Kam', 'Low', 'কম'], p_medium: ['Medium', 'Medium', 'মাঝারি'], p_high: ['Zaroori', 'High', 'বেশি'],
  no_tasks: ['Koi kaam baaki nahi.', 'No pending tasks.', 'কোনো কাজ বাকি নেই।'], done_h: ['Ho gaye', 'Done', 'সম্পন্ন'],
  cal_none: ['Is din koi hearing nahi.', 'No hearings on this day.', 'এই দিনে কোনো শুনানি নেই।'],
  mypw: ['Mera password badlein', 'Change my password', 'আমার পাসওয়ার্ড বদলান'], curpw: ['Abhi ka password', 'Current password', 'বর্তমান পাসওয়ার্ড'],
  // ---------- v5 ----------
  tab_dash: ['Dashboard', 'Dashboard', 'ড্যাশবোর্ড'], tab_clients: ['Clients', 'Clients', 'ক্লায়েন্ট'], tab_notes: ['Notes', 'Notes', 'নোট'], tab_law: ['BNS khoj', 'BNS finder', 'BNS খুঁজুন'],
  d_today: ['Aaj ki hearing', "Today's hearings", 'আজকের শুনানি'], d_late: ['Date nikal gayi', 'Overdue dates', 'তারিখ পেরিয়ে গেছে'], d_week: ['Agle 7 din', 'Next 7 days', 'আগামী ৭ দিন'],
  d_tasks: ['Khule kaam', 'Open tasks', 'বাকি কাজ'], d_fees: ['Baaki fees', 'Fees due', 'বাকি ফি'], d_store: ['Documents ki jagah', 'Document storage', 'ডকুমেন্টের জায়গা'],
  d_free: ['Free plan 1 GB', 'Free plan 1 GB', 'ফ্রি প্ল্যান ১ GB'], d_quick: ['Jaldi kaam', 'Quick actions', 'দ্রুত কাজ'], d_recent: ['Haal mein badli dates', 'Recent hearing changes', 'সাম্প্রতিক তারিখ পরিবর্তন'],
  d_norecent: ['Abhi koi date nahi badli.', 'No date changes yet.', 'এখনো কোনো তারিখ বদলায়নি।'], q_case: ['+ Case', '+ Case', '+ কেস'], q_client: ['+ Client', '+ Client', '+ ক্লায়েন্ট'],
  q_task: ['+ Kaam', '+ Task', '+ কাজ'], q_law: ['Section khojein', 'Find section', 'ধারা খুঁজুন'], q_note: ['+ Note', '+ Note', '+ নোট'],
  open: ['Kholein', 'Open', 'খুলুন'], back: ['‹ Wapas', '‹ Back', '‹ ফিরে যান'], details: ['Jaankari', 'Details', 'বিবরণ'],
  ph_client: ['Client ka naam (likhte hi list aayegi)', 'Client name (suggestions appear as you type)', 'ক্লায়েন্টের নাম (লিখলেই তালিকা আসবে)'],
  cl_new_hint: ['Naya naam ho to naya client apne aap ban jayega.', 'A new name creates a new client automatically.', 'নতুন নাম হলে নতুন ক্লায়েন্ট আপনা থেকে তৈরি হবে।'],
  ctype: ['Case type', 'Case type', 'কেসের ধরন'], ct_civil: ['Civil (dewani)', 'Civil', 'দেওয়ানি'], ct_criminal: ['Criminal (faujdari)', 'Criminal', 'ফৌজদারি'], ct_other: ['Anya', 'Other', 'অন্যান্য'],
  crim_h: ['Criminal jaankari', 'Criminal details', 'ফৌজদারি বিবরণ'], fir_no: ['FIR / PS case no', 'FIR / PS case no', 'FIR / থানা কেস নম্বর'], fir_date: ['FIR date', 'FIR date', 'FIR তারিখ'],
  sections: ['Dhaara (sections)', 'Sections', 'ধারা'], sec_ph: ['jaise BNS 103(1), 3(5)', 'e.g. BNS 103(1), 3(5)', 'যেমন BNS 103(1), 3(5)'], bail: ['Bail ki sthiti', 'Bail status', 'জামিনের অবস্থা'],
  bail_ph: ['jaise Jail mein / Bail mili / Anticipatory', 'e.g. In custody / On bail / Anticipatory', 'যেমন হেফাজতে / জামিনে / আগাম জামিন'], cs_date: ['Chargesheet date', 'Chargesheet date', 'চার্জশিটের তারিখ'],
  ip_name: ['Shikaayatkarta (IP)', 'Complainant (IP)', 'অভিযোগকারী (IP)'], io_name: ['Jaanch adhikari (IO)', 'Investigating officer (IO)', 'তদন্তকারী অফিসার (IO)'],
  addclient: ['Naya client jodein', 'Add a new client', 'নতুন ক্লায়েন্ট যোগ করুন'], guardian: ['Pita / pati ka naam', "Father's / husband's name", 'পিতা / স্বামীর নাম'],
  address: ['Pata', 'Address', 'ঠিকানা'], cl_notes: ['Note (client ke baare mein)', 'Notes about the client', 'নোট (ক্লায়েন্ট সম্পর্কে)'], savecl: ['Client save karein', 'Save client', 'ক্লায়েন্ট সেভ করুন'],
  cl_search: ['Naam ya mobile se khojein', 'Search by name or mobile', 'নাম বা মোবাইল দিয়ে খুঁজুন'], nocl: ['Koi client nahi mila.', 'No clients found.', 'কোনো ক্লায়েন্ট পাওয়া যায়নি।'],
  ncases: ['{0} case', '{0} cases', '{0}টি কেস'], call: ['Call karein', 'Call', 'কল করুন'], wa_chat: ['WhatsApp', 'WhatsApp', 'WhatsApp'],
  cl_cases: ['Is client ke cases', "This client's cases", 'এই ক্লায়েন্টের কেস'], cl_due: ['Kul baaki fees', 'Total fees due', 'মোট বাকি ফি'], cl_newcase: ['Is client ka naya case', 'New case for this client', 'এই ক্লায়েন্টের নতুন কেস'],
  cl_ok: ['Client save ho gaya', 'Client saved', 'ক্লায়েন্ট সেভ হয়েছে'], client: ['Client', 'Client', 'ক্লায়েন্ট'],
  docs: ['Documents', 'Documents', 'ডকুমেন্ট'], doc_up: ['File upload karein (PDF/JPG/PNG, 10 MB tak)', 'Upload a file (PDF/JPG/PNG, up to 10 MB)', 'ফাইল আপলোড করুন (PDF/JPG/PNG, ১০ MB পর্যন্ত)'],
  doc_none: ['Abhi koi document nahi.', 'No documents yet.', 'এখনো কোনো ডকুমেন্ট নেই।'], doc_dl: ['Download', 'Download', 'ডাউনলোড'], del: ['Hataayein', 'Delete', 'মুছুন'],
  doc_del_q: ['Ye document hamesha ke liye hata dein?', 'Delete this document permanently?', 'এই ডকুমেন্টটি চিরতরে মুছে ফেলবেন?'], doc_big: ['File 10 MB se badi hai', 'File is larger than 10 MB', 'ফাইল ১০ MB-এর বেশি'],
  doc_type: ['Sirf PDF, JPG ya PNG file chalegi', 'Only PDF, JPG or PNG files are allowed', 'শুধু PDF, JPG বা PNG ফাইল চলবে'], doc_wait: ['Upload ho raha hai...', 'Uploading...', 'আপলোড হচ্ছে...'],
  doc_ok: ['Document upload ho gaya', 'Document uploaded', 'ডকুমেন্ট আপলোড হয়েছে'], need_net: ['Iske liye internet chahiye', 'This needs an internet connection', 'এর জন্য ইন্টারনেট দরকার'],
  loading: ['Load ho raha hai...', 'Loading...', 'লোড হচ্ছে...'],
  drafts: ['Drafts', 'Drafts', 'খসড়া'], newdraft: ['Naya draft (template se)', 'New draft (from template)', 'নতুন খসড়া (টেমপ্লেট থেকে)'], draft_none: ['Abhi koi draft save nahi.', 'No saved drafts yet.', 'এখনো কোনো খসড়া সেভ হয়নি।'],
  k_vakalatnama: ['Vakalatnama', 'Vakalatnama', 'ওকালতনামা'], k_affidavit: ['Affidavit (English)', 'Affidavit (English)', 'হলফনামা (ইংরেজি)'], k_affidavit_bn: ['Affidavit (Bangla)', 'Affidavit (Bengali)', 'হলফনামা (বাংলা)'],
  k_notice: ['Legal notice', 'Legal notice', 'আইনি নোটিশ'], k_bail_480: ['Bail arzi - BNSS 480', 'Bail application - BNSS s.480', 'জামিনের আবেদন - BNSS ৪৮০'], k_bail_482: ['Agrim zamaanat - BNSS 482', 'Anticipatory bail - BNSS s.482', 'আগাম জামিন - BNSS ৪৮২'],
  k_bail_bn: ['Bail arzi (Bangla) - 480', 'Bail application (Bengali) - s.480', 'জামিনের আবেদন (বাংলা) - ৪৮০'], k_adjourn: ['Time / adjournment petition', 'Adjournment / time petition', 'সময়ের আবেদন'], k_hazira: ['Hazira petition', 'Hazira (attendance) petition', 'হাজিরা পিটিশন'], k_other: ['Draft', 'Draft', 'খসড়া'],
  dr_title: ['Draft ka naam', 'Draft title', 'খসড়ার নাম'], dr_print: ['Print / PDF', 'Print / PDF', 'প্রিন্ট / PDF'], dr_saved: ['Draft save ho gaya', 'Draft saved', 'খসড়া সেভ হয়েছে'],
  dr_warn: ['Draft — file karne se pehle vakil zaroor jaanch lein. (Draft — advocate must review before filing.)', 'Draft — advocate must review before filing.', 'খসড়া — দাখিলের আগে অ্যাডভোকেট অবশ্যই যাচাই করবেন। (Draft — advocate must review before filing.)'],
  dr_help: ['Khaali jagah (____) bharein aur text badal sakte hain.', 'Fill the blanks (____); you can edit any text.', 'ফাঁকা জায়গা (____) পূরণ করুন; যেকোনো লেখা বদলাতে পারেন।'], dr_del_q: ['Ye draft hata dein?', 'Delete this draft?', 'এই খসড়া মুছে ফেলবেন?'],
  law_h: ['IPC/CrPC/Evidence se BNS/BNSS/BSA', 'IPC/CrPC/Evidence to BNS/BNSS/BSA', 'IPC/CrPC/Evidence থেকে BNS/BNSS/BSA'],
  law_ph: ['Number ya shabd likhein: 302, murder, 103, bail, 65B', 'Type a number or word: 302, murder, 103, bail, 65B', 'নম্বর বা শব্দ লিখুন: 302, murder, 103, bail, 65B'],
  law_disc: ['Sirf madad ke liye. India Code par zaroor milaayein (Verify with India Code).', 'For reference only. Verify with India Code.', 'শুধু সহায়তার জন্য। India Code-এ অবশ্যই মিলিয়ে নিন (Verify with India Code).'],
  law_hint: ['Upar khojein. Jaise "302", "chori", "anticipatory".', 'Search above, e.g. "302", "theft", "anticipatory".', 'উপরে খুঁজুন, যেমন "302", "চুরি/theft", "anticipatory"।'], law_none: ['Kuch nahi mila. Doosra number/shabd try karein.', 'Nothing found. Try another number or word.', 'কিছু পাওয়া যায়নি। অন্য নম্বর বা শব্দ দিন।'],
  law_add: ['Case mein jodein', 'Add to case', 'কেসে যোগ করুন'], law_for: ['Case: {0}', 'Case: {0}', 'কেস: {0}'], law_pick: ['Kis case mein jodna hai?', 'Add to which case?', 'কোন কেসে যোগ করবেন?'],
  law_added: ['{0} case mein jud gaya', '{0} added to the case', '{0} কেসে যোগ হয়েছে'], law_omit: ['Hata diya gaya', 'Omitted', 'বাদ দেওয়া হয়েছে'], law_same: ['Kanoon nahi badla', 'Act unchanged', 'আইন বদলায়নি'],
  n_c: ['Sangyeya (C)', 'Cognizable (C)', 'আমলযোগ্য (C)'], n_nc: ['Asangyeya (NC)', 'Non-cognizable (NC)', 'আমল-অযোগ্য (NC)'], n_b: ['Zamaanati (B)', 'Bailable (B)', 'জামিনযোগ্য (B)'], n_nb: ['Gair-zamaanati (NB)', 'Non-bailable (NB)', 'জামিন-অযোগ্য (NB)'],
  law_more: ['{0} aur nateeje. Khoj ko aur saaf karein.', '{0} more results. Refine your search.', 'আরো {0}টি ফল। খোঁজ আরো নির্দিষ্ট করুন।'], findsec: ['Section khojein', 'Find section', 'ধারা খুঁজুন'],
  upi: ['UPI se payment', 'Pay via UPI', 'UPI-তে পেমেন্ট'], upi_share: ['WhatsApp par UPI link bhejein', 'Send UPI link on WhatsApp', 'WhatsApp-এ UPI লিঙ্ক পাঠান'],
  upi_scan: ['Scan karke ₹{0} bhejein', 'Scan to pay ₹{0}', 'স্ক্যান করে ₹{0} পাঠান'], upi_unset: ['UPI ID abhi set nahi. Senior Team tab > Chamber settings mein daal sakte hain.', 'UPI ID not set. A senior can add it in Team tab > Chamber settings.', 'UPI ID সেট করা নেই। সিনিয়র Team ট্যাব > চেম্বার সেটিংসে দিতে পারেন।'],
  upi_msg: ['Namaste, case {0} ki baaki fees {1} hai. UPI se bhejein: {2} - {3}', 'Hello, the pending fee for case {0} is {1}. Pay via UPI: {2} - {3}', 'নমস্কার, কেস {0}-এর বাকি ফি {1}। UPI-তে পাঠান: {2} - {3}'], due_now: ['Baaki: {0}', 'Due: {0}', 'বাকি: {0}'],
  set_h: ['Chamber settings', 'Chamber settings', 'চেম্বার সেটিংস'], adv_name: ['Vakil ka naam (drafts mein chhapega)', 'Advocate name (printed on drafts)', 'অ্যাডভোকেটের নাম (খসড়ায় ছাপা হবে)'],
  adv_enrol: ['Enrolment no.', 'Enrolment no.', 'এনরোলমেন্ট নম্বর'], ch_addr: ['Chamber ka pata', 'Chamber address', 'চেম্বারের ঠিকানা'], upi_id: ['UPI ID (jaise naam@okhdfcbank)', 'UPI ID (e.g. name@okhdfcbank)', 'UPI ID (যেমন name@okhdfcbank)'],
  upi_name: ['UPI par naam', 'Payee name for UPI', 'UPI-তে প্রাপকের নাম'], set_ok: ['Settings save ho gayi', 'Settings saved', 'সেটিংস সেভ হয়েছে'],
  addnote: ['Naya note jodein', 'Add a note', 'নতুন নোট যোগ করুন'], n_title: ['Shirshak (jaise judgment ka naam)', 'Title (e.g. judgment name)', 'শিরোনাম (যেমন রায়ের নাম)'],
  n_body: ['Note / citation / sandesh', 'Note / citation / message', 'নোট / সাইটেশন / বার্তা'], n_tag: ['Tag (jaise bail, ndps, munshi)', 'Tag (e.g. bail, ndps, munshi)', 'ট্যাগ (যেমন bail, ndps, munshi)'],
  n_case: ['Case se jodein (zaroori nahi)', 'Link to a case (optional)', 'কেসের সাথে যুক্ত করুন (ঐচ্ছিক)'], n_priv: ['Sirf senior dekhe (private)', 'Private (senior only)', 'শুধু সিনিয়র দেখবেন (প্রাইভেট)'],
  n_search: ['Note, citation ya tag khojein', 'Search notes, citations or tags', 'নোট, সাইটেশন বা ট্যাগ খুঁজুন'], n_none: ['Koi note nahi mila.', 'No notes found.', 'কোনো নোট পাওয়া যায়নি।'],
  n_del_q: ['Ye note hata dein?', 'Delete this note?', 'এই নোট মুছে ফেলবেন?'], private: ['Private', 'Private', 'প্রাইভেট'], by: ['{0} dwara', 'by {0}', '{0} লিখেছেন'],
  wk: ['Is hafte', 'This week', 'এই সপ্তাহ']
};
const E = {   // server ke Hinglish error ka anuvad
  'Login dobara karein': ['Please log in again', 'আবার লগইন করুন'], 'Account band hai': ['Account is disabled', 'অ্যাকাউন্ট বন্ধ আছে'],
  'Bahut koshish ho gayi. 15 minute baad try karein': ['Too many attempts. Try again after 15 minutes', 'অনেকবার চেষ্টা হয়েছে। ১৫ মিনিট পরে চেষ্টা করুন'],
  'Email ya password galat hai': ['Wrong email or password', 'ইমেইল বা পাসওয়ার্ড ভুল'], 'Server error, dobara try karein': ['Server error, please try again', 'সার্ভারে সমস্যা, আবার চেষ্টা করুন'],
  'Is kaam ki ijazat nahi hai': ['You are not allowed to do this', 'এই কাজের অনুমতি নেই'], 'Role galat hai': ['Invalid role', 'ভূমিকা (role) ভুল'],
  'Sahi email aur 8+ akshar ka password daalein': ['Enter a valid email and a password of 8+ characters', 'সঠিক ইমেইল ও ৮+ অক্ষরের পাসওয়ার্ড দিন'],
  'Ye email pehle se maujood hai': ['This email already exists', 'এই ইমেইল আগে থেকেই আছে'], 'User nahi ban paya': ['Could not create user', 'ব্যবহারকারী তৈরি হয়নি'],
  'Galat request': ['Invalid request', 'ভুল অনুরোধ'], 'User nahi mila': ['User not found', 'ব্যবহারকারী পাওয়া যায়নি'],
  'Case no ya CNR zaroori hai': ['Case no or CNR is required', 'কেস নম্বর বা CNR দেওয়া জরুরি'], 'Date galat hai': ['Invalid date', 'তারিখ ভুল'],
  'Junior/Client galat hai': ['Invalid junior/client', 'জুনিয়র/ক্লায়েন্ট ভুল'], 'Ye CNR is chamber mein pehle se hai': ['This CNR already exists in this chamber', 'এই CNR এই চেম্বারে আগে থেকেই আছে'],
  'Case save nahi hua': ['Case could not be saved', 'কেস সেভ হয়নি'], 'Case nahi mila': ['Case not found', 'কেস পাওয়া যায়নি'], 'User galat hai': ['Invalid user', 'ব্যবহারকারী ভুল'],
  'Password 8+ akshar ka hona chahiye': ['Password must be 8+ characters', 'পাসওয়ার্ড ৮+ অক্ষরের হতে হবে'], 'Kaam ka naam zaroori hai': ['Task name is required', 'কাজের নাম দেওয়া জরুরি'], 'Kaam nahi mila': ['Task not found', 'কাজ পাওয়া যায়নি'], 'Abhi ka password galat hai': ['Current password is wrong', 'বর্তমান পাসওয়ার্ড ভুল'], 'Chamber band hai. Support se baat karein': ['This chamber is disabled. Please contact support', 'এই চেম্বার বন্ধ আছে। সহায়তার সাথে যোগাযোগ করুন'],
  'Kuch badla nahi': ['Nothing changed', 'কিছু বদলায়নি'], 'Rakam ya type galat hai': ['Invalid amount or type', 'টাকার পরিমাণ বা ধরন ভুল'],
  'Case type galat hai': ['Invalid case type', 'কেসের ধরন ভুল'], 'Client nahi mila': ['Client not found', 'ক্লায়েন্ট পাওয়া যায়নি'], 'Client ka naam zaroori hai': ['Client name is required', 'ক্লায়েন্টের নাম দেওয়া জরুরি'],
  'UPI ID galat hai (jaise naam@okhdfcbank)': ['Invalid UPI ID (e.g. name@okhdfcbank)', 'UPI ID ভুল (যেমন name@okhdfcbank)'], 'File khaali hai': ['The file is empty', 'ফাইলটি খালি'],
  'File 10 MB se badi hai': ['File is larger than 10 MB', 'ফাইল ১০ MB-এর বেশি'], 'Sirf PDF, JPG ya PNG file chalegi': ['Only PDF, JPG or PNG files are allowed', 'শুধু PDF, JPG বা PNG ফাইল চলবে'],
  'Upload nahi hua, dobara try karein': ['Upload failed, please try again', 'আপলোড হয়নি, আবার চেষ্টা করুন'], 'Document nahi mila': ['Document not found', 'ডকুমেন্ট পাওয়া যায়নি'],
  'Draft khaali hai': ['The draft is empty', 'খসড়াটি খালি'], 'Draft nahi mila': ['Draft not found', 'খসড়া পাওয়া যায়নি'], 'Note khaali hai': ['The note is empty', 'নোটটি খালি'],
  'Note nahi mila': ['Note not found', 'নোট পাওয়া যায়নি'], 'Bahut zyada sections': ['Too many sections', 'অনেক বেশি ধারা']
};
const HD = {   // हिन्दी (देवनागरी) — D की चौथी भाषा
  tagline: 'चैंबर की केस डायरी और फ़ीस बही', email: 'ईमेल', password: 'पासवर्ड', loginbtn: 'लॉगिन करें', logout: 'लॉगआउट',
  tab_today: 'आज', tab_cases: 'केस', tab_fees: 'फ़ीस', tab_team: 'टीम', tab_backup: 'बैकअप', tab_mine: 'मेरे केस',
  online: 'ऑनलाइन', offline: 'ऑफ़लाइन', pending: '{0} एंट्री सिंक बाकी', nodate: 'तारीख नहीं',
  nextdate: 'अगली तारीख', closed: 'केस ख़त्म', ecourts: 'eCourts पर देखें', fees: 'फ़ीस', due: 'बाकी {0}',
  g_today: 'आज की सुनवाई', g_tom: 'कल', g_late: 'तारीख निकल गई, नई तारीख डालें', g_none: 'तारीख डालनी बाकी',
  empty_today: 'आज कोई सुनवाई नहीं। केस टैब से नया केस जोड़ें।', first100: 'पहले 100 दिखा रहे हैं। खोज से छाँटें।',
  nocase: 'कोई केस नहीं मिला।', search: 'केस नंबर, CNR, पक्ष या थाना से खोजें', addcase: 'नया केस जोड़ें',
  ph_caseno: 'केस नंबर (जैसे GR 123/24)', ph_cnr: 'CNR नंबर', ph_party: 'पक्ष का नाम', ph_court: 'कोर्ट', ph_ps: 'थाना (PS)', ph_stage: 'स्टेज',
  junior: 'जूनियर', clogin: 'क्लाइंट लॉगिन', none: 'कोई नहीं', savecase: 'केस सेव करें',
  totaldue: 'कुल बाकी फ़ीस', got: 'मिली', fixed: 'तय हुई', rcpt: 'रसीद',
  nofees: 'अभी कोई फ़ीस एंट्री नहीं। केस टैब में किसी केस का फ़ीस बटन दबाएँ।',
  addmember: 'नया सदस्य जोड़ें', ph_name: 'नाम', ph_mobile: 'मोबाइल', r_senior: 'सीनियर', r_junior: 'जूनियर', r_munshi: 'मुंशी', r_client: 'क्लाइंट',
  ph_pw: 'पासवर्ड (8+ अक्षर)', mkmember: 'सदस्य बनाएँ', inactive: 'बंद', deact: 'बंद करें', act: 'चालू करें',
  bk_info: 'अपना डेटा अपने पास भी रखें। हर हफ़्ते एक बार डाउनलोड करके Google Drive या पेनड्राइव में रख दें।',
  bk_last: 'आख़िरी बैकअप: {0}', bk_never: 'अभी तक नहीं', bk_csv: 'केस और फ़ीस (Excel)', bk_json: 'पूरा बैकअप (JSON)',
  fee_sum: 'तय: {0} • मिली: {1} • बाकी: {2}', fee_what: 'क्या दर्ज करना है', fee_got: 'फ़ीस मिली', fee_set: 'फ़ीस तय हुई',
  amount: 'रकम (₹)', note: 'नोट', note_ph: 'UPI / नकद', save: 'सेव करें', close: 'बंद करें',
  c_done: 'इस केस को ख़त्म मार्क करें?', rejected: 'एक एंट्री नहीं ली गई: ', saved_off: 'नेट नहीं है। सेव हो गया, नेट आते ही सिंक होगा।',
  cnr_copied: 'CNR कॉपी हो गया। eCourts पर पेस्ट करें।', popup: 'पॉपअप की अनुमति दें', member_ok: 'सदस्य बन गया',
  noserver: 'सर्वर से जुड़ नहीं पाए। नेट देखें।', rc_title: 'फ़ीस रसीद', rc_date: 'तारीख', rc_no: 'रसीद नंबर', rc_case: 'केस', rc_party: 'पक्ष', rc_amt: 'मिली रकम',
  support: 'सॉफ़्टवेयर सहायता', install: 'ऐप इंस्टॉल करें', ph_cphone: 'क्लाइंट का मोबाइल (WhatsApp)', edit: 'बदलाव', wa: 'WhatsApp रिमाइंडर',
  wa_msg: 'नमस्ते, आपके केस {0} की अगली सुनवाई {1} को है। - {2}',
  imp_title: 'पुराने केस Excel/CSV से डालें',
  imp_help: 'Excel फ़ाइल को "CSV UTF-8" में सेव करें। पहली लाइन में हेडिंग: Case no, CNR, Party, Court, PS, Stage, Next date, Mobile.',
  imp_sample: 'नमूना CSV', imp_done: '{0} केस जुड़े, {1} छूटे (पहले से थे या ग़लत)', imp_empty: 'फ़ाइल में कोई केस नहीं मिला',
  resetpw: 'पासवर्ड बदलें', newpw: 'नया पासवर्ड (8+ अक्षर)', pw_ok: 'पासवर्ड बदल गया',
  tab_tasks: 'काम', tab_cal: 'कैलेंडर', addtask: 'नया काम जोड़ें', ph_task: 'काम का नाम (जैसे Affidavit ड्राफ़्ट)', duedate: 'आख़िरी तारीख', assign: 'किसे देना है',
  p_low: 'कम', p_medium: 'मध्यम', p_high: 'ज़रूरी', no_tasks: 'कोई काम बाकी नहीं।', done_h: 'हो गए', cal_none: 'इस दिन कोई सुनवाई नहीं।',
  mypw: 'मेरा पासवर्ड बदलें', curpw: 'अभी का पासवर्ड',
  tab_dash: 'डैशबोर्ड', tab_clients: 'क्लाइंट', tab_notes: 'नोट्स', tab_law: 'BNS खोज',
  d_today: 'आज की सुनवाई', d_late: 'तारीख निकल गई', d_week: 'अगले 7 दिन', d_tasks: 'खुले काम', d_fees: 'बाकी फ़ीस', d_store: 'डॉक्यूमेंट की जगह',
  d_free: 'फ़्री प्लान 1 GB', d_quick: 'जल्दी काम', d_recent: 'हाल में बदली तारीखें', d_norecent: 'अभी कोई तारीख नहीं बदली।',
  q_case: '+ केस', q_client: '+ क्लाइंट', q_task: '+ काम', q_law: 'धारा खोजें', q_note: '+ नोट',
  open: 'खोलें', back: '‹ वापस', details: 'जानकारी', ph_client: 'क्लाइंट का नाम (लिखते ही लिस्ट आएगी)', cl_new_hint: 'नया नाम हो तो नया क्लाइंट अपने आप बन जाएगा।',
  ctype: 'केस का प्रकार', ct_civil: 'दीवानी (Civil)', ct_criminal: 'फ़ौजदारी (Criminal)', ct_other: 'अन्य',
  crim_h: 'फ़ौजदारी जानकारी', fir_no: 'FIR / थाना केस नंबर', fir_date: 'FIR तारीख', sections: 'धारा', sec_ph: 'जैसे BNS 103(1), 3(5)',
  bail: 'ज़मानत की स्थिति', bail_ph: 'जैसे जेल में / ज़मानत मिली / अग्रिम', cs_date: 'चार्जशीट तारीख', ip_name: 'शिकायतकर्ता (IP)', io_name: 'जाँच अधिकारी (IO)',
  addclient: 'नया क्लाइंट जोड़ें', guardian: 'पिता / पति का नाम', address: 'पता', cl_notes: 'नोट (क्लाइंट के बारे में)', savecl: 'क्लाइंट सेव करें',
  cl_search: 'नाम या मोबाइल से खोजें', nocl: 'कोई क्लाइंट नहीं मिला।', ncases: '{0} केस', call: 'कॉल करें', wa_chat: 'WhatsApp',
  cl_cases: 'इस क्लाइंट के केस', cl_due: 'कुल बाकी फ़ीस', cl_newcase: 'इस क्लाइंट का नया केस', cl_ok: 'क्लाइंट सेव हो गया', client: 'क्लाइंट',
  docs: 'डॉक्यूमेंट', doc_up: 'फ़ाइल अपलोड करें (PDF/JPG/PNG, 10 MB तक)', doc_none: 'अभी कोई डॉक्यूमेंट नहीं।', doc_dl: 'डाउनलोड', del: 'हटाएँ',
  doc_del_q: 'यह डॉक्यूमेंट हमेशा के लिए हटा दें?', doc_big: 'फ़ाइल 10 MB से बड़ी है', doc_type: 'सिर्फ़ PDF, JPG या PNG फ़ाइल चलेगी',
  doc_wait: 'अपलोड हो रहा है...', doc_ok: 'डॉक्यूमेंट अपलोड हो गया', need_net: 'इसके लिए इंटरनेट चाहिए', loading: 'लोड हो रहा है...',
  drafts: 'ड्राफ़्ट', newdraft: 'नया ड्राफ़्ट (टेम्पलेट से)', draft_none: 'अभी कोई ड्राफ़्ट सेव नहीं।',
  k_vakalatnama: 'वकालतनामा', k_affidavit: 'शपथपत्र (अंग्रेज़ी)', k_affidavit_bn: 'शपथपत्र (बांग्ला)', k_notice: 'लीगल नोटिस',
  k_bail_480: 'ज़मानत अर्ज़ी - BNSS 480', k_bail_482: 'अग्रिम ज़मानत - BNSS 482', k_bail_bn: 'ज़मानत अर्ज़ी (बांग्ला) - 480',
  k_adjourn: 'समय / स्थगन अर्ज़ी', k_hazira: 'हाज़िरा अर्ज़ी', k_other: 'ड्राफ़्ट',
  dr_title: 'ड्राफ़्ट का नाम', dr_print: 'प्रिंट / PDF', dr_saved: 'ड्राफ़्ट सेव हो गया',
  dr_warn: 'ड्राफ़्ट — फ़ाइल करने से पहले वकील ज़रूर जाँच लें। (Draft — advocate must review before filing.)',
  dr_help: 'ख़ाली जगह (____) भरें, कोई भी लिखावट बदल सकते हैं।', dr_del_q: 'यह ड्राफ़्ट हटा दें?',
  law_h: 'IPC/CrPC/Evidence से BNS/BNSS/BSA', law_ph: 'नंबर या शब्द लिखें: 302, murder, 103, bail, 65B',
  law_disc: 'सिर्फ़ मदद के लिए। India Code पर ज़रूर मिलाएँ (Verify with India Code).', law_hint: 'ऊपर खोजें। जैसे "302", "chori", "anticipatory"।',
  law_none: 'कुछ नहीं मिला। दूसरा नंबर या शब्द लिखें।', law_add: 'केस में जोड़ें', law_for: 'केस: {0}', law_pick: 'किस केस में जोड़ना है?',
  law_added: '{0} केस में जुड़ गया', law_omit: 'हटा दिया गया', law_same: 'क़ानून नहीं बदला',
  n_c: 'संज्ञेय (C)', n_nc: 'असंज्ञेय (NC)', n_b: 'ज़मानती (B)', n_nb: 'ग़ैर-ज़मानती (NB)', law_more: '{0} और नतीजे। खोज और साफ़ करें।', findsec: 'धारा खोजें',
  upi: 'UPI से पेमेंट', upi_share: 'WhatsApp पर UPI लिंक भेजें', upi_scan: 'स्कैन करके ₹{0} भेजें',
  upi_unset: 'UPI ID अभी सेट नहीं। सीनियर टीम टैब > चैंबर सेटिंग में डाल सकते हैं।',
  upi_msg: 'नमस्ते, केस {0} की बाकी फ़ीस {1} है। UPI से भेजें: {2} - {3}', due_now: 'बाकी: {0}',
  set_h: 'चैंबर सेटिंग', adv_name: 'वकील का नाम (ड्राफ़्ट में छपेगा)', adv_enrol: 'एनरोलमेंट नंबर', ch_addr: 'चैंबर का पता',
  upi_id: 'UPI ID (जैसे naam@okhdfcbank)', upi_name: 'UPI पर नाम', set_ok: 'सेटिंग सेव हो गई',
  addnote: 'नया नोट जोड़ें', n_title: 'शीर्षक (जैसे फ़ैसले का नाम)', n_body: 'नोट / साइटेशन / संदेश', n_tag: 'टैग (जैसे bail, ndps, munshi)',
  n_case: 'केस से जोड़ें (ज़रूरी नहीं)', n_priv: 'सिर्फ़ सीनियर देखें (प्राइवेट)', n_search: 'नोट, साइटेशन या टैग खोजें', n_none: 'कोई नोट नहीं मिला।',
  n_del_q: 'यह नोट हटा दें?', private: 'प्राइवेट', by: '{0} द्वारा', wk: 'इस हफ़्ते'
};
const HE = {   // सर्वर की ग़लती के संदेश — हिन्दी
  'Login dobara karein': 'दोबारा लॉगिन करें', 'Account band hai': 'खाता बंद है', 'Bahut koshish ho gayi. 15 minute baad try karein': 'बहुत कोशिश हो गई। 15 मिनट बाद कोशिश करें',
  'Email ya password galat hai': 'ईमेल या पासवर्ड ग़लत है', 'Server error, dobara try karein': 'सर्वर में दिक्कत, दोबारा कोशिश करें', 'Is kaam ki ijazat nahi hai': 'इस काम की इजाज़त नहीं है',
  'Role galat hai': 'भूमिका ग़लत है', 'Sahi email aur 8+ akshar ka password daalein': 'सही ईमेल और 8+ अक्षर का पासवर्ड डालें', 'Ye email pehle se maujood hai': 'यह ईमेल पहले से मौजूद है',
  'User nahi ban paya': 'सदस्य नहीं बन पाया', 'Galat request': 'ग़लत अनुरोध', 'User nahi mila': 'सदस्य नहीं मिला', 'Case no ya CNR zaroori hai': 'केस नंबर या CNR ज़रूरी है',
  'Date galat hai': 'तारीख ग़लत है', 'Junior/Client galat hai': 'जूनियर/क्लाइंट ग़लत है', 'Ye CNR is chamber mein pehle se hai': 'यह CNR इस चैंबर में पहले से है',
  'Case save nahi hua': 'केस सेव नहीं हुआ', 'Case nahi mila': 'केस नहीं मिला', 'User galat hai': 'सदस्य ग़लत है', 'Password 8+ akshar ka hona chahiye': 'पासवर्ड 8+ अक्षर का होना चाहिए',
  'Kaam ka naam zaroori hai': 'काम का नाम ज़रूरी है', 'Kaam nahi mila': 'काम नहीं मिला', 'Abhi ka password galat hai': 'अभी का पासवर्ड ग़लत है',
  'Chamber band hai. Support se baat karein': 'चैंबर बंद है। सहायता से बात करें', 'Kuch badla nahi': 'कुछ नहीं बदला', 'Rakam ya type galat hai': 'रकम या प्रकार ग़लत है',
  'Case type galat hai': 'केस का प्रकार ग़लत है', 'Client nahi mila': 'क्लाइंट नहीं मिला', 'Client ka naam zaroori hai': 'क्लाइंट का नाम ज़रूरी है',
  'UPI ID galat hai (jaise naam@okhdfcbank)': 'UPI ID ग़लत है (जैसे naam@okhdfcbank)', 'File khaali hai': 'फ़ाइल ख़ाली है', 'File 10 MB se badi hai': 'फ़ाइल 10 MB से बड़ी है',
  'Sirf PDF, JPG ya PNG file chalegi': 'सिर्फ़ PDF, JPG या PNG फ़ाइल चलेगी', 'Upload nahi hua, dobara try karein': 'अपलोड नहीं हुआ, दोबारा कोशिश करें',
  'Document nahi mila': 'डॉक्यूमेंट नहीं मिला', 'Draft khaali hai': 'ड्राफ़्ट ख़ाली है', 'Draft nahi mila': 'ड्राफ़्ट नहीं मिला', 'Note khaali hai': 'नोट ख़ाली है',
  'Note nahi mila': 'नोट नहीं मिला', 'Bahut zyada sections': 'बहुत ज़्यादा धाराएँ'
};
for (const k in HD) if (D[k]) D[k][3] = HD[k];

// ---------- Madad / Guide, swagat, hint: 4 bhasha [Hinglish, English, বাংলা, हिन्दी] ----------
Object.assign(D, {
  tab_help: ['Madad / Guide', 'Help / Guide', 'সাহায্য / গাইড', 'मदद / गाइड'],
  lang_l: ['Bhasha', 'Language', 'ভাষা', 'भाषा'], lang_l2: ['Bhasha / Language', 'Language', 'ভাষা / Language', 'भाषा / Language'],
  help_h: ['App kaise chalayein', 'How to use the app', 'অ্যাপ কীভাবে চালাবেন', 'ऐप कैसे चलाएँ'],
  help_sub: ['Har kaam ka chhota tareeka. "Kholein" dabakar seedhe us jagah jaayein.', 'A short how-to for each feature. Tap "Open" to go straight there.', 'প্রতিটি কাজের ছোট নিয়ম। "খুলুন" চাপলে সোজা সেখানে যাবেন।', 'हर काम का छोटा तरीका। "खोलें" दबाकर सीधे उस जगह जाएँ।'],
  how: ['Kaise karein', 'How to', 'কীভাবে করবেন', 'कैसे करें'],
  new_h: ['Kya naya hai (v5)', "What's new (v5)", 'নতুন কী আছে (v5)', 'क्या नया है (v5)'],
  new1: ['Dashboard: aaj ka poora haal ek nazar mein', 'Dashboard: your whole day at a glance', 'ড্যাশবোর্ড: আজকের সব এক নজরে', 'डैशबोर्ड: आज का पूरा हाल एक नज़र में'],
  new2: ['Clients: har muvakkil ka profile aur baaki fees', 'Clients: a profile and dues for every client', 'ক্লায়েন্ট: প্রত্যেক মক্কেলের প্রোফাইল ও বাকি ফি', 'क्लाइंट: हर मुवक्किल की प्रोफ़ाइल और बाकी फ़ीस'],
  new3: ['Documents: har case ki PDF/photo', 'Documents: PDFs and photos for each case', 'ডকুমেন্ট: প্রতিটি কেসের PDF/ছবি', 'डॉक्यूमेंट: हर केस की PDF/फ़ोटो'],
  new4: ['Drafts: Vakalatnama, bail arzi apne aap bhare', 'Drafts: vakalatnama and bail petitions filled in for you', 'খসড়া: ওকালতনামা, জামিনের আবেদন নিজে থেকেই ভরা', 'ड्राफ़्ट: वकालतनामा, ज़मानत अर्ज़ी अपने आप भरी'],
  new5: ['BNS khoj: IPC 302 likhein, BNS 103 paayein', 'BNS finder: type IPC 302, get BNS 103', 'BNS খুঁজুন: IPC 302 লিখুন, BNS 103 পান', 'BNS खोज: IPC 302 लिखें, BNS 103 पाएँ'],
  new6: ['UPI QR, Notes, Madad aur हिन्दी bhasha', 'UPI QR, Notes, this Help tab and Hindi', 'UPI QR, নোট, সাহায্য আর হিন্দি ভাষা', 'UPI QR, नोट्स, मदद और हिन्दी भाषा'],
  start_h: ['Shuru kaise karein (naya chamber)', 'Getting started (new chamber)', 'শুরু করবেন কীভাবে (নতুন চেম্বার)', 'शुरू कैसे करें (नया चैंबर)'],
  st1: ['Team > Chamber settings mein UPI ID aur vakil ka naam daalein', 'In Team > Chamber settings, enter your UPI ID and advocate name', 'টিম > চেম্বার সেটিংসে UPI ID ও অ্যাডভোকেটের নাম দিন', 'टीम > चैंबर सेटिंग में UPI ID और वकील का नाम डालें'],
  st2: ['Team mein junior, munshi aur client ke login banayein', 'In Team, create logins for juniors, munshis and clients', 'টিমে জুনিয়র, মুহুরি ও ক্লায়েন্টের লগইন বানান', 'टीम में जूनियर, मुंशी और क्लाइंट के लॉगिन बनाएँ'],
  st3: ['Cases jodein, ya purane cases Excel/CSV se daalein', 'Add cases, or import old ones from Excel/CSV', 'কেস যোগ করুন, বা পুরনো কেস Excel/CSV থেকে আনুন', 'केस जोड़ें, या पुराने केस Excel/CSV से डालें'],
  st4: ['Har case ki next date daalein', 'Enter the next date for every case', 'প্রতিটি কেসের পরবর্তী তারিখ দিন', 'हर केस की अगली तारीख डालें'],
  st5: ['Phone par app install karein (Home screen par)', 'Install the app on your phone (Home screen)', 'ফোনে অ্যাপ ইনস্টল করুন (হোম স্ক্রিনে)', 'फ़ोन पर ऐप इंस्टॉल करें (होम स्क्रीन पर)'],
  st_done: ['Ho gaya', 'Done', 'হয়েছে', 'हो गया'],
  help_contact: ['Madad chahiye? Seedhe baat karein', 'Need help? Talk to us directly', 'সাহায্য লাগবে? সরাসরি কথা বলুন', 'मदद चाहिए? सीधे बात करें'],
  help_who: ['Software banaya aur chalaya: SK Nuruddin, Chanchal, Malda', 'Built and run by SK Nuruddin, Chanchal, Malda', 'সফটওয়্যার তৈরি ও পরিচালনা: SK Nuruddin, চাঁচল, মালদা', 'सॉफ़्टवेयर बनाया और चलाया: SK Nuruddin, चांचल, मालदा'],
  call_n: ['Call 7602292599', 'Call 7602292599', 'কল 7602292599', 'कॉल 7602292599'],
  wa_us: ['WhatsApp karein', 'WhatsApp us', 'WhatsApp করুন', 'WhatsApp करें'],
  wa_us_msg: ['Court Connect mein madad chahiye', 'I need help with Court Connect', 'Court Connect নিয়ে সাহায্য চাই', 'Court Connect में मदद चाहिए'],
  wl_again: ['Swagat sandesh dobara dekhein', 'See the welcome message again', 'স্বাগত বার্তা আবার দেখুন', 'स्वागत संदेश दोबारा देखें'],
  hint_reset: ['Chhupaye hue hint wapas dikhayein', 'Show hidden hints again', 'লুকানো টিপস আবার দেখান', 'छिपाए हुए संकेत फिर दिखाएँ'],
  hint_hide: ['Chhupayein', 'Hide', 'লুকান', 'छिपाएँ'],
  // swagat
  wl_h: ['Court Connect mein swagat', 'Welcome to Court Connect', 'Court Connect-এ স্বাগত', 'Court Connect में स्वागत है'],
  wl_sub: ['Aapke chamber ka case diary, fees aur team, sab ek jagah.', "Your chamber's case diary, fees and team, all in one place.", 'আপনার চেম্বারের কেস ডায়েরি, ফি আর টিম, সব এক জায়গায়।', 'आपके चैंबर की केस डायरी, फ़ीस और टीम, सब एक जगह।'],
  wb1: ['Agli date kabhi na chhoote: aaj, kal aur nikli hui date ek nazar mein', 'Never miss a date: today, tomorrow and overdue at a glance', 'কোনো তারিখ মিস হবে না: আজ, কাল আর পেরোনো তারিখ এক নজরে', 'अगली तारीख कभी न छूटे: आज, कल और निकली हुई तारीख एक नज़र में'],
  wb2: ['Fees ka pakka hisaab, receipt aur UPI QR turant', 'Clear fee accounts, with instant receipts and UPI QR', 'ফি-র পাকা হিসাব, সঙ্গে সঙ্গে রসিদ ও UPI QR', 'फ़ीस का पक्का हिसाब, रसीद और UPI QR तुरंत'],
  wb3: ['Case ke documents aur drafts (Vakalatnama, bail arzi) ek jagah', 'Case documents and drafts (vakalatnama, bail) in one place', 'কেসের ডকুমেন্ট ও খসড়া (ওকালতনামা, জামিন) এক জায়গায়', 'केस के डॉक्यूमेंट और ड्राफ़्ट (वकालतनामा, ज़मानत अर्ज़ी) एक जगह'],
  wb4: ['IPC ki dhaara likhein, naya BNS section turant', 'Type an IPC section, get the new BNS section', 'IPC-র ধারা লিখুন, নতুন BNS ধারা সঙ্গে সঙ্গে', 'IPC की धारा लिखें, नई BNS धारा तुरंत'],
  wb5: ['Junior, munshi aur client ka alag login; client ko WhatsApp reminder', 'Separate logins for junior, munshi and client; WhatsApp reminders to clients', 'জুনিয়র, মুহুরি ও ক্লায়েন্টের আলাদা লগইন; ক্লায়েন্টকে WhatsApp রিমাইন্ডার', 'जूनियर, मुंशी और क्लाइंट का अलग लॉगिन; क्लाइंट को WhatsApp रिमाइंडर'],
  wb6: ['Net na ho tab bhi chale; English, বাংলা, हिन्दी, Hinglish', 'Works without internet; English, Bengali, Hindi, Hinglish', 'নেট না থাকলেও চলে; English, বাংলা, हिन्दी, Hinglish', 'नेट न हो तब भी चले; English, বাংলা, हिन्दी, Hinglish'],
  wb7: ['Kaam ki list: kise kya karna hai, kab tak', 'Task list: who does what, by when', 'কাজের তালিকা: কে কী করবে, কবে মধ্যে', 'काम की लिस्ट: किसे क्या करना है, कब तक'],
  wc1: ['Apne cases aur agli hearing ki date yahan dekhein', 'See your cases and next hearing dates here', 'এখানে নিজের কেস ও পরবর্তী শুনানির তারিখ দেখুন', 'अपने केस और अगली सुनवाई की तारीख यहाँ देखें'],
  wc2: ['Case ke documents dekhein aur download karein', 'View and download your case documents', 'কেসের ডকুমেন্ট দেখুন ও ডাউনলোড করুন', 'केस के डॉक्यूमेंट देखें और डाउनलोड करें'],
  wl_guide: ['Guide dekhein', 'See the guide', 'গাইড দেখুন', 'गाइड देखें'],
  wl_go: ['Shuru karein', 'Get started', 'শুরু করুন', 'शुरू करें'],
  // har tab ke upar ek line
  hint_dash: ['Aaj ka poora haal: hearing, nikli date, kaam aur baaki fees.', 'Your day at a glance: hearings, overdue dates, tasks and dues.', 'আজকের সব: শুনানি, পেরোনো তারিখ, কাজ ও বাকি ফি।', 'आज का पूरा हाल: सुनवाई, निकली तारीख, काम और बाकी फ़ीस।'],
  hint_cal: ['Mahine ka calendar. Kisi din par dabayein, us din ke cases dikhenge.', 'Monthly calendar. Tap a day to see its cases.', 'মাসের ক্যালেন্ডার। কোনো দিনে চাপুন, সেদিনের কেস দেখাবে।', 'महीने का कैलेंडर। किसी दिन पर दबाएँ, उस दिन के केस दिखेंगे।'],
  hint_cases: ['Saare cases. Naya case, next date, Badlav aur eCourts yahin se.', 'All cases. Add a case, set the next date, edit and eCourts from here.', 'সব কেস। নতুন কেস, পরবর্তী তারিখ, এডিট আর eCourts এখান থেকে।', 'सारे केस। नया केस, अगली तारीख, बदलाव और eCourts यहीं से।'],
  hint_mine: ['Aapke cases aur agli hearing ki date. "Kholein" se documents dekhein.', 'Your cases and next hearing dates. Tap "Open" to see documents.', 'আপনার কেস ও পরবর্তী শুনানির তারিখ। "খুলুন" চাপলে ডকুমেন্ট দেখবেন।', 'आपके केस और अगली सुनवाई की तारीख। "खोलें" से डॉक्यूमेंट देखें।'],
  hint_clients: ['Har muvakkil ka profile, uske cases aur baaki fees. Call/WhatsApp yahin se.', "Each client's profile, cases and dues. Call or WhatsApp from here.", 'প্রত্যেক মক্কেলের প্রোফাইল, কেস আর বাকি ফি। কল/WhatsApp এখান থেকে।', 'हर मुवक्किल की प्रोफ़ाइल, उसके केस और बाकी फ़ीस। कॉल/WhatsApp यहीं से।'],
  hint_tasks: ['Team ke kaam. Kaam dein, aakhri tareekh rakhein, ho jaye to ✓ lagayein.', 'Team tasks. Assign work, set a due date, tick ✓ when done.', 'টিমের কাজ। কাজ দিন, শেষ তারিখ রাখুন, হলে ✓ দিন।', 'टीम के काम। काम दें, आख़िरी तारीख रखें, हो जाए तो ✓ लगाएँ।'],
  hint_fees: ['Har case ki fees, jama aur baaki. Receipt aur UPI QR yahin se.', 'Fees, payments and dues for every case. Receipts and UPI QR from here.', 'প্রতিটি কেসের ফি, জমা আর বাকি। রসিদ ও UPI QR এখান থেকে।', 'हर केस की फ़ीस, जमा और बाकी। रसीद और UPI QR यहीं से।'],
  hint_notes: ['Judgment citation, precedent aur munshi ke sandesh. Tag se khojein.', 'Judgment citations, precedents and munshi messages. Search by tag.', 'রায়ের সাইটেশন, নজির আর মুহুরির বার্তা। ট্যাগ দিয়ে খুঁজুন।', 'फ़ैसलों के साइटेशन, नज़ीर और मुंशी के संदेश। टैग से खोजें।'],
  hint_law: ['Purani IPC/CrPC dhaara likhein, nayi BNS/BNSS dhaara dekhein.', 'Type an old IPC/CrPC section, see the new BNS/BNSS one.', 'পুরনো IPC/CrPC ধারা লিখুন, নতুন BNS/BNSS ধারা দেখুন।', 'पुरानी IPC/CrPC धारा लिखें, नई BNS/BNSS धारा देखें।'],
  hint_team: ['Team ke login banayein, password badlein. Chamber settings mein UPI ID.', 'Create team logins and reset passwords. UPI ID is in Chamber settings.', 'টিমের লগইন বানান, পাসওয়ার্ড বদলান। চেম্বার সেটিংসে UPI ID।', 'टीम के लॉगिन बनाएँ, पासवर्ड बदलें। चैंबर सेटिंग में UPI ID।'],
  hint_backup: ['Apne data ki copy download karein. Har hafte ek baar.', 'Download a copy of your data, once a week.', 'নিজের ডেটার কপি ডাউনলোড করুন। সপ্তাহে একবার।', 'अपने डेटा की कॉपी डाउनलोड करें। हर हफ़्ते एक बार।'],
  // guide cards
  g_dash_d: ['Aaj ki hearing, nikli date, agle 7 din, khule kaam aur baaki fees ek nazar mein.', "Today's hearings, overdue dates, next 7 days, open tasks and dues at a glance.", 'আজকের শুনানি, পেরোনো তারিখ, আগামী ৭ দিন, বাকি কাজ ও বাকি ফি এক নজরে।', 'आज की सुनवाई, निकली तारीख, अगले 7 दिन, खुले काम और बाकी फ़ीस एक नज़र में।'],
  g_dash_1: ['Login ke baad sabse pehle Dashboard khulta hai.', 'The Dashboard opens first after login.', 'লগইনের পর প্রথমেই ড্যাশবোর্ড খোলে।', 'लॉगिन के बाद सबसे पहले डैशबोर्ड खुलता है।'],
  g_dash_2: ['Kisi dabbe (jaise "Date nikal gayi") par dabayein, wahi list khulegi.', 'Tap a box (like "Overdue dates") to open that list.', 'কোনো বাক্সে (যেমন "তারিখ পেরিয়ে গেছে") চাপুন, সেই তালিকা খুলবে।', 'किसी डिब्बे (जैसे "तारीख निकल गई") पर दबाएँ, वही लिस्ट खुलेगी।'],
  g_dash_3: ['"Jaldi kaam" se seedhe naya case, client ya kaam jodein.', 'Use "Quick actions" to add a case, client or task straight away.', '"দ্রুত কাজ" থেকে সোজা নতুন কেস, ক্লায়েন্ট বা কাজ যোগ করুন।', '"जल्दी काम" से सीधे नया केस, क्लाइंट या काम जोड़ें।'],
  g_cal_d: ['Mahine bhar ki hearing, tareekh ke hisaab se.', 'All hearings of the month, day by day.', 'সারা মাসের শুনানি, দিন ধরে।', 'पूरे महीने की सुनवाई, तारीख के हिसाब से।'],
  g_cal_1: ['Calendar tab kholein. Laal number = us din kitne cases.', 'Open the Calendar tab. The red number = cases that day.', 'ক্যালেন্ডার ট্যাব খুলুন। লাল সংখ্যা = সেদিন কটা কেস।', 'कैलेंडर टैब खोलें। लाल नंबर = उस दिन कितने केस।'],
  g_cal_2: ['Kisi din par dabayein, neeche us din ke cases aayenge.', 'Tap a day; its cases appear below.', 'কোনো দিনে চাপুন, নিচে সেদিনের কেস আসবে।', 'किसी दिन पर दबाएँ, नीचे उस दिन के केस आएँगे।'],
  g_cal_3: ['‹ › se pichhla ya agla mahina dekhein.', 'Use ‹ › for the previous or next month.', '‹ › দিয়ে আগের বা পরের মাস দেখুন।', '‹ › से पिछला या अगला महीना देखें।'],
  g_cases_d: ['Har case ki diary: number, party, court, thana, stage aur agli date.', 'A diary for every case: number, party, court, police station, stage and next date.', 'প্রতিটি কেসের ডায়েরি: নম্বর, পক্ষ, কোর্ট, থানা, ধাপ আর পরবর্তী তারিখ।', 'हर केस की डायरी: नंबर, पक्ष, कोर्ट, थाना, स्टेज और अगली तारीख।'],
  g_cases_1: ['Cases > "Naya case jodein" > jaankari bharein > "Case save karein".', 'Cases > "Add a new case" > fill in > "Save case".', 'কেস > "নতুন কেস যোগ করুন" > তথ্য দিন > "কেস সেভ করুন"।', 'केस > "नया केस जोड़ें" > जानकारी भरें > "केस सेव करें"।'],
  g_cases_2: ['Case par "Next date" mein nayi tareekh chunein, apne aap save hoti hai.', 'Pick the new date in "Next date" on the case; it saves by itself.', 'কেসে "পরবর্তী তারিখ"-এ নতুন তারিখ বাছুন, নিজে থেকেই সেভ হয়।', 'केस पर "अगली तारीख" में नई तारीख चुनें, अपने आप सेव होती है।'],
  g_cases_3: ['Galti sudhaarni ho to "Badlav". Case poora ho to "Case khatam" (sirf senior).', 'To fix details tap "Edit". When a case ends tap "Case closed" (senior only).', 'ভুল ঠিক করতে "এডিট"। কেস শেষ হলে "কেস শেষ" (শুধু সিনিয়র)।', 'ग़लती सुधारनी हो तो "बदलाव"। केस पूरा हो तो "केस ख़त्म" (सिर्फ़ सीनियर)।'],
  g_cases_4: ['CNR ho to "View on eCourts" dabayein: CNR copy hota hai, eCourts par paste karein.', 'If there is a CNR, tap "View on eCourts": the CNR is copied, paste it on eCourts.', 'CNR থাকলে "eCourts-এ দেখুন" চাপুন: CNR কপি হবে, eCourts-এ পেস্ট করুন।', 'CNR हो तो "eCourts पर देखें" दबाएँ: CNR कॉपी होता है, eCourts पर पेस्ट करें।'],
  g_mine_d: ['Aapke cases aur agli hearing ki tareekh.', 'Your cases and next hearing dates.', 'আপনার কেস আর পরবর্তী শুনানির তারিখ।', 'आपके केस और अगली सुनवाई की तारीख।'],
  g_mine_1: ['"Mere cases" mein har case ki agli date dikhti hai.', '"My cases" shows the next date of every case.', '"আমার কেস"-এ প্রতিটি কেসের পরবর্তী তারিখ দেখা যায়।', '"मेरे केस" में हर केस की अगली तारीख दिखती है।'],
  g_mine_2: ['"Kholein" dabakar case ki poori jaankari aur documents dekhein.', 'Tap "Open" for full details and documents.', '"খুলুন" চেপে কেসের পুরো তথ্য ও ডকুমেন্ট দেখুন।', '"खोलें" दबाकर केस की पूरी जानकारी और डॉक्यूमेंट देखें।'],
  g_mine_3: ['Koi sawaal ho to apne vakil se baat karein.', 'For any question, talk to your advocate.', 'কোনো প্রশ্ন থাকলে নিজের আইনজীবীর সঙ্গে কথা বলুন।', 'कोई सवाल हो तो अपने वकील से बात करें।'],
  g_clients_d: ['Har muvakkil ka profile: mobile, pita/pati, pata, uske cases aur baaki fees.', 'A profile for each client: mobile, father/husband, address, cases and dues.', 'প্রত্যেক মক্কেলের প্রোফাইল: মোবাইল, পিতা/স্বামী, ঠিকানা, কেস ও বাকি ফি।', 'हर मुवक्किल की प्रोफ़ाइल: मोबाइल, पिता/पति, पता, उसके केस और बाकी फ़ीस।'],
  g_clients_1: ['Clients > "Naya client jodein" > naam, mobile bharein > Save.', 'Clients > "Add a new client" > enter name, mobile > Save.', 'ক্লায়েন্ট > "নতুন ক্লায়েন্ট যোগ করুন" > নাম, মোবাইল দিন > সেভ।', 'क्लाइंट > "नया क्लाइंट जोड़ें" > नाम, मोबाइल भरें > सेव।'],
  g_clients_2: ['Naya case jodte waqt client ka naam likhein, list se chunein. Naya naam ho to client apne aap banega.', 'When adding a case, type the client name and pick from the list. A new name creates the client.', 'নতুন কেস যোগের সময় ক্লায়েন্টের নাম লিখে তালিকা থেকে বাছুন। নতুন নাম হলে ক্লায়েন্ট নিজেই তৈরি হবে।', 'नया केस जोड़ते समय क्लाइंट का नाम लिखें, लिस्ट से चुनें। नया नाम हो तो क्लाइंट अपने आप बनेगा।'],
  g_clients_3: ['Client par dabayein: Call, WhatsApp aur "Is client ka naya case".', 'Tap a client for Call, WhatsApp and "New case for this client".', 'ক্লায়েন্টে চাপুন: কল, WhatsApp আর "এই ক্লায়েন্টের নতুন কেস"।', 'क्लाइंट पर दबाएँ: कॉल, WhatsApp और "इस क्लाइंट का नया केस"।'],
  g_tasks_d: ['Team ko kaam dein aur yaad rakhein kya baaki hai.', 'Give work to the team and keep track of what is pending.', 'টিমকে কাজ দিন আর কী বাকি তা মনে রাখুন।', 'टीम को काम दें और याद रखें क्या बाकी है।'],
  g_tasks_1: ['Kaam > "Naya kaam jodein" > naam, aakhri tareekh, kise dena hai > Save.', 'Tasks > "Add a task" > name, due date, assign to > Save.', 'কাজ > "নতুন কাজ যোগ করুন" > নাম, শেষ তারিখ, কাকে দেবেন > সেভ।', 'काम > "नया काम जोड़ें" > नाम, आख़िरी तारीख, किसे देना है > सेव।'],
  g_tasks_2: ['Kaam ho jaye to gol ○ par dabayein, ✓ lag jayega.', 'When a task is done, tap the circle ○ to tick it ✓.', 'কাজ হয়ে গেলে গোল ○-তে চাপুন, ✓ হয়ে যাবে।', 'काम हो जाए तो गोल ○ पर दबाएँ, ✓ लग जाएगा।'],
  g_tasks_3: ['Dashboard par "Khule kaam" mein ginti dikhti hai.', 'The count shows under "Open tasks" on the Dashboard.', 'ড্যাশবোর্ডে "বাকি কাজ"-এ সংখ্যা দেখা যায়।', 'डैशबोर्ड पर "खुले काम" में गिनती दिखती है।'],
  g_fees_t: ['Fees, receipt, UPI QR', 'Fees, receipt, UPI QR', 'ফি, রসিদ, UPI QR', 'फ़ीस, रसीद, UPI QR'],
  g_fees_d: ['Har case ki tay fees, mili rakam aur baaki. Receipt aur UPI QR.', 'Fees charged, received and due for every case. Receipts and UPI QR.', 'প্রতিটি কেসের ধার্য ফি, পাওয়া টাকা ও বাকি। রসিদ ও UPI QR।', 'हर केस की तय फ़ीस, मिली रकम और बाकी। रसीद और UPI QR।'],
  g_fees_1: ['Cases mein case ka "Fees" button dabayein.', 'In Cases, tap the "Fees" button on a case.', 'কেসে ওই কেসের "ফি" বোতাম চাপুন।', 'केस में उस केस का "फ़ीस" बटन दबाएँ।'],
  g_fees_2: ['"Fees tay hui" ya "Fees mili" chunein, rakam likhein > Save.', 'Choose "Fees charged" or "Fees received", enter the amount > Save.', '"ফি ধার্য হয়েছে" বা "ফি পাওয়া গেছে" বাছুন, টাকা লিখুন > সেভ।', '"फ़ीस तय हुई" या "फ़ीस मिली" चुनें, रकम लिखें > सेव।'],
  g_fees_3: ['Baaki ho to QR dikhega: client scan karke UPI se bhej de.', 'If money is due, a QR appears: the client scans it and pays by UPI.', 'বাকি থাকলে QR দেখাবে: ক্লায়েন্ট স্ক্যান করে UPI-তে পাঠাবেন।', 'बाकी हो तो QR दिखेगा: क्लाइंट स्कैन करके UPI से भेज दे।'],
  g_fees_4: ['Fees tab mein mili rakam ke aage "Receipt" se print karein.', 'In the Fees tab, tap "Receipt" next to a payment to print.', 'ফি ট্যাবে পাওয়া টাকার পাশে "রসিদ" চাপলে প্রিন্ট হবে।', 'फ़ीस टैब में मिली रकम के आगे "रसीद" से प्रिंट करें।'],
  g_docs_d: ['Har case ki PDF ya photo (FIR, chargesheet, order) surakshit rakhein.', 'Keep PDFs or photos (FIR, chargesheet, orders) safely with each case.', 'প্রতিটি কেসের PDF বা ছবি (FIR, চার্জশিট, আদেশ) নিরাপদে রাখুন।', 'हर केस की PDF या फ़ोटो (FIR, चार्जशीट, आदेश) सुरक्षित रखें।'],
  g_docs_1: ['Case par "Kholein" > Documents > "File upload karein" (10 MB tak).', 'On a case tap "Open" > Documents > "Upload a file" (up to 10 MB).', 'কেসে "খুলুন" > ডকুমেন্ট > "ফাইল আপলোড করুন" (১০ MB পর্যন্ত)।', 'केस पर "खोलें" > डॉक्यूमेंट > "फ़ाइल अपलोड करें" (10 MB तक)।'],
  g_docs_1c: ['Apne case par "Kholein" > Documents > "Download".', 'On your case tap "Open" > Documents > "Download".', 'নিজের কেসে "খুলুন" > ডকুমেন্ট > "ডাউনলোড"।', 'अपने केस पर "खोलें" > डॉक्यूमेंट > "डाउनलोड"।'],
  g_docs_2: ['Iske liye internet chahiye.', 'This needs internet.', 'এর জন্য ইন্টারনেট লাগবে।', 'इसके लिए इंटरनेट चाहिए।'],
  g_docs_3: ['Files private hain: sirf aapka chamber aur us case ka client dekh sakta hai. Hataana sirf senior.', "Files are private: only your chamber and that case's client can see them. Only a senior can delete.", 'ফাইল প্রাইভেট: শুধু আপনার চেম্বার আর সেই কেসের ক্লায়েন্ট দেখতে পারেন। মুছতে পারেন শুধু সিনিয়র।', 'फ़ाइलें प्राइवेट हैं: सिर्फ़ आपका चैंबर और उस केस का क्लाइंट देख सकता है। हटाना सिर्फ़ सीनियर।'],
  g_drafts_d: ['Vakalatnama, affidavit, bail arzi, notice: case ki jaankari apne aap bhar jati hai.', 'Vakalatnama, affidavit, bail, notice: case details are filled in for you.', 'ওকালতনামা, হলফনামা, জামিন, নোটিশ: কেসের তথ্য নিজে থেকেই বসে যায়।', 'वकालतनामा, शपथपत्र, ज़मानत अर्ज़ी, नोटिस: केस की जानकारी अपने आप भर जाती है।'],
  g_drafts_1: ['Case par "Kholein" > Drafts > template chunein (jaise Bail arzi).', 'On a case tap "Open" > Drafts > pick a template (e.g. bail).', 'কেসে "খুলুন" > খসড়া > টেমপ্লেট বাছুন (যেমন জামিন)।', 'केस पर "खोलें" > ड्राफ़्ट > टेम्पलेट चुनें (जैसे ज़मानत अर्ज़ी)।'],
  g_drafts_2: ['Khaali jagah (____) bharein, text badlein > Save.', 'Fill the blanks (____), edit the text > Save.', 'ফাঁকা জায়গা (____) ভরুন, লেখা বদলান > সেভ।', 'ख़ाली जगह (____) भरें, लिखावट बदलें > सेव।'],
  g_drafts_3: ['"Print / PDF" se A4 par chhaapein ya PDF banayein.', 'Use "Print / PDF" to print on A4 or save a PDF.', '"প্রিন্ট / PDF" দিয়ে A4-এ ছাপুন বা PDF বানান।', '"प्रिंट / PDF" से A4 पर छापें या PDF बनाएँ।'],
  g_drafts_4: ['File karne se pehle vakil zaroor padhkar jaanch lein.', 'The advocate must read and check it before filing.', 'দাখিলের আগে আইনজীবী অবশ্যই পড়ে যাচাই করবেন।', 'फ़ाइल करने से पहले वकील ज़रूर पढ़कर जाँच लें।'],
  g_law_d: ['Purani IPC/CrPC/Evidence dhaara ka naya BNS/BNSS/BSA section.', 'The new BNS/BNSS/BSA section for an old IPC/CrPC/Evidence section.', 'পুরনো IPC/CrPC/Evidence ধারার নতুন BNS/BNSS/BSA ধারা।', 'पुरानी IPC/CrPC/Evidence धारा की नई BNS/BNSS/BSA धारा।'],
  g_law_1: ['BNS khoj mein number ya shabd likhein: 302, chori, 438.', 'In BNS finder type a number or word: 302, theft, 438.', 'BNS খুঁজুন-এ নম্বর বা শব্দ লিখুন: 302, theft, 438।', 'BNS खोज में नंबर या शब्द लिखें: 302, theft, 438।'],
  g_law_2: ['"Case mein jodein" dabakar section case mein daalein.', 'Tap "Add to case" to put the section in a case.', '"কেসে যোগ করুন" চেপে ধারাটি কেসে দিন।', '"केस में जोड़ें" दबाकर धारा केस में डालें।'],
  g_law_3: ['Filing se pehle India Code par zaroor milaayein.', 'Always verify on India Code before filing.', 'দাখিলের আগে India Code-এ অবশ্যই মিলিয়ে নিন।', 'फ़ाइल करने से पहले India Code पर ज़रूर मिलाएँ।'],
  g_notes_d: ['Judgment citation, precedent aur team ke sandesh ek jagah.', 'Judgment citations, precedents and team messages in one place.', 'রায়ের সাইটেশন, নজির আর টিমের বার্তা এক জায়গায়।', 'फ़ैसलों के साइटेशन, नज़ीर और टीम के संदेश एक जगह।'],
  g_notes_1: ['Notes > "Naya note jodein" > shirshak, tag, likhein > Save.', 'Notes > "Add a note" > title, tag, text > Save.', 'নোট > "নতুন নোট যোগ করুন" > শিরোনাম, ট্যাগ, লেখা > সেভ।', 'नोट्स > "नया नोट जोड़ें" > शीर्षक, टैग, लिखें > सेव।'],
  g_notes_2: ['Chahein to case se jodein. "Private" note sirf senior dekhta hai.', 'Link it to a case if you like. A "Private" note is seen only by the senior.', 'চাইলে কেসের সঙ্গে যুক্ত করুন। "প্রাইভেট" নোট শুধু সিনিয়র দেখেন।', 'चाहें तो केस से जोड़ें। "प्राइवेट" नोट सिर्फ़ सीनियर देखते हैं।'],
  g_notes_3: ['Upar khoj mein shabd ya tag likhkar note dhoondhein.', 'Find notes by typing a word or tag in the search box.', 'উপরের খোঁজে শব্দ বা ট্যাগ লিখে নোট খুঁজুন।', 'ऊपर खोज में शब्द या टैग लिखकर नोट ढूँढें।'],
  g_team_d: ['Junior, munshi, client ke login aur chamber settings (UPI ID, vakil ka naam).', 'Logins for junior, munshi and client, plus chamber settings (UPI ID, advocate name).', 'জুনিয়র, মুহুরি, ক্লায়েন্টের লগইন আর চেম্বার সেটিংস (UPI ID, অ্যাডভোকেটের নাম)।', 'जूनियर, मुंशी, क्लाइंट के लॉगिन और चैंबर सेटिंग (UPI ID, वकील का नाम)।'],
  g_team_1: ['Team > "Naya member jodein" > naam, email, kaam (role), password > banayein.', 'Team > "Add a team member" > name, email, role, password > create.', 'টিম > "নতুন সদস্য যোগ করুন" > নাম, ইমেইল, ভূমিকা, পাসওয়ার্ড > তৈরি।', 'टीम > "नया सदस्य जोड़ें" > नाम, ईमेल, भूमिका, पासवर्ड > बनाएँ।'],
  g_team_2: ['Wahi email aur password us vyakti ko dein. Junior sirf apne cases dekhta hai, client sirf apne.', 'Give that email and password to the person. A junior sees only assigned cases, a client only their own.', 'সেই ইমেইল-পাসওয়ার্ড ব্যক্তিকে দিন। জুনিয়র শুধু নিজের কেস দেখেন, ক্লায়েন্ট শুধু নিজের।', 'वही ईमेल और पासवर्ड उस व्यक्ति को दें। जूनियर सिर्फ़ अपने केस देखता है, क्लाइंट सिर्फ़ अपने।'],
  g_team_3: ['"Chamber settings" mein UPI ID aur vakil ka naam daalein > Save.', 'In "Chamber settings" enter the UPI ID and advocate name > Save.', '"চেম্বার সেটিংস"-এ UPI ID ও অ্যাডভোকেটের নাম দিন > সেভ।', '"चैंबर सेटिंग" में UPI ID और वकील का नाम डालें > सेव।'],
  g_team_4: ['Koi password bhool jaye to uske aage "Password badlein".', 'If someone forgets a password, tap "Reset password" next to them.', 'কেউ পাসওয়ার্ড ভুললে তার পাশে "পাসওয়ার্ড বদলান"।', 'कोई पासवर्ड भूल जाए तो उसके आगे "पासवर्ड बदलें"।'],
  g_backup_d: ['Apne saare data ki copy apne paas (Excel aur poora backup).', 'A copy of all your data with you (Excel and full backup).', 'সব ডেটার কপি নিজের কাছে (Excel ও পুরো ব্যাকআপ)।', 'अपने सारे डेटा की कॉपी अपने पास (Excel और पूरा बैकअप)।'],
  g_backup_1: ['Backup tab > "Cases aur Fees (Excel)" dabayein.', 'Backup tab > tap "Cases and Fees (Excel)".', 'ব্যাকআপ ট্যাব > "কেস ও ফি (Excel)" চাপুন।', 'बैकअप टैब > "केस और फ़ीस (Excel)" दबाएँ।'],
  g_backup_2: ['"Poora backup (JSON)" bhi lein.', 'Also take the "Full backup (JSON)".', '"পুরো ব্যাকআপ (JSON)"-ও নিন।', '"पूरा बैकअप (JSON)" भी लें।'],
  g_backup_3: ['Files Google Drive ya pendrive mein rakhein. Har hafte ek baar.', 'Keep the files in Google Drive or on a pen drive. Once a week.', 'ফাইলগুলো Google Drive বা পেনড্রাইভে রাখুন। সপ্তাহে একবার।', 'फ़ाइलें Google Drive या पेनड्राइव में रखें। हर हफ़्ते एक बार।'],
  g_wa_d: ['Client ko ek dabaav mein agli date ka WhatsApp sandesh.', 'Send the client the next date on WhatsApp in one tap.', 'এক চাপে ক্লায়েন্টকে পরবর্তী তারিখের WhatsApp বার্তা।', 'एक बटन से क्लाइंट को अगली तारीख का WhatsApp संदेश।'],
  g_wa_1: ['Case mein client ka mobile aur next date honi chahiye.', "The case needs the client's mobile and a next date.", 'কেসে ক্লায়েন্টের মোবাইল ও পরবর্তী তারিখ থাকতে হবে।', 'केस में क्लाइंट का मोबाइल और अगली तारीख होनी चाहिए।'],
  g_wa_2: ['Case par "WhatsApp reminder" dabayein.', 'Tap "WhatsApp reminder" on the case.', 'কেসে "WhatsApp রিমাইন্ডার" চাপুন।', 'केस पर "WhatsApp रिमाइंडर" दबाएँ।'],
  g_wa_3: ['WhatsApp mein sandesh taiyaar milega, bas Send dabayein.', 'The message is ready in WhatsApp; just tap Send.', 'WhatsApp-এ বার্তা তৈরি থাকবে, শুধু Send চাপুন।', 'WhatsApp में संदेश तैयार मिलेगा, बस Send दबाएँ।'],
  g_off_t: ['Net na ho tab bhi', 'Works offline', 'নেট ছাড়াও চলে', 'नेट न हो तब भी'],
  g_off_d: ['Court mein net na ho to bhi entry karein.', 'Make entries even when there is no network in court.', 'কোর্টে নেট না থাকলেও এন্ট্রি করুন।', 'कोर्ट में नेट न हो तो भी एंट्री करें।'],
  g_off_1: ['Upar "Offline" likha ho tab bhi date, fees, kaam daalein.', 'Even when it says "Offline" at the top, enter dates, fees and tasks.', 'উপরে "অফলাইন" লেখা থাকলেও তারিখ, ফি, কাজ দিন।', 'ऊपर "ऑफ़लाइन" लिखा हो तब भी तारीख, फ़ीस, काम डालें।'],
  g_off_2: ['Entry phone mein save hoti hai; upar "sync baaki" dikhta hai.', 'Entries are saved on the phone; the top shows "waiting to sync".', 'এন্ট্রি ফোনে সেভ থাকে; উপরে "সিঙ্কের অপেক্ষায়" দেখায়।', 'एंट्री फ़ोन में सेव होती है; ऊपर "सिंक बाकी" दिखता है।'],
  g_off_3: ['Net aate hi sab apne aap server par chala jata hai. Documents ke liye net chahiye.', 'When the net returns, everything goes to the server by itself. Documents need internet.', 'নেট এলেই সব নিজে থেকে সার্ভারে চলে যায়। ডকুমেন্টের জন্য নেট লাগে।', 'नेट आते ही सब अपने आप सर्वर पर चला जाता है। डॉक्यूमेंट के लिए नेट चाहिए।'],
  g_inst_t: ['Phone par install', 'Install on phone', 'ফোনে ইনস্টল', 'फ़ोन पर इंस्टॉल'],
  g_inst_d: ['App ko phone ki Home screen par rakhein, ek dabaav mein khule.', "Put the app on your phone's Home screen so it opens in one tap.", 'অ্যাপটি ফোনের হোম স্ক্রিনে রাখুন, এক চাপে খুলবে।', 'ऐप को फ़ोन की होम स्क्रीन पर रखें, एक बटन से खुले।'],
  g_inst_1: ['Chrome mein app kholein.', 'Open the app in Chrome.', 'Chrome-এ অ্যাপ খুলুন।', 'Chrome में ऐप खोलें।'],
  g_inst_2: ['Upar "App install karein" dikhe to dabayein. Na dikhe to ⋮ menu > "Add to Home screen".', 'Tap "Install app" at the top if you see it. Otherwise ⋮ menu > "Add to Home screen".', 'উপরে "অ্যাপ ইনস্টল করুন" দেখালে চাপুন। না দেখালে ⋮ মেনু > "Add to Home screen"।', 'ऊपर "ऐप इंस्टॉल करें" दिखे तो दबाएँ। न दिखे तो ⋮ मेनू > "Add to Home screen"।'],
  g_inst_3: ['iPhone: Safari > Share > "Add to Home Screen".', 'iPhone: Safari > Share > "Add to Home Screen".', 'iPhone: Safari > Share > "Add to Home Screen"।', 'iPhone: Safari > Share > "Add to Home Screen"।'],
  g_lang_t: ['Bhasha badlein', 'Change language', 'ভাষা বদলান', 'भाषा बदलें'],
  g_lang_d: ['English, বাংলা, हिन्दी ya Hinglish, jo pasand ho.', 'English, Bengali, Hindi or Hinglish, whichever you like.', 'English, বাংলা, हिन्दी বা Hinglish, যেটা পছন্দ।', 'English, বাংলা, हिन्दी या Hinglish, जो पसंद हो।'],
  g_lang_1: ['Upar bhasha wale dabbe par dabayein.', 'Tap the language box at the top.', 'উপরে ভাষার বাক্সে চাপুন।', 'ऊपर भाषा वाले डिब्बे पर दबाएँ।'],
  g_lang_2: ['Bhasha chunein. Ye isi phone par yaad rahegi.', 'Pick a language. This phone will remember it.', 'ভাষা বাছুন। এই ফোনে মনে থাকবে।', 'भाषा चुनें। यह इसी फ़ोन पर याद रहेगी।'],
  g_pw_d: ['Apna password khud badlein.', 'Change your own password.', 'নিজের পাসওয়ার্ড নিজেই বদলান।', 'अपना पासवर्ड ख़ुद बदलें।'],
  g_pw_1: ['Sabse neeche "Mera password badlein" dabayein (ya yahan "Kholein").', 'Tap "Change my password" at the very bottom (or "Open" here).', 'একদম নিচে "আমার পাসওয়ার্ড বদলান" চাপুন (বা এখানে "খুলুন")।', 'सबसे नीचे "मेरा पासवर्ड बदलें" दबाएँ (या यहाँ "खोलें")।'],
  g_pw_2: ['Abhi ka password, phir naya password (8+ akshar) likhein.', 'Enter the current password, then the new one (8+ characters).', 'বর্তমান পাসওয়ার্ড, তারপর নতুন পাসওয়ার্ড (৮+ অক্ষর) লিখুন।', 'अभी का पासवर्ड, फिर नया पासवर्ड (8+ अक्षर) लिखें।'],
  g_pw_3: ['Bhool gaye to senior (Team tab) ya support se naya password lein.', 'Forgot it? Ask the senior (Team tab) or support for a new one.', 'ভুলে গেলে সিনিয়র (টিম ট্যাব) বা সহায়তা থেকে নতুন পাসওয়ার্ড নিন।', 'भूल गए तो सीनियर (टीम टैब) या सहायता से नया पासवर्ड लें।'],
  // login page
  lp_lead: ['Chanchal Court aur Malda ke vakilon ke liye case diary aur chamber software.', 'Case diary and chamber software for advocates of Chanchal Court and Malda.', 'চাঁচল কোর্ট ও মালদার আইনজীবীদের জন্য কেস ডায়েরি ও চেম্বার সফটওয়্যার।', 'चांचल कोर्ट और मालदा के वकीलों के लिए केस डायरी और चैंबर सॉफ़्टवेयर।'],
  lp_f1: ['Case diary, agli date', 'Case diary & next date', 'কেস ডায়েরি, পরবর্তী তারিখ', 'केस डायरी, अगली तारीख'], lp_f1d: ['Koi date na chhoote', 'Never miss a date', 'কোনো তারিখ মিস নয়', 'कोई तारीख न छूटे'],
  lp_f2: ['Dashboard', 'Dashboard', 'ড্যাশবোর্ড', 'डैशबोर्ड'], lp_f2d: ['Aaj ka haal ek nazar mein', 'Your day at a glance', 'আজকের সব এক নজরে', 'आज का हाल एक नज़र में'],
  lp_f3: ['Clients', 'Clients', 'ক্লায়েন্ট', 'क्लाइंट'], lp_f3d: ['Profile, cases, baaki fees', 'Profile, cases, dues', 'প্রোফাইল, কেস, বাকি ফি', 'प्रोफ़ाइल, केस, बाकी फ़ीस'],
  lp_f4: ['Documents', 'Documents', 'ডকুমেন্ট', 'डॉक्यूमेंट'], lp_f4d: ['FIR, order ki PDF/photo', 'PDFs/photos of FIR, orders', 'FIR, আদেশের PDF/ছবি', 'FIR, आदेश की PDF/फ़ोटो'],
  lp_f5: ['Drafting templates', 'Drafting templates', 'খসড়া টেমপ্লেট', 'ड्राफ़्टिंग टेम्पलेट'], lp_f5d: ['Vakalatnama, bail arzi', 'Vakalatnama, bail', 'ওকালতনামা, জামিন', 'वकालतनामा, ज़मानत अर्ज़ी'],
  lp_f6: ['BNS khoj', 'BNS finder', 'BNS খুঁজুন', 'BNS खोज'], lp_f6d: ['IPC 302 → BNS 103', 'IPC 302 → BNS 103', 'IPC 302 → BNS 103', 'IPC 302 → BNS 103'],
  lp_f7: ['Fees + UPI QR', 'Fees + UPI QR', 'ফি + UPI QR', 'फ़ीस + UPI QR'], lp_f7d: ['Hisaab, receipt, QR', 'Accounts, receipts, QR', 'হিসাব, রসিদ, QR', 'हिसाब, रसीद, QR'],
  lp_f8: ['Team login', 'Team logins', 'টিম লগইন', 'टीम लॉगिन'], lp_f8d: ['Senior, junior, munshi, client', 'Senior, junior, munshi, client', 'সিনিয়র, জুনিয়র, মুহুরি, ক্লায়েন্ট', 'सीनियर, जूनियर, मुंशी, क्लाइंट'],
  lp_f9: ['WhatsApp reminder', 'WhatsApp reminder', 'WhatsApp রিমাইন্ডার', 'WhatsApp रिमाइंडर'], lp_f9d: ['Client ko agli date', 'Next date to clients', 'ক্লায়েন্টকে পরবর্তী তারিখ', 'क्लाइंट को अगली तारीख'],
  lp_f10: ['Net na ho tab bhi', 'Works offline', 'নেট ছাড়াও চলে', 'नेट न हो तब भी'], lp_f10d: ['Net aate hi sync', 'Syncs when back online', 'নেট এলেই সিঙ্ক', 'नेट आते ही सिंक'],
  lp_f11: ['4 bhasha', '4 languages', '৪টি ভাষা', '4 भाषाएँ'], lp_f11d: ['English, বাংলা, हिन्दी, Hinglish', 'English, বাংলা, हिन्दी, Hinglish', 'English, বাংলা, हिन्दी, Hinglish', 'English, বাংলা, हिन्दी, Hinglish'],
  lp_dev: ['Software banaya aur chalaya', 'Built and run by', 'সফটওয়্যার তৈরি ও পরিচালনা', 'सॉफ़्टवेयर बनाया और चलाया'],
  lp_place: ['Chanchal, Malda, West Bengal', 'Chanchal, Malda, West Bengal', 'চাঁচল, মালদা, পশ্চিমবঙ্গ', 'चांचल, मालदा, पश्चिम बंगाल'],
  lp_demo: ['WhatsApp pe demo', 'Demo on WhatsApp', 'WhatsApp-এ ডেমো', 'WhatsApp पर डेमो']
});

// chhote SVG icon (emoji nahi, taaki har phone par ek jaise dikhein)
const IC = {
  dash: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  cases: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .7 3.5 2.8 3.5 6"/>',
  tasks: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
  fees: '<path d="M6 4h12M6 9h12M9 4a5 5 0 0 1 0 10H6l8 6"/>',
  docs: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  drafts: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  law: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  notes: '<path d="M5 3h10l4 4v14H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
  wa: '<path d="M21 12a8 8 0 0 1-11.8 7L3 21l2-6A8 8 0 1 1 21 12z"/>',
  team: '<circle cx="10" cy="8" r="4"/><path d="M3 21c0-4 3-7 7-7s7 3 7 7M19 8v6M16 11h6"/>',
  backup: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  off: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  inst: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  lang: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  pw: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  ok: '<path d="m5 12 5 5 9-10"/>'
};
const ico = (k, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k] || ''}</svg>`;

// ---------- v5.1: storage, link, Google Drive — 4 bhasha [Hinglish, English, বাংলা, हिन्दी] ----------
Object.assign(D, {
  d_free: ['Free plan 1 GB (Supabase)', 'Free plan 1 GB (Supabase)', 'ফ্রি প্ল্যান ১ GB (Supabase)', 'फ़्री प्लान 1 GB (Supabase)'],
  d_free_r2: ['Free plan 10 GB (Cloudflare R2)', 'Free plan 10 GB (Cloudflare R2)', 'ফ্রি প্ল্যান ১০ GB (Cloudflare R2)', 'फ़्री प्लान 10 GB (Cloudflare R2)'],
  doc_add: ['📷 Photo/PDF daalein', '📷 Add photo/PDF', '📷 ছবি/PDF দিন', '📷 फ़ोटो/PDF डालें'],
  doc_link: ['🔗 Link chipkayein', '🔗 Paste a link', '🔗 লিংক পেস্ট করুন', '🔗 लिंक चिपकाएँ'],
  doc_to_app: ['PDF/JPG/PNG, 10 MB tak. Photo apne aap chhoti ho jaati hai.', 'PDF/JPG/PNG, up to 10 MB. Photos are made smaller automatically.', 'PDF/JPG/PNG, ১০ MB পর্যন্ত। ছবি নিজে থেকেই ছোট হয়ে যায়।', 'PDF/JPG/PNG, 10 MB तक। फ़ोटो अपने आप छोटी हो जाती है।'],
  doc_to_drive: ['Files aapki Google Drive mein jayengi (folder "Court Connect").', 'Files go to your Google Drive (folder "Court Connect").', 'ফাইল আপনার Google Drive-এ যাবে (ফোল্ডার "Court Connect")।', 'फ़ाइलें आपकी Google Drive में जाएँगी (फ़ोल्डर "Court Connect")।'],
  doc_shrunk: ['Photo chhoti ki: {0} → {1}', 'Photo compressed: {0} → {1}', 'ছবি ছোট করা হলো: {0} → {1}', 'फ़ोटो छोटी की: {0} → {1}'],
  dk_link: ['Link', 'Link', 'লিংক', 'लिंक'], dk_drive: ['Google Drive', 'Google Drive', 'Google Drive', 'Google Drive'],
  gd_connect: ['Google Drive jodein (ek baar)', 'Connect Google Drive (one time)', 'Google Drive যুক্ত করুন (একবার)', 'Google Drive जोड़ें (एक बार)'],
  gd_on: ['✓ Drive judi hai ({0})', '✓ Drive connected ({0})', '✓ Drive যুক্ত আছে ({0})', '✓ Drive जुड़ी है ({0})'],
  gd_off: ['Drive hatayein', 'Disconnect Drive', 'Drive সরান', 'Drive हटाएँ'],
  gd_off_q: ['Google Drive ka jod hata dein? Files Drive mein hi rahengi, par team unhe app se nahi khol payegi.', 'Disconnect Google Drive? Files stay in your Drive, but the team will not be able to open them from the app.', 'Google Drive-এর সংযোগ সরাবেন? ফাইল Drive-এই থাকবে, কিন্তু টিম অ্যাপ থেকে খুলতে পারবে না।', 'Google Drive का जोड़ हटा दें? फ़ाइलें Drive में ही रहेंगी, पर टीम उन्हें ऐप से नहीं खोल पाएगी।'],
  gd_ok: ['Google Drive jud gayi', 'Google Drive connected', 'Google Drive যুক্ত হয়েছে', 'Google Drive जुड़ गई'],
  gd_no: ['Google Drive nahi judi ("Allow" nahi dabaya)', 'Google Drive not connected ("Allow" was not tapped)', 'Google Drive যুক্ত হয়নি ("Allow" চাপা হয়নি)', 'Google Drive नहीं जुड़ी ("Allow" नहीं दबाया)'],
  gd_err: ['Google Drive nahi judi, dobara try karein', 'Could not connect Google Drive, please try again', 'Google Drive যুক্ত হয়নি, আবার চেষ্টা করুন', 'Google Drive नहीं जुड़ी, दोबारा कोशिश करें'],
  gd_removed: ['Drive hata di gayi', 'Drive disconnected', 'Drive সরানো হয়েছে', 'Drive हटा दी गई'],
  gd_fallback: ['Drive se jud nahi paye, file app mein save hui', 'Could not reach Drive; the file was saved in the app', 'Drive-এ পৌঁছানো যায়নি, ফাইল অ্যাপে সেভ হয়েছে', 'Drive से जुड़ नहीं पाए, फ़ाइल ऐप में सेव हुई'],
  lk_h: ['Link chipkayein', 'Paste a link', 'লিংক পেস্ট করুন', 'लिंक चिपकाएँ'],
  lk_name: ['Naam (jaise FIR copy)', 'Name (e.g. FIR copy)', 'নাম (যেমন FIR কপি)', 'नाम (जैसे FIR कॉपी)'],
  lk_url: ['Link (https://...)', 'Link (https://...)', 'লিংক (https://...)', 'लिंक (https://...)'],
  lk_help: ['Google Drive mein file > Share > General access "Restricted" > "Copy link". Phir yahan paste karein.', 'In Google Drive: file > Share > General access "Restricted" > "Copy link". Then paste it here.', 'Google Drive-এ ফাইল > Share > General access "Restricted" > "Copy link"। তারপর এখানে পেস্ট করুন।', 'Google Drive में फ़ाइल > Share > General access "Restricted" > "Copy link"। फिर यहाँ पेस्ट करें।'],
  lk_save: ['Link jodein', 'Add link', 'লিংক যোগ করুন', 'लिंक जोड़ें'],
  lk_bad: ['Sirf https:// wala sahi link chalega', 'Only a valid https:// link is allowed', 'শুধু সঠিক https:// লিংক চলবে', 'सिर्फ़ https:// वाला सही लिंक चलेगा'],
  lk_warn: ['Ye Google Drive ka link nahi hai. Sirf bharosemand site ka link daalein. Phir bhi jodna hai?', 'This is not a Google Drive link. Only add links from sites you trust. Add it anyway?', 'এটি Google Drive-এর লিংক নয়। শুধু বিশ্বস্ত সাইটের লিংক দিন। তবুও যোগ করবেন?', 'यह Google Drive का लिंक नहीं है। सिर्फ़ भरोसेमंद साइट का लिंक डालें। फिर भी जोड़ना है?'],
  lk_ok: ['Link jud gaya', 'Link added', 'লিংক যোগ হয়েছে', 'लिंक जुड़ गया'],
  // Madad / Guide
  g_docs_1: ['Case par "Kholein" > Documents > "📷 Photo/PDF daalein" (10 MB tak). Phone par camera se photo bhi le sakte hain.', 'On a case tap "Open" > Documents > "📷 Add photo/PDF" (up to 10 MB). On a phone you can also take a photo with the camera.', 'কেসে "খুলুন" > ডকুমেন্ট > "📷 ছবি/PDF দিন" (১০ MB পর্যন্ত)। ফোনে ক্যামেরা দিয়ে ছবিও তুলতে পারেন।', 'केस पर "खोलें" > डॉक्यूमेंट > "📷 फ़ोटो/PDF डालें" (10 MB तक)। फ़ोन पर कैमरे से फ़ोटो भी ले सकते हैं।'],
  g_docs_4: ['Photo upload karne se pehle app use apne aap chhota kar deta hai (1600px, JPEG), jaise 4 MB → 0.4 MB. PDF waise hi jaati hai. Isse sabki jagah bachti hai.', 'Before upload the app shrinks photos automatically (1600px, JPEG), e.g. 4 MB → 0.4 MB. PDFs go as they are. This saves space for everyone.', 'আপলোডের আগে অ্যাপ নিজেই ছবি ছোট করে (1600px, JPEG), যেমন 4 MB → 0.4 MB। PDF যেমন আছে তেমনই যায়। এতে সবার জায়গা বাঁচে।', 'अपलोड से पहले ऐप फ़ोटो को अपने आप छोटा कर देता है (1600px, JPEG), जैसे 4 MB → 0.4 MB। PDF वैसे ही जाती है। इससे सबकी जगह बचती है।'],
  g_link_d: ['File Google Drive mein pehle se hai? Upload ki jagah uska link case mein chipka dein. App ki jagah bilkul nahi lagti.', 'Is the file already in Google Drive? Paste its link into the case instead of uploading. It uses no app space at all.', 'ফাইল আগে থেকেই Google Drive-এ আছে? আপলোডের বদলে তার লিংক কেসে পেস্ট করুন। অ্যাপের কোনো জায়গা লাগে না।', 'फ़ाइल पहले से Google Drive में है? अपलोड की जगह उसका लिंक केस में चिपका दें। ऐप की बिल्कुल जगह नहीं लगती।'],
  g_link_1: ['Phone par: Google Drive app > file ke aage ⋮ > Share > General access "Restricted" rehne dein > "Copy link".', 'On a phone: Google Drive app > ⋮ next to the file > Share > keep General access "Restricted" > "Copy link".', 'ফোনে: Google Drive অ্যাপ > ফাইলের পাশে ⋮ > Share > General access "Restricted" রাখুন > "Copy link"।', 'फ़ोन पर: Google Drive ऐप > फ़ाइल के आगे ⋮ > Share > General access "Restricted" रहने दें > "Copy link"।'],
  g_link_2: ['Computer par: drive.google.com > file par right-click > Share > General access "Restricted" > "Copy link".', 'On a computer: drive.google.com > right-click the file > Share > General access "Restricted" > "Copy link".', 'কম্পিউটারে: drive.google.com > ফাইলে right-click > Share > General access "Restricted" > "Copy link"।', 'कंप्यूटर पर: drive.google.com > फ़ाइल पर right-click > Share > General access "Restricted" > "Copy link"।'],
  g_link_3: ['"Restricted" link sirf unhe khulta hai jinka Gmail "Add people" mein joda hai. Team ya client ko dikhana ho to unka Gmail wahan jodein.', 'A "Restricted" link opens only for people whose Gmail is added under "Add people". Add your team or client there if they need it.', '"Restricted" লিংক শুধু তাঁদের জন্য খোলে যাঁদের Gmail "Add people"-এ যোগ করা আছে। টিম বা ক্লায়েন্টকে দেখাতে হলে তাঁদের Gmail সেখানে যোগ করুন।', '"Restricted" लिंक सिर्फ़ उन्हें खुलता है जिनका Gmail "Add people" में जोड़ा है। टीम या क्लाइंट को दिखाना हो तो उनका Gmail वहाँ जोड़ें।'],
  g_link_4: ['App mein: case > Documents > "🔗 Link chipkayein" > naam likhein, link paste karein > "Link jodein".', 'In the app: case > Documents > "🔗 Paste a link" > type a name, paste the link > "Add link".', 'অ্যাপে: কেস > ডকুমেন্ট > "🔗 লিংক পেস্ট করুন" > নাম লিখুন, লিংক পেস্ট করুন > "লিংক যোগ করুন"।', 'ऐप में: केस > डॉक्यूमेंट > "🔗 लिंक चिपकाएँ" > नाम लिखें, लिंक पेस्ट करें > "लिंक जोड़ें"।'],
  gd_t: ['Google Drive jodein', 'Connect Google Drive', 'Google Drive যুক্ত করুন', 'Google Drive जोड़ें'],
  g_gdrive_d: ['Ek baar jodne ke baad aapki upload ki files aapki apni Google Drive (folder "Court Connect") mein jaati hain. App ki jagah bachti hai.', 'After a one-time connection, files you upload go to your own Google Drive (folder "Court Connect"). This saves app space.', 'একবার যুক্ত করলে আপনার আপলোড করা ফাইল আপনার নিজের Google Drive-এ (ফোল্ডার "Court Connect") যায়। অ্যাপের জায়গা বাঁচে।', 'एक बार जोड़ने के बाद आपकी अपलोड की फ़ाइलें आपकी अपनी Google Drive (फ़ोल्डर "Court Connect") में जाती हैं। ऐप की जगह बचती है।'],
  g_gdrive_1: ['Ek baar: kisi bhi case > Documents > "Google Drive jodein (ek baar)" > apna Gmail chunein > "Allow". Phone aur computer dono par yahi tareeka.', 'One time: any case > Documents > "Connect Google Drive (one time)" > choose your Gmail > "Allow". Same on phone and computer.', 'একবার: যেকোনো কেস > ডকুমেন্ট > "Google Drive যুক্ত করুন (একবার)" > নিজের Gmail বাছুন > "Allow"। ফোন আর কম্পিউটারে একই নিয়ম।', 'एक बार: किसी भी केस > डॉक्यूमेंट > "Google Drive जोड़ें (एक बार)" > अपना Gmail चुनें > "Allow"। फ़ोन और कंप्यूटर दोनों पर यही तरीका।'],
  g_gdrive_2: ['Phir "📷 Photo/PDF daalein" se file apne aap Drive mein jaati hai. Team aur client app se hi khol lete hain, Drive share karne ki zaroorat nahi.', 'Then "📷 Add photo/PDF" sends the file to Drive automatically. Your team and client open it from the app; no Drive sharing needed.', 'তারপর "📷 ছবি/PDF দিন" দিলে ফাইল নিজে থেকেই Drive-এ যায়। টিম আর ক্লায়েন্ট অ্যাপ থেকেই খোলেন, Drive শেয়ার করতে হয় না।', 'फिर "📷 फ़ोटो/PDF डालें" से फ़ाइल अपने आप Drive में जाती है। टीम और क्लाइंट ऐप से ही खोल लेते हैं, Drive शेयर करने की ज़रूरत नहीं।'],
  g_gdrive_3: ['App sirf apni banayi files dekh sakta hai, aapki baaki Drive nahi. Band karna ho to Documents mein "Drive hatayein".', 'The app can see only the files it created, not the rest of your Drive. To stop, tap "Disconnect Drive" in Documents.', 'অ্যাপ শুধু নিজের তৈরি ফাইল দেখতে পায়, আপনার বাকি Drive নয়। বন্ধ করতে ডকুমেন্টে "Drive সরান"।', 'ऐप सिर्फ़ अपनी बनाई फ़ाइलें देख सकता है, आपकी बाकी Drive नहीं। बंद करना हो तो डॉक्यूमेंट में "Drive हटाएँ"।']
});
Object.assign(E, {
  'Sirf https:// wala sahi link chalega': ['Only a valid https:// link is allowed', 'শুধু সঠিক https:// লিংক চলবে'],
  'Google Drive abhi band hai': ['Google Drive is not available right now', 'Google Drive এখন বন্ধ আছে'],
  'Ye file abhi nahi khul sakti (storage setting dekhein)': ['This file cannot be opened right now (check storage settings)', 'এই ফাইল এখন খোলা যাচ্ছে না (স্টোরেজ সেটিং দেখুন)'],
  'Link purana ho gaya, dobara Download dabayein': ['The link expired, tap Download again', 'লিংকের মেয়াদ শেষ, আবার ডাউনলোড চাপুন'],
  'Drive se file nahi mil rahi (upload karne wale ne Drive hata di?)': ['Could not get the file from Drive (did the uploader disconnect Drive?)', 'Drive থেকে ফাইল পাওয়া যাচ্ছে না (আপলোডকারী কি Drive সরিয়েছেন?)']
});
Object.assign(HE, {
  'Sirf https:// wala sahi link chalega': 'सिर्फ़ https:// वाला सही लिंक चलेगा', 'Google Drive abhi band hai': 'Google Drive अभी बंद है',
  'Ye file abhi nahi khul sakti (storage setting dekhein)': 'यह फ़ाइल अभी नहीं खुल सकती (स्टोरेज सेटिंग देखें)',
  'Link purana ho gaya, dobara Download dabayein': 'लिंक पुराना हो गया, दोबारा डाउनलोड दबाएँ',
  'Drive se file nahi mil rahi (upload karne wale ne Drive hata di?)': 'Drive से फ़ाइल नहीं मिल रही (अपलोड करने वाले ने Drive हटा दी?)'
});

// ---------- v5.2: eCourts (official web/app + eCourtsIndia live status) — 4 bhasha [Hinglish, English, বাংলা, हिन्दी] ----------
Object.assign(D, {
  cnr_copied: ['CNR copy ho gaya — eCourts site par CNR box mein paste karein, phir CAPTCHA bharein.', 'CNR copied — paste it in the CNR box on the eCourts site, then fill the CAPTCHA.', 'CNR কপি হয়েছে — eCourts সাইটে CNR বক্সে পেস্ট করুন, তারপর CAPTCHA দিন।', 'CNR कॉपी हो गया — eCourts साइट पर CNR बॉक्स में पेस्ट करें, फिर CAPTCHA भरें।'],
  ref_h: ['Case Ref', 'Case references', 'কেস রেফারেন্স', 'केस रेफ़रेंस'],
  ref_none: ['Abhi koi ref nahi. Judgment ka hawala ya juda hua case jodein.', 'No references yet. Add a judgment citation or a linked case.', 'এখনও কোনো রেফারেন্স নেই। রায়ের উদ্ধৃতি বা যুক্ত কেস যোগ করুন।', 'अभी कोई रेफ़रेंस नहीं। फ़ैसले का हवाला या जुड़ा केस जोड़ें।'],
  ref_law: ['Judgment', 'Judgment', 'রায়', 'फ़ैसला'],
  ref_case: ['Juda case', 'Linked case', 'যুক্ত কেস', 'जुड़ा केस'],
  ref_addlaw: ['+ Judgment ka hawala', '+ Judgment citation', '+ রায়ের উদ্ধৃতি', '+ फ़ैसले का हवाला'],
  ref_addcase: ['+ Juda case', '+ Linked case', '+ যুক্ত কেস', '+ जुड़ा केस'],
  ref_cite_law: ['Citation, jaise (2014) 8 SCC 273', 'Citation, e.g. (2014) 8 SCC 273', 'উদ্ধৃতি, যেমন (2014) 8 SCC 273', 'हवाला, जैसे (2014) 8 SCC 273'],
  ref_title_law: ['Case ka naam, jaise Arnesh Kumar vs State of Bihar', 'Case name, e.g. Arnesh Kumar vs State of Bihar', 'কেসের নাম, যেমন Arnesh Kumar vs State of Bihar', 'केस का नाम, जैसे Arnesh Kumar vs State of Bihar'],
  ref_note_law: ['Kis baat ke liye (jaise: 7 saal tak ki saza mein arrest nahi)', 'Point it supports (e.g. no arrest for offences up to 7 years)', 'কোন বিষয়ে (যেমন: ৭ বছর পর্যন্ত সাজায় গ্রেপ্তার নয়)', 'किस बात के लिए (जैसे: 7 साल तक की सज़ा में गिरफ़्तारी नहीं)'],
  ref_cite_case: ['Case number, jaise Bail Misc 120/2026 ya CNR', 'Case number, e.g. Bail Misc 120/2026 or CNR', 'কেস নম্বর, যেমন Bail Misc 120/2026 বা CNR', 'केस नंबर, जैसे Bail Misc 120/2026 या CNR'],
  ref_title_case: ['Court, jaise Sessions Court Malda ya Calcutta High Court', 'Court, e.g. Sessions Court Malda or Calcutta High Court', 'আদালত, যেমন Sessions Court Malda বা Calcutta High Court', 'कोर्ट, जैसे Sessions Court Malda या Calcutta High Court'],
  ref_note_case: ['Rishta / note (jaise: isi FIR ki bail, appeal, transfer)', 'Relation / note (e.g. bail in same FIR, appeal, transfer)', 'সম্পর্ক / নোট (যেমন: একই FIR-এর জামিন, আপিল)', 'रिश्ता / नोट (जैसे: इसी FIR की बेल, अपील, ट्रांसफ़र)'],
  ref_copy: ['Copy', 'Copy', 'কপি', 'कॉपी'],
  ref_copied: ['Ref copy ho gaya, draft mein paste karein', 'Reference copied, paste it in your draft', 'রেফারেন্স কপি হয়েছে, ড্রাফটে পেস্ট করুন', 'रेफ़रेंस कॉपी हो गया, ड्राफ़्ट में पेस्ट करें'],
  ref_del_q: ['Yeh ref hatayein?', 'Remove this reference?', 'এই রেফারেন্স সরাবেন?', 'यह रेफ़रेंस हटाएँ?'],
  ref_net: ['Ref jodne ke liye internet chahiye', 'Internet needed to add references', 'রেফারেন্স যোগ করতে ইন্টারনেট দরকার', 'रेफ़रेंस जोड़ने के लिए इंटरनेट चाहिए'],
  ec_app: ['eCourts App mein kholein', 'Open in eCourts App', 'eCourts অ্যাপে খুলুন', 'eCourts ऐप में खोलें'],
  ec_app_copied: ["CNR copy ho gaya — app mein 'Search by CNR' pe paste karein", "CNR copied — paste it under 'Search by CNR' in the app", "CNR কপি হয়েছে — অ্যাপে 'Search by CNR'-এ পেস্ট করুন", "CNR कॉपी हो गया — ऐप में 'Search by CNR' पर पेस्ट करें"],
  ec_live: ['Live status dekhein', 'See live status', 'লাইভ স্ট্যাটাস দেখুন', 'लाइव स्टेटस देखें'],
  ec_h: ['Live status (eCourtsIndia)', 'Live status (eCourtsIndia)', 'লাইভ স্ট্যাটাস (eCourtsIndia)', 'लाइव स्टेटस (eCourtsIndia)'],
  ec_status: ['Status', 'Status', 'অবস্থা', 'स्थिति'], ec_next: ['Agli date (eCourts)', 'Next date (eCourts)', 'পরবর্তী তারিখ (eCourts)', 'अगली तारीख (eCourts)'],
  ec_judge: ['Judge', 'Judge', 'বিচারক', 'जज'], ec_parties: ['Petitioner v Respondent', 'Petitioner v Respondent', 'আবেদনকারী বনাম প্রতিপক্ষ', 'याचिकाकर्ता बनाम प्रतिवादी'],
  ec_dec: ['Faisle ki date', 'Decision date', 'রায়ের তারিখ', 'फ़ैसले की तारीख'],
  ec_hear: ['Pichhli sunwaiyan', 'Last hearings', 'আগের শুনানি', 'पिछली सुनवाइयाँ'],
  ec_orders: ['Orders ({0})', 'Orders ({0})', 'অর্ডার ({0})', 'ऑर्डर ({0})'], ec_noorder: ['Koi order nahi', 'No orders', 'কোনো অর্ডার নেই', 'कोई ऑर्डर नहीं'],
  ec_fetched: ['Abhi laaya gaya: {0}', 'Fetched: {0}', 'এখন আনা হলো: {0}', 'अभी लाया गया: {0}'],
  ec_cached: ['Pichhli baar laaya gaya: {0} (12 ghante tak dobara free)', 'Fetched earlier: {0} (free again for 12 hours)', 'আগে আনা হয়েছিল: {0} (১২ ঘণ্টা পর্যন্ত আবার ফ্রি)', 'पिछली बार लाया गया: {0} (12 घंटे तक दोबारा फ़्री)'],
  ec_src: ['Source: eCourtsIndia (private service) — official eCourts par zaroor milayein', 'Source: eCourtsIndia (private service) — verify on official eCourts', 'সূত্র: eCourtsIndia (বেসরকারি পরিষেবা) — অফিসিয়াল eCourts-এ মিলিয়ে নিন', 'स्रोत: eCourtsIndia (निजी सेवा) — आधिकारिक eCourts पर ज़रूर मिलाएँ'],
  ec_differs: ['eCourts par agli date {0} hai, app mein {1}.', 'eCourts shows next date {0}; the app has {1}.', 'eCourts-এ পরবর্তী তারিখ {0}, অ্যাপে {1}।', 'eCourts पर अगली तारीख {0} है, ऐप में {1}।'],
  ec_upd: ['Next date update karein', 'Update next date', 'পরবর্তী তারিখ আপডেট করুন', 'अगली तारीख अपडेट करें'],
  ec_upd_ok: ['Next date update ho gayi', 'Next date updated', 'পরবর্তী তারিখ আপডেট হয়েছে', 'अगली तारीख अपडेट हो गई'],
  ec_force: ['Abhi refresh karein', 'Refresh now', 'এখনই রিফ্রেশ করুন', 'अभी रिफ़्रेश करें'],
  ec_force_n: ['Refresh mein kuch minute lagte hain; naya data thodi der baad dobara "Live status dekhein" se aayega. (~₹1.65 kharch)', 'A refresh takes a few minutes; tap "See live status" again a little later for new data. (~₹1.65 cost)', 'রিফ্রেশে কয়েক মিনিট লাগে; নতুন তথ্যের জন্য একটু পরে আবার "লাইভ স্ট্যাটাস দেখুন" চাপুন। (~₹১.৬৫ খরচ)', 'रिफ़्रेश में कुछ मिनट लगते हैं; नया डेटा थोड़ी देर बाद दोबारा "लाइव स्टेटस देखें" से आएगा। (~₹1.65 ख़र्च)'],
  ec_queued: ['Refresh line mein hai — kuch minute baad dobara dekhein.', 'Refresh is queued — check again in a few minutes.', 'রিফ্রেশ লাইনে আছে — কয়েক মিনিট পরে আবার দেখুন।', 'रिफ़्रेश लाइन में है — कुछ मिनट बाद दोबारा देखें।'],
  ec_retry: ['Dobara try karein', 'Try again', 'আবার চেষ্টা করুন', 'दोबारा कोशिश करें'],
  ecx_off: ['Live status abhi band hai', 'Live status is not available right now', 'লাইভ স্ট্যাটাস এখন বন্ধ', 'लाइव स्टेटस अभी बंद है'],
  ecx_no_key: ['eCourtsIndia key galat ya maujood nahi (Render mein ECOURTSINDIA_KEY dekhein)', 'eCourtsIndia key is wrong or missing (check ECOURTSINDIA_KEY on Render)', 'eCourtsIndia কী ভুল বা নেই (Render-এ ECOURTSINDIA_KEY দেখুন)', 'eCourtsIndia key ग़लत या मौजूद नहीं (Render में ECOURTSINDIA_KEY देखें)'],
  ecx_no_credit: ['eCourtsIndia mein credit khatam ho gaya. Recharge karein', 'eCourtsIndia credit has run out. Please recharge', 'eCourtsIndia-তে ক্রেডিট শেষ। রিচার্জ করুন', 'eCourtsIndia में क्रेडिट ख़त्म हो गया। रिचार्ज करें'],
  ecx_bad_cnr: ['CNR galat hai (16 akshar, jaise WBMD030004122026)', 'Invalid CNR (16 characters, e.g. WBMD030004122026)', 'CNR ভুল (১৬ অক্ষর, যেমন WBMD030004122026)', 'CNR ग़लत है (16 अक्षर, जैसे WBMD030004122026)'],
  ecx_not_found: ['Is CNR ka case eCourtsIndia par nahi mila', 'No case with this CNR was found on eCourtsIndia', 'এই CNR-এর কেস eCourtsIndia-তে পাওয়া যায়নি', 'इस CNR का केस eCourtsIndia पर नहीं मिला'],
  ecx_rate_limit: ['eCourtsIndia abhi busy hai, thodi der baad try karein', 'eCourtsIndia is busy, try again a little later', 'eCourtsIndia এখন ব্যস্ত, একটু পরে চেষ্টা করুন', 'eCourtsIndia अभी व्यस्त है, थोड़ी देर बाद कोशिश करें'],
  ecx_daily_limit: ['Aaj ki live status seema poori ho gayi. Kal try karein', "Today's live status limit is used up. Try tomorrow", 'আজকের লাইভ স্ট্যাটাস সীমা শেষ। কাল চেষ্টা করুন', 'आज की लाइव स्टेटस सीमा पूरी हो गई। कल कोशिश करें'],
  ecx_timeout: ['eCourtsIndia se jawab nahi aaya, dobara try karein', 'eCourtsIndia did not respond, try again', 'eCourtsIndia থেকে উত্তর আসেনি, আবার চেষ্টা করুন', 'eCourtsIndia से जवाब नहीं आया, दोबारा कोशिश करें'],
  ecx_upstream: ['eCourtsIndia se data nahi mila, baad mein try karein', 'Could not get data from eCourtsIndia, try later', 'eCourtsIndia থেকে তথ্য পাওয়া যায়নি, পরে চেষ্টা করুন', 'eCourtsIndia से डेटा नहीं मिला, बाद में कोशिश करें'],
  ecx_forbidden: ['Is kaam ki ijazat nahi hai', 'You are not allowed to do this', 'এই কাজের অনুমতি নেই', 'इस काम की इजाज़त नहीं है'],
  // Madad / Guide
  g_cases_5: ['"eCourts App mein kholein": CNR copy hota hai aur eCourts Services app khulta hai (Android). App mein "Search by CNR" par paste karein — app khud nahi bharta. Free hai, key nahi chahiye.', '"Open in eCourts App": copies the CNR and opens the eCourts Services app (Android). Paste it under "Search by CNR" in the app — it does not fill in by itself. Free, no key needed.', '"eCourts অ্যাপে খুলুন": CNR কপি হয় আর eCourts Services অ্যাপ খোলে (Android)। অ্যাপে "Search by CNR"-এ পেস্ট করুন — অ্যাপ নিজে ভরে না। ফ্রি, কী লাগে না।', '"eCourts ऐप में खोलें": CNR कॉपी होता है और eCourts Services ऐप खुलता है (Android)। ऐप में "Search by CNR" पर पेस्ट करें — ऐप खुद नहीं भरता। फ़्री है, key नहीं चाहिए।'],
  g_mine_4: ['Case mein CNR ho to "eCourts App mein kholein" dabayein: CNR copy hoga, app mein "Search by CNR" par paste karein.', 'If the case has a CNR, tap "Open in eCourts App": the CNR is copied; paste it under "Search by CNR" in the app.', 'কেসে CNR থাকলে "eCourts অ্যাপে খুলুন" চাপুন: CNR কপি হবে, অ্যাপে "Search by CNR"-এ পেস্ট করুন।', 'केस में CNR हो तो "eCourts ऐप में खोलें" दबाएँ: CNR कॉपी होगा, ऐप में "Search by CNR" पर पेस्ट करें।'],
  g_ecourts_d: ['CNR wale case ki taaza jaankari (status, agli date, judge, orders) seedhe app mein. Har nayi khoj ~₹1.50 (eCourtsIndia credit se); 12 ghante tak wahi case dobara dekhna free hai.', 'Fresh details for a case with a CNR (status, next date, judge, orders) right in the app. Each fresh lookup costs ~₹1.50 (eCourtsIndia credit); viewing the same case again within 12 hours is free.', 'CNR থাকা কেসের টাটকা তথ্য (অবস্থা, পরবর্তী তারিখ, বিচারক, অর্ডার) সোজা অ্যাপে। প্রতিটি নতুন খোঁজ ~₹১.৫০ (eCourtsIndia ক্রেডিট থেকে); ১২ ঘণ্টার মধ্যে একই কেস আবার দেখা ফ্রি।', 'CNR वाले केस की ताज़ा जानकारी (स्थिति, अगली तारीख, जज, ऑर्डर) सीधे ऐप में। हर नई खोज ~₹1.50 (eCourtsIndia क्रेडिट से); 12 घंटे तक वही केस दोबारा देखना फ़्री है।'],
  g_ecourts_1: ['Case "Kholein" > "Live status dekhein" dabayein (case mein CNR hona chahiye).', 'Open a case > tap "See live status" (the case needs a CNR).', 'কেস "খুলুন" > "লাইভ স্ট্যাটাস দেখুন" চাপুন (কেসে CNR থাকতে হবে)।', 'केस "खोलें" > "लाइव स्टेटस देखें" दबाएँ (केस में CNR होना चाहिए)।'],
  g_ecourts_2: ['Status, agli date, court, judge, parties, pichhli sunwaiyan aur orders ki list dikhegi.', 'You will see status, next date, court, judge, parties, last hearings and the order list.', 'অবস্থা, পরবর্তী তারিখ, আদালত, বিচারক, পক্ষ, আগের শুনানি আর অর্ডারের তালিকা দেখাবে।', 'स्थिति, अगली तारीख, कोर्ट, जज, पक्षकार, पिछली सुनवाइयाँ और ऑर्डर की सूची दिखेगी।'],
  g_ecourts_3: ['eCourts ki date app se alag ho to "Next date update karein" dabayein.', 'If the eCourts date differs from the app, tap "Update next date".', 'eCourts-এর তারিখ অ্যাপের থেকে আলাদা হলে "পরবর্তী তারিখ আপডেট করুন" চাপুন।', 'eCourts की तारीख ऐप से अलग हो तो "अगली तारीख अपडेट करें" दबाएँ।'],
  g_ecourts_4: ['Senior "Abhi refresh karein" se court se naya data mangwa sakte hain (~₹1.65, kuch minute lagte hain).', 'Seniors can tap "Refresh now" to pull new data from the court (~₹1.65, takes a few minutes).', 'সিনিয়র "এখনই রিফ্রেশ করুন" দিয়ে আদালত থেকে নতুন তথ্য আনাতে পারেন (~₹১.৬৫, কয়েক মিনিট লাগে)।', 'सीनियर "अभी रिफ़्रेश करें" से कोर्ट से नया डेटा मँगवा सकते हैं (~₹1.65, कुछ मिनट लगते हैं)।'],
  g_ecourts_5: ['Ye data eCourtsIndia (private service) se hai. Zaroori kaam se pehle official eCourts par milayein.', 'This data comes from eCourtsIndia (a private service). Verify on official eCourts before anything important.', 'এই তথ্য eCourtsIndia (বেসরকারি পরিষেবা) থেকে। জরুরি কাজের আগে অফিসিয়াল eCourts-এ মিলিয়ে নিন।', 'यह डेटा eCourtsIndia (निजी सेवा) से है। ज़रूरी काम से पहले आधिकारिक eCourts पर मिलाएँ।'],
  g_ecourts_6: ['Free tareeka bhi hai: "eCourts App mein kholein" CNR copy karke eCourts Services app kholta hai; wahan "Search by CNR" mein paste karein.', 'There is a free way too: "Open in eCourts App" copies the CNR and opens the eCourts Services app; paste it under "Search by CNR".', 'ফ্রি উপায়ও আছে: "eCourts অ্যাপে খুলুন" CNR কপি করে eCourts Services অ্যাপ খোলে; সেখানে "Search by CNR"-এ পেস্ট করুন।', 'फ़्री तरीका भी है: "eCourts ऐप में खोलें" CNR कॉपी करके eCourts Services ऐप खोलता है; वहाँ "Search by CNR" में पेस्ट करें।']
});

// r = kaun dekhe: S senior, M munshi, J junior, C client. s = steps [number ya [key, roles]]
const GUIDE = [
  { id: 'dash', t: 'tab_dash', go: 'dash', r: 'SMJ', s: [1, 2, [3, 'SM']] },
  { id: 'cal', t: 'tab_cal', go: 'cal', r: 'SMJ', s: [1, 2, 3] },
  { id: 'cases', t: 'tab_cases', go: 'cases', r: 'SMJ', s: [[1, 'SM'], 2, [3, 'SM'], 4, 5] },
  { id: 'mine', ic: 'cases', t: 'tab_mine', go: 'cases', r: 'C', s: [1, 2, 4, 3] },
  { id: 'clients', t: 'tab_clients', go: 'clients', r: 'SM', s: [1, 2, 3] },
  { id: 'tasks', t: 'tab_tasks', go: 'tasks', r: 'SMJ', s: [[1, 'SM'], 2, 3] },
  { id: 'fees', t: 'g_fees_t', go: 'fees', r: 'SM', s: [1, 2, 3, 4] },
  { id: 'docs', t: 'docs', go: 'cases', r: 'SMJC', s: [[1, 'SMJ'], ['1c', 'C'], [4, 'SMJ'], 2, 3] },
  { id: 'link', ic: 'docs', t: 'lk_h', go: 'cases', r: 'SMJ', s: [1, 2, 3, 4] },
  { id: 'gdrive', ic: 'docs', t: 'gd_t', go: 'cases', r: 'SMJ', s: [1, 2, 3], need: () => S.drive.enabled },
  { id: 'ecourts', ic: 'cases', t: 'ec_live', go: 'cases', r: 'SMJC', s: [1, 2, [3, 'SMJ'], [4, 'S'], 5, 6], need: () => S.ec && S.ec.enabled },
  { id: 'drafts', t: 'drafts', go: 'cases', r: 'SMJ', s: [1, 2, 3, 4] },
  { id: 'law', t: 'tab_law', go: 'law', r: 'SMJ', s: [1, 2, 3] },
  { id: 'notes', t: 'tab_notes', go: 'notes', r: 'SMJ', s: [1, 2, 3] },
  { id: 'wa', t: 'wa', go: 'cases', r: 'SM', s: [1, 2, 3] },
  { id: 'team', t: 'tab_team', go: 'team', r: 'S', s: [1, 2, 3, 4] },
  { id: 'backup', t: 'tab_backup', go: 'backup', r: 'S', s: [1, 2, 3] },
  { id: 'off', t: 'g_off_t', r: 'SMJC', s: [1, 2, 3] },
  { id: 'inst', t: 'g_inst_t', a: 'inst', r: 'SMJC', s: [1, 2, 3] },
  { id: 'lang', t: 'g_lang_t', a: 'langfocus', r: 'SMJC', s: [1, 2] },
  { id: 'pw', t: 'mypw', a: 'mypw', r: 'SMJC', s: [1, 2, 3] }
];
const RL = () => ({ senior: 'S', munshi: 'M', junior: 'J', client: 'C' }[S.user.role] || 'C');
const HINTS = ['dash', 'cal', 'cases', 'clients', 'tasks', 'fees', 'notes', 'law', 'team', 'backup'];
const hidHints = () => { try { return JSON.parse(localStorage.getItem('mcc_hh') || '[]'); } catch { return []; } };
function hintBar() {
  if (!HINTS.includes(S.tab)) return '';
  const k = S.tab === 'cases' && RL() === 'C' ? 'mine' : S.tab;
  if (hidHints().includes(k)) return '';
  return `<div class="hint" id="hint">${ico('info', 18)}<p>${t('hint_' + k)}</p><button class="hq" data-a="help" data-k="${k}" title="${esc(t('tab_help'))}" aria-label="${esc(t('tab_help'))}">?</button><button class="hx" data-a="hidehint" data-k="${k}" title="${esc(t('hint_hide'))}" aria-label="${esc(t('hint_hide'))}">×</button></div>`;
}
const installed = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
function startList() {
  const c = S.chamber || {};
  const items = [[!!(c.upi_id && c.adv_name), 'st1', 'data-a="gset"'], [S.users.length > 1, 'st2', 'data-a="tab" data-k="team"'], [S.cases.length > 0, 'st3', 'data-a="quick" data-k="case"'],
    [S.cases.some(x => x.next_date), 'st4', 'data-a="tab" data-k="cases"'], [installed(), 'st5', 'data-a="help" data-k="inst"']];
  return `<section class="panel start"><h3>${ico('flag', 18)} ${t('start_h')}</h3><ol class="chk">${items.map(([done, k, act], i) =>
    `<li class="${done ? 'ok' : ''}"><span class="n">${done ? ico('ok', 14) : i + 1}</span><span class="tx2">${t(k)}</span>${done ? `<small class="okt">${t('st_done')}</small>` : `<button class="ghost" ${act}>${t('open')}</button>`}</li>`).join('')}</ol></section>`;
}
function guideCard(g) {
  const r = RL(), steps = g.s.filter(x => !Array.isArray(x) || x[1].includes(r)).map(x => t(`g_${g.id}_${Array.isArray(x) ? x[0] : x}`));
  const btn = g.go ? `<button class="ghost strong" data-a="tab" data-k="${g.go}">${t('open')}</button>`
    : g.a === 'inst' ? (DIP ? `<button class="ghost strong" data-a="inst">${t('install')}</button>` : '')
    : g.a ? `<button class="ghost strong" data-a="${g.a}">${t('open')}</button>` : '';
  return `<article class="gd" id="g-${g.id}"><div class="gh"><span class="gi">${ico(g.ic || g.id, 22)}</span><h3>${t(g.t)}</h3></div>
    <p>${t(`g_${g.id}_d`)}</p><p class="how">${t('how')}</p><ol>${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${btn ? `<div class="row">${btn}</div>` : ''}</article>`;
}
function vHelp() {
  const r = RL();
  const news = r !== 'C' ? `<section class="panel new"><h3>${ico('star', 18)} ${t('new_h')}</h3><ul>${[1, 2, 3, 4, 5, 6].map(i => `<li>${t('new' + i)}</li>`).join('')}</ul></section>` : '';
  return `<div class="hh"><h2>${ico('help', 22)} ${t('help_h')}</h2><p class="m">${t('help_sub')}</p></div>
    <div class="htop">${news}${r === 'S' ? startList() : ''}</div>
    <div class="guide">${GUIDE.filter(g => g.r.includes(r) && (!g.need || g.need())).map(guideCard).join('')}</div>
    <section class="panel contact"><h3>${t('help_contact')}</h3><p>${t('help_who')}</p>
      <div class="row"><a class="btn pri" href="tel:+917602292599">${ico('phone', 16)} ${t('call_n')}</a><a class="btn ghost" href="https://wa.me/917602292599?text=${encodeURIComponent(t('wa_us_msg'))}" target="_blank" rel="noopener">${ico('wa', 16)} ${t('wa_us')}</a></div>
      <div class="row"><button class="ghost" data-a="welcome">${t('wl_again')}</button>${hidHints().length ? `<button class="ghost" data-a="hintreset">${t('hint_reset')}</button>` : ''}</div></section>`;
}
const wKey = () => 'mcc_w_' + (S.user && S.user.id);
function showWelcome() {
  const r = RL(), b = r === 'C' ? ['wc1', 'wc2', 'wb6'] : r === 'J' ? ['wb1', 'wb7', 'wb3', 'wb4', 'wb6'] : ['wb1', 'wb2', 'wb3', 'wb4', 'wb5', 'wb6'];
  const d = $('#dlg'); d.classList.add('wl');
  d.innerHTML = `<div class="wlh"><span class="wlogo"></span><div><h3>${t('wl_h')}</h3><p class="m">${t('wl_sub')}</p></div></div>
    <ul class="wlb">${b.map(k => `<li>${ico('ok', 16)}<span>${t(k)}</span></li>`).join('')}</ul>
    <div class="row wlr"><button class="ghost strong" data-a="wguide">${t('wl_guide')}</button><button class="pri" data-a="wgo">${t('wl_go')}</button></div>`;
  localStorage.setItem(wKey(), '1');
  if (!d.open) d.showModal();
}

const t = (k, ...a) => (D[k] ? (D[k][IDX[LANG]] ?? D[k][0]) : k).replace(/\{(\d)\}/g, (_, i) => a[i]);
const se = m => LANG === 'hd' ? (HE[m] || m) : (LANG !== 'hi' && E[m]) ? E[m][IDX[LANG] - 1] : m;
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString(LOC[LANG], { day: '2-digit', month: 'short', year: 'numeric' }) : t('nodate');
const fmtT = ts => ts ? new Date(ts).toLocaleString(LOC[LANG], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
const mb = b => (Number(b || 0) / 1048576).toFixed(1) + ' MB';
const kb = b => b >= 1048576 ? mb(b) : Math.max(1, Math.round(b / 1024)) + ' KB';
function applyStatic() {
  document.documentElement.lang = HTML_LANG[LANG];
  document.querySelectorAll('[data-t]').forEach(e => e.textContent = t(e.dataset.t));
  document.querySelectorAll('.lang').forEach(s => s.value = LANG);
}

const S = { user: JSON.parse(localStorage.getItem('u') || 'null'), cases: [], fees: [], users: [], tasks: [], clients: [], notes: [], chamber: {}, dash: {},
  docs: {}, drafts: {}, drive: { enabled: false }, ec: { enabled: false }, ecs: {}, law: null, lawQ: '', secTarget: null, cal: null, tab: 'dash', view: null, q: '', cq: '', nq: '', openAdd: '', prefill: null, pending: 0 };
let TODAY = iso(new Date()), B = {};
const TABS = {
  senior: [['dash', 'tab_dash'], ['cal', 'tab_cal'], ['cases', 'tab_cases'], ['clients', 'tab_clients'], ['tasks', 'tab_tasks'], ['fees', 'tab_fees'], ['notes', 'tab_notes'], ['law', 'tab_law'], ['team', 'tab_team'], ['backup', 'tab_backup'], ['help', 'tab_help']],
  munshi: [['dash', 'tab_dash'], ['cal', 'tab_cal'], ['cases', 'tab_cases'], ['clients', 'tab_clients'], ['tasks', 'tab_tasks'], ['fees', 'tab_fees'], ['notes', 'tab_notes'], ['law', 'tab_law'], ['help', 'tab_help']],
  junior: [['dash', 'tab_dash'], ['cal', 'tab_cal'], ['cases', 'tab_cases'], ['tasks', 'tab_tasks'], ['notes', 'tab_notes'], ['law', 'tab_law'], ['help', 'tab_help']],
  client: [['cases', 'tab_mine'], ['help', 'tab_help']]
};
const canAdd = () => ['senior', 'munshi'].includes(S.user.role);
const canDate = () => S.user.role !== 'client';
const staff = () => S.user.role !== 'client';
const isSr = () => S.user.role === 'senior';

// ---------- offline storage (IndexedDB) ----------
const idb = new Promise((ok, no) => {
  const r = indexedDB.open('mcc', 1);
  r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('ob', { keyPath: 'id' }); };
  r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
});
const tx = async (s, m, f) => { const d = await idb; return new Promise((ok, no) => { const q = d.transaction(s, m), r = f(q.objectStore(s)); q.oncomplete = () => ok(r && r.result); q.onerror = () => no(q.error); }); };
const kv = { get: k => tx('kv', 'readonly', s => s.get(k)), set: (k, v) => tx('kv', 'readwrite', s => s.put(v, k)), clear: () => tx('kv', 'readwrite', s => s.clear()) };

$('#dlg').addEventListener('close', () => $('#dlg').classList.remove('wl'));
let tt; const toast = m => { const e = $('#toast'); e.textContent = m; e.hidden = false; clearTimeout(tt); tt = setTimeout(() => e.hidden = true, 4000); };

// ---------- API + offline queue ----------
async function api(p, o = {}) {
  const r = await fetch('/api' + p, { method: o.method || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('t') }, body: o.body ? JSON.stringify(o.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && p !== '/login') { logout(); throw Object.assign(new Error(se(d.error || 'Login dobara karein')), { server: true, code: d.code, status: r.status }); }
  if (!r.ok) throw Object.assign(new Error(se(d.error || 'Server error, dobara try karein')), { server: true, code: d.code, status: r.status });
  return d;
}
async function send(method, path, body) {      // net nahi to queue mein; null return hota hai
  try { return await api(path, { method, body }); }
  catch (e) {
    if (e.server) throw e;
    await tx('ob', 'readwrite', s => s.put({ id: uid(), method, path, body, ts: Date.now() }));
    await count(); toast(t('saved_off')); return null;
  }
}
async function count() { S.pending = await tx('ob', 'readonly', s => s.count()); bar(); }
let busy = false;
async function flush() {
  if (busy || !navigator.onLine || !S.user) return; busy = true;
  try {
    const q = (await tx('ob', 'readonly', s => s.getAll())).sort((a, b) => a.ts - b.ts);
    for (const j of q) {
      try { await api(j.path, { method: j.method, body: j.body }); }
      catch (e) { if (!e.server) break; toast(t('rejected') + e.message); }
      await tx('ob', 'readwrite', s => s.delete(j.id));
    }
    if (q.length) { await count(); await load(); }
  } finally { busy = false; }
}
const KEYS = ['cases', 'fees', 'users', 'tasks', 'clients', 'notes', 'chamber', 'dash'];
async function load() {
  try {
    S.cases = await api('/cases'); await kv.set('cases', S.cases);
    try { S.ec = await api('/ecourts/status'); } catch { S.ec = { enabled: false }; }   // sab roles: live status button dikhe ya nahi
    if (canAdd()) {
      S.fees = await api('/fees'); await kv.set('fees', S.fees);
      S.users = await api('/users'); await kv.set('users', S.users);
      S.clients = await api('/clients'); await kv.set('clients', S.clients);
    }
    if (staff()) {
      S.tasks = await api('/tasks'); await kv.set('tasks', S.tasks);
      S.notes = await api('/notes'); await kv.set('notes', S.notes);
      S.chamber = await api('/chamber'); await kv.set('chamber', S.chamber);
      S.dash = await api('/dashboard'); await kv.set('dash', S.dash);
      try { S.drive = await api('/drive/status'); } catch { S.drive = { enabled: false }; }
    }
  } catch (e) {
    if (e.server) toast(e.message);
    else for (const k of KEYS) S[k] = (await kv.get(k)) || (k === 'chamber' || k === 'dash' ? {} : []);
  }
  render();
}

// ---------- chhote helpers ----------
const bar = () => { const b = $('#bar'); if (b) b.textContent = t(navigator.onLine ? 'online' : 'offline') + (S.pending ? ' • ' + t('pending', S.pending) : ''); };
function buildBal() { B = {}; for (const f of S.fees) { const b = B[f.case_id] ??= { ch: 0, pd: 0 }; f.kind === 'charge' ? b.ch += +f.amount : b.pd += +f.amount; } }
const due = id => { const b = B[id] || { ch: 0, pd: 0 }; return Math.round((b.ch - b.pd) * 100) / 100; };
const cname = c => c ? (c.case_no || c.cnr || '') : '';
const clientOf = c => c && c.client_id ? S.clients.find(x => x.id === c.client_id) : null;
const waNum = p => { p = String(p || '').replace(/\D/g, ''); if (p.length === 10) p = '91' + p; return p; };
const pendingCases = () => S.cases.filter(c => c.status === 'pending' && !tmp(c.id));
const opt = (a, sel, none = true) => (none ? `<option value="">${t('none')}</option>` : '') + a.map(u => `<option value="${esc(u.id)}"${u.id === sel ? ' selected' : ''}>${esc(u.name || u.email)}</option>`).join('');
const chip = (txt, cls = '') => `<span class="chip ${cls}">${esc(txt)}</span>`;

// ---------- UPI ----------
function upiLink(amount, note) {
  const c = S.chamber || {}; if (!c.upi_id || !(amount > 0)) return '';
  const pn = c.upi_name || c.adv_name || S.user.chamber || '';
  return 'upi://pay?pa=' + c.upi_id + '&pn=' + encodeURIComponent(pn).slice(0, 80) + '&am=' + Number(amount).toFixed(2) + '&cu=INR&tn=' + encodeURIComponent(String(note || 'Fees').slice(0, 40));
}
const qr = (txt, px = 180) => typeof qrSvg === 'function' ? qrSvg(txt, px) : '';
function upiBlock(c) {
  const d = due(c.id), link = upiLink(d, 'Fees ' + cname(c));
  if (!(d > 0)) return '';
  if (!link) return `<p class="m">${t('upi_unset')}</p>`;
  return `<div class="upi"><div class="qr">${qr(link)}</div><div><p><b>${t('upi_scan', Number(d).toLocaleString('en-IN'))}</b></p><p class="m">${esc(S.chamber.upi_id)}</p>
    <div class="row"><a class="btn pri" href="${esc(link)}">${t('upi')}</a>${c.client_phone || clientOf(c)?.phone ? `<button type="button" class="ghost" data-a="waupi" data-id="${esc(c.id)}">${t('upi_share')}</button>` : ''}</div></div></div>`;
}

// ---------- case card ----------
function card(c) {
  const b = B[c.id] || { ch: 0, pd: 0 }, tm = tmp(c.id), late = c.status === 'pending' && c.next_date && c.next_date < TODAY;
  const meta = [c.court, c.ps_name, c.stage].filter(Boolean).map(esc).join(' • ');
  const crim = c.case_type === 'criminal' && (c.fir_no || c.sections) ? `<p class="m">${c.fir_no ? 'FIR ' + esc(c.fir_no) : ''}${c.fir_no && c.sections ? ' • ' : ''}${c.sections ? esc(c.sections) : ''}</p>` : '';
  return `<article class="case${c.status === 'disposed' ? ' done' : ''}">
    <div class="dt${late ? ' late' : ''}"><b>${c.next_date ? esc(c.next_date.slice(8)) : '–'}</b><span>${c.next_date ? new Date(c.next_date + 'T00:00').toLocaleDateString(LOC[LANG], { month: 'short', year: '2-digit' }) : ''}</span></div>
    <div class="bd"><h3>${esc(c.case_no || c.cnr)}</h3><p>${esc(c.party_name)}</p>
      ${meta ? `<p class="m">${meta}</p>` : ''}${crim}${c.cnr ? `<p class="m">CNR ${esc(c.cnr)}</p>` : ''}${c.status === 'disposed' ? `<p class="m">${t('closed')}</p>` : ''}
      <div class="row">
        ${!tm ? `<button class="ghost strong" data-a="open" data-id="${esc(c.id)}">${t('open')}</button>` : ''}
        ${canDate() && c.status === 'pending' ? `<label>${t('nextdate')}<input type="date" data-nd="${esc(c.id)}" value="${esc(c.next_date || '')}" ${tm ? 'disabled' : ''}></label>` : ''}
        ${c.cnr ? `<button class="ghost" data-a="ec" data-cnr="${esc(c.cnr)}">${t('ecourts')}</button>` : ''}
        ${canAdd() && !tm ? `<button class="ghost" data-a="fee" data-id="${esc(c.id)}">${t('fees')}${b.ch ? ' • ' + t('due', money(b.ch - b.pd)) : ''}</button>` : ''}
        ${canAdd() && c.client_phone && c.next_date && c.status === 'pending' ? `<button class="ghost" data-a="wa" data-id="${esc(c.id)}">${t('wa')}</button>` : ''}
        ${canAdd() && !tm ? `<button class="ghost" data-a="edit" data-id="${esc(c.id)}">${t('edit')}</button>` : ''}
        ${isSr() && c.status === 'pending' && !tm ? `<button class="ghost" data-a="done" data-id="${esc(c.id)}">${t('closed')}</button>` : ''}
      </div></div></article>`;
}
const group = (h, a) => a.length ? `<h2>${h} <small>${a.length}</small></h2>${a.map(card).join('')}` : '';
function todayGroups() {
  const a = S.cases.filter(c => c.status === 'pending');
  return group(t('g_today'), a.filter(c => c.next_date === TODAY)) + group(t('g_tom'), a.filter(c => c.next_date === addDays(1)))
    + group(t('g_late'), a.filter(c => c.next_date && c.next_date < TODAY)) + group(t('g_none'), a.filter(c => !c.next_date));
}

// ---------- dashboard ----------
function vDash() {
  const a = S.cases.filter(c => c.status === 'pending'), wk = addDays(6);
  const nToday = a.filter(c => c.next_date === TODAY).length, nLate = a.filter(c => c.next_date && c.next_date < TODAY).length;
  const nWeek = a.filter(c => c.next_date && c.next_date >= TODAY && c.next_date <= wk).length, nTask = S.tasks.filter(x => !x.done).length;
  const tile = (n, l, cls = '', act = '', extra = '') => `<button class="tile ${cls}" ${act}><b>${n}</b><span>${l}</span>${extra}</button>`;
  let tiles = tile(nToday, t('d_today'), 'gold', 'data-a="scroll" data-k="g-today"') + tile(nLate, t('d_late'), nLate ? 'red' : '', 'data-a="scroll" data-k="g-late"')
    + tile(nWeek, t('d_week'), '', 'data-a="tab" data-k="cal"') + tile(nTask, t('d_tasks'), '', 'data-a="tab" data-k="tasks"');
  if (canAdd()) {
    const tot = Object.values(B).reduce((s, b) => s + Math.max(b.ch - b.pd, 0), 0), st = S.dash.storage_bytes || 0, r2 = S.dash.storage_backend === 'r2', lim = S.dash.storage_limit || (r2 ? 10737418240 : 1073741824), pct = Math.min(100, st / lim * 100);
    tiles += tile(money(tot), t('d_fees'), '', 'data-a="tab" data-k="fees"')
      + tile(mb(st), t('d_store'), 'store' + (pct >= 80 ? ' red' : ''), '', `<i class="meter"><i style="width:${pct.toFixed(1)}%"></i></i><small>${pct < 1 && st ? '<1' : Math.round(pct)}% • ${t(r2 ? 'd_free_r2' : 'd_free')}</small>`);
  }
  const qb = (k, l) => `<button class="ghost" data-a="quick" data-k="${k}">${l}</button>`;
  const quick = (canAdd() ? qb('case', t('q_case')) + qb('client', t('q_client')) + qb('task', t('q_task')) : '') + qb('note', t('q_note')) + qb('law', t('q_law')) + qb('cal', t('tab_cal'));
  const rec = (S.dash.recent || []).map(r => { const c = S.cases.find(x => x.id === r.case_id); return c ? `<div class="fe"><div><b>${esc(cname(c))}</b> <span class="m">${esc(c.party_name || '')}</span>
    <p class="m">${esc(fmt(r.old_date))} → <b class="tx">${esc(fmt(r.new_date))}</b> • ${esc(r.by || '')} • ${esc(fmtT(r.changed_at))}</p></div><button class="ghost" data-a="open" data-id="${esc(c.id)}">${t('open')}</button></div>` : ''; }).join('');
  const groups = todayGroups().replace(`<h2>${t('g_today')}`, `<h2 id="g-today">${t('g_today')}`).replace(`<h2>${t('g_late')}`, `<h2 id="g-late">${t('g_late')}`);
  return `<div class="tiles">${tiles}</div><h2>${t('d_quick')}</h2><div class="row quick">${quick}</div>
    <h2>${t('d_recent')}</h2>${rec || `<p class="m">${t('d_norecent')}</p>`}${groups || `<p class="empty">${t('empty_today')}</p>`}`;
}

// ---------- case form (naya + edit dono) ----------
function clientList() { return `<datalist id="cl-list">${S.clients.map(c => `<option value="${esc(c.name)}">${esc(c.phone || '')}${c.guardian ? ' • ' + esc(c.guardian) : ''}</option>`).join('')}</datalist>`; }
function crimFields(c = {}) {
  const f = (n, l, m, ph = '') => `<label>${l}<input name="${n}" value="${esc(c[n] || '')}" maxlength="${m}" placeholder="${esc(ph)}"></label>`;
  const d = (n, l) => `<label>${l}<input type="date" name="${n}" value="${esc(c[n] || '')}"></label>`;
  return `<fieldset class="crim"${c.case_type === 'criminal' ? '' : ' hidden'}><legend>${t('crim_h')}</legend>
    ${f('fir_no', t('fir_no'), 60)}${d('fir_date', t('fir_date'))}${f('sections', t('sections'), 500, t('sec_ph'))}${f('bail_status', t('bail'), 80, t('bail_ph'))}
    ${d('chargesheet_date', t('cs_date'))}${f('ip_name', t('ip_name'), 160)}${f('io_name', t('io_name'), 160)}</fieldset>`;
}
const typeSel = v => `<label>${t('ctype')}<select name="case_type"><option value="">–</option>${['civil', 'criminal', 'other'].map(k => `<option value="${k}"${v === k ? ' selected' : ''}>${t('ct_' + k)}</option>`).join('')}</select></label>`;
function addForm() {
  const p = S.prefill || {};
  return `<details class="add" id="add-case"${S.openAdd === 'case' ? ' open' : ''}><summary>${t('addcase')}</summary><form data-f="case">
    <input name="case_no" placeholder="${t('ph_caseno')}" maxlength="60"><input name="cnr" placeholder="${t('ph_cnr')}" maxlength="40">
    <label class="span2">${t('client')}<input name="client_name" list="cl-list" autocomplete="off" placeholder="${t('ph_client')}" maxlength="120" value="${esc(p.name || '')}"><small class="m">${t('cl_new_hint')}</small></label>
    <input name="party_name" placeholder="${t('ph_party')}" maxlength="160"><input name="client_phone" placeholder="${t('ph_cphone')}" maxlength="20" inputmode="tel" value="${esc(p.phone || '')}">
    <input name="court" placeholder="${t('ph_court')}" maxlength="60"><input name="ps_name" placeholder="${t('ph_ps')}" maxlength="80"><input name="stage" placeholder="${t('ph_stage')}" maxlength="80">
    <label>${t('nextdate')}<input type="date" name="next_date"></label>${typeSel('')}
    <label>${t('junior')}<select name="assigned_to">${opt(S.users.filter(u => u.role === 'junior' && u.active))}</select></label>
    <label>${t('clogin')}<select name="client_user_id">${opt(S.users.filter(u => u.role === 'client' && u.active))}</select></label>
    ${crimFields({})}
    <button class="pri">${t('savecase')}</button></form>${clientList()}</details>`;
}
// client naam ko client_id se jodna; naya naam ho to server naya client banata hai (make_client)
function linkClient(b, isNew) {
  const nm = (b.client_name || '').trim(); delete b.client_name;
  if (!nm) return isNew ? b : Object.assign(b, { client_id: null });
  const ph = (b.client_phone || '').replace(/\D/g, '').slice(-10);
  const m = S.clients.filter(c => c.name.trim().toLowerCase() === nm.toLowerCase());
  const hit = m.find(c => ph && (c.phone || '').replace(/\D/g, '').slice(-10) === ph) || m[0];
  if (hit) { b.client_id = hit.id; if (!b.client_phone && hit.phone) b.client_phone = hit.phone; }
  else { b.make_client = 1; b.client_name = nm; }
  if (isNew && !b.party_name) b.party_name = nm;
  return b;
}

// ---------- cases tab ----------
function caseCards() {
  const q = S.q.toLowerCase(), a = S.cases.filter(c => !q || [c.case_no, c.cnr, c.party_name, c.ps_name, c.fir_no, c.sections, clientOf(c)?.name].some(x => (x || '').toLowerCase().includes(q)));
  return a.slice(0, 100).map(card).join('') + (a.length > 100 ? `<p class="empty">${t('first100')}</p>` : '') || `<p class="empty">${t('nocase')}</p>`;
}
const vCases = () => (canAdd() ? addForm() + importBox() : '') + `<input id="q" type="search" placeholder="${t('search')}" value="${esc(S.q)}"><div id="list">${caseCards()}</div>`;

// ---------- case detail view ----------
function dl(rows) { return `<dl class="kv">${rows.filter(r => r[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`; }
function vCase(id) {
  const c = S.cases.find(x => x.id === id); if (!c) { S.view = null; return vTab(); }
  const cl = clientOf(c), cr = c.case_type === 'criminal' || c.fir_no || c.sections || c.io_name;
  const secs = (c.sections || '').split(',').map(x => x.trim()).filter(Boolean);
  let h = `<button class="ghost back" data-a="back">${t('back')}</button>
    <section class="panel head"><div><h2 class="h">${esc(cname(c))}</h2><p>${esc(c.party_name || '')}</p>
      <p class="m">${[c.court, c.ps_name, c.stage].filter(Boolean).map(esc).join(' • ')}</p></div>
      <div class="nd${c.status === 'pending' && c.next_date && c.next_date < TODAY ? ' late' : ''}"><small>${t('nextdate')}</small><b>${esc(fmt(c.next_date))}</b>${c.status === 'disposed' ? chip(t('closed')) : ''}${c.case_type ? chip(t('ct_' + c.case_type), 'gold') : ''}</div></section>
    <section class="panel"><h3>${t('details')}</h3>${dl([
      ['CNR', esc(c.cnr || '')], [t('ph_court'), esc(c.court || '')], [t('ph_ps'), esc(c.ps_name || '')], [t('ph_stage'), esc(c.stage || '')],
      [t('client'), cl ? `<button class="link" data-a="client" data-id="${esc(cl.id)}">${esc(cl.name)}</button>${cl.phone ? ' • ' + esc(cl.phone) : ''}` : ''],
      [t('ph_cphone'), !cl && c.client_phone ? esc(c.client_phone) : ''], [t('note'), staff() ? esc(c.notes || '') : '']])}
      <div class="row">${canAdd() ? `<button class="ghost" data-a="edit" data-id="${esc(c.id)}">${t('edit')}</button><button class="ghost" data-a="fee" data-id="${esc(c.id)}">${t('fees')}</button>` : ''}
      ${canAdd() && c.client_phone && c.next_date && c.status === 'pending' ? `<button class="ghost" data-a="wa" data-id="${esc(c.id)}">${t('wa')}</button>` : ''}
      ${c.cnr ? `<button class="ghost" data-a="ec" data-cnr="${esc(c.cnr)}">${t('ecourts')}</button><button class="ghost" data-a="ecapp" data-cnr="${esc(c.cnr)}">${t('ec_app')}</button>` : ''}
      ${c.cnr && S.ec && S.ec.enabled && !tmp(c.id) ? `<button class="ghost strong" data-a="eclive" data-id="${esc(c.id)}">${t('ec_live')}</button>` : ''}
      ${staff() ? `<button class="ghost" data-a="findsec" data-id="${esc(c.id)}">${t('findsec')}</button>` : ''}</div></section>${ecPanel(c)}`;
  if (cr) h += `<section class="panel"><h3>${t('crim_h')}</h3>${dl([[t('fir_no'), esc(c.fir_no || '')], [t('fir_date'), c.fir_date ? esc(fmt(c.fir_date)) : ''],
    [t('sections'), secs.map(s => chip(s)).join(' ')], [t('bail'), esc(c.bail_status || '')], [t('cs_date'), c.chargesheet_date ? esc(fmt(c.chargesheet_date)) : ''],
    [t('ip_name'), esc(c.ip_name || '')], [t('io_name'), esc(c.io_name || '')]])}</section>`;
  if (staff() && !tmp(c.id)) h += refPanel(c);
  if (canAdd()) { const b = B[c.id] || { ch: 0, pd: 0 }; h += `<section class="panel"><h3>${t('fees')}</h3><p class="m">${t('fee_sum', money(b.ch), money(b.pd), money(b.ch - b.pd))}</p>${upiBlock(c)}</section>`; }
  // documents
  const docs = S.docs[c.id];
  h += `<section class="panel"><h3>${t('docs')}</h3>${staff() && navigator.onLine ? docBar(c) : ''}
    ${!docs ? `<p class="m">${navigator.onLine ? t('loading') : t('need_net')}</p>` : docs.length ? docs.map(d => `<div class="fe doc"><div><b>${d.backend === 'link' ? '🔗 ' : ''}${esc(d.name)}</b><p class="m">${docMeta(d)} • ${esc(fmt(String(d.created_at).slice(0, 10)))}</p></div>
      <div class="row"><button class="ghost" data-a="dldoc" data-id="${esc(d.id)}">${t(d.backend === 'link' ? 'open' : 'doc_dl')}</button>${isSr() ? `<button class="ghost danger" data-a="deldoc" data-id="${esc(d.id)}" data-c="${esc(c.id)}">${t('del')}</button>` : ''}</div></div>`).join('') : `<p class="m">${t('doc_none')}</p>`}</section>`;
  if (staff()) {
    const dr = S.drafts[c.id];
    h += `<section class="panel"><h3>${t('drafts')}</h3><p class="m">${t('newdraft')}</p><div class="row tpl">${KINDS.map(k => `<button class="ghost" data-a="draft" data-id="${esc(c.id)}" data-k="${k}">${t('k_' + k)}</button>`).join('')}</div>
      ${!dr ? '' : dr.length ? dr.map(d => `<div class="fe"><div><b>${esc(d.title)}</b><p class="m">${t('k_' + (D['k_' + d.kind] ? d.kind : 'other'))} • ${esc(fmtT(d.updated_at || d.created_at))}</p></div>
        <div class="row"><button class="ghost" data-a="draft" data-id="${esc(c.id)}" data-d="${esc(d.id)}">${t('open')}</button>${isSr() ? `<button class="ghost danger" data-a="deldraft" data-id="${esc(d.id)}" data-c="${esc(c.id)}">${t('del')}</button>` : ''}</div></div>`).join('') : `<p class="m">${t('draft_none')}</p>`}</section>`;
  }
  return h;
}
// Case Ref: judgment ka hawala + jude hue case
const refText = r => r.kind === 'law' ? [r.title, r.cite].filter(Boolean).join(', ') : [r.cite, r.title].filter(Boolean).join(', ');
function refPanel(c) {
  const L = Array.isArray(c.case_refs) ? c.case_refs : [], mine = r => canAdd() || r.by === S.user.id;
  const one = r => `<div class="fe ref"><div>${chip(t(r.kind === 'law' ? 'ref_law' : 'ref_case'), r.kind === 'law' ? 'g' : '')} <b>${esc(r.cite)}</b>${r.title ? `<p>${esc(r.title)}</p>` : ''}${r.note ? `<p class="m">${esc(r.note)}</p>` : ''}</div>
    <div class="row"><button class="ghost" data-a="refcopy" data-id="${esc(c.id)}" data-r="${esc(r.id)}">${t('ref_copy')}</button>${mine(r) ? `<button class="ghost danger" data-a="refdel" data-id="${esc(c.id)}" data-r="${esc(r.id)}">${t('del')}</button>` : ''}</div></div>`;
  const law = L.filter(r => r.kind === 'law'), cs = L.filter(r => r.kind !== 'law');
  return `<section class="panel" id="refs"><h3>${t('ref_h')}</h3>${L.length ? law.concat(cs).map(one).join('') : `<p class="m">${t('ref_none')}</p>`}
    <div class="row"><button class="ghost" data-a="refadd" data-id="${esc(c.id)}" data-k="law">${t('ref_addlaw')}</button><button class="ghost" data-a="refadd" data-id="${esc(c.id)}" data-k="case">${t('ref_addcase')}</button></div></section>`;
}
// eCourtsIndia live status panel (sirf jab button dabaya ho)
function ecPanel(c) {
  const e = S.ecs[c.id]; if (!e || !S.ec || !S.ec.enabled) return '';
  const head = `<section class="panel ecp" id="ecp"><h3>${t('ec_h')}</h3>`, src = `<p class="m small">${t('ec_src')}</p>`;
  if (e.loading) return head + `<p class="m">${t('loading')}</p>${src}</section>`;
  if (e.err) return head + `<p class="err">${esc(e.err)}</p><div class="row"><button class="ghost" data-a="eclive" data-id="${esc(c.id)}">${t('ec_retry')}</button></div>${src}</section>`;
  const d = e.data || {}, sn = d.snapshot || {}, hs = sn.hearings || [], os = sn.orders || [];
  const vs = [(sn.petitioners || []).join(', '), (sn.respondents || []).join(', ')].filter(Boolean).join(' v ');
  let h = head + dl([[t('ec_status'), esc(sn.status || '') + (sn.disposal ? ' • ' + esc(sn.disposal) : '')], [t('ec_next'), sn.next_date ? `<b>${esc(fmt(sn.next_date))}</b>` : ''],
    [t('ph_court'), esc([sn.court, sn.district].filter(Boolean).join(', '))], [t('ec_judge'), esc((sn.judges || []).join(', '))], [t('ec_parties'), esc(vs)],
    [t('ec_dec'), sn.decision_date ? esc(fmt(sn.decision_date)) : '']]);
  if (d.differs) h += `<div class="ecdiff"><p>${esc(t('ec_differs', fmt(sn.next_date), d.stored_next ? fmt(d.stored_next) : '—'))}</p>${staff() ? `<button class="ghost strong" data-a="ecnd" data-id="${esc(c.id)}">${t('ec_upd')}</button>` : ''}</div>`;
  if (hs.length) h += `<h4>${t('ec_hear')}</h4><ul class="ecl">${hs.map(x => `<li><b>${esc(x.date ? fmt(x.date) : '—')}</b> ${esc(x.purpose || '')}${x.judge ? ' • ' + esc(x.judge) : ''}</li>`).join('')}</ul>`;
  h += `<h4>${t('ec_orders', sn.order_count || os.length)}</h4>${os.length ? `<ul class="ecl">${os.map(o => `<li><b>${esc(o.date ? fmt(o.date) : '—')}</b> ${esc(o.type || '')}</li>`).join('')}</ul>` : `<p class="m">${t('ec_noorder')}</p>`}`;
  h += `<p class="m small">${t(d.cached ? 'ec_cached' : 'ec_fetched', fmtT(d.fetched_at))}</p>`;
  if (d.queued) h += `<p class="m small">${t('ec_queued')}</p>`;
  if (isSr()) h += `<div class="row"><button class="ghost" data-a="ecforce" data-id="${esc(c.id)}">${t('ec_force')}</button></div><p class="m small">${t('ec_force_n')}</p>`;
  return h + src + '</section>';
}
async function ecFetch(id, force) {
  if (!navigator.onLine) return toast(t('need_net'));
  S.ecs[id] = { loading: true }; render();
  try { S.ecs[id] = { data: await api(`/cases/${id}/ecourts-status`, { method: 'POST', body: force ? { force: true } : {} }) }; }
  catch (e) { S.ecs[id] = { err: e.server ? (e.code && D['ecx_' + e.code] ? t('ecx_' + e.code) : e.message) : t('noserver') }; }
  if (S.view && S.view.t === 'case' && S.view.id === id) { render(); $('#ecp')?.scrollIntoView({ block: 'nearest' }); }
}
// CNR clipboard mein (navigator.clipboard, warna textarea + execCommand)
function copyText(v) {
  const old = () => { const ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch { /* chhod dein */ } ta.remove(); };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).catch(old); else old();
}
const EC_WEB = 'https://services.ecourts.gov.in/ecourtindia_v6/';
const EC_INTENT = 'intent://#Intent;package=in.gov.ecourts.eCourtsServices;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Din.gov.ecourts.eCourtsServices;end';
async function loadCaseExtras(id) {
  if (tmp(id) || !navigator.onLine) return;
  try {
    const [docs, drafts] = await Promise.all([api(`/cases/${id}/docs`), staff() ? api(`/cases/${id}/drafts`) : Promise.resolve(null)]);
    S.docs[id] = docs; if (drafts) S.drafts[id] = drafts;
    if (S.view && S.view.t === 'case' && S.view.id === id) render();
  } catch (e) { if (e.server) toast(e.message); }
}
// Documents ke bade button: upload (camera ya file), link, Google Drive
function docBar(c) {
  const dv = S.drive || {};
  const gd = !dv.enabled ? '' : dv.connected
    ? `<div class="gdon"><span>${esc(t('gd_on', dv.email || 'Gmail'))}</span><button class="ghost" data-a="gddisc">${t('gd_off')}</button></div>`
    : `<button class="ghost gdbtn" data-a="gdconnect">${t('gd_connect')}</button>`;
  return `<div class="docbar"><label class="bigbtn pri">${t('doc_add')}<input type="file" id="docup" data-id="${esc(c.id)}" accept="image/*,.pdf,application/pdf"></label>
    <button class="bigbtn ghost" data-a="addlink" data-id="${esc(c.id)}">${t('doc_link')}</button></div>
    <p class="m small">${t(dv.enabled && dv.connected ? 'doc_to_drive' : 'doc_to_app')}</p>${gd}`;
}
const docMeta = d => d.backend === 'link' ? esc(t('dk_link')) : esc((d.mime.split('/')[1] || '').toUpperCase()) + ' • ' + kb(d.size) + (d.backend === 'gdrive' ? ' • ' + esc(t('dk_drive')) : '');
// Photo ko upload se pehle chhota karein: lambi side max 1600px, JPEG quality 0.75. PDF waisi hi. Chhoti na ho to asli file.
const MAXPX = 1600;
async function shrink(file) {
  const hd = [...new Uint8Array(await file.slice(0, 8).arrayBuffer())].map(x => x.toString(16).padStart(2, '0')).join('');
  if (hd.startsWith('255044462d') || !/^image\//.test(file.type || 'image/') || typeof createImageBitmap !== 'function') return { file };   // PDF waisi hi
  const jpgPng = hd.startsWith('ffd8ff') || hd === '89504e470d0a1a0a';
  let bmp; try { bmp = await createImageBitmap(file); } catch { return { file }; }      // decode na ho to asli file
  const sc = Math.min(1, MAXPX / Math.max(bmp.width, bmp.height));
  if (sc === 1 && jpgPng && file.size <= 400 * 1024) { if (bmp.close) bmp.close(); return { file }; }   // pehle se chhoti photo
  const w = Math.max(1, Math.round(bmp.width * sc)), h = Math.max(1, Math.round(bmp.height * sc));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.imageSmoothingQuality = 'high'; g.drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  const blob = await new Promise(ok => cv.toBlob(ok, 'image/jpeg', 0.75));
  cv.width = cv.height = 0;
  if (!blob || (jpgPng && blob.size >= file.size)) return { file };       // chhoti nahi hui: asli bhejein (HEIC/WebP hamesha JPEG banegi)
  const name = (file.name || 'photo').replace(/\.[^.]*$/, '') + '.jpg';
  return { file: new File([blob], name, { type: 'image/jpeg' }), from: file.size, to: blob.size };
}
async function upload(id, file0) {
  if (!navigator.onLine) return toast(t('need_net'));
  const { file, from, to } = await shrink(file0);
  if (file.size > 10 * 1024 * 1024) return toast(t('doc_big'));
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer()), hx = [...head].map(x => x.toString(16).padStart(2, '0')).join('');
  if (!(hx.startsWith('255044462d') || hx.startsWith('ffd8ff') || hx === '89504e470d0a1a0a')) return toast(t('doc_type'));
  toast(t('doc_wait'));
  const r = await fetch(`/api/cases/${id}/docs`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name.slice(0, 120)), Authorization: 'Bearer ' + localStorage.getItem('t') }, body: file });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) { logout(); return; }
  if (!r.ok) return toast(se(d.error || 'Upload nahi hua, dobara try karein'));
  (S.docs[id] ||= []).unshift(d);
  if (d.fallback) try { S.drive = await api('/drive/status'); } catch { /* agli baar */ }
  toast([from ? t('doc_shrunk', kb(from), kb(to)) : '', t(d.fallback ? 'gd_fallback' : 'doc_ok')].filter(Boolean).join(' • ')); load(); render();
}

// ---------- clients ----------
function clientForm(c = {}, f = 'client') {
  const i = (n, ph, m, extra = '') => `<input name="${n}" placeholder="${ph}" maxlength="${m}" value="${esc(c[n] || '')}" ${extra}>`;
  return `<form data-f="${f}"${c.id ? ` data-id="${esc(c.id)}"` : ''}>${i('name', t('ph_name'), 120, 'required')}${i('phone', t('ph_mobile'), 20, 'inputmode="tel"')}${i('guardian', t('guardian'), 120)}${i('address', t('address'), 300)}
    <textarea name="notes" rows="2" maxlength="1000" placeholder="${t('cl_notes')}">${esc(c.notes || '')}</textarea>
    <div class="row"><button class="pri">${t('savecl')}</button>${c.id ? `<button type="button" class="ghost" data-a="x">${t('close')}</button>` : ''}</div></form>`;
}
function clientRows() {
  const q = S.cq.toLowerCase(), a = S.clients.filter(c => !q || [c.name, c.phone, c.guardian, c.address].some(x => (x || '').toLowerCase().includes(q)));
  return a.slice(0, 200).map(c => {
    const cs = S.cases.filter(x => x.client_id === c.id), d = cs.reduce((s, x) => s + Math.max(due(x.id), 0), 0);
    return `<button class="fe crow" data-a="client" data-id="${esc(c.id)}"><div><b>${esc(c.name)}</b><p class="m">${esc(c.phone || '')}${c.guardian ? ' • ' + esc(c.guardian) : ''}</p></div>
      <div class="r"><span class="m">${t('ncases', cs.length)}</span>${d > 0 ? `<b class="due">${money(d)}</b>` : ''}</div></button>`;
  }).join('') || `<p class="empty">${t('nocl')}</p>`;
}
const vClients = () => `<details class="add"${S.openAdd === 'client' ? ' open' : ''}><summary>${t('addclient')}</summary>${clientForm()}</details>
  <input id="cq" type="search" placeholder="${t('cl_search')}" value="${esc(S.cq)}"><div id="clist">${clientRows()}</div>`;
function vClient(id) {
  const c = S.clients.find(x => x.id === id); if (!c) { S.view = null; return vTab(); }
  const cs = S.cases.filter(x => x.client_id === c.id), tot = cs.reduce((s, x) => s + Math.max(due(x.id), 0), 0), p = waNum(c.phone);
  return `<button class="ghost back" data-a="back">${t('back')}</button>
    <section class="panel head"><div><h2 class="h">${esc(c.name)}</h2><p class="m">${c.guardian ? esc(t('guardian')) + ': ' + esc(c.guardian) : ''}</p></div>
      <div class="nd"><small>${t('cl_due')}</small><b>${money(tot)}</b></div></section>
    <section class="panel">${dl([[t('ph_mobile'), esc(c.phone || '')], [t('address'), esc(c.address || '')], [t('note'), esc(c.notes || '')]])}
      <div class="row">${c.phone ? `<a class="btn pri" href="tel:${esc(c.phone)}">${t('call')}</a><a class="btn ghost" href="https://wa.me/${esc(p)}" target="_blank" rel="noopener">${t('wa_chat')}</a>` : ''}
      <button class="ghost" data-a="editcl" data-id="${esc(c.id)}">${t('edit')}</button><button class="ghost" data-a="clcase" data-id="${esc(c.id)}">${t('cl_newcase')}</button></div></section>
    <h2>${t('cl_cases')} <small>${cs.length}</small></h2>${cs.map(card).join('') || `<p class="m">${t('nocase')}</p>`}`;
}

// ---------- notes ----------
function noteForm(n = {}, f = 'note') {
  const cs = pendingCases();
  return `<form data-f="${f}"${n.id ? ` data-id="${esc(n.id)}"` : ''}><input name="title" placeholder="${t('n_title')}" maxlength="160" value="${esc(n.title || '')}">
    <input name="tag" placeholder="${t('n_tag')}" maxlength="40" value="${esc(n.tag || '')}">
    <textarea name="body" rows="4" maxlength="5000" placeholder="${t('n_body')}">${esc(n.body || '')}</textarea>
    <label>${t('n_case')}<select name="case_id"><option value="">${t('none')}</option>${cs.map(c => `<option value="${esc(c.id)}"${c.id === n.case_id ? ' selected' : ''}>${esc(cname(c))} ${esc(c.party_name || '')}</option>`).join('')}</select></label>
    ${isSr() ? `<label class="ckl"><input type="checkbox" name="private" value="1"${n.private ? ' checked' : ''}> ${t('n_priv')}</label>` : ''}
    <div class="row"><button class="pri">${t('save')}</button>${n.id ? `<button type="button" class="ghost" data-a="x">${t('close')}</button>` : ''}</div></form>`;
}
function noteRows() {
  const q = S.nq.toLowerCase(), a = S.notes.filter(n => !q || [n.title, n.body, n.tag].some(x => (x || '').toLowerCase().includes(q)));
  return a.map(n => { const c = n.case_id && S.cases.find(x => x.id === n.case_id), mine = isSr() || n.created_by === S.user.id;
    return `<article class="note"><div class="nh"><b>${esc(n.title)}</b>${n.tag ? chip('#' + n.tag, 'gold') : ''}${n.private ? chip(t('private'), 'red') : ''}</div>
      ${n.body ? `<p class="nb">${esc(n.body)}</p>` : ''}<p class="m">${c ? `<button class="link" data-a="open" data-id="${esc(c.id)}">${esc(cname(c))}</button> • ` : ''}${n.by ? esc(t('by', n.by)) + ' • ' : ''}${esc(fmtT(n.updated_at || n.created_at))}</p>
      ${mine && !tmp(n.id) ? `<div class="row"><button class="ghost" data-a="editnote" data-id="${esc(n.id)}">${t('edit')}</button><button class="ghost danger" data-a="delnote" data-id="${esc(n.id)}">${t('del')}</button></div>` : ''}</article>`; }).join('')
    || `<p class="empty">${t('n_none')}</p>`;
}
const vNotes = () => `<details class="add"${S.openAdd === 'note' ? ' open' : ''}><summary>${t('addnote')}</summary>${noteForm()}</details>
  <input id="nq" type="search" placeholder="${t('n_search')}" value="${esc(S.nq)}"><div id="nlist">${noteRows()}</div>`;

// ---------- BNS / BNSS / BSA section finder ----------
async function getLaw() {
  if (S.law) return S.law;
  try { S.law = await (await fetch('/law-sections.json')).json(); } catch { S.law = { meta: {}, s: [] }; }
  return S.law;
}
function lawSearch(q) {
  q = q.trim().toLowerCase(); if (!q) return [];
  const qn = q.replace(/\s+/g, ''), num = /^\d/.test(qn), out = [];
  const base = x => x.toLowerCase().replace(/\s+/g, '').split('(')[0];
  for (const e of S.law.s) {
    let sc = 0; const os = e.os.toLowerCase(), ns = e.ns.toLowerCase().replace(/\s+/g, '');
    if (num) {
      if (os === qn) sc = 100; else if (base(e.ns) === qn || ns === qn) sc = 90; else if (ns.startsWith(qn)) sc = 70; else if (os.startsWith(qn)) sc = 60;
      else if (ns.split('/').some(x => x.startsWith(qn))) sc = 50;
    } else {
      const txt = (e.en + ' ' + e.hi + ' ' + e.k + ' ' + e.o + ' ' + e.n).toLowerCase();
      const words = q.split(/\s+/);
      if (words.every(w => txt.includes(w))) sc = 40 + (e.k.toLowerCase().split(' ').includes(words[0]) ? 20 : 0) + (e.en.toLowerCase().startsWith('punishment') ? 5 : 0);
    }
    if (sc) out.push([sc, e]);
  }
  return out.sort((a, b) => b[0] - a[0]).map(x => x[1]);
}
function lawRow(e) {
  const nat = [e.c && chip(t(e.c === 'C' ? 'n_c' : 'n_nc'), e.c === 'C' ? 'red' : ''), e.b && chip(t(e.b === 'B' ? 'n_b' : 'n_nb'), e.b === 'NB' ? 'red' : 'green')].filter(Boolean).join(' ');
  const sec = e.x === 1 ? '' : (e.x === 2 ? `${e.o} ${e.os}` : `${e.n} ${e.ns}`);
  return `<article class="law"><div class="lh"><span class="old">${esc(e.o)} ${esc(e.os)}</span><span class="arr">→</span><span class="new">${e.x === 1 ? esc(t('law_omit')) : e.x === 2 ? esc(t('law_same')) : esc(e.n + ' ' + e.ns)}</span></div>
    <p><b>${esc(e.en)}</b></p><p class="m">${esc(e.hi)}</p>${nat ? `<div class="row nat">${nat}</div>` : ''}
    ${sec && staff() ? `<div class="row"><button class="ghost" data-a="addsec" data-s="${esc(sec)}">${t('law_add')}</button></div>` : ''}</article>`;
}
function lawResults() {
  if (!S.law) return `<p class="m">${t('loading')}</p>`;
  if (!S.lawQ.trim()) return `<p class="empty">${t('law_hint')}</p>`;
  const r = lawSearch(S.lawQ);
  return r.length ? r.slice(0, 40).map(lawRow).join('') + (r.length > 40 ? `<p class="m">${t('law_more', r.length - 40)}</p>` : '') : `<p class="empty">${t('law_none')}</p>`;
}
function vLaw() {
  if (!S.law) getLaw().then(() => { if (S.tab === 'law' && !S.view) { const l = $('#llist'); if (l) l.innerHTML = lawResults(); } });
  const tc = S.secTarget && S.cases.find(c => c.id === S.secTarget);
  return `<h2>${t('law_h')}</h2>${tc ? `<p class="target">${t('law_for', esc(cname(tc)))} <button class="link" data-a="open" data-id="${esc(tc.id)}">${t('open')}</button> <button class="link" data-a="untarget">✕</button></p>` : ''}
    <input id="lq" type="search" placeholder="${t('law_ph')}" value="${esc(S.lawQ)}" autocomplete="off">
    <p class="disc">${t('law_disc')} <a href="https://www.indiacode.nic.in/" target="_blank" rel="noopener">India Code</a></p><div id="llist">${lawResults()}</div>`;
}

// ---------- draft editor ----------
function vDraftEd(v) {
  const c = S.cases.find(x => x.id === v.id); if (!c) { S.view = null; return vTab(); }
  return `<button class="ghost back" data-a="open" data-id="${esc(c.id)}">${t('back')}</button>
    <section class="panel"><h3>${t('k_' + v.kind)} — ${esc(cname(c))}</h3><p class="warn">${t('dr_warn')}</p><p class="m">${t('dr_help')}</p>
    <form data-f="draft" data-id="${esc(c.id)}" data-k="${esc(v.kind)}"${v.did ? ` data-d="${esc(v.did)}"` : ''}>
      <label>${t('dr_title')}<input name="title" maxlength="120" value="${esc(v.title)}"></label>
      <textarea name="body" class="draft${/_bn$/.test(v.kind) ? ' bn' : ''}" rows="24" maxlength="20000" spellcheck="false">${esc(v.body)}</textarea>
      <div class="row"><button class="pri">${t('save')}</button><button type="button" class="ghost" data-a="print">${t('dr_print')}</button></div></form></section>`;
}
function printDoc(title, body, bn) {
  const w = window.open('', '_blank'); if (!w) return toast(t('popup'));
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&family=Noto+Serif+Bengali:wght@400;700&display=swap">
    <style>@page{size:A4;margin:22mm 20mm 24mm}*{box-sizing:border-box}body{margin:0;color:#000;font:13pt/1.65 "Times New Roman",Times,"Noto Serif","Noto Serif Bengali","Nirmala UI",serif}
    ${bn ? 'body{font-family:"Noto Serif Bengali","Nirmala UI","Times New Roman",serif}' : ''}
    pre{white-space:pre-wrap;word-wrap:break-word;font:inherit;margin:0}.ft{margin-top:28px;border-top:1px solid #999;padding-top:6px;font:9pt Arial,sans-serif;color:#555}
    @media screen{body{max-width:210mm;margin:16px auto;padding:20mm;box-shadow:0 0 8px #aaa}}</style></head>
    <body><pre>${esc(body)}</pre><p class="ft">Draft — advocate must review before filing. • ${esc(S.user.chamber || '')}</p></body></html>`);
  w.document.close(); w.focus();
  const go = () => { try { w.print(); } catch (e) { } };
  (w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve()).then(() => setTimeout(go, 300));
}

// ---------- fees, team, backup ----------
function vFees() {
  const tot = Object.values(B).reduce((a, b) => a + Math.max(b.ch - b.pd, 0), 0);
  const nm = id => cname(S.cases.find(x => x.id === id));
  return `<div class="sum"><span>${t('totaldue')}</span><b>${money(tot)}</b></div>` + (S.fees.slice(0, 100).map(f =>
    `<div class="fe"><div><b>${f.kind === 'payment' ? t('got') : t('fixed')} ${money(f.amount)}</b><p class="m">${esc(nm(f.case_id))} • ${fmt(f.created_at.slice(0, 10))} ${esc(f.note || '')}</p></div>
    ${f.kind === 'payment' && !tmp(f.id) ? `<button class="ghost" data-a="rcpt" data-id="${esc(f.id)}">${t('rcpt')}</button>` : ''}</div>`).join('')
    || `<p class="empty">${t('nofees')}</p>`);
}
function settingsForm() {
  const c = S.chamber || {}, i = (n, l, m, extra = '') => `<label>${l}<input name="${n}" maxlength="${m}" value="${esc(c[n] || '')}" ${extra}></label>`;
  return `<details class="add"${S.openAdd === 'set' ? ' open' : ''}><summary>${t('set_h')}</summary><form data-f="chamber">
    ${i('adv_name', t('adv_name'), 120)}${i('adv_enrol', t('adv_enrol'), 60)}${i('address', t('ch_addr'), 300)}${i('upi_id', t('upi_id'), 120, 'autocomplete="off" spellcheck="false"')}${i('upi_name', t('upi_name'), 80)}
    <button class="pri">${t('save')}</button></form></details>`;
}
const vTeam = () => settingsForm() + `<details class="add"><summary>${t('addmember')}</summary><form data-f="user">
  <input name="name" placeholder="${t('ph_name')}" required><input name="email" type="email" placeholder="${t('email')}" required><input name="phone" placeholder="${t('ph_mobile')}">
  <select name="role"><option value="junior">${t('r_junior')}</option><option value="munshi">${t('r_munshi')}</option><option value="client">${t('r_client')}</option></select>
  <input name="password" type="password" minlength="8" placeholder="${t('ph_pw')}" autocomplete="new-password" required>
  <button class="pri">${t('mkmember')}</button></form></details>` + S.users.map(u =>
  `<div class="fe"><div><b>${esc(u.name || u.email)}</b><p class="m">${t('r_' + u.role)} • ${esc(u.email)}${u.active ? '' : ' • ' + t('inactive')}</p></div>
  ${u.id !== S.user.id ? `<div class="row"><button class="ghost" data-a="pw" data-id="${esc(u.id)}">${t('resetpw')}</button><button class="ghost" data-a="act" data-id="${esc(u.id)}" data-on="${u.active ? 0 : 1}">${u.active ? t('deact') : t('act')}</button></div>` : ''}</div>`).join('');
const vBackup = () => `<p>${t('bk_info')}</p>
  <p class="m">${t('bk_last', localStorage.getItem('bk') ? esc(fmt(localStorage.getItem('bk'))) : t('bk_never'))}</p>
  <div class="row"><button class="pri" data-a="csv">${t('bk_csv')}</button><button class="ghost" data-a="json">${t('bk_json')}</button></div>`;

// ---------- import, tasks, calendar ----------
const importBox = () => `<details class="add"><summary>${t('imp_title')}</summary><p class="m">${t('imp_help')}</p><input type="file" id="imp" accept=".csv,text/csv"><div class="row"><button type="button" class="ghost" data-a="sample">${t('imp_sample')}</button></div></details>`;
function parseCSV(txt) {
  txt = txt.replace(/^\ufeff/, ''); const l1 = txt.split('\n', 1)[0];
  const d = l1.includes('\t') ? '\t' : (l1.split(';').length > l1.split(',').length ? ';' : ',');
  const rows = []; let r = [], v = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { v += '"'; i++; } else q = false; } else v += c; }
    else if (c === '"') q = true;
    else if (c === d) { r.push(v); v = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; r.push(v); v = ''; if (r.some(x => x.trim())) rows.push(r); r = []; }
    else v += c;
  }
  r.push(v); if (r.some(x => x.trim())) rows.push(r); return rows;
}
const hk = h => { h = h.toLowerCase(); return /cnr/.test(h) ? 'cnr' : /mobile|phone|whatsapp/.test(h) ? 'client_phone' : /date/.test(h) ? 'next_date' : /\bps\b|thana|police|station/.test(h) ? 'ps_name' : /court/.test(h) ? 'court' : /stage/.test(h) ? 'stage' : /party|name|naam/.test(h) ? 'party_name' : /case/.test(h) ? 'case_no' : null; };
const toIso = v => { v = (v || '').trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v; const m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/); return m ? `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : ''; };
async function importCSV(file) {
  const rows = parseCSV(await file.text()); if (rows.length < 2) return toast(t('imp_empty'));
  const keys = rows[0].map(hk);
  const data = rows.slice(1).map(r => { const o = {}; keys.forEach((k, i) => { if (k && String(r[i] ?? '').trim()) o[k] = String(r[i]).trim(); }); if (o.next_date) { o.next_date = toIso(o.next_date); if (!o.next_date) delete o.next_date; } return o; }).filter(o => o.case_no || o.cnr);
  if (!data.length) return toast(t('imp_empty'));
  let add = 0; for (let i = 0; i < data.length; i += 200) add += (await api('/cases/import', { method: 'POST', body: { rows: data.slice(i, i + 200) } })).added;
  toast(t('imp_done', add, data.length - add)); await load();
}
const taskForm = () => `<details class="add"${S.openAdd === 'task' ? ' open' : ''}><summary>${t('addtask')}</summary><form data-f="task">
  <input name="title" placeholder="${t('ph_task')}" maxlength="160" required>
  <label>${t('duedate')}<input type="date" name="due_date"></label>
  <label>${t('assign')}<select name="assigned_to">${S.users.filter(u => u.role !== 'client' && u.active).map(u => `<option value="${esc(u.id)}"${u.id === S.user.id ? ' selected' : ''}>${esc(u.name || u.email)}</option>`).join('')}</select></label>
  <select name="priority"><option value="medium">${t('p_medium')}</option><option value="high">${t('p_high')}</option><option value="low">${t('p_low')}</option></select>
  <button class="pri">${t('save')}</button></form></details>`;
const taskRow = x => `<div class="fe task${x.done ? ' dn' : ''}"><button class="ck" data-a="tk" data-id="${esc(x.id)}" data-on="${x.done ? 0 : 1}" aria-label="done">${x.done ? '✓' : ''}</button>
  <div><b>${esc(x.title)}</b><p class="m">${esc(x.assignee || '')} • ${t('p_' + x.priority)}${x.due_date ? ' • ' + esc(fmt(x.due_date)) : ''}</p></div></div>`;
function vTasks() {
  const open = S.tasks.filter(x => !x.done), dn = S.tasks.filter(x => x.done);
  return (canAdd() ? taskForm() : '') + (open.map(taskRow).join('') || `<p class="empty">${t('no_tasks')}</p>`)
    + (dn.length ? `<h2>${t('done_h')} <small>${dn.length}</small></h2>` + dn.slice(0, 20).map(taskRow).join('') : '');
}
function vCal() {
  const { y, m, sel } = S.cal, pre = `${y}-${String(m + 1).padStart(2, '0')}-`, n = new Date(y, m + 1, 0).getDate(), cnt = {};
  S.cases.forEach(c => { if (c.status === 'pending' && c.next_date && c.next_date.startsWith(pre)) cnt[c.next_date] = (cnt[c.next_date] || 0) + 1; });
  let cells = '<i></i>'.repeat(new Date(y, m, 1).getDay());
  for (let d = 1; d <= n; d++) { const k = pre + String(d).padStart(2, '0'); cells += `<button class="cd${k === TODAY ? ' td' : ''}${k === sel ? ' sel' : ''}" data-a="day" data-k="${k}">${d}${cnt[k] ? `<small>${cnt[k]}</small>` : ''}</button>`; }
  const wd = [...Array(7)].map((_, i) => `<b>${new Date(2023, 0, 1 + i).toLocaleDateString(LOC[LANG], { weekday: 'narrow' })}</b>`).join('');
  const list = S.cases.filter(c => c.status === 'pending' && c.next_date === sel);
  return `<div class="calh"><button class="ghost" data-a="cm" data-d="-1">‹</button><h2>${new Date(y, m, 1).toLocaleDateString(LOC[LANG], { month: 'long', year: 'numeric' })}</h2><button class="ghost" data-a="cm" data-d="1">›</button></div>
    <div class="cal">${wd}${cells}</div><h2>${fmt(sel)} <small>${list.length}</small></h2>${list.map(card).join('') || `<p class="empty">${t('cal_none')}</p>`}`;
}

const vTab = () => ({ dash: vDash, today: vDash, cal: vCal, cases: vCases, clients: vClients, tasks: vTasks, fees: vFees, notes: vNotes, law: vLaw, team: vTeam, backup: vBackup, help: vHelp }[S.tab])();
function render() {
  TODAY = iso(new Date()); S.cal ??= { y: new Date().getFullYear(), m: new Date().getMonth(), sel: TODAY };
  $('#login').hidden = !!S.user; $('#app').hidden = !S.user;
  if (!S.user) return;
  const tabs = TABS[S.user.role]; if (!tabs.some(x => x[0] === S.tab)) S.tab = tabs[0][0];
  $('#who').textContent = (S.user.chamber ? S.user.chamber + ' • ' : '') + (S.user.name || S.user.email);
  $('#tabs').innerHTML = tabs.map(([k, l]) => `<button data-a="tab" data-k="${k}" class="${k === S.tab ? 'on' : ''}">${t(l)}</button>`).join('');
  buildBal();
  const v = S.view;
  $('#view').innerHTML = v ? (v.t === 'case' ? vCase(v.id) : v.t === 'client' ? vClient(v.id) : v.t === 'draft' ? vDraftEd(v) : vTab()) : hintBar() + vTab();
  S.openAdd = ''; bar();
  const on = $('#tabs .on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
const go = (view, tab) => { if (tab) S.tab = tab; S.view = view; render(); scrollTo(0, 0); };

// ---------- backup helpers (CSV ke headings hamesha English, Excel ke liye) ----------
const csv = rows => '\ufeff' + rows.map(r => r.map(v => { v = v ?? ''; if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v; return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',')).join('\r\n');
const dlFile = (name, txt, type, mark = true) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1e4); if (mark) localStorage.setItem('bk', TODAY); };

// ---------- drafting templates ----------
const KINDS = ['vakalatnama', 'affidavit', 'affidavit_bn', 'notice', 'bail_480', 'bail_482', 'bail_bn', 'adjourn', 'hazira'];
function draftCtx(c) {
  const cl = clientOf(c) || {}, ch = S.chamber || {}, B_ = '________', v = x => (x && String(x).trim()) || B_;
  return { court: v(c.court).toUpperCase(), courtRaw: v(c.court), caseNo: v(c.case_no || c.cnr), ps: v(c.ps_name), fir: v(c.fir_no), firDate: c.fir_date ? fmtD(c.fir_date) : B_,
    sec: v(c.sections), party: v(c.party_name), client: v(cl.name || c.party_name), guardian: v(cl.guardian), address: v(cl.address), adv: v(ch.adv_name || S.user.name),
    enrol: v(ch.adv_enrol), chamber: v(ch.name || S.user.chamber), chAddr: v(ch.address), next: c.next_date ? fmtD(c.next_date) : B_, stage: v(c.stage), ip: v(c.ip_name),
    cs: c.chargesheet_date ? fmtD(c.chargesheet_date) : '', today: fmtD(TODAY), year: TODAY.slice(0, 4), B: B_ };
}
const fmtD = d => { const [y, m, dd] = d.split('-'); return `${dd}.${m}.${y}`; };
const TPL = {
  vakalatnama: x => `IN THE COURT OF THE LD. ${x.court}

${x.caseNo}
${x.fir !== x.B ? `(${x.ps} P.S. Case No. ${x.fir} dated ${x.firDate}, U/s ${x.sec})\n` : ''}
${x.party}

VAKALATNAMA

I/We, ${x.client}, son/daughter/wife of ${x.guardian}, residing at ${x.address}, the ${x.B} (petitioner/accused/plaintiff/defendant) in the above case, do hereby appoint and retain ${x.adv}, Advocate (Enrolment No. ${x.enrol}), to appear, act and plead for me/us in the above case and in all proceedings arising therefrom or connected therewith, including applications for bail, petitions of every kind, inspection and obtaining of certified copies, filing and taking back of documents, depositing and withdrawing money, and to do all acts necessary for the conduct of the case in this Court and in any Court to which the case may be transferred.

I/We agree to ratify all acts done by the said Advocate in pursuance of this authority. The Advocate shall not be responsible for any default in my/our appearance or for non-payment of fees.

[Affix Advocates' Welfare Fund stamp / Court fee as applicable]

Date: ${x.today}
Place: ${x.B}

                                              ______________________________
                                              Signature / L.T.I. of Executant(s)

Accepted:

${x.adv}
Advocate`,

  affidavit: x => `BEFORE THE LD. ${x.court}
[or: BEFORE THE NOTARY PUBLIC / LD. EXECUTIVE MAGISTRATE, ${x.B}]

In the matter of: ${x.caseNo}
${x.party}

AFFIDAVIT

I, ${x.client}, son/daughter/wife of ${x.guardian}, aged about ____ years, by faith ________, by occupation ________, by nationality Indian, residing at ${x.address}, do hereby solemnly affirm and declare as follows:

1. That I am the ________ in the above matter and I am well acquainted with the facts and circumstances of the case, and as such I am competent to swear this affidavit.

2. That ________________________________________________________________.

3. That ________________________________________________________________.

4. That the statements made in paragraphs 1 to ____ above are true to my knowledge and belief, and nothing material has been concealed therefrom.

VERIFICATION

I, the deponent above named, do hereby verify that the contents of this affidavit are true and correct to the best of my knowledge, information and belief. Verified at ________ on this ${x.today}.

Identified by:                                ______________________________
                                              DEPONENT
${x.adv}
Advocate`,

  affidavit_bn: x => `বিজ্ঞ ${x.courtRaw} আদালত সমীপে
[অথবা: নোটারি পাবলিক / বিজ্ঞ এক্সিকিউটিভ ম্যাজিস্ট্রেট, ${x.B} সমীপে]

বিষয়: ${x.caseNo}
${x.party}

হলফনামা

আমি, ${x.client}, পিতা/স্বামী ${x.guardian}, বয়স আনুমানিক ____ বৎসর, ধর্ম ________, পেশা ________, জাতীয়তা ভারতীয়, সাকিন ${x.address}, এই মর্মে হলফপূর্বক ঘোষণা করিতেছি যে:

১। আমি উক্ত মামলার ________ এবং মামলার সমস্ত ঘটনা ও পরিস্থিতি সম্পর্কে সম্যক অবগত আছি, সেই কারণে এই হলফনামা করিতে সক্ষম।

২। ________________________________________________________________।

৩। ________________________________________________________________।

৪। উপরের ১ হইতে ____ নং অনুচ্ছেদে বর্ণিত বিষয়গুলি আমার জ্ঞান ও বিশ্বাসমতে সত্য, এবং কোনো গুরুত্বপূর্ণ তথ্য গোপন করা হয় নাই।

সত্যপাঠ

আমি উপরোক্ত হলফকারী এই মর্মে সত্যপাঠ করিতেছি যে এই হলফনামার বিষয়বস্তু আমার জ্ঞান, তথ্য ও বিশ্বাসমতে সত্য ও সঠিক। অদ্য ${x.today} তারিখে ________-এ সত্যপাঠ করা হইল।

সনাক্তকারী:                                   ______________________________
                                              হলফকারীর স্বাক্ষর
${x.adv}
অ্যাডভোকেট`,

  notice: x => `${x.adv}
Advocate
${x.chamber}
${x.chAddr}

Ref. No.: ________                                        Date: ${x.today}

BY REGISTERED POST WITH A/D / SPEED POST

To,
________________________________ (name of the noticee)
________________________________ (address)

Sub: LEGAL NOTICE

Sir/Madam,

Under instructions from and on behalf of my client ${x.client}, son/daughter/wife of ${x.guardian}, residing at ${x.address} (hereinafter referred to as "my client"), I do hereby serve upon you the following legal notice:

1. That ________________________________________________________________.

2. That ________________________________________________________________.

3. That in spite of repeated requests and demands, you have failed and neglected to ________________________________.

I, therefore, through this notice call upon you to ________________________________ within ____ days from the date of receipt of this notice, failing which my client shall be constrained to initiate appropriate civil and/or criminal proceedings against you before the competent Court of law, entirely at your risk as to costs and consequences.

A copy of this notice has been retained in my office for record and further necessary action.

Yours faithfully,

(${x.adv})
Advocate`,

  bail_480: x => `IN THE COURT OF THE LD. ${x.court}

${x.caseNo}
Arising out of ${x.ps} P.S. Case No. ${x.fir} dated ${x.firDate}
U/s ${x.sec}

State
        -Versus-
${x.client}                                        ... Accused/Petitioner

PETITION FOR BAIL UNDER SECTION 480 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023

The humble petition of the accused/petitioner above named most respectfully sheweth:

1. That the petitioner has been falsely implicated in the above case and has been in custody since ________.

2. That the petitioner is innocent and has not committed any offence as alleged. The allegations made against the petitioner are vague, general and not supported by any material.

3. That the petitioner is a permanent resident of ${x.address} and there is no likelihood of the petitioner absconding, tampering with evidence or influencing witnesses.

4. That ${x.cs ? `the chargesheet has already been submitted on ${x.cs}` : 'the investigation is complete / the chargesheet has been submitted on ________'} and further detention of the petitioner is not necessary.

5. That the petitioner has no criminal antecedents. [Edit as per facts]

6. That the petitioner is ready and willing to furnish adequate bail bond with sufficient sureties and to abide by any condition that this Ld. Court may be pleased to impose.

It is, therefore, prayed that Your Honour may graciously be pleased to release the petitioner on bail on such terms and conditions as Your Honour may deem fit and proper.

And for this act of kindness, the petitioner, as in duty bound, shall ever pray.

Date: ${x.today}
                                              Advocate for the Petitioner
                                              ${x.adv}`,

  bail_482: x => `IN THE COURT OF THE LD. SESSIONS JUDGE, MALDA
[or the Ld. Court having jurisdiction]

Criminal Misc. Case No. ________ of ${x.year}

In connection with ${x.ps} P.S. Case No. ${x.fir} dated ${x.firDate}
U/s ${x.sec}

${x.client}, son/daughter/wife of ${x.guardian}, residing at ${x.address}
                                              ... Petitioner
        -Versus-
The State of West Bengal                       ... Opposite Party

APPLICATION UNDER SECTION 482 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 FOR GRANT OF ANTICIPATORY BAIL

The humble petition of the petitioner above named most respectfully sheweth:

1. That the petitioner apprehends arrest in connection with the above case, which has been registered on the basis of a complaint lodged by ${x.ip} (de-facto complainant).

2. That the petitioner is innocent and has been falsely implicated owing to ________________________________.

3. That the allegations, even if taken at face value, do not disclose the commission of the offences alleged against the petitioner. [Edit as per facts]

4. That the petitioner is a law-abiding citizen and a permanent resident of the above address, having no criminal antecedents, and there is no possibility of the petitioner fleeing from justice.

5. That the petitioner undertakes to cooperate with the investigation, to make himself/herself available for interrogation by the police officer as and when required, and not to directly or indirectly make any inducement, threat or promise to any person acquainted with the facts of the case.

6. That no other application for anticipatory bail in connection with the same case is pending before any other Court.

It is, therefore, prayed that Your Honour may graciously be pleased to direct that, in the event of arrest, the petitioner be released on bail on such terms and conditions as Your Honour may deem fit and proper.

And for this act of kindness, the petitioner, as in duty bound, shall ever pray.

Date: ${x.today}
                                              Advocate for the Petitioner
                                              ${x.adv}`,

  bail_bn: x => `বিজ্ঞ ${x.courtRaw} আদালত সমীপে

মামলা নং: ${x.caseNo}
${x.ps} থানা মামলা নং ${x.fir}, তারিখ ${x.firDate}
ধারা: ${x.sec}

রাষ্ট্র
        -বনাম-
${x.client}                                        ... অভিযুক্ত/আবেদনকারী

ভারতীয় নাগরিক সুরক্ষা সংহিতা, ২০২৩-এর ৪৮০ ধারা অনুযায়ী জামিনের আবেদন

আবেদনকারীর বিনীত নিবেদন এই যে,

১। আবেদনকারীকে উক্ত মামলায় মিথ্যাভাবে জড়ানো হইয়াছে এবং তিনি ________ তারিখ হইতে হেফাজতে আছেন।

২। আবেদনকারী সম্পূর্ণ নির্দোষ এবং অভিযোগে বর্ণিত কোনো অপরাধ তিনি করেন নাই। তাঁহার বিরুদ্ধে আনীত অভিযোগ অস্পষ্ট ও ভিত্তিহীন।

৩। আবেদনকারী ${x.address}-এর স্থায়ী বাসিন্দা; তাঁহার পলাইয়া যাওয়ার, সাক্ষ্যপ্রমাণ নষ্ট করিবার বা সাক্ষীকে প্রভাবিত করিবার কোনো সম্ভাবনা নাই।

৪। ${x.cs ? `এই মামলায় ${x.cs} তারিখে চার্জশিট দাখিল হইয়াছে` : 'তদন্ত সম্পূর্ণ হইয়াছে / ________ তারিখে চার্জশিট দাখিল হইয়াছে'} এবং আবেদনকারীকে আর আটক রাখার প্রয়োজন নাই।

৫। আবেদনকারীর পূর্বে কোনো অপরাধমূলক রেকর্ড নাই। [ঘটনা অনুযায়ী সংশোধন করুন]

৬। আবেদনকারী উপযুক্ত জামিনদারসহ বেলবন্ড দিতে এবং বিজ্ঞ আদালতের আরোপিত যেকোনো শর্ত মানিয়া চলিতে প্রস্তুত।

অতএব প্রার্থনা, বিজ্ঞ আদালত অনুগ্রহপূর্বক আবেদনকারীকে উপযুক্ত শর্তে জামিনে মুক্তির আদেশ দান করিতে মর্জি হয়।

এবং এই দয়ার জন্য আবেদনকারী চিরকাল প্রার্থনা করিবেন।

তারিখ: ${x.today}
                                              আবেদনকারীর পক্ষে অ্যাডভোকেট
                                              ${x.adv}`,

  adjourn: x => `IN THE COURT OF THE LD. ${x.court}

${x.caseNo}
${x.party}

PETITION FOR ADJOURNMENT / TIME

The humble petition of the ________ (petitioner/accused/plaintiff/defendant) above named most respectfully sheweth:

1. That the above case is fixed on ${x.next} for ${x.stage}.

2. That the petitioner / the Ld. Advocate for the petitioner is unable to take steps on the said date because ________________________________ (reason).

3. That the said inability is neither wilful nor deliberate, and unless time is granted the petitioner shall suffer irreparable loss and injury.

It is, therefore, prayed that Your Honour may graciously be pleased to adjourn the case and fix another date for ${x.stage}, in the interest of justice.

And for this act of kindness, the petitioner, as in duty bound, shall ever pray.

Date: ${x.today}
                                              Advocate for the Petitioner
                                              ${x.adv}`,

  hazira: x => `IN THE COURT OF THE LD. ${x.court}

${x.caseNo}
${x.party}

HAZIRA (ATTENDANCE PETITION)

The petitioner/accused ${x.client}, son/daughter/wife of ${x.guardian}, of ${x.address}, most respectfully begs to state that he/she is present before this Ld. Court today, i.e. on ${x.next}, in connection with the above case, and prays that his/her attendance may kindly be recorded.

Date: ${x.today}

______________________________                  ______________________________
Signature / L.T.I. of the Petitioner            Advocate for the Petitioner
                                                ${x.adv}`
};

// ---------- actions ----------
const ACT = {
  tab: ({ k }) => { S.tab = k; S.view = null; S.secTarget = null; S.prefill = null; render(); scrollTo(0, 0); },
  out: () => logout(),
  x: () => $('#dlg').close(),
  back: () => go(null),
  scroll: ({ k }) => { const e = document.getElementById(k); if (e) e.scrollIntoView({ behavior: 'smooth' }); },
  quick: ({ k }) => {
    if (k === 'case') { S.openAdd = 'case'; S.prefill = null; go(null, 'cases'); }
    else if (k === 'client') { S.openAdd = 'client'; go(null, 'clients'); }
    else if (k === 'task') { S.openAdd = 'task'; go(null, 'tasks'); }
    else if (k === 'note') { S.openAdd = 'note'; go(null, 'notes'); }
    else if (k === 'law') { S.secTarget = null; go(null, 'law'); setTimeout(() => $('#lq')?.focus(), 50); }
    else go(null, k);
  },
  open: ({ id }) => { go({ t: 'case', id }); loadCaseExtras(id); },
  client: ({ id }) => go({ t: 'client', id }),
  ec: ({ cnr }) => { copyText(cnr); window.open(EC_WEB, '_blank', 'noopener'); toast(t('cnr_copied')); },
  refadd: ({ id, k }) => {
    if (!navigator.onLine) return toast(t('ref_net'));
    const law = k === 'law', i = (n, ph, m, req) => `<input name="${n}" placeholder="${esc(ph)}" maxlength="${m}"${req ? ' required' : ''}>`;
    $('#dlg').innerHTML = `<form data-f="refadd" data-id="${esc(id)}" data-k="${law ? 'law' : 'case'}"><h3>${t(law ? 'ref_addlaw' : 'ref_addcase')}</h3>
      ${i('cite', t(law ? 'ref_cite_law' : 'ref_cite_case'), 200, true)}${i('title', t(law ? 'ref_title_law' : 'ref_title_case'), 200)}
      <textarea name="note" rows="3" maxlength="400" placeholder="${esc(t(law ? 'ref_note_law' : 'ref_note_case'))}"></textarea>
      <div class="row"><button class="pri">${t('save')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>`;
    $('#dlg').showModal();
  },
  refcopy: ({ id, r }) => { const c = S.cases.find(x => x.id === id), x = c && (c.case_refs || []).find(y => y.id === r); if (!x) return; copyText(refText(x)); toast(t('ref_copied')); },
  refdel: async ({ id, r }) => {
    if (!confirm(t('ref_del_q'))) return;
    const d = await api('/cases/' + id + '/refs/' + encodeURIComponent(r), { method: 'DELETE' }), c = S.cases.find(x => x.id === id);
    if (c) { c.case_refs = d.case_refs; await kv.set('cases', S.cases); } render();
  },
  ecapp: ({ cnr }) => {      // eCourts Services app mein CNR ka deep link nahi hai: sirf copy + app kholna (user khud paste kare)
    copyText(cnr);
    if (/Android/i.test(navigator.userAgent)) { toast(t('ec_app_copied')); location.href = EC_INTENT; }
    else { window.open(EC_WEB, '_blank', 'noopener'); toast(t('cnr_copied')); }
  },
  eclive: ({ id }) => ecFetch(id, false),
  ecforce: ({ id }) => ecFetch(id, true),
  ecnd: async ({ id }) => {
    const e = S.ecs[id], nd = e && e.data && e.data.snapshot && e.data.snapshot.next_date, c = S.cases.find(x => x.id === id);
    if (!nd || !c || !staff()) return;
    await send('PATCH', `/cases/${id}/next-date`, { next_date: nd });
    c.next_date = nd; e.data.stored_next = nd; e.data.differs = false; await kv.set('cases', S.cases); toast(t('ec_upd_ok')); render();
  },
  fee: ({ id }) => {
    const c = S.cases.find(x => x.id === id), b = B[id] || { ch: 0, pd: 0 };
    $('#dlg').innerHTML = `<form data-f="fee" data-id="${esc(id)}"><h3>${esc(c.case_no || c.cnr)}</h3>
      <p class="m">${t('fee_sum', money(b.ch), money(b.pd), money(b.ch - b.pd))}</p>${upiBlock(c)}
      <label>${t('fee_what')}<select name="kind"><option value="payment">${t('fee_got')}</option><option value="charge">${t('fee_set')}</option></select></label>
      <label>${t('amount')}<input name="amount" type="number" min="1" step="0.01" inputmode="decimal" required></label>
      <label>${t('note')}<input name="note" maxlength="200" placeholder="${t('note_ph')}"></label>
      <div class="row"><button class="pri">${t('save')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>`;
    $('#dlg').showModal();
  },
  waupi: ({ id }) => {
    const c = S.cases.find(x => x.id === id), d = due(id), link = upiLink(d, 'Fees ' + cname(c)), p = waNum(c.client_phone || clientOf(c)?.phone);
    window.open('https://wa.me/' + p + '?text=' + encodeURIComponent(t('upi_msg', cname(c), money(d), link, S.user.chamber || '')), '_blank', 'noopener');
  },
  done: async ({ id }) => {
    if (!confirm(t('c_done'))) return;
    await api('/cases/' + id, { method: 'PATCH', body: { status: 'disposed' } });
    S.cases.find(c => c.id === id).status = 'disposed'; await kv.set('cases', S.cases); render();
  },
  act: async ({ id, on }) => { await api('/users/' + id, { method: 'PATCH', body: { active: on === '1' } }); S.users = await api('/users'); render(); },
  rcpt: ({ id }) => {
    const f = S.fees.find(x => x.id === id), c = S.cases.find(x => x.id === f.case_id) || {}, w = window.open('', '_blank');
    if (!w) return toast(t('popup'));
    const d = due(c.id), link = upiLink(d, 'Fees ' + cname(c));
    w.document.write(`<title>${t('rc_title')}</title><body style="font:16px system-ui,'Nirmala UI';max-width:420px;margin:30px auto"><h2>${esc(S.user.chamber || t('rc_title'))}</h2><h3>${t('rc_title')}</h3>
      <p>${t('rc_date')}: ${esc(fmt(f.created_at.slice(0, 10)))}<br>${t('rc_no')}: ${esc(f.id.slice(0, 8))}</p><p>${t('rc_case')}: ${esc(c.case_no || c.cnr)}<br>${t('rc_party')}: ${esc(c.party_name)}</p>
      <h3>${t('rc_amt')}: ${money(f.amount)}</h3><p>${esc(f.note)}</p>
      ${d > 0 ? `<hr><p>${t('due_now', money(d))}</p>${link ? `<div>${qr(link, 150)}</div><p style="font-size:13px">${t('upi')}: ${esc(S.chamber.upi_id)}</p>` : ''}` : ''}`);
    w.document.close(); w.focus(); w.print();
  },
  csv: () => {
    dlFile('cases.csv', csv([['Case no', 'CNR', 'Party', 'Client', 'Court', 'PS', 'Stage', 'Next date', 'Status', 'Type', 'FIR no', 'Sections', 'Fees charged', 'Fees received', 'Due'],
      ...S.cases.map(c => { const b = B[c.id] || { ch: 0, pd: 0 }; return [c.case_no, c.cnr, c.party_name, clientOf(c)?.name, c.court, c.ps_name, c.stage, c.next_date, c.status, c.case_type, c.fir_no, c.sections, b.ch, b.pd, b.ch - b.pd]; })]), 'text/csv');
    setTimeout(() => dlFile('fees.csv', csv([['Date', 'Case', 'Type', 'Amount', 'Note'], ...S.fees.map(f => { const c = S.cases.find(x => x.id === f.case_id) || {}; return [f.created_at.slice(0, 10), c.case_no || c.cnr, f.kind === 'payment' ? 'Received' : 'Charged', f.amount, f.note]; })]), 'text/csv'), 600);
    setTimeout(() => dlFile('clients.csv', csv([['Name', 'Mobile', 'Father/Husband', 'Address', 'Notes'], ...S.clients.map(c => [c.name, c.phone, c.guardian, c.address, c.notes])]), 'text/csv'), 1200);
  },
  wa: ({ id }) => {
    const c = S.cases.find(x => x.id === id);
    window.open('https://wa.me/' + waNum(c.client_phone) + '?text=' + encodeURIComponent(t('wa_msg', c.case_no || c.cnr, fmt(c.next_date), S.user.chamber || '')), '_blank', 'noopener');
  },
  edit: ({ id }) => {
    const c = S.cases.find(x => x.id === id), f = (n, p, m) => `<input name="${n}" placeholder="${p}" value="${esc(c[n])}" maxlength="${m}">`, cl = clientOf(c);
    $('#dlg').innerHTML = `<form data-f="edit" data-id="${esc(id)}"><h3>${esc(c.case_no || c.cnr)}</h3>${f('case_no', t('ph_caseno'), 60)}${f('cnr', t('ph_cnr'), 40)}
      <label>${t('client')}<input name="client_name" list="cl-list" autocomplete="off" placeholder="${t('ph_client')}" maxlength="120" value="${esc(cl ? cl.name : '')}"></label>
      ${f('party_name', t('ph_party'), 160)}${f('court', t('ph_court'), 60)}${f('ps_name', t('ph_ps'), 80)}${f('stage', t('ph_stage'), 80)}${f('client_phone', t('ph_cphone'), 20)}${f('notes', t('note'), 1000)}
      ${typeSel(c.case_type || '')}${crimFields(c)}
      <div class="row"><button class="pri">${t('save')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>${clientList()}`;
    $('#dlg').showModal();
  },
  editcl: ({ id }) => { const c = S.clients.find(x => x.id === id); $('#dlg').innerHTML = `<h3>${esc(c.name)}</h3>` + clientForm(c, 'editcl'); $('#dlg').showModal(); },
  clcase: ({ id }) => { const c = S.clients.find(x => x.id === id); S.prefill = { name: c.name, phone: c.phone }; S.openAdd = 'case'; go(null, 'cases'); },
  editnote: ({ id }) => { const n = S.notes.find(x => x.id === id); $('#dlg').innerHTML = noteForm(n, 'editnote'); $('#dlg').showModal(); },
  delnote: async ({ id }) => { if (!confirm(t('n_del_q'))) return; await api('/notes/' + id, { method: 'DELETE' }); S.notes = S.notes.filter(n => n.id !== id); await kv.set('notes', S.notes); render(); },
  findsec: ({ id }) => { S.secTarget = id; go(null, 'law'); setTimeout(() => $('#lq')?.focus(), 50); },
  untarget: () => { S.secTarget = null; render(); },
  addsec: async ({ s }) => {
    if (S.secTarget) return addSection(S.secTarget, s);
    const cs = pendingCases(); if (!cs.length) return toast(t('nocase'));
    $('#dlg').innerHTML = `<form data-f="addsec" data-s="${esc(s)}"><h3>${esc(s)}</h3><label>${t('law_pick')}<select name="case_id">${cs.map(c => `<option value="${esc(c.id)}">${esc(cname(c))} ${esc(c.party_name || '')}</option>`).join('')}</select></label>
      <div class="row"><button class="pri">${t('law_add')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>`;
    $('#dlg').showModal();
  },
  dldoc: async ({ id }) => {
    if (!navigator.onLine) return toast(t('need_net'));
    const { url, open } = await api('/docs/' + id + '/url');
    if (!open && url.startsWith('/api/')) {          // Drive file: apne server se (60 s token), galti ho to toast
      const r = await fetch(url), name = ((Object.values(S.docs).flat().find(d => d.id === id) || {}).name) || 'document';
      if (!r.ok) { const d = await r.json().catch(() => ({})); return toast(se(d.error || 'Document nahi mila')); }
      return dlFile(name, await r.blob(), r.headers.get('content-type') || 'application/octet-stream', false);
    }
    const a = document.createElement('a'); a.href = url; a.rel = 'noopener noreferrer'; if (open) a.target = '_blank';
    document.body.appendChild(a); a.click(); a.remove();
  },
  addlink: ({ id }) => {
    $('#dlg').innerHTML = `<form data-f="link" data-id="${esc(id)}"><h3>${t('lk_h')}</h3><p class="m">${t('lk_help')}</p>
      <label>${t('lk_name')}<input name="name" maxlength="120" required></label>
      <label>${t('lk_url')}<input name="url" type="url" inputmode="url" maxlength="1000" placeholder="https://drive.google.com/..." required></label>
      <div class="row"><button class="pri">${t('lk_save')}</button><button type="button" class="ghost" data-a="x">${t('close')}</button></div></form>`;
    $('#dlg').showModal();
  },
  gdconnect: async () => {
    if (!navigator.onLine) return toast(t('need_net'));
    const { url } = await api('/drive/connect', { method: 'POST' });
    if (typeof url === 'string' && url.startsWith('https://accounts.google.com/')) location.href = url; else toast(t('gd_err'));
  },
  gddisc: async () => {
    if (!confirm(t('gd_off_q'))) return;
    await api('/drive/disconnect', { method: 'POST' }); S.drive = { ...S.drive, connected: false, email: '' }; toast(t('gd_removed')); render();
  },
  deldoc: async ({ id, c }) => { if (!confirm(t('doc_del_q'))) return; await api('/docs/' + id, { method: 'DELETE' }); S.docs[c] = (S.docs[c] || []).filter(d => d.id !== id); load(); render(); },
  draft: ({ id, k, d }) => {
    const c = S.cases.find(x => x.id === id);
    if (d) { const dr = (S.drafts[id] || []).find(x => x.id === d); if (!dr) return; return go({ t: 'draft', id, kind: dr.kind, did: dr.id, title: dr.title, body: dr.body }); }
    go({ t: 'draft', id, kind: k, title: `${t('k_' + k)} - ${cname(c)}`.slice(0, 120), body: TPL[k](draftCtx(c)) });
  },
  deldraft: async ({ id, c }) => { if (!confirm(t('dr_del_q'))) return; await api('/drafts/' + id, { method: 'DELETE' }); S.drafts[c] = (S.drafts[c] || []).filter(d => d.id !== id); render(); },
  print: () => { const f = $('form[data-f="draft"]'); if (!f) return; printDoc(f.elements.title.value, f.elements.body.value, /_bn$/.test(f.dataset.k)); },
  mypw: async () => { const c = prompt(t('curpw')); if (!c) return; const p = prompt(t('newpw')); if (!p) return; await api('/me/password', { method: 'POST', body: { current: c, password: p } }); toast(t('pw_ok')); },
  pw: async ({ id }) => { const p = prompt(t('newpw')); if (!p) return; await api('/users/' + id, { method: 'PATCH', body: { password: p } }); toast(t('pw_ok')); },
  sample: () => dlFile('sample.csv', csv([['Case no', 'CNR', 'Party', 'Court', 'PS', 'Stage', 'Next date', 'Mobile'], ['GR 123/24', 'WBMD010012342024', 'Md. Rahim vs State', 'ACJM Malda', 'Chanchal', 'Evidence', '2026-11-15', '9876543210']]), 'text/csv', false),
  tk: async ({ id, on }) => { if (tmp(id)) return; await send('PATCH', '/tasks/' + id, { done: on === '1' }); S.tasks.find(x => x.id === id).done = on === '1'; await kv.set('tasks', S.tasks); render(); },
  day: ({ k }) => { S.cal.sel = k; render(); },
  cm: ({ d }) => { let m = S.cal.m + +d, y = S.cal.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } S.cal.m = m; S.cal.y = y; render(); },
  inst: async () => { if (!DIP) return; DIP.prompt(); await DIP.userChoice; DIP = null; $('#inst').hidden = true; },
  help: ({ k }) => {
    S.tab = 'help'; S.view = null; render();
    const e = k && document.getElementById('g-' + k); if (!e) return scrollTo(0, 0);
    e.scrollIntoView({ block: 'start' }); e.classList.add('flash'); setTimeout(() => e.classList.remove('flash'), 1800);
  },
  hidehint: ({ k }) => { const h = hidHints(); if (!h.includes(k)) h.push(k); localStorage.setItem('mcc_hh', JSON.stringify(h)); $('#hint')?.remove(); },
  hintreset: () => { localStorage.removeItem('mcc_hh'); render(); },
  welcome: () => showWelcome(),
  wguide: () => { $('#dlg').close(); ACT.help({}); },
  wgo: () => $('#dlg').close(),
  langfocus: () => { scrollTo(0, 0); const s = $('#app header .lang'); if (s) { s.focus(); try { s.showPicker && s.showPicker(); } catch (e) { } } },
  gset: () => { S.openAdd = 'set'; go(null, 'team'); },
  json: async () => dlFile('backup-' + TODAY + '.json', JSON.stringify(await api('/backup'), null, 1), 'application/json')
};
async function addSection(caseId, sec) {
  const r = await api(`/cases/${caseId}/sections`, { method: 'POST', body: { sec } });
  const c = S.cases.find(x => x.id === caseId); if (c) c.sections = r.sections; await kv.set('cases', S.cases);
  toast(t('law_added', sec));
}
const formData = f => { const b = Object.fromEntries(new FormData(f)); for (const k in b) if (typeof b[k] === 'string') b[k] = b[k].trim(); return b; };
const FORM = {
  refadd: async f => {
    const b = Object.fromEntries(new FormData(f)); b.kind = f.dataset.k;
    const d = await api('/cases/' + f.dataset.id + '/refs', { method: 'POST', body: b }), c = S.cases.find(x => x.id === f.dataset.id);
    if (c) { c.case_refs = d.case_refs; await kv.set('cases', S.cases); } $('#dlg').close(); render(); $('#refs')?.scrollIntoView({ block: 'nearest' });
  },
  link: async f => {
    const b = formData(f), id = f.dataset.id; let u = null;
    try { u = new URL(b.url); } catch { u = null; }
    if (!u || u.protocol !== 'https:') return toast(t('lk_bad'));
    if (!['drive.google.com', 'docs.google.com'].includes(u.hostname.toLowerCase()) && !confirm(t('lk_warn'))) return;
    const d = await api(`/cases/${id}/links`, { method: 'POST', body: { name: b.name, url: u.href } });
    $('#dlg').close(); (S.docs[id] ||= []).unshift(d); toast(t('lk_ok')); render();
  },
  login: async f => {
    $('#err').textContent = '';
    try {
      const d = await api('/login', { method: 'POST', body: Object.fromEntries(new FormData(f)) });
      localStorage.setItem('t', d.token); localStorage.setItem('u', JSON.stringify(d.user)); S.user = d.user; f.reset(); S.tab = 'dash'; S.view = null; await start();
    } catch (e) { $('#err').textContent = e.server ? e.message : t('noserver'); }
  },
  case: async f => {
    const b = linkClient(formData(f), true); for (const k in b) if (b[k] === '') delete b[k];
    if (b.case_type !== 'criminal') for (const k of ['fir_no', 'fir_date', 'sections', 'bail_status', 'chargesheet_date', 'ip_name', 'io_name']) if (!b[k]) delete b[k];
    b.client_ref = uid(); const r = await send('POST', '/cases', b);
    S.prefill = null;
    if (r && !r.id) await load(); else { S.cases.unshift(r || { ...b, id: 'tmp-' + b.client_ref, status: 'pending' }); if (r && b.make_client) load(); }
    await kv.set('cases', S.cases); render();
  },
  fee: async f => {
    const b = Object.fromEntries(new FormData(f)); b.case_id = f.dataset.id; b.amount = Number(b.amount); b.client_ref = uid();
    const r = await send('POST', '/fees', b); $('#dlg').close();
    if (r && !r.id) await load(); else S.fees.unshift(r || { ...b, id: 'tmp-' + b.client_ref, created_at: new Date().toISOString() });
    await kv.set('fees', S.fees); render();
  },
  edit: async f => {
    const b = formData(f), c = S.cases.find(x => x.id === f.dataset.id), nm = (b.client_name || '').trim();
    linkClient(b, false);
    if (typeof b.cnr === 'string') b.cnr = b.cnr.toUpperCase().replace(/[\s-]/g, '');
    if (b.make_client) {     // edit mein naya client: pehle client banao (net chahiye)
      const n = await api('/clients', { method: 'POST', body: { name: nm, phone: b.client_phone || '', client_ref: uid() } });
      if (n.id) { S.clients.push(n); b.client_id = n.id; } delete b.make_client; delete b.client_name;
    }
    if (!c.client_id && b.client_id === null) delete b.client_id;
    await send('PATCH', '/cases/' + c.id, b); Object.assign(c, b); await kv.set('cases', S.cases); $('#dlg').close(); render();
  },
  task: async f => {
    const b = Object.fromEntries(new FormData(f)); if (!b.due_date) delete b.due_date; b.client_ref = uid();
    const r = await send('POST', '/tasks', b), me = S.users.find(u => u.id === b.assigned_to);
    if (r && !r.id) await load(); else S.tasks.unshift(r || { ...b, id: 'tmp-' + b.client_ref, done: false, assignee: me ? (me.name || me.email) : '' });
    await kv.set('tasks', S.tasks); render();
  },
  client: async f => {
    const b = formData(f); b.client_ref = uid();
    const r = await send('POST', '/clients', b);
    if (r && !r.id) await load(); else S.clients.push(r || { ...b, id: 'tmp-' + b.client_ref });
    S.clients.sort((a, b2) => a.name.localeCompare(b2.name)); await kv.set('clients', S.clients); toast(t('cl_ok')); S.cq = ''; render();
  },
  editcl: async f => {
    const b = formData(f), c = S.clients.find(x => x.id === f.dataset.id);
    await send('PATCH', '/clients/' + c.id, b); Object.assign(c, b); await kv.set('clients', S.clients); $('#dlg').close(); toast(t('cl_ok')); render();
  },
  note: async f => {
    const b = formData(f); b.private = !!b.private; if (!b.case_id) delete b.case_id; b.client_ref = uid();
    const r = await send('POST', '/notes', b);
    if (r && !r.id) await load(); else S.notes.unshift(r || { ...b, id: 'tmp-' + b.client_ref, by: S.user.name || '', created_by: S.user.id, created_at: new Date().toISOString() });
    await kv.set('notes', S.notes); render();
  },
  editnote: async f => {
    const b = formData(f), n = S.notes.find(x => x.id === f.dataset.id); b.private = !!b.private; if (!b.case_id) b.case_id = null;
    await send('PATCH', '/notes/' + n.id, b); Object.assign(n, b, { updated_at: new Date().toISOString() }); await kv.set('notes', S.notes); $('#dlg').close(); render();
  },
  addsec: async f => { const cid = new FormData(f).get('case_id'); $('#dlg').close(); await addSection(cid, f.dataset.s); },
  draft: async f => {
    const b = formData(f), cid = f.dataset.id; b.body = f.elements.body.value;
    if (f.dataset.d) { await api('/drafts/' + f.dataset.d, { method: 'PATCH', body: { title: b.title, body: b.body } }); }
    else { const r = await send('POST', '/drafts', { case_id: cid, kind: f.dataset.k, title: b.title, body: b.body, client_ref: uid() }); if (r && r.id) { f.dataset.d = r.id; S.view.did = r.id; } }
    S.view.title = b.title; S.view.body = b.body; toast(t('dr_saved'));
    if (navigator.onLine) api(`/cases/${cid}/drafts`).then(d => { S.drafts[cid] = d; }).catch(() => {});
  },
  chamber: async f => { const b = formData(f); await api('/chamber', { method: 'PATCH', body: b }); S.chamber = { ...S.chamber, ...b }; await kv.set('chamber', S.chamber); toast(t('set_ok')); render(); },
  user: async f => { await api('/users', { method: 'POST', body: Object.fromEntries(new FormData(f)) }); S.users = await api('/users'); toast(t('member_ok')); render(); }
};
function logout() {
  localStorage.removeItem('t'); localStorage.removeItem('u'); S.user = null; S.view = null; S.secTarget = null;
  S.cases = []; S.fees = []; S.users = []; S.tasks = []; S.clients = []; S.notes = []; S.chamber = {}; S.dash = {}; S.docs = {}; S.drafts = {}; S.drive = { enabled: false }; S.ec = { enabled: false }; S.ecs = {};
  kv.clear(); render();
}

document.addEventListener('click', async e => { const b = e.target.closest('[data-a]'); if (b) try { await ACT[b.dataset.a](b.dataset); } catch (x) { toast(x.server ? x.message : t('noserver')); } });
document.addEventListener('submit', async e => { e.preventDefault(); const f = e.target; try { await FORM[f.dataset.f](f); } catch (x) { toast(x.server ? x.message : t('noserver')); } });
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'q') { S.q = el.value; $('#list').innerHTML = caseCards(); }
  else if (el.id === 'cq') { S.cq = el.value; $('#clist').innerHTML = clientRows(); }
  else if (el.id === 'nq') { S.nq = el.value; $('#nlist').innerHTML = noteRows(); }
  else if (el.id === 'lq') { S.lawQ = el.value; $('#llist').innerHTML = lawResults(); }
  else if (el.name === 'client_name') {   // client chuna to uska mobile bhar do
    const c = S.clients.find(x => x.name.toLowerCase() === el.value.trim().toLowerCase()), ph = el.form && el.form.client_phone;
    if (c && ph && !ph.value && c.phone) ph.value = c.phone;
  }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.classList.contains('lang')) {
    LANG = el.value; localStorage.setItem('lang', LANG); if ($('#dlg').open) $('#dlg').close();
    applyStatic(); $('#err').textContent = ''; render(); return;
  }
  if (el.name === 'case_type' && el.form) { const fs = el.form.querySelector('.crim'); if (fs) fs.hidden = el.value !== 'criminal'; return; }
  if (el.id === 'imp') { const fl = el.files[0]; el.value = ''; if (fl) try { await importCSV(fl); } catch (x) { toast(x.server ? x.message : t('noserver')); } return; }
  if (el.id === 'docup') { const fl = el.files[0], id = el.dataset.id; el.value = ''; if (fl) try { await upload(id, fl); } catch (x) { toast(x.server ? x.message : t('noserver')); } return; }
  const id = el.dataset.nd; if (!id || !el.value) return;
  try {
    await send('PATCH', `/cases/${id}/next-date`, { next_date: el.value });
    S.cases.find(c => c.id === id).next_date = el.value; await kv.set('cases', S.cases); render();
  } catch (x) { toast(x.message); }
});
addEventListener('online', () => { bar(); flush(); }); addEventListener('offline', bar);
let DIP; addEventListener('beforeinstallprompt', e => { e.preventDefault(); DIP = e; const b = $('#inst'); if (b) b.hidden = false; });
setInterval(flush, 30000);

async function start() {
  const dp = new URLSearchParams(location.search).get('drive');      // Google se wapas aaye (Drive jodne ke baad)
  if (dp) history.replaceState(null, '', location.pathname);
  applyStatic(); render(); if (!S.user) return; await count(); await flush(); await load();
  if (dp) toast(t({ ok: 'gd_ok', no: 'gd_no' }[dp] || 'gd_err'));
  if (S.user && !localStorage.getItem(wKey()) && !$('#dlg').open) showWelcome();   // har user ko pehli baar ek swagat sandesh
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
start();
