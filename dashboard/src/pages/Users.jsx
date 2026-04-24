import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users as UsersIcon, Search, UserPlus, Phone, MapPin, Award, Trash2, Edit, X, CheckSquare, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    phoneNumber: '', 
    rt: '', 
    village: '', 
    district: '', 
    regency: '', 
    province: '', 
    role: 'WARGA', 
    latitude: null, 
    longitude: null 
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ 
      name: '', 
      phoneNumber: '', 
      rt: '', 
      village: '', 
      district: '', 
      regency: '', 
      province: '', 
      role: 'WARGA', 
      latitude: null, 
      longitude: null 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setFormData({ 
      name: user.name, 
      phoneNumber: user.phoneNumber, 
      rt: user.rt || '', 
      village: user.village || '',
      district: user.district || '',
      regency: user.regency || '',
      province: user.province || '',
      role: user.role,
      latitude: user.latitude || null,
      longitude: user.longitude || null
    });
    setIsModalOpen(true);
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      toast.info('Sedang mengambil koordinat GPS...');
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));

        // Reverse Geocoding
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          const addr = data.address;
          
          if (addr) {
            setFormData(prev => ({
              ...prev,
              village: addr.village || addr.suburb || addr.hamlet || '',
              district: addr.city_district || addr.district || '',
              regency: addr.city || addr.regency || addr.county || '',
              province: addr.state || ''
            }));
            toast.success('Alamat otomatis terdeteksi!');
          }
        } catch (err) {
          console.error('Reverse Geocoding Error:', err);
          toast.success('Lokasi dikunci (Gagal mengambil nama alamat)');
        }
      }, (error) => {
        toast.error('Gagal mengambil lokasi. Pastikan izin GPS aktif.');
      });
    } else {
      toast.error('Browser Anda tidak mendukung Geolocation.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.patch(`http://localhost:5000/api/users/${selectedUserId}`, formData);
        toast.success('Data warga berhasil diperbarui');
      } else {
        await axios.post('http://localhost:5000/api/users/register', formData);
        toast.success('Warga berhasil didaftarkan');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan';
      toast.error(msg);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Yakin ingin menghapus warga ini?')) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        toast.success('Warga berhasil dihapus');
        fetchUsers();
      } catch (err) {
        toast.error('Gagal menghapus warga');
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-base-content">Manajemen Warga</h1>
          <p className="text-xs text-base-content/50 font-medium mt-1">Kelola data penduduk dan riwayat poin mereka.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn btn-sm bg-waste-green text-white border-none px-6 rounded-xl font-bold h-10 shadow-lg shadow-waste-green/20"
        >
          <UserPlus size={18} className="mr-2" /> Tambah Warga
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-base-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/30 group-focus-within:text-waste-green transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau nomor telepon..." 
            className="w-full pl-12 pr-4 py-3 bg-base-100 rounded-2xl border-none focus:ring-2 focus:ring-waste-green/20 text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-lg">
            <thead>
              <tr className="bg-base-100/30">
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest px-8">Nama Lengkap</th>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest">Detail Alamat</th>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-center">Total Poin</th>
                <th className="text-[10px] uppercase font-black text-base-content/30 tracking-widest text-right px-8">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <tr key={i}><td colSpan="5" className="skeleton h-16 w-full my-4"></td></tr>)
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-base-100/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-waste-green-light text-waste-green flex items-center justify-center font-black text-xs uppercase">
                          {user.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-black text-base-content">{user.name}</div>
                            {user.latitude && (
                              <a 
                                href={`https://www.google.com/maps?q=${user.latitude},${user.longitude}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="p-1 bg-waste-green-light text-waste-green rounded-md hover:bg-waste-green hover:text-white transition-colors"
                                title="Lihat di Google Maps"
                              >
                                <MapPin size={10} />
                              </a>
                            )}
                          </div>
                          <div className="text-[10px] text-base-content/40 font-bold uppercase tracking-widest mt-0.5">{user.rt || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-[10px] text-base-content/60 font-bold leading-relaxed">
                        {user.village && <><span className="text-waste-green">Desa:</span> {user.village}<br/></>}
                        {user.district && <><span className="text-waste-green">Kec:</span> {user.district}<br/></>}
                        {user.regency && <><span className="text-waste-green">Kab:</span> {user.regency}</>}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="inline-flex items-center gap-2 bg-waste-amber-light text-waste-amber px-3 py-1.5 rounded-xl font-black text-xs shadow-sm">
                        <Award size={12} /> {user.totalPoints.toLocaleString()}
                      </div>
                    </td>
                    <td className="text-right px-8">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(user)}
                          className="btn btn-ghost btn-sm text-base-content/30 hover:text-waste-green p-0"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-ghost btn-sm text-base-content/30 hover:text-waste-coral p-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-base-100 flex justify-between items-center bg-waste-green text-white">
              <h2 className="text-xl font-black tracking-tight">{isEditMode ? 'Edit Data Warga' : 'Daftar Warga Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bagian Kiri: Identitas */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest mb-2 block">Nama Lengkap</label>
                    <input 
                      type="text" required 
                      className="w-full px-5 py-3 bg-base-100 rounded-2xl border-none focus:ring-2 focus:ring-waste-green/20 text-sm font-bold"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest mb-2 block">Nomor Telepon (WA)</label>
                    <input 
                      type="text" required 
                      className="w-full px-5 py-3 bg-base-100 rounded-2xl border-none focus:ring-2 focus:ring-waste-green/20 text-sm font-bold"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest mb-2 block">RT/RW / Detail Rumah</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" placeholder="RT 07/RW 04"
                        className="flex-1 px-5 py-3 bg-base-100 rounded-2xl border-none focus:ring-2 focus:ring-waste-green/20 text-sm font-bold"
                        value={formData.rt}
                        onChange={(e) => setFormData({...formData, rt: e.target.value})}
                      />
                      {formData.latitude && (
                        <a 
                          href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                          target="_blank" rel="noreferrer"
                          className="btn btn-square bg-waste-amber text-white border-none rounded-2xl"
                          title="Lihat Lokasi Saat Ini"
                        >
                          <MapPin size={20} />
                        </a>
                      )}
                      <button 
                        type="button"
                        onClick={handleGetLocation}
                        className="btn btn-square bg-waste-green text-white border-none rounded-2xl"
                        title="SET ULANG LOKASI (Gunakan GPS Perangkat)"
                      >
                        <TrendingUp size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Alamat Terdeteksi */}
                <div className="space-y-4 p-6 bg-base-100 rounded-[24px]">
                  <h3 className="text-[10px] font-black text-waste-green uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckSquare size={14} /> Detail Alamat (Auto-Detect)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-base-content/40 uppercase">Desa/Kel</label>
                      <input 
                        type="text" readOnly className="w-full px-3 py-2 bg-white rounded-xl text-[11px] font-bold border border-base-200 outline-none"
                        value={formData.village}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-base-content/40 uppercase">Kecamatan</label>
                      <input 
                        type="text" readOnly className="w-full px-3 py-2 bg-white rounded-xl text-[11px] font-bold border border-base-200 outline-none"
                        value={formData.district}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-base-content/40 uppercase">Kab/Kota</label>
                      <input 
                        type="text" readOnly className="w-full px-3 py-2 bg-white rounded-xl text-[11px] font-bold border border-base-200 outline-none"
                        value={formData.regency}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-base-content/40 uppercase">Provinsi</label>
                      <input 
                        type="text" readOnly className="w-full px-3 py-2 bg-white rounded-xl text-[11px] font-bold border border-base-200 outline-none"
                        value={formData.province}
                      />
                    </div>
                  </div>
                  {formData.latitude && (
                    <div className="pt-2 text-[8px] font-bold text-base-content/30 italic">
                      Koordinat: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              </div>
              
              <button type="submit" className="w-full py-4 bg-waste-green text-white rounded-2xl font-black shadow-xl shadow-waste-green/20 mt-8 hover:bg-waste-green-mid transition-all active:scale-[0.98]">
                {isEditMode ? 'Simpan Perubahan' : 'Simpan Data Warga'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
