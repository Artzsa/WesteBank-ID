import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { toast } from 'react-toastify';
import { Package, Trash2, FileText, ArrowUpRight, TrendingUp, Users, Scale, Wallet, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  
  const [stocks, setStocks] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalPoints: 0, totalWeightKg: 0, totalWithdrawals: 0, pendingSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [personalStats, setPersonalStats] = useState({ totalPoints: 0, totalWaste: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAdmin) {
          const [stocksRes, statsRes, pendingRes] = await Promise.all([
            axios.get(`${API_URL}/collector/stocks`),
            axios.get(`${API_URL}/collector/stats`),
            axios.get(`${API_URL}/waste/pending`)
          ]);
          setStocks(stocksRes.data);
          const filteredPending = pendingRes.data.filter(sub => sub.status === 'VERIFIED');
          setStats({ ...statsRes.data, pendingSubmissions: filteredPending.length });
        } else {
          // Fetch Warga Data safely
          try {
            const [subRes, impactRes] = await Promise.all([
              axios.get(`${API_URL}/waste/pending`).catch(() => ({ data: [] })),
              axios.get(`${API_URL}/users/${user?.phoneNumber || 'none'}/impact`).catch(() => ({ data: { totalPoints: 0, breakdown: {} } }))
            ]);
            
            const mySubmissions = Array.isArray(subRes.data) ? subRes.data.filter(s => s.userId === user?.id) : [];
            setUserSubmissions(mySubmissions);
            
            const breakdown = impactRes.data?.breakdown || {};
            setPersonalStats({
              totalPoints: impactRes.data?.totalPoints || 0,
              totalWaste: Object.values(breakdown).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)
            });
          } catch (innerErr) {
            console.error("Non-admin fetch error:", innerErr);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const generatePDF = () => {
    if (!stocks || stocks.length === 0) {
      toast.error('Data stok kosong, tidak ada yang bisa dicetak.');
      return;
    }

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('id-ID');
    
    doc.setFontSize(20);
    doc.text('WasteBank ID - Laporan Stok Sampah', 14, 22);
    doc.setFontSize(11);
    doc.text(`Tanggal: ${date}`, 14, 30);
    doc.text(`Dicetak oleh: ${user?.name || 'Admin'}`, 14, 35);
    
    const tableColumn = ["Wilayah (RT)", "Plastik (Kg)", "Kertas (Kg)", "Logam (Kg)", "Kaca (Kg)", "Minyak (Lt)", "Total"];
    const tableRows = stocks.map(stock => {
      const total = (stock.totalPlasticKg || 0) + (stock.totalPaperKg || 0) + (stock.totalMetalKg || 0) + (stock.totalGlassKg || 0) + (stock.totalOilKg || 0);
      return [
        stock.rt,
        (stock.totalPlasticKg || 0).toFixed(1),
        (stock.totalPaperKg || 0).toFixed(1),
        (stock.totalMetalKg || 0).toFixed(1),
        (stock.totalGlassKg || 0).toFixed(1),
        (stock.totalOilKg || 0).toFixed(1),
        total.toFixed(1)
      ];
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [46, 204, 113] }
    });

    doc.save(`Laporan_Stok_WasteBank_${date}.pdf`);
    toast.success('Laporan PDF berhasil diunduh!');
  };

  const kpis = isAdmin ? [
    { label: 'Warga Aktif', val: (stats?.totalUsers || 0).toLocaleString(), change: '↑ 12%', color: 'text-waste-green', icon: Users },
    { label: 'Sampah Masuk', val: `${(stats?.totalWeightKg || 0).toLocaleString()} Kg`, change: '↑ 8%', color: 'text-waste-green', icon: Scale },
    { label: 'Poin Rakyat', val: ((stats?.totalPoints || 0) / 1000).toFixed(1) + 'k', change: '↑ 15%', color: 'text-waste-green', icon: TrendingUp },
    { label: 'Kas Operasional', val: `Rp ${(stats?.totalWeightKg * 200 || 0).toLocaleString()}`, change: '↑ 5%', color: 'text-waste-green', icon: Wallet },
  ] : (user?.role === 'PENGEPUL' ? [
    { label: 'Tugas Timbang', val: (userSubmissions || []).length.toString(), change: 'Total Setoran', color: 'text-waste-green', icon: Package },
    { label: 'Status Aktif', val: 'Online', change: 'Pengepul RT', color: 'text-waste-green', icon: CheckCircle },
    { label: 'Poin Anda', val: (user?.totalPoints || 0).toLocaleString(), change: 'Saldo Poin', color: 'text-waste-amber', icon: Wallet },
    { label: 'Wilayah Kerja', val: user?.rt || '-', change: 'Lokasi RT', color: 'text-waste-green', icon: Users },
  ] : [
    { label: 'Poin Anda', val: (personalStats?.totalPoints || 0).toLocaleString(), change: 'Saldo Aktif', color: 'text-waste-green', icon: Wallet },
    { label: 'Tabungan Sampah', val: `${(personalStats?.totalWaste || 0).toFixed(1)} Kg`, change: 'Total Kontribusi', color: 'text-waste-green', icon: Scale },
    { label: 'Status Setoran', val: (userSubmissions || []).filter(s => s?.status === 'PENDING').length.toString(), change: 'Menunggu Verifikasi', color: 'text-waste-amber', icon: Clock },
    { label: 'Dampak Lingkungan', val: ((personalStats?.totalWaste || 0) * 2.5).toFixed(1), change: 'Kg CO2 Diselamatkan', color: 'text-waste-green', icon: TrendingUp },
  ]);

  if (loading) return <div className="skeleton h-screen w-full rounded-3xl"></div>;

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
              <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg ${(kpi.change || '').includes('↑') || isAdmin ? 'bg-waste-green-light text-waste-green' : 'bg-waste-amber-light text-waste-amber'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-[9px] md:text-[10px] font-black text-base-content/30 uppercase tracking-widest mb-1 relative z-10">{kpi.label}</div>
            <div className="text-xl md:text-3xl font-black text-base-content tracking-tighter relative z-10">{kpi.val}</div>
          </div>
        ))}
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-10">
          {/* Statistics Chart */}
          <div className="xl:col-span-3 bg-white p-6 md:p-8 rounded-3xl border border-base-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-black text-base tracking-tight text-base-content">Volume Sampah Terkumpul</h2>
                <p className="text-[11px] text-base-content/40 font-medium">Data akumulasi dari seluruh wilayah (RT)</p>
              </div>
              <div className="bg-waste-green-light px-3 py-1 rounded-lg">
                <TrendingUp size={14} className="text-waste-green" />
              </div>
            </div>
            <div className="h-[250px] w-full">
              <Bar 
                data={{
                  labels: ['Plastik', 'Kertas', 'Logam', 'Kaca', 'Minyak'],
                  datasets: [{
                    label: 'Total Stok (Kg)',
                    data: [
                      stocks.reduce((acc, curr) => acc + (curr.totalPlasticKg || 0), 0),
                      stocks.reduce((acc, curr) => acc + (curr.totalPaperKg || 0), 0),
                      stocks.reduce((acc, curr) => acc + (curr.totalMetalKg || 0), 0),
                      stocks.reduce((acc, curr) => acc + (curr.totalGlassKg || 0), 0),
                      stocks.reduce((acc, curr) => acc + (curr.totalOilKg || 0), 0),
                    ],
                    backgroundColor: ['#2ecc71', '#3498db', '#f1c40f', '#e67e22', '#e74c3c'],
                    borderRadius: 8,
                  }]
                }} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } }
                }} 
              />
            </div>
          </div>

          {/* Main Stock Table */}
          <div className="xl:col-span-2 bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 border-b border-base-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-black text-base tracking-tight text-base-content">Stok per Wilayah (RT)</h2>
                <p className="text-[11px] text-base-content/40 font-medium">Data diperbarui hari ini</p>
              </div>
              <button onClick={generatePDF} className="text-[11px] font-black text-white bg-waste-green px-4 py-2 rounded-xl hover:bg-waste-green-mid transition-colors shadow-lg shadow-waste-green/20 flex items-center gap-2">
                <FileText size={14} /> Cetak Laporan PDF
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
                  {stocks.map((stock) => (
                    <tr key={stock.rt} className="hover:bg-base-100/30 transition-colors">
                      <td className="py-5">
                        <div className="font-black text-sm text-base-content">{stock.rt}</div>
                      </td>
                      <td className="text-center text-xs font-bold text-base-content/60 hidden md:table-cell">{(stock.totalPlasticKg || 0).toFixed(1)} kg</td>
                      <td className="text-center text-xs font-bold text-base-content/60 hidden md:table-cell">{(stock.totalPaperKg || 0).toFixed(1)} kg</td>
                      <td className="text-right">
                        <span className="badge badge-lg bg-waste-green-light text-waste-green border-none font-black text-xs px-4 h-10 shadow-sm">
                          {((stock.totalPlasticKg || 0) + (stock.totalPaperKg || 0) + (stock.totalMetalKg || 0) + (stock.totalGlassKg || 0) + (stock.totalOilKg || 0)).toFixed(1)} kg
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Leaderboard */}
          <div className="bg-white rounded-3xl border border-base-200 shadow-sm p-6 md:p-8">
            <h2 className="font-black text-base tracking-tight mb-6">Leaderboard RT</h2>
            <div className="space-y-6">
              {stocks
                .map(s => ({ ...s, total: (s.totalPlasticKg || 0) + (s.totalPaperKg || 0) + (s.totalMetalKg || 0) + (s.totalGlassKg || 0) + (s.totalOilKg || 0) }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5).map((stock, i) => (
                <div key={stock.rt} className="flex items-center gap-5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-waste-amber-light text-waste-amber' : 'bg-base-100 text-base-content/30'}`}>{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-[11px] font-black text-base-content">{stock.rt}</div>
                    <div className="w-full h-1.5 bg-base-100 rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-waste-green" style={{ width: `${Math.min(100, (stock.total / 100) * 100)}%` }}></div></div>
                  </div>
                  <div className="text-[11px] font-black text-waste-green">{stock.total.toFixed(0)} pts</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          {/* Recent Submissions for Warga */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-base-100 flex justify-between items-center">
               <h2 className="font-black text-base tracking-tight">Riwayat Setoran Anda</h2>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-waste-amber rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black text-base-content/40 uppercase tracking-widest">Real-time update</span>
               </div>
             </div>
             <div className="overflow-x-auto">
               <table className="table table-lg w-full">
                 <thead>
                   <tr className="bg-base-100/30">
                     <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest pl-8">Tanggal</th>
                     <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Jenis</th>
                     <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Poin</th>
                     <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-right pr-8">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {userSubmissions.length > 0 ? userSubmissions.map((sub) => (
                     <tr key={sub.id} className="hover:bg-base-50 transition-colors border-b border-base-100">
                       <td className="pl-8 py-5">
                          <span className="text-xs font-bold text-base-content/60">{new Date(sub.createdAt).toLocaleDateString('id-ID')}</span>
                       </td>
                       <td>
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-xl bg-base-100 flex items-center justify-center">
                                <Package size={14} className="text-waste-green" />
                             </div>
                             <span className="text-sm font-black text-base-content">{sub.predictedType}</span>
                          </div>
                       </td>
                       <td>
                          <span className="text-sm font-black text-waste-green">+{sub.pointsAwarded.toLocaleString()} Pts</span>
                       </td>
                       <td className="text-right pr-8">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            sub.status === 'APPROVED' ? 'bg-green-50 text-green-600' : 
                            sub.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {sub.status === 'VERIFIED' ? 'Proses Admin' : sub.status}
                          </span>
                       </td>
                     </tr>
                   )) : (
                     <tr>
                       <td colSpan="4" className="py-20 text-center">
                          <p className="text-xs font-bold text-base-content/30 uppercase tracking-widest">Belum ada riwayat setoran.</p>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

          {/* Tips / Info for Warga */}
          <div className="space-y-6">
             <div className="bg-waste-green rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-waste-green/20">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                <h3 className="text-xl font-black mb-4 relative z-10">Tukar Poin Sekarang! 🎁</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-6 relative z-10">Poin Anda cukup untuk menukar Sembako atau Token Listrik. Cek katalog hadiah terbaru kami.</p>
                <button 
                  onClick={() => window.location.href = '/rewards'}
                  className="btn btn-sm bg-white text-waste-green border-none rounded-xl font-black text-[10px] px-6 h-10 hover:bg-white/90"
                >
                  Lihat Katalog
                </button>
             </div>

             <div className="bg-white rounded-[40px] p-10 border border-base-200 shadow-sm">
                <h3 className="font-black text-base text-base-content mb-6">Tips Nabung Sampah ♻️</h3>
                <div className="space-y-4">
                   <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">1</div>
                      <p className="text-[11px] text-base-content/60 leading-relaxed">Pilah sampah dari rumah antara organik dan anorganik.</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">2</div>
                      <p className="text-[11px] text-base-content/60 leading-relaxed">Pastikan wadah plastik atau kaleng dalam keadaan bersih.</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs shrink-0">3</div>
                      <p className="text-[11px] text-base-content/60 leading-relaxed">Gunakan fitur #setor di WA untuk jemputan rutin.</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
