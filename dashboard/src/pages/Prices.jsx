import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { toast } from 'react-toastify';
import { Tag, Save, RotateCcw, AlertTriangle, TrendingUp, TrendingDown, Megaphone } from 'lucide-react';

const Prices = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(null); // Track which item is broadcasting
  const [customMessage, setCustomMessage] = useState('');
  const [isCustomBroadcasting, setIsCustomBroadcasting] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const handleCustomBroadcast = async () => {
    if (!customMessage.trim()) return toast.error('Ketik pesan dulu boy!');
    setIsCustomBroadcasting(true);
    try {
      const usersRes = await axios.get(`${API_URL}/users`);
      const warga = usersRes.data.filter(u => u.role === 'WARGA');

      let successCount = 0;
      for (let i = 0; i < warga.length; i++) {
        const w = warga[i];
        try {
          const res = await axios.post('http://127.0.0.1:5001/send-message', {
            phoneNumber: w.phoneNumber,
            message: customMessage
          });
          if (res.data.success) successCount++;
        } catch (err) {
          console.error(`Gagal kirim ke ${w.name}:`, err.message);
        }

        // Delay aman 10-20 detik
        if (i < warga.length - 1) {
          await delay(Math.floor(Math.random() * 10000) + 10000);
        }
      }

      if (successCount > 0) {
        toast.success(`Berhasil kirim pengumuman ke ${successCount} warga!`);
        setCustomMessage('');
      } else {
        toast.error('Gagal kirim. Pastikan Bot WA sudah nyala.');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsCustomBroadcasting(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await axios.get(`${API_URL}/prices`);
      setPrices(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data harga');
    } finally {
      setLoading(false);
    }
  };

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleBroadcastPrice = async (type, price, isUp) => {
    setIsBroadcasting(type);
    try {
      const usersRes = await axios.get(`${API_URL}/users`);
      const warga = usersRes.data.filter(u => u.role === 'WARGA');

      const message = isUp 
        ? `🚀 *PEMBERITAHUAN HARGA NAIK!* 📈\n\nHarga *${type}* naik jadi *Rp ${price.toLocaleString()}/Kg* minggu ini!\n\nJangan lewatkan kesempatan emas, ayo segera setor ke Bank Sampah dan kumpulkan poin maksimal! ♻️💰`
        : `⚠️ *PEMBERITAHUAN HARGA TURUN* 📉\n\nHarga *${type}* saat ini turun menjadi *Rp ${price.toLocaleString()}/Kg*.\n\nSaran kami: Simpan dulu sampah Anda di rumah, setor nanti saat harga kembali stabil untuk margin poin optimal! 🌿🏠`;

      let successCount = 0;
      for (let i = 0; i < warga.length; i++) {
        const w = warga[i];
        try {
          const res = await axios.post('http://127.0.0.1:5001/send-message', {
            phoneNumber: w.phoneNumber,
            message: message
          });
          if (res.data.success) successCount++;
        } catch (err) {
          console.error(`Gagal kirim ke ${w.name}:`, err.message);
        }

        // Delay aman 10-20 detik
        if (i < warga.length - 1) {
          await delay(Math.floor(Math.random() * 10000) + 10000);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Notif ${type} terkirim ke ${successCount} warga!`);
      } else {
        toast.error('Gagal mengirim. Cek koneksi Bot.');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server');
    } finally {
      setIsBroadcasting(null);
    }
  };

  const handlePriceChange = (type, newPrice) => {
    setPrices(prev => prev.map(p => 
      p.type === type ? { ...p, price: parseInt(newPrice) || 0 } : p
    ));
  };

  const savePrice = async (type, price) => {
    setIsSaving(true);
    try {
      await axios.patch(`${API_URL}/prices/${type}`, { price });
      toast.success(`Harga ${type} berhasil diperbarui`);
      fetchPrices();
    } catch (err) {
      toast.error('Gagal memperbarui harga');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-3xl"></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-base-content">Pengaturan Harga Pasar</h1>
          <p className="text-xs text-base-content/50 font-medium mt-1">Ubah harga rongsokan per KG untuk menyesuaikan poin warga.</p>
        </div>
        <div className="p-3 bg-waste-amber-light text-waste-amber rounded-2xl flex items-center gap-2">
           <AlertTriangle size={16} />
           <span className="text-[10px] font-black uppercase">Admin Only</span>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-base-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-waste-green-light text-waste-green rounded-xl">
             <Megaphone size={18} />
          </div>
          <h2 className="font-black text-base-content">Push Notifikasi (Broadcast WA)</h2>
        </div>
        <div className="space-y-4">
          <textarea 
            className="textarea textarea-bordered w-full rounded-2xl bg-base-100 border-none min-h-[100px] font-medium text-sm focus:ring-2 focus:ring-waste-green/20"
            placeholder="Ketik pengumuman untuk seluruh warga di sini... (Contoh: Besok libur setor ya!)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          ></textarea>
          <button 
            onClick={handleCustomBroadcast}
            disabled={isCustomBroadcasting}
            className="btn bg-waste-green hover:bg-waste-green-mid text-white border-none rounded-2xl w-full gap-2 shadow-lg shadow-waste-green/10"
          >
            {isCustomBroadcasting ? <span className="loading loading-spinner loading-sm"></span> : <Megaphone size={18} />}
            Kirim ke Seluruh Warga
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prices.map((item) => (
          <div key={item.id} className="bg-white p-8 rounded-[32px] border border-base-200 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-base-100 rounded-2xl text-base-content/40 group-hover:bg-waste-green-light group-hover:text-waste-green transition-colors">
                  <Tag size={20} />
                </div>
                <div>
                  <h3 className="font-black text-base-content tracking-tight">{item.type}</h3>
                  <span className="text-[10px] font-bold text-base-content/30 uppercase tracking-widest">Harga per KG</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-base-content/40 mb-1">Terakhir Update</div>
                <div className="text-[10px] font-black text-base-content/60">{new Date(item.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-base-content/30">Rp</span>
                <input 
                  type="number" 
                  className="w-full pl-12 pr-4 py-4 bg-base-100 rounded-2xl border-none focus:ring-2 focus:ring-waste-green/20 text-xl font-black text-base-content"
                  value={item.price}
                  onChange={(e) => handlePriceChange(item.type, e.target.value)}
                />
              </div>
              <button 
                onClick={() => savePrice(item.type, item.price)}
                disabled={isSaving}
                className="btn btn-square bg-waste-green text-white border-none rounded-2xl hover:bg-waste-green-mid shadow-lg shadow-waste-green/20"
              >
                <Save size={20} />
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-base-100 flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-base-content/40 uppercase tracking-tight">
                 <div className="flex items-center gap-1 text-waste-green">
                    <TrendingUp size={12} /> Tren Dinamis
                 </div>
                 <span>ID: {item.id.substring(0, 8)}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                   onClick={() => handleBroadcastPrice(item.type, item.price, true)}
                   disabled={isBroadcasting === item.type}
                   className="flex items-center justify-center gap-2 py-2.5 bg-waste-green-light text-waste-green rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-waste-green hover:text-white transition-all disabled:opacity-50"
                 >
                   {isBroadcasting === item.type ? <span className="loading loading-spinner loading-xs"></span> : <Megaphone size={12} />}
                   Kirim Notif Naik
                 </button>
                 <button 
                   onClick={() => handleBroadcastPrice(item.type, item.price, false)}
                   disabled={isBroadcasting === item.type}
                   className="flex items-center justify-center gap-2 py-2.5 bg-waste-coral-light text-waste-coral rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-waste-coral hover:text-white transition-all disabled:opacity-50"
                 >
                   <Megaphone size={12} />
                   Kirim Notif Turun
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-waste-green rounded-[40px] p-10 text-white relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 space-y-4">
           <h2 className="text-2xl font-black">Bagaimana Harga Bekerja?</h2>
           <p className="text-sm text-white/70 leading-relaxed max-w-2xl">
             Harga yang Anda masukkan di sini adalah **Harga Pasar Bruto**. Sistem akan otomatis memotong **20% untuk kas operasional** Bank Sampah sebelum poin diberikan ke tabungan warga.
             <br/><br/>
             Contoh: Jika harga Plastik Rp 2.000, maka warga menerima **1.600 Pts** dan **400 Pts** masuk ke Kas Bank Sampah.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Prices;
