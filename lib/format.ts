export const naira = (n: number | null | undefined) => `\u20A6${Math.round(Number(n ?? 0)).toLocaleString('en-NG')}`;
export function money(minor: number, currency: string) {
  const major = minor / 100;
  return currency === 'USD' ? `$${major.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : `\u20A6${major.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}
export const dt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }) : '-';
export const d = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' }) : '-';
export const planActive = (p: any) => !!p?.is_subscribed && (!p.subscription_expires_at || new Date(p.subscription_expires_at) > new Date());
