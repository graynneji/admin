import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { naira } from '@/lib/format';

export default async function Therapists() {
  await requireAdmin();
  const [{ data: therapists }, { data: patients }, { data: avail }] = await Promise.all([
    db().from('therapist').select('id, name, email, therapist_id, specialization, years_of_experience, balance, pending, total_earning, timezone').order('name'),
    db().from('patients').select('therapist'),
    db().from('therapist_availability').select('therapist_id'),
  ]);
  const load = new Map<number, number>();
  (patients ?? []).forEach((p: any) => load.set(p.therapist, (load.get(p.therapist) ?? 0) + 1));
  const hasAvail = new Set((avail ?? []).map((a: any) => a.therapist_id));

  return (
    <>
      <h1>Therapists</h1>
      <p className="sub">{therapists?.length ?? 0} therapists. A therapist with no availability is never auto-matched to new patients.</p>
      <table>
        <thead><tr><th>Name</th><th>Specialty</th><th>Patients</th><th>Availability</th><th>Available</th><th>Pending</th><th>Lifetime</th><th>Timezone</th></tr></thead>
        <tbody>
          {(therapists ?? []).map((t: any) => (
            <tr key={t.id}>
              <td><b>{t.name}</b><div className="muted small">{t.email}</div></td>
              <td>{t.specialization || '-'}<div className="muted small">{t.years_of_experience ?? 0} yrs</div></td>
              <td>{load.get(t.id) ?? 0}</td>
              <td>{hasAvail.has(t.therapist_id) ? <span className="pill ok">set</span> : <span className="pill warn">none</span>}</td>
              <td>{naira(t.balance)}</td><td>{naira(t.pending)}</td><td>{naira(t.total_earning)}</td><td>{t.timezone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
