'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { colors, radius, shadow, spacing } from '@/lib/design-tokens';

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
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.background,
        padding: spacing.lg,
      }}
    >
      <form
        onSubmit={handleSubmit}
        aria-labelledby="login-heading"
        style={{
          width: '100%',
          maxWidth: 360,
          background: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.xl,
          boxShadow: shadow.md,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
            marginBottom: spacing.lg,
            borderRadius: radius.sm,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.sm,
              background: colors.primary,
              color: colors.textOnPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ID
          </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>Staff ID System</span>
        </Link>

        <h1
          id="login-heading"
          style={{ fontSize: 20, fontWeight: 700, color: colors.primary, margin: 0 }}
        >
          Sign in
        </h1>
        <p style={{ fontSize: 13, color: colors.textMuted, margin: '4px 0 0' }}>
          Sign in to manage your organization&apos;s staff ID records.
        </p>

        <div className="field">
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {error && (
          <p role="alert" className="alert alert-error" style={{ marginTop: spacing.md }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: spacing.lg }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
