import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { Calendar as CalendarIcon, Clock, MapPin, Truck, CheckCircle2, ChevronRight, AlertCircle, X, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Pickups = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({ rt: '', volume: '' });

  useEffect(() => {
    fetchPickups();
  }, []);

  const fetchPickups = async () => {
    try {
      const res = await axios.get('${API_URL}/pickups');
      setSchedules(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePickup = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        date: format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id }),
        time: '-'
      };
      const res = await axios.post('${API_URL}/pickups', payload);

      // Kirim notifikasi WA ke semua warga di RT tersebut
      try {
        const usersRes = await axios.get('${API_URL}/users');
        const wargaRT = usersRes.data.filter(u => u.role === 'WARGA' && u.rt === formData.rt);
        const pickupMsg = `🚛 *PEMBERITAHUAN PENGAMBILAN SAMPAH* 🚛\n\nHalo Warga *${formData.rt}*!\n\nPetugas pengepul akan datang mengambil sampah pada:\n📅 *${payload.date}*\n\nMohon siapkan sampah Anda di depan rumah ya!\n\nTerima kasih. ♻️🌿`;
        for (const w of wargaRT) {
          axios.post('http://127.0.0.1:5001/send-message', {
            phoneNumber: w.phoneNumber,
            message: pickupMsg
          }).catch(err => console.error('Notif pickup error:', err.message));
        }
      } catch (notifErr) {
        console.error('Failed to send pickup notifications:', notifErr.message);
      }

      toast.success('Jadwal berhasil dibuat & warga sudah diberitahu!');
      setIsModalOpen(false);
      setFormData({ rt: '', volume: '' });
      setSelectedDate(new Date());
      fetchPickups();
    } catch (err) {
      toast.error('Gagal membuat jadwal');
    }
  };

  const handleDeletePickup = async (id) => {
    if (window.confirm('Hapus jadwal ini?')) {
      try {
        await axios.delete(`${API_URL}/pickups/${id}`);
        toast.success('Jadwal dihapus');
        fetchPickups();
      } catch (err) {
        toast.error('Gagal menghapus');
      }
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.patch(`${API_URL}/pickups/${id}`, { status });
      toast.success(`Jadwal diupdate ke ${status}`);
      fetchPickups();
    } catch (err) {
      toast.error('Gagal update status');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-base-content">Penjadwalan Pickup</h1>
          <p className="text-xs text-base-content/50 font-medium mt-1">Atur jadwal pengangkutan sampah dari tiap-tiap RT.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-sm bg-waste-green text-white border-none px-6 rounded-xl font-bold h-10 shadow-lg shadow-waste-green/20"
        >
          + Buat Jadwal Baru
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-32 w-full rounded-[32px]"></div>)
          ) : schedules.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-[32px] border border-dashed border-base-300">
              <p className="text-sm text-base-content/40 font-bold">Belum ada jadwal pengangkutan.</p>
            </div>
          ) : (
            schedules.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-[32px] border border-base-200 shadow-sm hover:shadow-xl hover:shadow-waste-green/5 transition-all group">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${item.status === 'COMPLETED' ? 'bg-waste-green-light text-waste-green' : 'bg-waste-amber-light text-waste-amber'}`}>
                      <Truck size={28} />
                    </div>
                    <div>
                      <div className="text-lg font-black text-base-content tracking-tight">{item.rt}</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-base-content/40 uppercase tracking-widest mt-1">
                        <span className={`badge badge-xs ${item.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}></span> {item.status}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-8 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black text-base-content tracking-tight">
                        <CalendarIcon size={16} className="text-waste-green" /> {item.date}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-base-content/30 mt-1">
                        <Clock size={12} /> {item.time} WIB
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.status !== 'COMPLETED' && (
                        <button 
                          onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                          className="btn btn-ghost btn-sm text-waste-green p-0"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePickup(item.id)}
                        className="btn btn-ghost btn-sm text-waste-coral p-0"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-waste-green p-8 rounded-[40px] text-white shadow-2xl shadow-waste-green/20 relative overflow-hidden">
            <h3 className="text-lg font-black tracking-tight mb-2">Info Penjadwalan</h3>
            <p className="text-xs text-white/70 leading-relaxed font-medium">Pilihlah waktu penjemputan saat volume sampah di RT sudah mencapai ambang batas.</p>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-base-100 flex justify-between items-center bg-waste-green text-white">
              <h2 className="text-xl font-black tracking-tight">Buat Jadwal Pickup</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleCreatePickup} className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest mb-2 block px-1">Wilayah (RT)</label>
                <input 
                  type="text" required placeholder="Contoh: RT 07/RW 04"
                  className="w-full px-5 py-3 bg-base-100 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-waste-green/20 transition-all"
                  value={formData.rt}
                  onChange={(e) => setFormData({...formData, rt: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest mb-2 block px-1">Waktu Penjemputan</label>
                <div className="relative">
                  <DatePicker
                    selected={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    dateFormat="dd MMMM yyyy"
                    locale={id}
                    className="w-full px-5 py-3 bg-base-100 rounded-2xl border-none text-sm font-bold focus:ring-2 focus:ring-waste-green/20 transition-all"
                    placeholderText="Pilih tanggal"
                    calendarClassName="waste-calendar"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <CalendarIcon size={16} className="text-base-content/30" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-waste-green text-white rounded-2xl font-black shadow-lg shadow-waste-green/20 mt-4 hover:bg-waste-green-mid transition-all active:scale-[0.98]">
                Simpan Jadwal Baru
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pickups;
