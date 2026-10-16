import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt } from '@/lib/format';
import { replySupport } from '../../actions';

export default async function Thread({ params }: { params: { customerId: string } }) {
  await requireAdmin();
  const id = params.customerId;
  const [{ data: msgs }, { data: u }, { data: t }, { data: pay }] = await Promise.all([
    db().from('support_messages').select('id, message, is_staff, created_at').eq('customer_id', id).order('created_at', { ascending: true }).limit(500),
    db().from('patients').select('name, email, is_subscribed, plan_type, sessions_remaining, subscription_expires_at').eq('patient_id', id).maybeSingle(),
    db().from('therapist').select('name, email').eq('therapist_id', id).maybeSingle(),
    db().from('payments').select('plan_type, amount_kobo, currency, status, created_at').eq('patient_id', id).order('created_at', { ascending: false }).limit(5),
  ]);
  await db().from('support_messages').update({ read_at: new Date().toISOString() }).eq('customer_id', id).eq('is_staff', false).is('read_at', null);
  const who: any = u ?? t;

  return (
    <>
      <p><Link href="/support">← All conversations</Link></p>
      <h1>{who?.name ?? 'Customer'}</h1>
      <p className="sub">{who?.email}{u ? ` · plan: ${u.is_subscribed ? u.plan_type : 'none'} · ${u.sessions_remaining ?? 0} sessions left` : t ? ' · therapist' : ''}</p>
      {pay?.length ? (
        <div className="card small" style={{ marginBottom: 14 }}><b>Recent payments:</b> {pay.map((p: any) => `${p.plan_type} ${p.currency} ${(p.amount_kobo / 100).toFixed(0)} (${p.status})`).join(' · ')}</div>
      ) : null}
      <div className="card" style={{ marginBottom: 14 }}>
        {(msgs ?? []).map((m: any) => (
          <div key={m.id}><div className={`bubble ${m.is_staff ? 'staff' : ''}`}>{m.message}</div><div className="muted small" style={{ textAlign: m.is_staff ? 'right' : 'left' }}>{dt(m.created_at)}</div></div>
        ))}
        {!msgs?.length && <div className="empty">No messages.</div>}
      </div>
      <form action={replySupport} className="card">
        <input type="hidden" name="customer" value={id} />
        <label>Reply</label>
        <textarea name="message" required maxLength={2000} placeholder="Write your reply…" />
        <div style={{ marginTop: 10 }}><button className="btn">Send reply</button></div>
      </form>
    </>
  );
}
