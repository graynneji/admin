import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt, naira } from '@/lib/format';

export default async function Sessions({ searchParams }: { searchParams: { outcome?: string } }) {
  await requireAdmin();
  let q = db().from('appointment').select('id, time, status, outcome, missed_reason, attended_seconds, duration_minutes, session_type, earning_amount, patient_id, therapist_id').order('time', { ascending: false }).limit(300);
  if (searchParams.outcome === 'upcoming') q = q.eq('status', 'accepted').eq('outcome', 'scheduled').gt('time', new Date().toISOString());
  else if (searchParams.outcome) q = q.eq('outcome', searchParams.outcome);
  const { data: rows } = await q;
  const pIds = Array.from(new Set((rows ?? []).map((r: any) => r.patient_id)));
  const tIds = Array.from(new Set((rows ?? []).map((r: any) => r.therapist_id)));
  const [{ data: pats }, { data: ths }] = await Promise.all([
    pIds.length ? db().from('patients').select('patient_id, name').in('patient_id', pIds) : Promise.resolve({ data: [] as any[] }),
    tIds.length ? db().from('therapist').select('therapist_id, name').in('therapist_id', tIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const pn = new Map((pats ?? []).map((p: any) => [p.patient_id, p.name]));
  const tn = new Map((ths ?? []).map((t: any) => [t.therapist_id, t.name]));
  const link = (label: string, v?: string) => <a className={searchParams.outcome === v ? 'on' : ''} href={v ? `?outcome=${v}` : '?'}>{label}</a>;

  return (
    <>
      <h1>Sessions</h1>
      <p className="sub">A session counts as completed when the call lasts long enough (see Settings). Missed ones are listed with the reason.</p>
      <div className="filters">{link('All')}{link('Upcoming', 'upcoming')}{link('Completed', 'completed')}{link('Missed', 'missed')}</div>
      <table>
        <thead><tr><th>When (Lagos)</th><th>Patient</th><th>Therapist</th><th>Type</th><th>Status</th><th>On call</th><th>Therapist earned</th></tr></thead>
        <tbody>
          {(rows ?? []).map((r: any) => (
            <tr key={r.id}>
              <td>{dt(r.time)}</td><td>{pn.get(r.patient_id) ?? '-'}</td><td>{tn.get(r.therapist_id) ?? '-'}</td><td>{r.session_type} · {r.duration_minutes}m</td>
              <td>
                {r.status === 'declined' ? <span className="pill bad">declined</span> : r.status === 'pending' ? <span className="pill warn">requested</span>
                  : r.outcome === 'completed' ? <span className="pill ok">completed</span>
                  : r.outcome === 'missed' ? <span className="pill bad">missed{r.missed_reason ? ` (${r.missed_reason.replace('_', ' ')})` : ''}</span>
                  : <span className="pill info">scheduled</span>}
              </td>
              <td>{Math.round((r.attended_seconds ?? 0) / 60)} / {r.duration_minutes} min</td>
              <td>{r.outcome === 'completed' ? naira(r.earning_amount) : '-'}</td>
            </tr>
          ))}
          {!rows?.length && <tr><td colSpan={7} className="empty">No sessions.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
