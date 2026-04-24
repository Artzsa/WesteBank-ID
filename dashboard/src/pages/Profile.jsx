import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Phone, MapPin, Shield, Calendar, Award } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalPoints: 0, totalVerifications: 0 });

  useEffect(() => {
    if (user?.id) {
      const fetchStats = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/api/users/${user.id}/stats`);
          setStats(res.data);
        } catch (err) {
          console.error('Failed to fetch user stats:', err);
        }
      };
      fetchStats();
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-10 rounded-[48px] border border-base-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-waste-green/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="relative">
          <div className="w-32 h-32 rounded-[40px] bg-waste-green text-white flex items-center justify-center shadow-2xl shadow-waste-green/30">
            <User size={64} />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-waste-amber rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
            <Award size={20} />
          </div>
        </div>

        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-black tracking-tight text-base-content">{user?.name}</h1>
          <p className="text-sm font-bold text-waste-green uppercase tracking-widest mt-1">{user?.role} — {user?.rt || 'Kelurahan'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
            <div className="bg-base-100 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-base-content/60">
              <Phone size={14} className="text-waste-green" /> {user?.phoneNumber}
            </div>
            <div className="bg-base-100 px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold text-base-content/60">
              <Calendar size={14} className="text-waste-green" /> Terdaftar {user?.createdAt ? new Date(user?.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }) : '...'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[48px] border border-base-200 shadow-sm">
          <h2 className="text-lg font-black tracking-tight mb-8 flex items-center gap-3">
            <Shield className="text-waste-green" size={24} /> Informasi Akun
          </h2>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest block mb-2">ID Pengguna</label>
              <div className="text-sm font-bold text-base-content/60 font-mono bg-base-100 p-3 rounded-xl">{user?.id}</div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-base-content/30 tracking-widest block mb-2">Wilayah Tugas</label>
              <div className="text-sm font-bold text-base-content flex items-center gap-2">
                <MapPin size={16} className="text-waste-green" /> {user?.rt || 'Seluruh Kelurahan'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-waste-green p-10 rounded-[48px] shadow-2xl shadow-waste-green/20 text-white flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight mb-2">Statistik Anda</h2>
            <p className="text-xs text-white/60 font-medium leading-relaxed">Performa kontribusi Anda dalam sistem WasteBank ID.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-10">
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Verifikasi</div>
              <div className="text-2xl font-black">{stats.totalVerifications}</div>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-sm">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Poin Total</div>
              <div className="text-2xl font-black">{stats.totalPoints.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[48px] border border-base-200 shadow-sm text-center">
        <p className="text-xs text-base-content/40 font-medium">Ingin mengubah data profil atau mengganti nomor HP?</p>
        <button className="mt-4 text-sm font-black text-waste-green hover:underline">Hubungi Admin Sistem</button>
      </div>
    </div>
  );
};

export default Profile;

