'use server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase-admin';
import { sessionClient } from '@/lib/supabase-server';

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const supabase = sessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect('/login?error=invalid');
  const { data: admin } = await db().from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    redirect('/login?error=not_admin');
  }
  redirect('/');
}

export async function logout() {
  await sessionClient().auth.signOut();
  redirect('/login');
}
