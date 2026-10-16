import { login } from './actions';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const msg = searchParams.error === 'not_admin' ? 'This account is not an admin.' : searchParams.error ? 'Wrong email or password.' : '';
  return (
    <div className="login card">
      <h1>Mentel Admin</h1>
      <p className="sub">Sign in with your admin account.</p>
      {msg ? <div className="error">{msg}</div> : null}
      <form action={login}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
        <div style={{ marginTop: 18 }}><button className="btn" style={{ width: '100%' }}>Sign in</button></div>
      </form>
    </div>
  );
}
