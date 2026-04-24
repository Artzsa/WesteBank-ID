import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { toast } from 'react-toastify';
import { 
  TrendingUp, 
  Scale, 
  Package, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalPoints: 0, 
    totalWeightKg: 0, 
    totalWithdrawals: 0, 
    dailyVolume: [],
    monthlyVolume: [] 
  });
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, stocksRes] = await Promise.all([
          axios.get(`${API_URL}/collector/stats`),
          axios.get(`${API_URL}/collector/stocks`)
        ]);
        setStats(statsRes.data);
        setStocks(stocksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalPlastic = stocks.reduce((acc, curr) => acc + curr.totalPlasticKg, 0);
  const totalPaper = stocks.reduce((acc, curr) => acc + curr.totalPaperKg, 0);
  const totalMetal = stocks.reduce((acc, curr) => acc + curr.totalMetalKg, 0);
  const totalGlass = stocks.reduce((acc, curr) => acc + curr.totalGlassKg, 0);
  const totalOil = stocks.reduce((acc, curr) => acc + curr.totalOilKg, 0);
  const totalAll = totalPlastic + totalPaper + totalMetal + totalGlass + totalOil || 1;

  const kpis = [
    { 
      label: 'Total Sampah', 
      val: `${stats.totalWeightKg.toLocaleString()} Kg`, 
      change: '+8.2%', up: true, icon: Scale 
    },
    { label: 'Poin Rakyat', val: (stats.totalPoints / 1000).toFixed(1) + 'k', change: '+12.5%', up: true, icon: Package },
    { label: 'Warga Aktif', val: stats.totalUsers.toString(), change: '+4.3%', up: true, icon: Users },
    { label: 'Efisiensi', val: '94%', change: '-1.2%', up: false, icon: BarChart2 },
  ];

  // Chart Data: Monthly Trend
  const monthlyChartData = {
    labels: stats.monthlyVolume?.map(m => m.month) || [],
    datasets: [
      {
        label: 'Volume Sampah (Kg)',
        data: stats.monthlyVolume?.map(m => m.volume) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: '#22c55e',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: '#22c55e',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        displayColors: false,
        borderRadius: 12
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false },
        ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 10, weight: 'bold' }, color: '#94a3b8' }
      }
    }
  };

  // Chart Data: Composition
  const compositionData = {
    labels: ['Plastik', 'Kertas', 'Logam', 'Kaca', 'Minyak'],
    datasets: [
      {
        data: [totalPlastic, totalPaper, totalMetal, totalGlass, totalOil],
        backgroundColor: [
          '#22c55e', // Green
          '#f59e0b', // Amber
          '#14b8a6', // Teal
          '#f43f5e', // Coral (Rose)
          '#d97706', // Dark Amber
        ],
        borderWidth: 0,
        hoverOffset: 20
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (item) => {
            const val = item.raw;
            const percentage = ((val / totalAll) * 100).toFixed(1);
            return ` ${item.label}: ${val.toFixed(1)} Kg (${percentage}%)`;
          }
        }
      }
    }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-[40px]"></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 pb-20">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-base-content">Analitik & Performa</h1>
        <p className="text-xs text-base-content/50 font-medium mt-1">Laporan komprehensif data pengelolaan sampah kelurahan.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((item) => (
          <div key={item.label} className="bg-white p-8 rounded-[40px] border border-base-200 shadow-sm relative group overflow-hidden">
            <div className={`p-3 rounded-2xl inline-block mb-6 ${item.up ? 'bg-waste-green-light text-waste-green' : 'bg-waste-coral-light text-waste-coral'}`}>
              <item.icon size={20} />
            </div>
            <div className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mb-1">{item.label}</div>
            <div className="text-3xl font-black text-base-content tracking-tighter mb-2">{item.val}</div>
            <div className={`flex items-center gap-1 text-xs font-black ${item.up ? 'text-waste-green' : 'text-waste-coral'}`}>
              {item.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {item.change}
              <span className="text-base-content/20 ml-1 font-bold italic">vs bln lalu</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Trend Volume */}
        <div className="bg-white p-10 rounded-[48px] border border-base-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black tracking-tight">Tren Setoran Bulanan</h3>
              <p className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mt-1">6 Bulan Terakhir (Kg)</p>
            </div>
            <TrendingUp size={24} className="text-waste-green opacity-20" />
          </div>
          <div className="flex-1 min-h-[300px]">
             <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Composition */}
        <div className="bg-white p-10 rounded-[48px] border border-base-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black tracking-tight">Komposisi Sampah</h3>
              <p className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mt-1">Distribusi per Kategori</p>
            </div>
            <PieChartIcon size={24} className="text-waste-teal opacity-20" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-64 relative">
              <Doughnut data={compositionData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-base-content">{totalAll.toFixed(0)}</span>
                <span className="text-[10px] font-black text-base-content/30 uppercase tracking-widest">Total Kg</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Plastik', color: 'bg-waste-green', val: totalPlastic },
                { label: 'Kertas', color: 'bg-waste-amber', val: totalPaper },
                { label: 'Logam', color: 'bg-waste-teal', val: totalMetal },
                { label: 'Kaca', color: 'bg-waste-coral', val: totalGlass },
                { label: 'Minyak', color: 'bg-waste-amber-mid', val: totalOil },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm group-hover:scale-125 transition-all`}></div>
                    <span className="text-xs font-black text-base-content/60 group-hover:text-base-content transition-colors">{item.label}</span>
                  </div>
                  <div className="text-xs font-bold text-base-content/40">
                    {item.val.toFixed(1)} Kg
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
