import { redirect } from 'next/navigation';
import { getSupabaseSessionClient } from '@/lib/supabase-session-server';
import { LogoutButton } from './logout-button';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseSessionClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/admin/login');
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: '#0b3d91',
          color: '#ffffff',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>RSTV Admin</span>
        <LogoutButton />
      </header>
      <main style={{ flex: 1, padding: 24, background: '#f7f7f8' }}>{children}</main>
    </div>
  );
}
