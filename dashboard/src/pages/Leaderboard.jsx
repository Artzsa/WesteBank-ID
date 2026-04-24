import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Medal, Target, TrendingUp, Filter, Calendar } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/leaderboard/rt');
        setLeaderboard(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header with Month Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-base-content">Leaderboard RT</h1>
          <p className="text-sm text-base-content/50 font-medium mt-1">Apresiasi untuk wilayah paling peduli lingkungan.</p>
        </div>
        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-base-200 shadow-sm w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-waste-green text-white rounded-xl text-xs font-black shadow-lg shadow-waste-green/20">Bulan Ini</button>
          <button className="flex-1 md:flex-none px-4 py-2 text-base-content/40 hover:text-base-content rounded-xl text-xs font-black">Sepanjang Waktu</button>
        </div>
      </div>

      {/* Top 3 Podium */}
      {!loading && leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10 px-4 md:px-0">
          {/* Rank 2 */}
          <div className="order-2 md:order-1 group">
            <div className="bg-white p-8 rounded-[40px] border border-base-200 shadow-sm relative text-center group-hover:border-waste-green transition-all group-hover:shadow-xl group-hover:shadow-waste-green/5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white border-8 border-base-100 rounded-full flex items-center justify-center shadow-xl">
                <Medal className="text-slate-400" size={32} />
              </div>
              <div className="mt-4">
                <div className="text-lg font-black text-base-content tracking-tight">{leaderboard[1].rt}</div>
                <div className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mt-1">Peringkat 2</div>
                <div className="mt-6 text-3xl font-black text-waste-green tracking-tighter">
                  {leaderboard[1].points.toLocaleString()} <span className="text-xs text-base-content/30 font-bold uppercase">pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 1 - Champion */}
          <div className="order-1 md:order-2 group">
            <div className="bg-waste-green p-10 rounded-[48px] shadow-2xl shadow-waste-green/20 relative text-center scale-110 z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-waste-amber border-8 border-white rounded-[32px] flex items-center justify-center shadow-2xl rotate-12 group-hover:rotate-0 transition-transform">
                <Trophy className="text-white" size={48} />
              </div>
              <div className="mt-8">
                <div className="text-xl font-black text-white tracking-tight">{leaderboard[0].rt}</div>
                <div className="text-[11px] font-black text-white/50 uppercase tracking-widest mt-1">Juara Umum</div>
                <div className="mt-8 text-5xl font-black text-white tracking-tighter">
                  {leaderboard[0].points.toLocaleString()} <span className="text-sm text-white/40 font-bold uppercase">pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 md:order-3 group">
            <div className="bg-white p-8 rounded-[40px] border border-base-200 shadow-sm relative text-center group-hover:border-waste-green transition-all group-hover:shadow-xl group-hover:shadow-waste-green/5">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white border-8 border-base-100 rounded-full flex items-center justify-center shadow-xl">
                <Medal className="text-orange-600/60" size={32} />
              </div>
              <div className="mt-4">
                <div className="text-lg font-black text-base-content tracking-tight">{leaderboard[2].rt}</div>
                <div className="text-[10px] font-black text-base-content/30 uppercase tracking-widest mt-1">Peringkat 3</div>
                <div className="mt-6 text-3xl font-black text-waste-green tracking-tighter">
                  {leaderboard[2].points.toLocaleString()} <span className="text-xs text-base-content/30 font-bold uppercase">pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Ranks List */}
      <div className="bg-white rounded-[40px] border border-base-200 shadow-sm overflow-hidden mt-20">
        <div className="p-8 border-b border-base-100 flex justify-between items-center">
          <h2 className="font-black text-base tracking-tight">Daftar Peringkat RT</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-base-content/40">
              <Calendar size={14} /> Update: 23 April 2026
            </div>
          </div>
        </div>
        <div className="px-8 pb-8">
          <table className="table table-lg">
            <thead>
              <tr>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Peringkat</th>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Wilayah (RT)</th>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Warga Aktif</th>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-right">Total Poin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan="4" className="skeleton h-16 w-full my-4"></td></tr>)
              ) : (
                leaderboard.map((item, index) => (
                  <tr key={item.rt} className="hover:bg-base-100/30 transition-colors border-none group">
                    <td className="py-5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm ${
                        index === 0 ? 'bg-waste-amber-light text-waste-amber' : 
                        index === 1 ? 'bg-slate-100 text-slate-500' :
                        index === 2 ? 'bg-orange-50 text-orange-600/70' : 'bg-base-100 text-base-content/30'
                      }`}>
                        #{index + 1}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="font-black text-base text-base-content tracking-tight">{item.rt}</div>
                        <div className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Kelurahan Cicendo</div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-xs font-bold text-base-content/60">
                        <Target size={14} className="text-waste-green" /> 120 Warga
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-lg font-black text-waste-green tracking-tighter">{item.points.toLocaleString()}</div>
                          <div className="text-[9px] font-black text-base-content/20 uppercase tracking-widest">Poin Terkumpul</div>
                        </div>
                        <div className="p-2 bg-waste-green-light rounded-xl group-hover:rotate-12 transition-transform">
                          <TrendingUp size={16} className="text-waste-green" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
