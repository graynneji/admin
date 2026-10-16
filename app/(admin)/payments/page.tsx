// import { requireAdmin } from '@/lib/auth';
// import { db } from '@/lib/supabase-admin';
// import { dt, money } from '@/lib/format';

// const pill = (s: string) => (s === 'success' ? 'ok' : s === 'failed' ? 'bad' : 'warn');

// export default async function Payments({ searchParams }: { searchParams: { status?: string; provider?: string } }) {
//   await requireAdmin();
//   let q = db().from('payments').select('id, patient_id, plan_type, amount_kobo, currency, status, provider, provider_reference, created_at, confirmed_at, receipt_sent_at').order('created_at', { ascending: false }).limit(300);
//   if (searchParams.status) q = q.eq('status', searchParams.status);
//   if (searchParams.provider) q = q.eq('provider', searchParams.provider);
//   const { data: payments } = await q;
//   const ids = Array.from(new Set((payments ?? []).map((p: any) => p.patient_id).filter(Boolean)));
//   const { data: pats } = ids.length ? await db().from('patients').select('patient_id, name, email').in('patient_id', ids) : { data: [] as any[] };
//   const who = new Map((pats ?? []).map((p: any) => [p.patient_id, p]));
//   const totals: Record<string, number> = {};
//   (payments ?? []).filter((p: any) => p.status === 'success').forEach((p: any) => { totals[p.currency] = (totals[p.currency] ?? 0) + p.amount_kobo; });
//   const f = (label: string, key: string, val?: string) => (
//     <a className={(searchParams as any)[key] === val ? 'on' : ''} href={val ? `?${key}=${val}` : '?'}>{label}</a>
//   );

//   return (
//     <>
//       <h1>Payments</h1>
//       <p className="sub">Successful in this view: {Object.keys(totals).length ? Object.entries(totals).map(([c, m]) => money(m, c)).join('  +  ') : '-'}</p>
//       <div className="filters">
//         {f('All', 'status')}{f('Success', 'status', 'success')}{f('Pending', 'status', 'pending')}{f('Failed', 'status', 'failed')}
//         {f('Paystack', 'provider', 'paystack')}{f('Flutterwave', 'provider', 'flutterwave')}
//       </div>
//       <table>
//         <thead><tr><th>Date</th><th>Patient</th><th>Plan</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Receipt</th><th>Reference</th></tr></thead>
//         <tbody>
//           {(payments ?? []).map((p: any) => {
//             const w: any = who.get(p.patient_id);
//             return (
//               <tr key={p.id}>
//                 <td>{dt(p.created_at)}</td>
//                 <td>{w ? <><b>{w.name}</b><div className="muted small">{w.email}</div></> : <span className="muted">deleted user</span>}</td>
//                 <td>{p.plan_type}</td><td><b>{money(p.amount_kobo, p.currency)}</b></td><td>{p.provider}</td>
//                 <td><span className={`pill ${pill(p.status)}`}>{p.status}</span></td>
//                 <td>{p.receipt_sent_at ? <span className="pill ok">sent</span> : p.status === 'success' ? <span className="pill warn">not sent</span> : '-'}</td>
//                 <td className="small muted">{p.provider_reference}</td>
//               </tr>
//             );
//           })}
//           {!payments?.length && <tr><td colSpan={8} className="empty">No payments.</td></tr>}
//         </tbody>
//       </table>
//     </>
//   );
// }


import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt, money } from '@/lib/format';
import { resendReceipt } from '../actions';

const pill = (s: string) => (s === 'success' ? 'ok' : s === 'failed' ? 'bad' : 'warn');

export default async function Payments({ searchParams }: { searchParams: { status?: string; provider?: string } }) {
  await requireAdmin();
  let q = db().from('payments').select('id, patient_id, plan_type, amount_kobo, currency, status, provider, provider_reference, created_at, confirmed_at, receipt_sent_at, receipt_error').order('created_at', { ascending: false }).limit(300);
  if (searchParams.status) q = q.eq('status', searchParams.status);
  if (searchParams.provider) q = q.eq('provider', searchParams.provider);
  const { data: payments } = await q;
  const ids = Array.from(new Set((payments ?? []).map((p: any) => p.patient_id).filter(Boolean)));
  const { data: pats } = ids.length ? await db().from('patients').select('patient_id, name, email').in('patient_id', ids) : { data: [] as any[] };
  const who = new Map((pats ?? []).map((p: any) => [p.patient_id, p]));
  const totals: Record<string, number> = {};
  (payments ?? []).filter((p: any) => p.status === 'success').forEach((p: any) => { totals[p.currency] = (totals[p.currency] ?? 0) + p.amount_kobo; });
  const f = (label: string, key: string, val?: string) => (
    <a className={(searchParams as any)[key] === val ? 'on' : ''} href={val ? `?${key}=${val}` : '?'}>{label}</a>
  );

  return (
    <>
      <h1>Payments</h1>
      <p className="sub">Successful in this view: {Object.keys(totals).length ? Object.entries(totals).map(([c, m]) => money(m, c)).join('  +  ') : '-'}</p>
      <div className="filters">
        {f('All', 'status')}{f('Success', 'status', 'success')}{f('Pending', 'status', 'pending')}{f('Failed', 'status', 'failed')}
        {f('Paystack', 'provider', 'paystack')}{f('Flutterwave', 'provider', 'flutterwave')}
      </div>
      <table>
        <thead><tr><th>Date</th><th>Patient</th><th>Plan</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Receipt</th><th>Reference</th></tr></thead>
        <tbody>
          {(payments ?? []).map((p: any) => {
            const w: any = who.get(p.patient_id);
            return (
              <tr key={p.id}>
                <td>{dt(p.created_at)}</td>
                <td>{w ? <><b>{w.name}</b><div className="muted small">{w.email}</div></> : <span className="muted">deleted user</span>}</td>
                <td>{p.plan_type}</td><td><b>{money(p.amount_kobo, p.currency)}</b></td><td>{p.provider}</td>
                <td><span className={`pill ${pill(p.status)}`}>{p.status}</span></td>
                <td>
                  {p.receipt_sent_at ? <span className="pill ok">sent</span> : p.status === 'success' ? (
                    <>
                      <span className="pill bad">not sent</span>
                      {p.receipt_error ? <div className="small" style={{ color: 'var(--bad)', maxWidth: 260, marginTop: 4 }}>{p.receipt_error}</div> : null}
                    </>
                  ) : '-'}
                  {p.status === 'success' && (
                    <form action={resendReceipt} style={{ marginTop: 6 }}>
                      <input type="hidden" name="reference" value={p.provider_reference} />
                      <button className="btn ghost sm">{p.receipt_sent_at ? 'Send again' : 'Send now'}</button>
                    </form>
                  )}
                </td>
                <td className="small muted">{p.provider_reference}</td>
              </tr>
            );
          })}
          {!payments?.length && <tr><td colSpan={8} className="empty">No payments.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
