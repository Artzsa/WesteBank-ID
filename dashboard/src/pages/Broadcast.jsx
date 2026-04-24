import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Megaphone, 
  GraduationCap, 
  Coins, 
  Calendar, 
  Gift, 
  XCircle, 
  Edit3, 
  Send,
  Users,
  CheckCircle2,
  Sparkles,
  History,
  Clock,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Broadcast = () => {
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState({ current: 0, total: 0 });
  const [showConfirm, setShowConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'history'

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    try {
      const res = await axios.post(`${API_URL}/ai/generate-tip`, {
        topic: 'Daur ulang sampah rumah tangga kreatif'
      });
      if (res.data.success) {
        handleMessageChange('edukasi', res.data.tip);
        toast.success('Tips Edukasi berhasil digenerate oleh AI!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal panggil AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };
  const [filterRT, setFilterRT] = useState('Semua');
  const [minPoints, setMinPoints] = useState(0);

  // Helper Delay
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // Daftar Template Awal
  const [templates, setTemplates] = useState([
    {
      id: 'edukasi',
      title: 'Edukasi Daur Ulang',
      icon: <GraduationCap size={24} />,
      color: 'bg-emerald-50 text-emerald-600',
      btnColor: 'bg-emerald-600',
      message: 'Halo {{nama}}, tahu tidak kalau mencuci botol plastik sebelum disetor bisa meningkatkan nilai jualnya? Yuk mulai budayakan "Bilas Sebelum Setor"! ♻️✨',
      isEditing: false
    },
    {
      id: 'poin',
      title: 'Update Tabungan',
      icon: <Coins size={24} />,
      color: 'bg-amber-50 text-amber-600',
      btnColor: 'bg-amber-600',
      message: 'Selamat! Tabungan poin {{nama}} baru saja bertambah. Sekarang total poin Anda adalah {{poin}} Pts. Cek saldo sekarang di #cek! 💰📈',
      isEditing: false
    },
    {
      id: 'jadwal',
      title: 'Pengingat Jadwal',
      icon: <Calendar size={24} />,
      color: 'bg-blue-50 text-blue-600',
      btnColor: 'bg-blue-600',
      message: 'PENGUMUMAN: Besok tim angkut sampah akan melewati wilayah {{rt}} jam 08:00 WIB. Jangan lupa siapkan karung Anda di depan rumah ya! 🚛💨',
      isEditing: false
    },
    {
      id: 'reward',
      title: 'Tukar Reward',
      icon: <Gift size={24} />,
      color: 'bg-purple-50 text-purple-600',
      btnColor: 'bg-purple-600',
      message: 'Kabar Gembira {{nama}}! Stok Sembako dan Token Listrik baru saja masuk. Yuk tukarkan poin Anda sebelum kehabisan! 🎁🛍️',
      isEditing: false
    },
    {
      id: 'tolak',
      title: 'Edukasi Penolakan',
      icon: <XCircle size={24} />,
      color: 'bg-rose-50 text-rose-600',
      btnColor: 'bg-rose-600',
      message: 'Mohon maaf {{nama}}, demi kualitas daur ulang, sampah yang basah/kotor belum bisa kami terima. Mari kita jaga kebersihan sampah agar nilai poin tetap optimal! 🌿🏠',
      isEditing: false
    }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, historyRes] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/broadcast/history`)
      ]);
      setUsers(usersRes.data.filter(u => u.role === 'WARGA'));
      setHistory(historyRes.data);
    } catch (err) {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = (id) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, isEditing: !t.isEditing } : t
    ));
  };

  const handleMessageChange = (id, newMessage) => {
    setTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, message: newMessage } : t
    ));
  };

  const getFilteredUsers = () => {
    return users.filter(u => {
      const matchRT = filterRT === 'Semua' || u.rt === filterRT;
      const matchPoints = u.totalPoints >= minPoints;
      return matchRT && matchPoints;
    });
  };

  const filteredUsers = getFilteredUsers();
  const rtList = ['Semua', ...new Set(users.map(u => u.rt))].filter(Boolean);

  const handleBroadcast = async (template) => {
    setIsBroadcasting(true);
    setShowConfirm(null);
    setBroadcastProgress({ current: 0, total: filteredUsers.length });
    
    let successCount = 0;
    try {
      for (let i = 0; i < filteredUsers.length; i++) {
        const u = filteredUsers[i];
        setBroadcastProgress(prev => ({ ...prev, current: i + 1 }));

        let finalMsg = template.message
          .replace(/{{nama}}/g, u.name)
          .replace(/{{poin}}/g, u.totalPoints.toLocaleString())
          .replace(/{{rt}}/g, u.rt || '-');

        try {
          // Note: In production this would call your WA service
          const res = await axios.post(`${API_URL}/bot/send-message`, {
            phoneNumber: u.phoneNumber,
            message: finalMsg
          });
          if (res.data.success) successCount++;
        } catch (err) {
          console.error(`Gagal kirim ke ${u.name}:`, err.message);
          // For demo/dev purposes, let's assume it succeeded if the WA service is not running
          // successCount++; 
        }

        // Jeda aman 10-20 detik (Sangat Aman)
        if (i < filteredUsers.length - 1) {
          const randomSleep = Math.floor(Math.random() * 5000) + 2000; // Faster for testing
          await delay(randomSleep);
        }
      }

      // Log to Backend
      await axios.post(`${API_URL}/broadcast/log`, {
        title: template.title,
        message: template.message,
        targetCount: filteredUsers.length
      });

      toast.success(`Broadcast Selesai! Berhasil terkirim ke ${successCount} warga.`);
      fetchData(); // Refresh history
    } catch (err) {
      toast.error('Terjadi kesalahan saat broadcast');
    } finally {
      setIsBroadcasting(false);
      setBroadcastProgress({ current: 0, total: 0 });
    }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-[40px]"></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[40px] border border-base-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-waste-green-light text-waste-green rounded-xl">
               <Megaphone size={20} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">Pusat Broadcast</h1>
          </div>
          <p className="text-xs text-base-content/50 font-medium">Kirim pesan pintar ke warga dengan sistem antrean aman.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-base-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'templates' ? 'bg-white text-waste-green shadow-sm' : 'text-base-content/40 hover:text-base-content'}`}
            >
              Templates
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'history' ? 'bg-white text-waste-green shadow-sm' : 'text-base-content/40 hover:text-base-content'}`}
            >
              Riwayat
            </button>
          </div>

          {activeTab === 'templates' && (
            <>
              <div className="h-8 w-px bg-base-200 mx-2 hidden md:block"></div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">RT</label>
                <select 
                  className="select select-sm bg-base-100 border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-waste-green/20"
                  value={filterRT}
                  onChange={(e) => setFilterRT(e.target.value)}
                >
                  {rtList.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">Min. Poin</label>
                <input 
                  type="number" 
                  className="input input-sm bg-base-100 border-none rounded-xl font-bold text-xs w-24 focus:ring-2 focus:ring-waste-green/20"
                  value={minPoints}
                  onChange={(e) => setMinPoints(e.target.value)}
                />
              </div>

              <div className="bg-waste-green-light px-4 py-2 rounded-xl flex items-center gap-2">
                <Users size={14} className="text-waste-green" />
                <span className="text-xs font-black text-waste-green">{filteredUsers.length} Target</span>
              </div>
            </>
          )}
        </div>
      </div>

      {activeTab === 'templates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-[32px] border border-base-200 p-6 flex flex-col shadow-sm hover:shadow-xl transition-all group overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-2xl ${t.color}`}>
                  {t.icon}
                </div>
                <div className="flex items-center gap-2">
                  {t.id === 'edukasi' && (
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-waste-amber-light text-waste-amber rounded-xl text-[10px] font-black uppercase hover:bg-waste-amber hover:text-white transition-all disabled:opacity-50"
                    >
                      {isGeneratingAI ? <span className="loading loading-spinner loading-[10px]"></span> : <Sparkles size={12} />}
                      Generate AI
                    </button>
                  )}
                  <button 
                    onClick={() => toggleEdit(t.id)}
                    className="p-2 hover:bg-base-100 rounded-xl text-base-content/30 hover:text-base-content transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="font-black text-lg text-base-content mb-4">{t.title}</h3>

              <div className="flex-1 relative mb-6">
                {t.isEditing ? (
                  <textarea 
                    className="w-full h-32 p-4 bg-base-50 rounded-2xl border-2 border-waste-green/20 focus:border-waste-green outline-none text-sm font-medium leading-relaxed resize-none"
                    value={t.message}
                    onChange={(e) => handleMessageChange(t.id, e.target.value)}
                  />
                ) : (
                  <div className="bg-base-100/50 p-4 rounded-2xl text-sm font-medium text-base-content/70 leading-relaxed italic border border-dashed border-base-200 h-32 overflow-y-auto">
                    "{t.message}"
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {['{{nama}}', '{{poin}}', '{{rt}}'].map(tag => (
                    <span key={tag} className="text-[9px] font-bold bg-base-100 text-base-content/40 px-2 py-0.5 rounded-full border border-base-200">{tag}</span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setShowConfirm(t)}
                disabled={isBroadcasting}
                className={`w-full py-4 rounded-2xl ${t.btnColor} text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50`}
              >
                <Send size={16} />
                Kirim Ke {filteredUsers.length} Warga
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-base-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-base-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-waste-amber-light text-waste-amber rounded-xl">
                 <History size={18} />
               </div>
               <h2 className="font-black text-lg">Riwayat Pesan Terkirim</h2>
             </div>
             <span className="text-xs font-black text-base-content/30 uppercase tracking-widest">{history.length} Entri</span>
          </div>
          
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="border-none text-[10px] font-black uppercase text-base-content/40 tracking-widest">
                    <th className="bg-transparent pl-8">Waktu</th>
                    <th className="bg-transparent">Judul / Template</th>
                    <th className="bg-transparent">Pesan</th>
                    <th className="bg-transparent">Target</th>
                    <th className="bg-transparent pr-8 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => (
                    <tr key={log.id} className="border-base-100 group">
                      <td className="pl-8">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-base-content/30" />
                           <span className="text-xs font-bold text-base-content/60">
                             {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                           </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-black text-base-content">{log.title}</span>
                      </td>
                      <td className="max-w-xs">
                        <p className="text-xs font-medium text-base-content/50 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                          {log.message}
                        </p>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-base-100 rounded-full w-fit">
                          <UserCheck size={12} className="text-waste-green" />
                          <span className="text-[10px] font-black">{log.targetCount} Warga</span>
                        </div>
                      </td>
                      <td className="pr-8 text-right">
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">Success</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center mx-auto text-base-content/20">
                 <History size={40} />
              </div>
              <p className="font-black text-base-content/30 uppercase text-xs tracking-widest">Belum ada riwayat broadcast.</p>
            </div>
          )}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-6">
            <div className="w-20 h-20 bg-waste-amber-light text-waste-amber rounded-3xl flex items-center justify-center mx-auto animate-bounce">
              <Megaphone size={40} />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-base-content">Konfirmasi Broadcast</h2>
              <p className="text-sm text-base-content/60 font-medium leading-relaxed">
                Anda akan mengirim pesan <span className="font-black text-base-content">"{showConfirm.title}"</span> ke <span className="font-black text-waste-green">{filteredUsers.length} warga</span>.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirm(null)} className="flex-1 py-4 rounded-2xl bg-base-100 text-base-content font-black text-sm hover:bg-base-200 transition-all">Batal</button>
              <button onClick={() => handleBroadcast(showConfirm)} className="flex-1 py-4 rounded-2xl bg-waste-green text-white font-black text-sm hover:bg-waste-green-mid transition-all flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />Ya, Kirim!
              </button>
            </div>
          </div>
        </div>
      )}

      {isBroadcasting && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-white/80 backdrop-blur-md">
          <div className="loading loading-spinner loading-lg text-waste-green"></div>
          <p className="mt-4 font-black text-base-content">Sedang mengirim: {broadcastProgress.current} dari {broadcastProgress.total}</p>
          <div className="w-64 h-2 bg-base-200 rounded-full mt-4 overflow-hidden">
            <div 
              className="h-full bg-waste-green transition-all duration-500" 
              style={{ width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-base-content/50 mt-4 italic">Sistem memberikan jeda acak untuk keamanan nomor Anda.</p>
        </div>
      )}
    </div>
  );
};

export default Broadcast;
