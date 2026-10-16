import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { money, naira } from '@/lib/format';

export default async function Overview() {
  await requireAdmin();
  const s = db();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const head = { count: 'exact' as const, head: true };

  const [patients, therapists, active, completed, missed, upcoming, pendingChanges, pendingPayouts, newPatients, revenue, therapistWallets] = await Promise.all([
    s.from('patients').select('id', head),
    s.from('therapist').select('id', head),
    s.from('patients').select('id', head).eq('is_subscribed', true).gt('subscription_expires_at', now.toISOString()),
    s.from('appointment').select('id', head).eq('outcome', 'completed').gte('time', monthStart),
    s.from('appointment').select('id', head).eq('outcome', 'missed').gte('time', monthStart),
    s.from('appointment').select('id', head).eq('status', 'accepted').eq('outcome', 'scheduled').gt('time', now.toISOString()),
    s.from('therapist_change_requests').select('id', head).eq('status', 'pending'),
    s.from('payout_requests').select('amount').in('status', ['pending', 'processing']),
    s.from('patients').select('id', head).gte('created_at', since30),
    s.from('payments').select('amount_kobo, currency').eq('status', 'success').gte('confirmed_at', since30),
    s.from('therapist').select('balance, pending'),
  ]);

  const rev: Record<string, number> = {};
  (revenue.data ?? []).forEach((p: any) => { rev[p.currency] = (rev[p.currency] ?? 0) + p.amount_kobo; });
  const payoutTotal = (pendingPayouts.data ?? []).reduce((a: number, r: any) => a + Number(r.amount), 0);
  const owed = (therapistWallets.data ?? []).reduce((a: number, t: any) => a + Number(t.balance ?? 0) + Number(t.pending ?? 0), 0);
  const done = completed.count ?? 0, miss = missed.count ?? 0;
  const rate = done + miss ? Math.round((done / (done + miss)) * 100) : null;

  const Stat = ({ l, v, n }: { l: string; v: React.ReactNode; n?: string }) => (
    <div className="card stat"><div className="l">{l}</div><div className="v">{v}</div>{n ? <div className="n">{n}</div> : null}</div>
  );

  return (
    <>
      <h1>Overview</h1>
      <p className="sub">Live numbers from your Mentel database.</p>
      <div className="grid">
        <Stat l="Patients" v={patients.count ?? 0} n={`${newPatients.count ?? 0} joined in the last 30 days`} />
        <Stat l="Active plans" v={active.count ?? 0} n="paid and not expired" />
        <Stat l="Therapists" v={therapists.count ?? 0} />
        <Stat l="Upcoming sessions" v={upcoming.count ?? 0} />
        <Stat l="Completed this month" v={done} n={rate !== null ? `${rate}% completion rate` : undefined} />
        <Stat l="Missed this month" v={miss} />
        <Stat l="Revenue (30 days)" v={Object.keys(rev).length ? Object.entries(rev).map(([c, m]) => <div key={c}>{money(m, c)}</div>) : '-'} />
        <Stat l="Owed to therapists" v={naira(owed)} n="available + pending balances" />
        <Stat l="Withdrawals waiting" v={naira(payoutTotal)} n={`${pendingPayouts.data?.length ?? 0} request(s)`} />
        <Stat l="Therapist-change requests" v={pendingChanges.count ?? 0} n="waiting for review" />
      </div>
    </>
  );
}
