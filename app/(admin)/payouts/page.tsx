import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt, naira } from '@/lib/format';
import { setPayoutStatus } from '../actions';

export default async function Payouts({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const status = searchParams.status ?? 'open';
  let q = db().from('payout_requests').select('id, therapist_id, bank_account_id, amount, status, requested_at, completed_at').order('requested_at', { ascending: false }).limit(200);
  q = status === 'open' ? q.in('status', ['pending', 'processing']) : status === 'all' ? q : q.eq('status', status);
  const { data: rows } = await q;
  const tIds = Array.from(new Set((rows ?? []).map((r: any) => r.therapist_id)));
  const bIds = Array.from(new Set((rows ?? []).map((r: any) => r.bank_account_id).filter(Boolean)));
  const [{ data: ths }, { data: banks }] = await Promise.all([
    tIds.length ? db().from('therapist').select('therapist_id, name, email').in('therapist_id', tIds) : Promise.resolve({ data: [] as any[] }),
    bIds.length ? db().from('bank_accounts').select('id, bank_name, account_name, account_number').in('id', bIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const tn = new Map((ths ?? []).map((t: any) => [t.therapist_id, t]));
  const bn = new Map((banks ?? []).map((b: any) => [b.id, b]));
  const link = (label: string, v: string) => <a className={status === v ? 'on' : ''} href={`?status=${v}`}>{label}</a>;
  const pill = (s: string) => (s === 'completed' ? 'ok' : s === 'failed' ? 'bad' : s === 'processing' ? 'info' : 'warn');

  return (
    <>
      <h1>Payouts</h1>
      <p className="sub">Pay the account below from your bank, then press <b>Mark paid</b>. If you can&apos;t pay it, press <b>Fail</b> - the money returns to the therapist&apos;s balance automatically.</p>
      <div className="filters">{link('Waiting', 'open')}{link('Paid', 'completed')}{link('Failed', 'failed')}{link('All', 'all')}</div>
      <table>
        <thead><tr><th>Requested</th><th>Therapist</th><th>Amount</th><th>Send to</th><th>Status</th><th /></tr></thead>
        <tbody>
          {(rows ?? []).map((r: any) => {
            const t: any = tn.get(r.therapist_id); const b: any = bn.get(r.bank_account_id);
            return (
              <tr key={r.id}>
                <td>{dt(r.requested_at)}</td>
                <td><b>{t?.name ?? '-'}</b><div className="muted small">{t?.email}</div></td>
                <td><b>{naira(r.amount)}</b></td>
                <td>{b ? <>{b.bank_name}<div><b>{b.account_number}</b></div><div className="muted small">{b.account_name}</div></> : '-'}</td>
                <td><span className={`pill ${pill(r.status)}`}>{r.status}</span>{r.completed_at ? <div className="muted small">{dt(r.completed_at)}</div> : null}</td>
                <td>
                  {(r.status === 'pending' || r.status === 'processing') && (
                    <div className="row">
                      {r.status === 'pending' && <form action={setPayoutStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="processing" /><button className="btn ghost sm">Processing</button></form>}
                      <form action={setPayoutStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="completed" /><button className="btn ok sm">Mark paid</button></form>
                      <form action={setPayoutStatus}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value="failed" /><button className="btn bad sm">Fail</button></form>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
          {!rows?.length && <tr><td colSpan={6} className="empty">Nothing here.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
