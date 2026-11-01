import { StrictMode, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import axios, { type AxiosInstance } from 'axios';
import JobsFeed from './JobsFeed';

/** Standalone dev harness: sign in against core-api, then render the feed like the shell would. */
const CORE = import.meta.env.VITE_CORE_API_URL ?? 'http://localhost:8080';
const MATCH = import.meta.env.VITE_MATCH_API_URL ?? 'http://localhost:8082';

function Harness() {
  const [http, setHttp] = useState<AxiosInstance | null>(null);
  const [error, setError] = useState('');

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const { data } = await axios.post(`${CORE}/auth/login`, { email: f.get('email'), password: f.get('password') });
      setHttp(axios.create({ baseURL: MATCH, headers: { Authorization: `Bearer ${data.accessToken}` } }));
    } catch {
      setError('Login failed');
    }
  }

  if (http) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <JobsFeed http={http} />
      </div>
    );
  }
  return (
    <form onSubmit={login} className="mx-auto mt-24 max-w-xs space-y-2 p-4 text-sm">
      <p className="font-semibold">jobs-feed-mfe (standalone)</p>
      <input name="email" placeholder="email" className="w-full rounded border px-2 py-1" />
      <input name="password" type="password" placeholder="password" className="w-full rounded border px-2 py-1" />
      <button className="rounded bg-indigo-600 px-3 py-1 text-white">Sign in</button>
      {error && <p className="text-rose-600">{error}</p>}
    </form>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
