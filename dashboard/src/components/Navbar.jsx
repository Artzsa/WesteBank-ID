import { Bell, User, Search, LogOut, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard';
      case '/verification': return 'Submisi Sampah';
      case '/pickups': return 'Penjadwalan Pickup';
      case '/leaderboard': return 'Leaderboard RT';
      default: return 'WasteBank ID';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="navbar bg-white border-b border-base-200 px-4 md:px-8 py-4 min-h-[72px] sticky top-0 z-40 shadow-sm">
      <div className="flex-1 gap-2 md:gap-4">
        {/* Hamburger Toggle for Mobile */}
        <label htmlFor="my-drawer" className="btn btn-ghost btn-circle btn-sm lg:hidden">
          <Menu size={20} className="text-base-content/70" />
        </label>

        <div>
          <h1 className="text-sm md:text-lg font-bold text-base-content leading-tight">{getPageTitle()}</h1>
          <p className="hidden md:block text-[11px] text-base-content/50 font-medium mt-0.5">April 2026 • 12 RT Aktif</p>
        </div>
      </div>

      <div className="flex-none gap-2 md:gap-6">
        <div className="hidden lg:flex items-center bg-base-100 px-3 py-2 rounded-xl gap-2 border border-base-300">
          <Search size={16} className="text-base-content/40" />
          <input type="text" placeholder="Cari data..." className="bg-transparent border-none focus:outline-none text-xs w-32 xl:w-48" />
        </div>
        
        <button className="btn btn-ghost btn-circle btn-sm bg-base-100 border border-base-200">
          <div className="indicator">
            <Bell size={18} className="text-base-content/70" />
            <span className="badge badge-primary badge-xs indicator-item"></span>
          </div>
        </button>

        <div className="flex items-center gap-2 md:gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold truncate max-w-[120px]">{user?.name || 'User'}</div>
            <div className="text-[9px] text-base-content/50 uppercase font-bold tracking-tight">{user?.role}</div>
          </div>
          
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm md:btn-md avatar m-0 p-0">
              <div className="w-8 md:w-10 rounded-xl bg-waste-green text-white flex items-center justify-center font-bold shadow-md">
                <User size={18} />
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-white rounded-2xl w-52 border border-base-300">
              <li className="px-4 py-2 border-b border-base-100 mb-1">
                <div className="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">Akun Saya</div>
              </li>
              <li><button onClick={() => navigate('/profile')} className="py-2 px-4 rounded-xl text-left w-full">Profil Saya</button></li>
              <li className="lg:hidden"><a className="py-2 px-4 rounded-xl">Pemberitahuan</a></li>
              <li className="mt-2 pt-2 border-t border-base-100">
                <button 
                  onClick={handleLogout}
                  className="py-2 px-4 rounded-xl text-waste-coral hover:bg-waste-coral-light font-bold flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Keluar Sesi
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
