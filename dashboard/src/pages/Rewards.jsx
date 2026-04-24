import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';
import { toast } from 'react-toastify';
import { 
  Gift, 
  Plus, 
  Trash2, 
  Edit3, 
  Package, 
  Coins, 
  ShoppingCart, 
  Search,
  Zap,
  ShoppingBag,
  History,
  CheckCircle2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const Rewards = () => {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' or 'redemptions'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    pointsRequired: '',
    stock: '',
    category: 'SEMBAKO',
    imageUrl: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsRes, redemptionsRes] = await Promise.all([
        axios.get('${API_URL}/rewards'),
        axios.get('${API_URL}/rewards/redemptions')
      ]);
      setRewards(rewardsRes.data);
      setRedemptions(redemptionsRes.data);
    } catch (err) {
      toast.error('Gagal mengambil data reward');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reward = null) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name,
        pointsRequired: reward.pointsRequired,
        stock: reward.stock,
        category: reward.category,
        imageUrl: reward.imageUrl || ''
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: '',
        pointsRequired: '',
        stock: '',
        category: 'SEMBAKO',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await axios.patch(`${API_URL}/rewards/${editingReward.id}`, formData);
        toast.success('Reward berhasil diperbarui!');
      } else {
        await axios.post('${API_URL}/rewards', formData);
        toast.success('Reward baru ditambahkan!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus reward ini?')) {
      try {
        await axios.delete(`${API_URL}/rewards/${id}`);
        toast.success('Reward dihapus');
        fetchData();
      } catch (err) {
        toast.error('Gagal menghapus reward');
      }
    }
  };

  if (loading) return <div className="skeleton h-96 w-full rounded-[40px]"></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[40px] border border-base-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-waste-green-light text-waste-green rounded-xl">
               <Gift size={20} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">Katalog Reward</h1>
          </div>
          <p className="text-xs text-base-content/50 font-medium">Kelola stok sembako, token, dan hadiah untuk tukar poin warga.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-base-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'catalog' ? 'bg-white text-waste-green shadow-sm' : 'text-base-content/40 hover:text-base-content'}`}
            >
              Katalog
            </button>
            <button 
              onClick={() => setActiveTab('redemptions')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'redemptions' ? 'bg-white text-waste-green shadow-sm' : 'text-base-content/40 hover:text-base-content'}`}
            >
              Penukaran
            </button>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="btn btn-sm h-10 px-6 bg-waste-green hover:bg-waste-green-mid text-white border-none rounded-xl font-black text-xs gap-2 shadow-lg shadow-waste-green/20"
          >
            <Plus size={16} />
            Tambah Barang
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rewards.map((reward) => (
            <div key={reward.id} className="bg-white rounded-[32px] border border-base-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
              <div className="h-40 bg-base-100 relative overflow-hidden">
                {reward.imageUrl ? (
                  <img src={reward.imageUrl} alt={reward.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-base-content/10">
                    <Package size={64} />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    reward.category === 'SEMBAKO' ? 'bg-emerald-500 text-white' : 
                    reward.category === 'LISTRIK' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {reward.category}
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-black text-lg text-base-content line-clamp-1">{reward.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Coins size={14} className="text-waste-amber" />
                    <span className="text-sm font-black text-waste-amber">{reward.pointsRequired.toLocaleString()} Poin</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-base-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-base-content/30 uppercase tracking-widest">Stok Tersedia</span>
                    <span className={`text-sm font-black ${reward.stock < 5 ? 'text-waste-coral' : 'text-base-content'}`}>
                      {reward.stock} unit
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenModal(reward)}
                      className="p-2 hover:bg-base-100 rounded-xl text-base-content/30 hover:text-base-content transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(reward.id)}
                      className="p-2 hover:bg-rose-50 rounded-xl text-base-content/30 hover:text-rose-600 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {rewards.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 bg-white rounded-[40px] border border-dashed border-base-300">
               <div className="w-20 h-20 bg-base-100 rounded-full flex items-center justify-center mx-auto text-base-content/10">
                 <ShoppingBag size={40} />
               </div>
               <p className="font-black text-base-content/30 uppercase text-xs tracking-widest">Belum ada barang di katalog.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[40px] border border-base-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-base-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-waste-amber-light text-waste-amber rounded-xl">
                 <History size={18} />
               </div>
               <h2 className="font-black text-lg">Log Penukaran Warga</h2>
             </div>
             <span className="text-xs font-black text-base-content/30 uppercase tracking-widest">{redemptions.length} Transaksi</span>
          </div>
          
          {redemptions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="border-none text-[10px] font-black uppercase text-base-content/40 tracking-widest">
                    <th className="bg-transparent pl-8">Waktu</th>
                    <th className="bg-transparent">Warga</th>
                    <th className="bg-transparent">Barang</th>
                    <th className="bg-transparent">Poin Digunakan</th>
                    <th className="bg-transparent pr-8 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((item) => (
                    <tr key={item.id} className="border-base-100">
                      <td className="pl-8">
                        <span className="text-xs font-bold text-base-content/60">
                          {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: id })}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-base-content">{item.user.name}</span>
                          <span className="text-[10px] font-bold text-base-content/40">{item.user.phoneNumber}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-base-100 rounded-lg">
                            <ShoppingCart size={12} className="text-waste-green" />
                          </div>
                          <span className="text-sm font-bold text-base-content">{item.reward.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-black text-waste-amber">-{item.pointsUsed.toLocaleString()}</span>
                      </td>
                      <td className="pr-8 text-right">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          item.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {item.status}
                        </span>
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
               <p className="font-black text-base-content/30 uppercase text-xs tracking-widest">Belum ada warga yang tukar poin.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-8 right-8 p-2 hover:bg-base-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-waste-green-light text-waste-green rounded-2xl">
                <Gift size={24} />
              </div>
              <h2 className="text-2xl font-black text-base-content">
                {editingReward ? 'Edit Reward' : 'Tambah Reward Baru'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-full">
                  <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">Nama Barang</label>
                  <input 
                    required
                    type="text" 
                    className="input w-full bg-base-100 border-none rounded-2xl font-bold"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Minyak Goreng 1L"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">Kategori</label>
                  <select 
                    className="select w-full bg-base-100 border-none rounded-2xl font-bold"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="SEMBAKO">Sembako</option>
                    <option value="LISTRIK">Token Listrik</option>
                    <option value="PULSA">Pulsa / Data</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">Stok Awal</label>
                  <input 
                    required
                    type="number" 
                    className="input w-full bg-base-100 border-none rounded-2xl font-bold"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">Harga (Poin)</label>
                  <div className="relative">
                    <input 
                      required
                      type="number" 
                      className="input w-full bg-base-100 border-none rounded-2xl font-bold pr-12"
                      value={formData.pointsRequired}
                      onChange={(e) => setFormData({...formData, pointsRequired: e.target.value})}
                      placeholder="500"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                       <Zap size={16} className="text-waste-amber" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-base-content/40 ml-1">Link Gambar (Opsional)</label>
                  <input 
                    type="text" 
                    className="input w-full bg-base-100 border-none rounded-2xl font-bold"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-base-100 text-base-content font-black text-sm hover:bg-base-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 rounded-2xl bg-waste-green text-white font-black text-sm hover:bg-waste-green-mid transition-all shadow-lg shadow-waste-green/20"
                >
                  {editingReward ? 'Simpan Perubahan' : 'Tambahkan Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rewards;
