import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { toast } from 'react-toastify';
import { Package, Trash2, FileText, ArrowUpRight, TrendingUp, Users, Scale, Wallet, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  const [stocks, setStocks] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPoints: 0, totalWeightKg: 0, totalWithdrawals: 0, pendingSubmissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stocksRes, statsRes, pendingRes] = await Promise.all([
          axios.get(`${API_URL}/collector/stocks`),
          axios.get(`${API_URL}/collector/stats`),
          axios.get(`${API_URL}/waste/pending`)
        ]);
        setStocks(stocksRes.data);
        const filteredPending = pendingRes.data.filter(sub => {
          if (isAdmin) return sub.status === 'VERIFIED';
          return sub.status === 'PENDING';
        });
        setStats({ ...statsRes.data, pendingSubmissions: filteredPending.length });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpis = isAdmin ? [
    { label: 'Warga Aktif', val: stats.totalUsers.toLocaleString(), change: '↑ 12%', color: 'text-waste-green', icon: Users },
    { label: 'Sampah Masuk', val: `${stats.totalWeightKg.toLocaleString()} Kg`, change: '↑ 8%', color: 'text-waste-green', icon: Scale },
    { label: 'Poin Rakyat', val: (stats.totalPoints / 1000).toFixed(1) + 'k', change: '↑ 15%', color: 'text-waste-green', icon: TrendingUp },
    { label: 'Kas Operasional', val: `Rp ${(stats.totalWeightKg * 200).toLocaleString()}`, change: '↑ 5%', color: 'text-waste-green', icon: Wallet },
  ] : [
    { label: 'Perlu Verifikasi', val: stats.pendingSubmissions.toString(), change: 'Action Needed', color: 'text-waste-coral', icon: CheckCircle },
    { label: 'Sampah di RT', val: `${stats.totalWeightKg.toLocaleString()} Kg`, change: 'In Stock', color: 'text-waste-green', icon: Package },
    { label: 'Warga Dilayani', val: stats.totalUsers.toLocaleString(), change: 'Total', color: 'text-waste-green', icon: Users },
    { label: 'Target Jemput', val: '3 Lokasi', change: 'Today', color: 'text-waste-amber', icon: Scale },
  ];


  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-12">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-4 md:p-6 rounded-3xl border border-base-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden relative">
             <div className="absolute top-[-10%] right-[-10%] w-20 h-20 bg-base-100 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 md:p-3 bg-waste-green-light rounded-2xl">
                <kpi.icon size={18} className="text-waste-green" />
              </div>
              <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg ${kpi.change.includes('↑') ? 'bg-waste-green-light text-waste-green' : 'bg-waste-coral-light text-waste-coral'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-[9px] md:text-[10px] font-black text-base-content/30 uppercase tracking-widest mb-1 relative z-10">{kpi.label}</div>
            <div className="text-xl md:text-3xl font-black text-base-content tracking-tighter relative z-10">{kpi.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
        {/* Main Stock Table */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 border-b border-base-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-black text-base tracking-tight text-base-content">Stok per Wilayah (RT)</h2>
              <p className="text-[11px] text-base-content/40 font-medium">Data diperbarui hari ini, 17:30 WIB</p>
            </div>
            <button className="text-[11px] font-black text-waste-green bg-waste-green-light px-4 py-2 rounded-xl hover:bg-waste-green transition-colors hover:text-white">
              Cetak Laporan
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-lg">
              <thead>
                <tr className="bg-base-100/30">
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Wilayah</th>
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-center hidden md:table-cell">Plastik</th>
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-center hidden md:table-cell">Kertas</th>
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-right">Total Stok</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan="4" className="skeleton h-16 w-full my-4"></td></tr>)
                ) : (
                  stocks.map((stock) => (
                    <tr key={stock.rt} className="hover:bg-base-100/30 transition-colors">
                      <td className="py-5">
                        <div className="font-black text-sm text-base-content">{stock.rt}</div>
                        <div className="md:hidden text-[10px] text-base-content/40 mt-0.5">
                          P: {(stock.totalPlasticKg || 0).toFixed(1)}kg • K: {(stock.totalPaperKg || 0).toFixed(1)}kg
                        </div>
                      </td>
                      <td className="text-center text-xs font-bold text-base-content/60 hidden md:table-cell">{(stock.totalPlasticKg || 0).toFixed(1)} kg</td>
                      <td className="text-center text-xs font-bold text-base-content/60 hidden md:table-cell">{(stock.totalPaperKg || 0).toFixed(1)} kg</td>
                      <td className="text-right">
                        <span className="badge badge-lg bg-waste-green-light text-waste-green border-none font-black text-xs px-4 h-10 shadow-sm">
                          {((stock.totalPlasticKg || 0) + (stock.totalPaperKg || 0) + (stock.totalMetalKg || 0) + (stock.totalGlassKg || 0) + (stock.totalOilKg || 0)).toFixed(1)} kg
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Side Leaderboard */}
        <div className="bg-white rounded-3xl border border-base-200 shadow-sm p-6 md:p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-black text-base tracking-tight">Leaderboard RT</h2>
              <p className="text-[10px] text-base-content/40 font-bold uppercase tracking-widest">Bulan April</p>
            </div>
            <div className="w-10 h-10 bg-waste-amber-light rounded-2xl flex items-center justify-center">
              <TrendingUp size={20} className="text-waste-amber" />
            </div>
          </div>
          <div className="space-y-6">
            {stocks
              .map(s => ({
                ...s,
                total: (s.totalPlasticKg || 0) + (s.totalPaperKg || 0) + (s.totalMetalKg || 0) + (s.totalGlassKg || 0) + (s.totalOilKg || 0)
              }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 5).map((stock, i) => (
              <div key={stock.rt} className="flex items-center gap-5 group">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm ${
                  i === 0 ? 'bg-waste-amber-light text-waste-amber' : 
                  i === 1 ? 'bg-base-200 text-base-content/50' :
                  i === 2 ? 'bg-waste-coral-light text-waste-coral' : 'bg-base-100 text-base-content/30'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-base-content tracking-tight">{stock.rt}</div>
                  <div className="w-full h-2 bg-base-100 rounded-full mt-2 overflow-hidden border border-base-200 shadow-inner">
                    <div 
                      className="h-full bg-waste-green rounded-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (stock.total / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs font-black text-waste-green tabular-nums">
                  {stock.total.toFixed(0)} pts
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm w-full mt-10 text-[10px] font-black uppercase tracking-widest text-base-content/30 border border-dashed border-base-200 rounded-xl hover:bg-base-100">
            Selengkapnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
