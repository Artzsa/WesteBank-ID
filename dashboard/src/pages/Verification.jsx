import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CheckCircle, XCircle, Clock, Weight, Maximize2, Check, Filter, Phone, MapPin, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const WASTE_TYPES = [
  { value: 'PLASTIK', label: 'Plastik' },
  { value: 'KERTAS', label: 'Kertas' },
  { value: 'LOGAM', label: 'Logam / Kaleng' },
  { value: 'KACA', label: 'Kaca / Botol' },
  { value: 'MINYAK', label: 'Minyak Jelantah' },
  { value: 'LAINNYA', label: 'Lainnya' }
];

const Verification = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [submissions, setSubmissions] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
    fetchPrices();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/waste/pending');
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/prices');
      const priceMap = {};
      res.data.forEach(p => {
        priceMap[p.type] = p.price;
      });
      setPrices(priceMap);
    } catch (err) {
      console.error('Error fetching prices:', err);
    }
  };

  const OPERATIONAL_CUT = 0.2; // Potongan 20% untuk operasional

  const filteredSubmissions = submissions.filter(sub => {
    if (isAdmin) return sub.status === 'VERIFIED';
    return sub.status === 'PENDING';
  });

  const handleVerify = async (id, status, weight, type, isSorted) => {
    // Validasi input untuk Pengepul
    if (status === 'VERIFIED' && (!weight || weight <= 0)) {
      return toast.warning('Harap masukkan berat sampah yang valid');
    }

    try {
      // Hitung poin bruto (hanya untuk kalkulasi di frontend atau kirim ke backend saat approval)
      const basePrice = prices[type] || 1000;
      const SORTED_BONUS = 1.2; // Tambahan 20%
      const multiplier = isSorted ? SORTED_BONUS : 1;
      const grossPoints = weight * basePrice * multiplier;
      const netPoints = Math.round(grossPoints * (1 - OPERATIONAL_CUT));

      await axios.patch(`http://localhost:5000/api/waste/${id}/verify`, {
        status,
        pointsAwarded: netPoints,
        weightKg: parseFloat(weight),
        actualType: type,
        isSorted: isSorted,
        verifiedById: user.id
      });
      
      toast.success(
        status === 'VERIFIED' 
          ? 'Data timbangan berhasil dikirim ke Admin' 
          : 'Poin berhasil dicairkan ke warga'
      );
      fetchSubmissions();
    } catch (err) {
      toast.error('Gagal memproses setoran');
    }
  };

  const [inputData, setInputData] = useState({});

  const handleInputChange = (id, field, value) => {
    setInputData(prev => ({
      ...prev,
      [id]: {
        ...prev[id] || { weight: '', type: 'PLASTIK', isSorted: false },
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-base-content">
            {isAdmin ? 'Verifikasi & Pencairan' : 'Input Timbangan Lapangan'}
          </h1>
          <p className="text-[11px] md:text-xs text-base-content/50 font-medium mt-1">
            {isAdmin 
              ? 'Tinjau hasil input Pengepul sebelum mencairkan poin.' 
              : 'Timbang sampah dan input data untuk divalidasi Admin.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-3xl w-full"></div>)}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white p-12 md:p-20 text-center rounded-3xl border border-dashed border-base-300">
          <div className="w-20 h-20 bg-waste-green-light rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="text-waste-green" size={32} />
          </div>
          <h2 className="text-lg font-bold text-base-content">Antrean Kosong!</h2>
          <p className="text-sm text-base-content/40 mt-1 max-w-xs mx-auto">
            {isAdmin ? 'Belum ada timbangan masuk dari Pengepul.' : 'Semua sampah warga sudah berhasil ditimbang.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredSubmissions.map((sub) => {
            const currentData = inputData[sub.id] || { 
              weight: sub.estimatedWeightKg || '', 
              type: sub.actualType || sub.predictedType || 'PLASTIK',
              isSorted: sub.isSorted || false
            };

            const grossPoints = currentData.weight 
              ? Math.round(currentData.weight * (prices[currentData.type] || 1000) * (currentData.isSorted ? 1.2 : 1))
              : 0;
            
            const netPoints = Math.round(grossPoints * (1 - OPERATIONAL_CUT));

            return (
              <div key={sub.id} className="bg-white rounded-3xl border border-base-300 shadow-sm overflow-hidden group hover:border-waste-green transition-all hover:shadow-xl hover:shadow-waste-green/5">
                <div className="relative aspect-[4/3] bg-base-200 overflow-hidden">
                  <img 
                    src={sub.imageUrl} 
                    alt="Waste" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <span className="badge badge-sm bg-black/60 text-white border-none font-black text-[9px] px-2 py-2 backdrop-blur-md">
                      🤖 AI: {sub.predictedType}
                    </span>
                    {currentData.isSorted && (
                      <span className="badge badge-sm bg-waste-amber text-white border-none font-black text-[9px] px-2 py-2 shadow-lg animate-pulse">
                        ✨ BONUS TERPILAH +20%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-black text-base-content tracking-tight">{sub.user.name}</div>
                      <div className="text-[10px] text-base-content/40 font-bold flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {sub.user.rt}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-waste-green">+{netPoints.toLocaleString()}</div>
                      <div className="text-[8px] font-bold text-base-content/30 uppercase tracking-widest">Poin Bersih</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-base-content/30 tracking-widest mb-1.5 block px-1">Berat Aktual (Kg)</label>
                      <div className="relative">
                        <input 
                          type="number" step="0.1"
                          disabled={isAdmin}
                          className="w-full px-4 py-3 bg-base-100 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-waste-green/20 transition-all disabled:opacity-60"
                          value={currentData.weight}
                          onChange={(e) => handleInputChange(sub.id, 'weight', e.target.value)}
                        />
                        <Weight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/20" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-base-content/30 tracking-widest mb-1.5 block px-1">Kategori Sampah</label>
                      <select 
                        disabled={isAdmin}
                        className="select select-sm w-full bg-base-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-waste-green/20 h-12 disabled:opacity-60"
                        value={currentData.type}
                        onChange={(e) => handleInputChange(sub.id, 'type', e.target.value)}
                      >
                        {WASTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-base-50 rounded-2xl border border-base-100">
                      <input 
                        type="checkbox" 
                        disabled={isAdmin}
                        className="checkbox checkbox-sm checkbox-success rounded-lg"
                        checked={currentData.isSorted}
                        onChange={(e) => handleInputChange(sub.id, 'isSorted', e.target.checked)}
                      />
                      <span className="text-[10px] font-black text-base-content/60 uppercase tracking-tight">Kondisi Terpilah (+20%)</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!isAdmin ? (
                      <button 
                        onClick={() => handleVerify(sub.id, 'VERIFIED', currentData.weight, currentData.type, currentData.isSorted)}
                        className="flex-1 btn btn-sm bg-waste-amber text-white border-none hover:bg-waste-amber-mid rounded-xl font-bold text-[11px] h-10 shadow-lg shadow-waste-amber/10"
                      >
                        Kirim ke Admin
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleVerify(sub.id, 'APPROVED', currentData.weight, currentData.type, currentData.isSorted)}
                        className="flex-1 btn btn-sm bg-waste-green text-white border-none hover:bg-waste-green-mid rounded-xl font-bold text-[11px] h-10 shadow-lg shadow-waste-green/10"
                      >
                        Setujui & Cairkan
                      </button>
                    )}
                    <button 
                      onClick={() => handleVerify(sub.id, 'REJECTED', 0, 0, sub.predictedType, false)}
                      className="btn btn-sm btn-outline border-base-200 text-waste-coral hover:bg-waste-coral-light hover:border-waste-coral rounded-xl font-bold text-[11px] h-10"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Verification;
