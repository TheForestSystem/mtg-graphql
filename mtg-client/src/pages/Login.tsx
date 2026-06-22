import { useState } from 'react';
import { getClient } from '../lib/gql';
import { LOGIN } from '../lib/queries';

export default function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const data: any = await getClient().request(LOGIN, { username, password });
      onLogin(data.login.token);
    } catch (err: any) {
      setError(err.message ?? 'Login failed');
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '100px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}