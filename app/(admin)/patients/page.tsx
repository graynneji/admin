import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { d, planActive } from '@/lib/format';

export default async function Patients({ searchParams }: { searchParams: { q?: string; plan?: string } }) {
  await requireAdmin();
  const q = (searchParams.q ?? '').trim();
  let query = db().from('patients').select('id, name, email, patient_id, therapist, is_subscribed, plan_type, sessions_remaining, subscription_expires_at, created_at').order('created_at', { ascending: false }).limit(300);
  if (q) query = query.or(`name.ilike.%${q.replace(/[%,]/g, '')}%,email.ilike.%${q.replace(/[%,]/g, '')}%`);
  const [{ data: patients }, { data: therapists }] = await Promise.all([query, db().from('therapist').select('id, name')]);
  const tName = new Map((therapists ?? []).map((t: any) => [t.id, t.name]));
  const rows = (patients ?? []).filter((p: any) => !searchParams.plan || (searchParams.plan === 'active' ? planActive(p) : !planActive(p)));

  return (
    <>
      <h1>Patients</h1>
      <p className="sub">{rows.length} shown (latest 300).</p>
      <form className="row" style={{ marginBottom: 14 }}>
        <input name="q" defaultValue={q} placeholder="Search name or email" style={{ maxWidth: 320 }} />
        <button className="btn">Search</button>
      </form>
      <div className="filters">
        <a className={!searchParams.plan ? 'on' : ''} href="?">All</a>
        <a className={searchParams.plan === 'active' ? 'on' : ''} href="?plan=active">Active plan</a>
        <a className={searchParams.plan === 'none' ? 'on' : ''} href="?plan=none">No active plan</a>
      </div>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Therapist</th><th>Plan</th><th>Sessions left</th><th>Expires</th><th>Joined</th></tr></thead>
        <tbody>
          {rows.map((p: any) => (
            <tr key={p.id}>
              <td><b>{p.name}</b></td><td>{p.email}</td><td>{tName.get(p.therapist) ?? '-'}</td>
              <td>{planActive(p) ? <span className="pill ok">{p.plan_type}</span> : <span className="pill">none</span>}</td>
              <td>{p.sessions_remaining ?? 0}</td><td>{d(p.subscription_expires_at)}</td><td>{d(p.created_at)}</td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={7} className="empty">No patients found.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
