import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt } from '@/lib/format';

export default async function Support() {
  await requireAdmin();
  const { data: msgs } = await db().from('support_messages').select('customer_id, message, is_staff, created_at, read_at').order('created_at', { ascending: false }).limit(1000);
  const threads = new Map<string, { last: any; unread: number }>();
  (msgs ?? []).forEach((m: any) => {
    const t = threads.get(m.customer_id) ?? { last: m, unread: 0 };
    if (!m.is_staff && !m.read_at) t.unread++;
    threads.set(m.customer_id, t);
  });
  const ids = Array.from(threads.keys());
  const [{ data: users }, { data: ths }] = await Promise.all([
    ids.length ? db().from('user').select('user_id, name') .in('user_id', ids) : Promise.resolve({ data: [] as any[] }),
    ids.length ? db().from('therapist').select('therapist_id, name').in('therapist_id', ids) : Promise.resolve({ data: [] as any[] }),
  ]);
  const name = new Map<string, { n: string; role: string }>();
  (users ?? []).forEach((u: any) => name.set(u.user_id, { n: u.name, role: 'patient' }));
  (ths ?? []).forEach((t: any) => name.set(t.therapist_id, { n: t.name, role: 'therapist' }));

  return (
    <>
      <h1>Support chat</h1>
      <p className="sub">Conversations from More → Chat with us. Customers get a push notification when you reply.</p>
      <table>
        <thead><tr><th>Customer</th><th>Last message</th><th>When</th><th /></tr></thead>
        <tbody>
          {Array.from(threads.entries()).map(([id, t]) => {
            const w = name.get(id);
            return (
              <tr key={id}>
                <td><Link href={`/support/${id}`}><b>{w?.n ?? 'Unknown'}</b></Link> <span className="pill">{w?.role ?? '?'}</span></td>
                <td>{t.last.is_staff ? <span className="muted">You: </span> : null}{String(t.last.message).slice(0, 90)}</td>
                <td>{dt(t.last.created_at)}</td>
                <td>{t.unread ? <span className="pill warn">{t.unread} new</span> : null}</td>
              </tr>
            );
          })}
          {!threads.size && <tr><td colSpan={4} className="empty">No conversations yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
