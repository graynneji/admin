import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';
import { updatePlan, updateSetting } from '../actions';

export default async function Settings() {
  await requireAdmin();
  const [{ data: plans }, { data: settings }, { data: log }] = await Promise.all([
    db().from('plans').select('*').order('sort_order'),
    db().from('platform_settings').select('*').order('key'),
    db().from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(15),
  ]);
  return (
    <>
      <h1>Settings & pricing</h1>
      <p className="sub">Changes apply immediately to every app - no update needed.</p>

      <h2 style={{ fontSize: 16 }}>Plan prices</h2>
      <p className="muted small">Nigeria pays the ₦ price through Paystack; everyone else pays the $ price through Flutterwave.</p>
      <table style={{ marginBottom: 28 }}>
        <thead><tr><th>Plan</th><th>Sessions</th><th>Days</th><th>Price (₦)</th><th>Price ($)</th><th /></tr></thead>
        <tbody>
          {(plans ?? []).map((p: any) => (
            <tr key={p.id}>
              <td><b>{p.title}</b></td><td>{p.sessions}</td><td>{p.duration_days}</td>
              <td colSpan={3}>
                <form action={updatePlan} className="row">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="price_ngn" type="number" min={1} step="1" defaultValue={p.price_kobo / 100} style={{ width: 130 }} />
                  <input name="price_usd" type="number" min={1} step="0.01" defaultValue={(p.price_usd_cents ?? 0) / 100} style={{ width: 110 }} />
                  <button className="btn sm">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16 }}>Platform rules</h2>
      <table style={{ marginBottom: 28 }}>
        <thead><tr><th>Setting</th><th>What it does</th><th>Value</th></tr></thead>
        <tbody>
          {(settings ?? []).map((s: any) => (
            <tr key={s.key}>
              <td><b>{s.key}</b></td><td className="muted">{s.note}</td>
              <td><form action={updateSetting} className="row"><input type="hidden" name="key" value={s.key} /><input name="value" type="number" step="any" defaultValue={s.value} style={{ width: 110 }} /><button className="btn sm">Save</button></form></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 16 }}>Recent admin actions</h2>
      <table>
        <thead><tr><th>When</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>{(log ?? []).map((l: any) => <tr key={l.id}><td>{new Date(l.created_at).toLocaleString('en-GB')}</td><td>{l.action}</td><td className="muted small">{l.target}</td></tr>)}
          {!log?.length && <tr><td colSpan={3} className="empty">Nothing yet.</td></tr>}</tbody>
      </table>
    </>
  );
}
