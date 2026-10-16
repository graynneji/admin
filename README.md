# Mentel Admin (Next.js)

Manage patients, therapists, sessions, payments, withdrawals, therapist-change requests, support chat,
announcements, pricing and platform rules.

## Run it
```bash
cd admin
cp .env.example .env.local      # fill in the 3 values
npm install
npm run dev                     # http://localhost:3001
```

## Create the first admin (once, in the Supabase SQL editor)
1. Dashboard -> Authentication -> Users -> **Add user** (email + password, tick "Auto confirm").
2. Make that user an admin:
```sql
insert into public.admin_users (user_id) select id from auth.users where email = 'you@yourcompany.com';
```

## Deploy
Vercel (or any Node host): set the same three environment variables. `SUPABASE_SERVICE_ROLE_KEY` must be
a *server* variable only. Put the site behind your company VPN / IP allow-list if you can - it has full database access.

## How it stays safe
- The service-role key is only used in server components / server actions, never sent to the browser.
- Every page and every action calls `requireAdmin()`: signed in AND present in `admin_users`.
- Every change (payout, price, therapist change, announcement) is written to `admin_audit_log`.
