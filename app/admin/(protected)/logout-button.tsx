'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.4)',
        color: '#ffffff',
        borderRadius: 4,
        padding: '6px 14px',
        fontSize: 13,
        cursor: loading ? 'default' : 'pointer',
      }}
    >
      {loading ? 'Signing out…' : 'Log out'}
    </button>
  );
}
