# Backup kaise kaam karta hai

Note: backup.yml GitHub pe daalne ke liye repo > Add file > Create new file, naam mein `.github/workflows/backup.yml` likhein aur is file ka text paste karein.

1. Har raat 2 baje GitHub khud poore database ki copy banata hai, password se lock karke, 30 din tak rakhta hai.
2. Pehli baar setup: repo > Settings > Secrets and variables > Actions > New repository secret
   - `SUPABASE_DB_URL`: Supabase dashboard > Connect > "Session pooler" URI (usme apna DB password bharein)
   - `BACKUP_PASSWORD`: koi lamba password, kahin likh ke rakhein
3. Turant test: repo > Actions > Daily DB backup > Run workflow. Hara tick aaye toh sahi.
4. Backup nikaalna: Actions > koi bhi run > neeche "court-backup" download.
5. Kholna (laptop pe): `gpg -d court-YYYY-MM-DD.sql.gz.gpg > backup.sql.gz` phir password daalein.
6. Wapas daalna: naye Supabase project ke SQL editor / psql mein `backup.sql` chalayein.

Repo public hai, isliye backup hamesha password se lock hota hai. Bina BACKUP_PASSWORD ke koi nahi khol sakta.
