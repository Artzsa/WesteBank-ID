import { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, History, Download, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Finances = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/waste/stats/finance');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Header
    doc.setFontSize(22);
    doc.text('Laporan Keuangan Bank Sampah ID', 14, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${date}`, 14, 28);
    
    // KPI Table
    doc.autoTable({
      startY: 35,
      head: [['Kategori', 'Nilai']],
      body: [
        ['Kas Operasional', `Rp ${stats.totalOperationalCut.toLocaleString()}`],
        ['Tabungan Warga (Pts)', `${stats.totalNetPoints.toLocaleString()}`],
        ['Total Nilai Sampah', `Rp ${stats.totalGrossValue.toLocaleString()}`],
      ],
    });
    
    // Transaction Table
    doc.text('Riwayat Transaksi Terakhir', 14, doc.autoTable.previous.finalY + 15);
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Tanggal', 'Warga', 'Jenis', 'Pot. Op', 'Poin Bersih']],
      body: stats.recentTransactions.map(tr => [
        new Date(tr.createdAt).toLocaleDateString(),
        tr.user.name,
        tr.predictedType,
        `Rp ${tr.operationalCut.toLocaleString()}`,
        `${tr.pointsAwarded.toLocaleString()} Pts`
      ]),
    });
    
    doc.save(`Laporan_Keuangan_WasteBank_${date}.pdf`);
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-3xl"></div>;

  const kpiCards = [
    {
      label: 'Kas Operasional',
      value: `Rp ${stats.totalOperationalCut.toLocaleString()}`,
      subValue: 'Dana Pengelola',
      icon: Wallet,
      color: 'bg-waste-green',
      iconColor: 'text-waste-green',
      trend: '+12%',
      trendUp: true
    },
    {
      label: 'Tabungan Warga',
      value: `${stats.totalNetPoints.toLocaleString()} Pts`,
      subValue: 'Kewajiban Bank',
      icon: DollarSign,
      color: 'bg-waste-amber',
      iconColor: 'text-waste-amber',
      trend: '+5%',
      trendUp: true
    },
    {
      label: 'Total Nilai Sampah',
      value: `Rp ${stats.totalGrossValue.toLocaleString()}`,
      subValue: 'Volume x Harga Pasar',
      icon: TrendingUp,
      color: 'bg-waste-green-mid',
      iconColor: 'text-waste-green-mid',
      trend: '+18%',
      trendUp: true
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-base-content">Transparansi Keuangan</h1>
          <p className="text-xs text-base-content/50 font-medium mt-1">Laporan arus kas, potongan operasional, dan kewajiban poin warga.</p>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="btn btn-sm bg-white border-base-200 text-base-content hover:bg-base-100 rounded-xl px-4 font-bold h-10 shadow-sm"
        >
          <Download size={16} className="mr-2" /> Unduh Laporan (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-base-200 shadow-sm hover:shadow-xl hover:shadow-base-200/50 transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-32 h-32 ${card.color} opacity-[0.03] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${card.color} bg-opacity-10 ${card.iconColor}`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${card.trendUp ? 'bg-waste-green-light text-waste-green' : 'bg-waste-coral-light text-waste-coral'}`}>
                {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {card.trend}
              </div>
            </div>
            <div className="relative z-10">
              <div className="text-2xl font-black text-base-content mb-1 tracking-tight">{card.value}</div>
              <div className="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">{card.label}</div>
              <div className="mt-4 pt-4 border-t border-base-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-base-content/40">{card.subValue}</span>
                 <span className="text-[10px] font-black text-base-content/20 italic">REAL-TIME</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-base-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-base-100 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-base-100 rounded-xl text-base-content/40">
                 <History size={18} />
               </div>
               <h2 className="font-black text-base-content tracking-tight">Riwayat Transaksi Terakhir</h2>
             </div>
             <button className="text-xs font-bold text-waste-green hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-lg">
              <thead>
                <tr className="bg-base-50/50">
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest px-8">Warga</th>
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Jenis</th>
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-right">Pot. Op (20%)</th>
                  <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-right px-8">Poin Bersih</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions.map((tr) => (
                  <tr key={tr.id} className="hover:bg-base-100/30 transition-colors">
                    <td className="px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-base-100 flex items-center justify-center font-black text-[10px] text-base-content/40 uppercase">
                          {tr.user.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-black text-base-content">{tr.user.name}</div>
                          <div className="text-[9px] text-base-content/40 font-bold uppercase tracking-tight">{new Date(tr.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sm bg-base-100 text-base-content/60 border-none font-bold text-[9px] uppercase">{tr.predictedType}</span>
                    </td>
                    <td className="text-right text-waste-coral font-bold text-xs">-Rp {tr.operationalCut.toLocaleString()}</td>
                    <td className="text-right px-8 font-black text-waste-green text-xs">+{tr.pointsAwarded.toLocaleString()} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-waste-green rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div>
             <PieChartIcon className="text-white/20 mb-4" size={48} />
             <h3 className="text-xl font-black mb-2">Analisis Kas</h3>
             <p className="text-sm text-white/60 font-medium">Dana Operasional Anda saat ini cukup untuk mendukung kegiatan jemput sampah selama **12 hari** ke depan.</p>
           </div>
           
           <div className="space-y-4 relative z-10">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                 <div className="flex justify-between text-[10px] font-bold text-white/50 mb-2 uppercase">Rasio Profitabilitas</div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-[20%]"></div>
                 </div>
                 <div className="mt-2 text-[10px] font-black">20% dari total nilai sampah</div>
              </div>
              <button className="w-full py-4 bg-white text-waste-green rounded-3xl font-black text-sm shadow-xl shadow-black/10 hover:scale-[1.02] transition-transform active:scale-[0.98]">
                 Alokasikan Dana Kas
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Finances;
