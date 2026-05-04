import React from 'react';
import {
  LayoutDashboard, Package, Store, LayoutTemplate,
  BarChart3, Heart, Layers, Settings, LogOut, User,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export type SidebarView = 'dashboard' | 'kits' | 'store' | 'templates' | 'analytics' | 'favorites' | 'brand' | 'settings';

const NAV_ITEMS: { id: SidebarView; label: string; icon: React.ComponentType<{ size: number }> }[] = [
  { id: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'kits',       label: 'Product Kits',  icon: Package },
  { id: 'store',      label: 'Store',         icon: Store },
  { id: 'templates',  label: 'Templates',     icon: LayoutTemplate },
  { id: 'analytics',  label: 'Analytics',     icon: BarChart3 },
  { id: 'favorites',  label: 'Favorites',     icon: Heart },
  { id: 'brand',      label: 'Brand Kit',     icon: Layers },
  { id: 'settings',   label: 'Settings',      icon: Settings },
];

export function Sidebar({ active, onChange }: { active: SidebarView; onChange: (v: SidebarView) => void }) {
  const { user, signOut } = useAuth();

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 12px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, marginBottom: 28 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6C5CE7,#8A7BFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff', flexShrink: 0 }}>N</div>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>Nexio</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onChange(id)}
            className={`nav-item ${active === id ? 'active' : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(108,92,231,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={14} color="var(--accent)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email?.split('@')[0] ?? 'User'}</p>
            <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {user?.role === 'admin' ? 'Admin' : 'Pro Plan'}
            </p>
          </div>
        </div>
        <button onClick={signOut} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
