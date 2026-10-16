import Link from 'next/link';
import { logout } from '../login/actions';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [{ count: changes }, { count: payouts }] = await Promise.all([
    db().from('therapist_change_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db().from('payout_requests').select('id', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
  ]);
  const badge = (n: number | null) => (n ? <span className="pill warn">{n}</span> : null);
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">Mentel Admin</div>
        <Link className="nav" href="/">Overview</Link>
        <Link className="nav" href="/patients">Patients</Link>
        <Link className="nav" href="/therapists">Therapists</Link>
        <Link className="nav" href="/sessions">Sessions</Link>
        <Link className="nav" href="/payments">Payments</Link>
        <Link className="nav" href="/payouts">Payouts {badge(payouts)}</Link>
        <Link className="nav" href="/change-requests">Therapist changes {badge(changes)}</Link>
        <Link className="nav" href="/support">Support chat</Link>
        <Link className="nav" href="/announcements">Announcements</Link>
        <Link className="nav" href="/settings">Settings & pricing</Link>
        <div className="grow" />
        <div className="small" style={{ padding: '0 10px', opacity: 0.7 }}>{user.email}</div>
        <form action={logout}><button className="btn ghost" style={{ width: '100%', marginTop: 8 }}>Sign out</button></form>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
