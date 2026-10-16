// 'use server';
// import { revalidatePath } from 'next/cache';
// import { audit, requireAdmin } from '@/lib/auth';
// import { db } from '@/lib/supabase-admin';

// const num = (v: FormDataEntryValue | null) => (v === null || v === '' ? null : Number(v));
// const str = (v: FormDataEntryValue | null) => String(v ?? '').trim();

// /** Withdrawals: mark paid, mark processing, or mark failed (a database trigger returns the money to the therapist's balance). */
// export async function setPayoutStatus(formData: FormData) {
//   const admin = await requireAdmin();
//   const id = str(formData.get('id'));
//   const status = str(formData.get('status'));
//   if (!['processing', 'completed', 'failed'].includes(status)) return;
//   const patch: Record<string, unknown> = { status };
//   if (status === 'completed') patch.completed_at = new Date().toISOString();
//   await db().from('payout_requests').update(patch).eq('id', id);
//   await audit(admin.id, `payout_${status}`, id);
//   revalidatePath('/payouts');
// }

// /** Therapist change: approve (pick someone, or leave empty = auto-match) / reject with a note. */
// export async function resolveChangeRequest(formData: FormData) {
//   const admin = await requireAdmin();
//   const id = str(formData.get('id'));
//   const decision = str(formData.get('decision'));
//   const note = str(formData.get('note')) || null;
//   const therapist = num(formData.get('therapist'));

//   if (decision === 'reject') {
//     const { data } = await db().rpc('reject_therapist_change', { p_request: id, p_admin: admin.id, p_note: note });
//     await audit(admin.id, 'change_rejected', id, { note, result: data });
//   } else {
//     const { data } = await db().rpc('apply_therapist_change', { p_request: id, p_new_therapist: decision === 'auto' ? null : therapist, p_admin: admin.id, p_note: note });
//     await audit(admin.id, decision === 'auto' ? 'change_auto_matched' : 'change_approved', id, { therapist, result: data });
//   }
//   revalidatePath('/change-requests');
// }

// export async function replySupport(formData: FormData) {
//   const admin = await requireAdmin();
//   const customer = str(formData.get('customer'));
//   const message = str(formData.get('message'));
//   if (!customer || !message) return;
//   await db().from('support_messages').insert({ customer_id: customer, sender_id: admin.id, is_staff: true, message: message.slice(0, 2000) });
//   await db().from('support_messages').update({ read_at: new Date().toISOString() }).eq('customer_id', customer).eq('is_staff', false).is('read_at', null);
//   revalidatePath(`/support/${customer}`);
//   revalidatePath('/support');
// }

// export async function sendAnnouncement(formData: FormData) {
//   const admin = await requireAdmin();
//   const title = str(formData.get('title'));
//   const body = str(formData.get('body'));
//   const audience = str(formData.get('audience')) || 'all';
//   const days = num(formData.get('days')) ?? 7;
//   const push = formData.get('push') === 'on';
//   if (!title || !body) return;
//   await db().rpc('broadcast_announcement', { p_title: title, p_body: body, p_audience: audience, p_expires_in_days: days, p_send_push: push });
//   await audit(admin.id, 'announcement', audience, { title, push });
//   revalidatePath('/announcements');
// }

// export async function updateSetting(formData: FormData) {
//   const admin = await requireAdmin();
//   const key = str(formData.get('key'));
//   const value = num(formData.get('value'));
//   if (!key || value === null || Number.isNaN(value)) return;
//   await db().from('platform_settings').update({ value }).eq('key', key);
//   await audit(admin.id, 'setting', key, { value });
//   revalidatePath('/settings');
// }

// export async function updatePlan(formData: FormData) {
//   const admin = await requireAdmin();
//   const id = str(formData.get('id'));
//   const ngn = num(formData.get('price_ngn'));
//   const usd = num(formData.get('price_usd'));
//   if (!id || ngn === null || usd === null || ngn <= 0 || usd <= 0) return;
//   await db().from('plans').update({ price_kobo: Math.round(ngn * 100), price_usd_cents: Math.round(usd * 100) }).eq('id', id);
//   await audit(admin.id, 'plan_price', id, { ngn, usd });
//   revalidatePath('/settings');
// }

"use server";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";

const num = (v: FormDataEntryValue | null) =>
  v === null || v === "" ? null : Number(v);
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

/** Withdrawals: mark paid, mark processing, or mark failed (a database trigger returns the money to the therapist's balance). */
export async function setPayoutStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData.get("id"));
  const status = str(formData.get("status"));
  if (!["processing", "completed", "failed"].includes(status)) return;
  const patch: Record<string, unknown> = { status };
  if (status === "completed") patch.completed_at = new Date().toISOString();
  await db().from("payout_requests").update(patch).eq("id", id);
  await audit(admin.id, `payout_${status}`, id);
  revalidatePath("/payouts");
}

/** Therapist change: approve (pick someone, or leave empty = auto-match) / reject with a note. */
export async function resolveChangeRequest(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData.get("id"));
  const decision = str(formData.get("decision"));
  const note = str(formData.get("note")) || null;
  const therapist = num(formData.get("therapist"));

  if (decision === "reject") {
    const { data } = await db().rpc("reject_therapist_change", {
      p_request: id,
      p_admin: admin.id,
      p_note: note,
    });
    await audit(admin.id, "change_rejected", id, { note, result: data });
  } else {
    const { data } = await db().rpc("apply_therapist_change", {
      p_request: id,
      p_new_therapist: decision === "auto" ? null : therapist,
      p_admin: admin.id,
      p_note: note,
    });
    await audit(
      admin.id,
      decision === "auto" ? "change_auto_matched" : "change_approved",
      id,
      { therapist, result: data },
    );
  }
  revalidatePath("/change-requests");
}

export async function replySupport(formData: FormData) {
  const admin = await requireAdmin();
  const customer = str(formData.get("customer"));
  const message = str(formData.get("message"));
  if (!customer || !message) return;
  await db()
    .from("support_messages")
    .insert({
      customer_id: customer,
      sender_id: admin.id,
      is_staff: true,
      message: message.slice(0, 2000),
    });
  await db()
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("customer_id", customer)
    .eq("is_staff", false)
    .is("read_at", null);
  revalidatePath(`/support/${customer}`);
  revalidatePath("/support");
}

export async function sendAnnouncement(formData: FormData) {
  const admin = await requireAdmin();
  const title = str(formData.get("title"));
  const body = str(formData.get("body"));
  const audience = str(formData.get("audience")) || "all";
  const days = num(formData.get("days")) ?? 7;
  const push = formData.get("push") === "on";
  if (!title || !body) return;
  await db().rpc("broadcast_announcement", {
    p_title: title,
    p_body: body,
    p_audience: audience,
    p_expires_in_days: days,
    p_send_push: push,
  });
  await audit(admin.id, "announcement", audience, { title, push });
  revalidatePath("/announcements");
}

export async function updateSetting(formData: FormData) {
  const admin = await requireAdmin();
  const key = str(formData.get("key"));
  const value = num(formData.get("value"));
  if (!key || value === null || Number.isNaN(value)) return;
  await db().from("platform_settings").update({ value }).eq("key", key);
  await audit(admin.id, "setting", key, { value });
  revalidatePath("/settings");
}

export async function updatePlan(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData.get("id"));
  const ngn = num(formData.get("price_ngn"));
  const usd = num(formData.get("price_usd"));
  if (!id || ngn === null || usd === null || ngn <= 0 || usd <= 0) return;
  await db()
    .from("plans")
    .update({
      price_kobo: Math.round(ngn * 100),
      price_usd_cents: Math.round(usd * 100),
    })
    .eq("id", id);
  await audit(admin.id, "plan_price", id, { ngn, usd });
  revalidatePath("/settings");
}

/** Re-send a payment receipt email (calls the resend-receipt Edge Function with the service key). */
export async function resendReceipt(formData: FormData) {
  const admin = await requireAdmin();
  const reference = str(formData.get("reference"));
  if (!reference) return;
  let outcome: unknown = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend-receipt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ reference }),
      },
    );
    outcome = await res.json().catch(() => ({ status: res.status }));
  } catch (e) {
    outcome = { error: (e as Error).message };
  }
  await audit(admin.id, "resend_receipt", reference, outcome);
  revalidatePath("/payments");
}
