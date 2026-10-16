import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { dt } from '@/lib/format';
import { sendAnnouncement } from '../actions';

export default async function Announcements() {
  await requireAdmin();
  const { data: list } = await db().from('announcements').select('*').order('created_at', { ascending: false }).limit(30);
  return (
    <>
      <h1>Announcements</h1>
      <p className="sub">Shows as a banner on the Home screen and (optionally) sends a push notification to the chosen group.</p>
      <form action={sendAnnouncement} className="card" style={{ maxWidth: 640, marginBottom: 26 }}>
        <label>Title</label><input name="title" required maxLength={80} />
        <label>Message</label><textarea name="body" required maxLength={400} />
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Send to</label>
            <select name="audience" defaultValue="all"><option value="all">Everyone</option><option value="patients">Patients only</option><option value="therapists">Therapists only</option></select>
          </div>
          <div style={{ width: 150 }}><label>Banner for (days)</label><input name="days" type="number" min={1} max={60} defaultValue={7} /></div>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', textTransform: 'none' }}><input type="checkbox" name="push" defaultChecked style={{ width: 'auto' }} /> Also send a push notification</label>
        <div style={{ marginTop: 14 }}><button className="btn">Send announcement</button></div>
      </form>
      <table>
        <thead><tr><th>Sent</th><th>To</th><th>Title</th><th>Message</th><th>Banner until</th></tr></thead>
        <tbody>
          {(list ?? []).map((a: any) => <tr key={a.id}><td>{dt(a.created_at)}</td><td><span className="pill">{a.audience}</span></td><td><b>{a.title}</b></td><td>{a.body}</td><td>{dt(a.expires_at)}</td></tr>)}
          {!list?.length && <tr><td colSpan={5} className="empty">None yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
