'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/admin/staff');
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f0f0',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 340,
          background: '#ffffff',
          borderRadius: 8,
          padding: 32,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0b3d91', margin: 0 }}>RSTV Admin</h1>
        <p style={{ fontSize: 13, color: '#1c2628', margin: '4px 0 16px' }}>
          Sign in to manage staff ID records.
        </p>

        <label style={labelStyle}>Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 12 }}>Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        {error && (
          <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 12, marginBottom: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 20,
            background: '#0b3d91',
            color: '#ffffff',
            border: 'none',
            borderRadius: 4,
            padding: '10px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#1c2628',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #b4b4b4',
  borderRadius: 4,
  padding: '8px 10px',
  fontSize: 14,
  color: '#1c2628',
};
