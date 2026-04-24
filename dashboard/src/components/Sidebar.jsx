import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Truck, BarChart3, Users, FileText, X, Wallet, Tag, Megaphone, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOperationalAdmin = user?.role === 'ADMIN';
  const isAdmin = isSuperAdmin || isOperationalAdmin;

  const sections = [
    {
      title: 'Utama',
      links: [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/verification', icon: CheckSquare, label: 'Verifikasi Sampah' },
        ...(isSuperAdmin ? [{ to: '/leaderboard', icon: BarChart3, label: 'Leaderboard' }] : []),
      ]
    },
    {
      title: 'Operasional',
      links: [
        { to: '/pickups', icon: Truck, label: 'Jadwal Jemput' },
        ...(isAdmin ? [
          { to: '/users', icon: Users, label: 'Manajemen Warga' },
          ...(isSuperAdmin ? [{ to: '/broadcast', icon: Megaphone, label: 'Pusat Broadcast' }] : []),
          { to: '/rewards', icon: Gift, label: 'Katalog Reward' }
        ] : []),
      ]
    },
    ...(isAdmin ? [
      {
        title: 'Laporan & Keuangan',
        links: [
          ...(isSuperAdmin ? [
            { to: '/analytics', icon: FileText, label: 'Analitik' },
            { to: '/finances', icon: Wallet, label: 'Keuangan' },
          ] : []),
          { to: '/prices', icon: Tag, label: 'Harga Sampah' },
        ]
      }
    ] : [])
  ];

  return (
    <aside className="w-64 min-h-screen bg-waste-green text-white/80 p-0 overflow-y-auto shadow-2xl lg:shadow-none">
      {/* Header for Mobile only to close drawer */}
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <div>
          <div className="text-lg font-bold text-white tracking-wider">WasteBank ID</div>
          <div className="text-[10px] text-white/50 uppercase font-medium">
            {isSuperAdmin ? 'Admin Kelurahan' : isOperationalAdmin ? 'Admin Bank Sampah' : 'Warga'}
          </div>
        </div>
        <label htmlFor="my-drawer" className="lg:hidden btn btn-ghost btn-circle btn-sm text-white/50">
          <X size={20} />
        </label>
      </div>
      
      <div className="px-4 py-6">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.links.map((link) => (
                <li key={link.to}>
                  <NavLink 
                    to={link.to} 
                    onClick={() => {
                      const drawer = document.getElementById('my-drawer');
                      if (drawer) drawer.checked = false;
                    }}
                    className={({ isActive }) => 
                      `flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${
                        isActive 
                          ? 'bg-white/15 text-white shadow-sm' 
                          : 'hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <div className={`p-1 rounded ${link.to === '/' ? 'bg-white/20' : ''}`}>
                      <link.icon size={16} />
                    </div>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
