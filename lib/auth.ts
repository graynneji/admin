import { redirect } from 'next/navigation';
import { db } from './supabase-admin';
import { sessionClient } from './supabase-server';

/** Every admin page and every server action starts here: signed in AND listed in public.admin_users. */
export async function requireAdmin() {
  const { data } = await sessionClient().auth.getUser();
  const user = data.user;
  if (!user) redirect('/login');
  const { data: row } = await db().from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!row) redirect('/login?error=not_admin');
  return user;
}

export async function audit(adminId: string, action: string, target?: string, details?: unknown) {
  await db().from('admin_audit_log').insert({ admin_id: adminId, action, target, details: details ?? null });
}
