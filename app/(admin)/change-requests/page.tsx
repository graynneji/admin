import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt } from '@/lib/format';
import { resolveChangeRequest } from '../actions';

const REASON: Record<string, string> = {
  no_connection: 'We don\u2019t connect well', communication: 'Communication style', specialty: 'Needs a different specialty',
  schedule: 'Availability / schedule', gender_preference: 'Preference (e.g. gender)', other: 'Something else',
};

export default async function ChangeRequests({ searchParams }: { searchParams: { status?: string } }) {
  await requireAdmin();
  const status = searchParams.status ?? 'pending';
  let q = db().from('therapist_change_requests').select('*').order('created_at', { ascending: false }).limit(100);
  if (status !== 'all') q = q.eq('status', status);
  const { data: rows } = await q;
  const [{ data: therapists }, { data: pats }] = await Promise.all([
    db().from('therapist').select('id, name, specialization, therapist_id'),
    (rows?.length ? db().from('patients').select('patient_id, name, email').in('patient_id', rows.map((r: any) => r.patient_id)) : Promise.resolve({ data: [] as any[] })),
  ]);
  const { data: avail } = await db().from('therapist_availability').select('therapist_id');
  const hasAvail = new Set((avail ?? []).map((a: any) => a.therapist_id));
  const { data: loads } = await db().from('patients').select('therapist');
  const load = new Map<number, number>(); (loads ?? []).forEach((p: any) => load.set(p.therapist, (load.get(p.therapist) ?? 0) + 1));
  const tn = new Map((therapists ?? []).map((t: any) => [t.id, t]));
  const pn = new Map((pats ?? []).map((p: any) => [p.patient_id, p]));
  const link = (label: string, v: string) => <a className={status === v ? 'on' : ''} href={`?status=${v}`}>{label}</a>;

  return (
    <>
      <h1>Therapist change requests</h1>
      <p className="sub">Pick a therapist, or choose <b>Auto-match</b> and the system picks the available therapist with the fewest patients (preferring a specialty match). Approving moves the patient and cancels their upcoming sessions with the old therapist (credits are returned).</p>
      <div className="filters">{link('Pending', 'pending')}{link('Approved', 'approved')}{link('Rejected', 'rejected')}{link('All', 'all')}</div>

      {(rows ?? []).map((r: any) => {
        const p: any = pn.get(r.patient_id); const cur: any = tn.get(r.current_therapist_id); const pref: any = tn.get(r.preferred_therapist_id); const asg: any = tn.get(r.assigned_therapist_id);
        return (
          <div className="card" key={r.id} style={{ marginBottom: 14 }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b style={{ fontSize: 16 }}>{p?.name ?? 'Patient'}</b> <span className="muted">{p?.email}</span></div>
              <span className={`pill ${r.status === 'approved' ? 'ok' : r.status === 'rejected' ? 'bad' : r.status === 'pending' ? 'warn' : ''}`}>{r.status}</span>
            </div>
            <div className="muted small" style={{ margin: '4px 0 10px' }}>Requested {dt(r.created_at)} · currently with <b>{cur?.name ?? '-'}</b></div>
            <div><b>Reason:</b> {REASON[r.reason_code] ?? r.reason_code}</div>
            {r.reason_text ? <div style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }} className="card">{r.reason_text}</div> : null}
            <div><b>Wants:</b> {r.auto_match ? 'Let Mentel choose' : pref ? `${pref.name} (${pref.specialization ?? 'no specialty listed'})` : '-'}{r.preferred_note ? <> — <i>&ldquo;{r.preferred_note}&rdquo;</i></> : null}</div>

            {r.status === 'pending' ? (
              <form action={resolveChangeRequest} style={{ marginTop: 12 }}>
                <input type="hidden" name="id" value={r.id} />
                <label>Assign to</label>
                <select name="therapist" defaultValue={r.preferred_therapist_id ?? ''}>
                  <option value="">— choose a therapist (or use Auto-match) —</option>
                  {(therapists ?? []).filter((t: any) => t.id !== r.current_therapist_id).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name} · {t.specialization ?? 'general'} · {load.get(t.id) ?? 0} patients{hasAvail.has(t.therapist_id) ? '' : ' · NO AVAILABILITY'}</option>
                  ))}
                </select>
                <label>Note (shown to the patient if rejected)</label>
                <input name="note" placeholder="Optional" />
                <div className="row" style={{ marginTop: 12 }}>
                  <button name="decision" value="approve" className="btn ok">Approve with selected</button>
                  <button name="decision" value="auto" className="btn">Auto-match</button>
                  <button name="decision" value="reject" className="btn bad">Reject</button>
                </div>
              </form>
            ) : (
              <div className="muted small" style={{ marginTop: 10 }}>
                {r.status === 'approved' ? <>Moved to <b>{asg?.name ?? '-'}</b> · </> : null}{dt(r.resolved_at)}{r.admin_note ? ` · "${r.admin_note}"` : ''}
              </div>
            )}
          </div>
        );
      })}
      {!rows?.length && <div className="card empty">No requests.</div>}
    </>
  );
}
