import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Phone, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/users/login', { phoneNumber });
      login(res.data);
      toast.success(`Selamat datang, ${res.data.name}!`);
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      toast.error(`Error: ${errorMsg}`);
      console.error('Login Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-waste-green flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center border-b border-base-100">
            <div className="w-16 h-16 bg-waste-green-light rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-waste-green" size={32} />
            </div>
            <h1 className="text-2xl font-black text-waste-green tracking-tight">WasteBank ID</h1>
            <p className="text-sm text-base-content/50 font-medium mt-1">Sistem Manajemen Sampah Digital</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest block mb-2 px-1">
                Nomor Telepon
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={18} className="text-base-content/30 group-focus-within:text-waste-green transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="628xxxxxxxxxx"
                  className="w-full pl-11 pr-4 py-4 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-waste-green/20 focus:border-waste-green transition-all text-sm font-bold"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-base-content/40 mt-3 px-1 leading-relaxed">
                Gunakan nomor yang sudah terdaftar di sistem kelurahan (Admin: 628111111111, Pengepul: 628222222222).
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-waste-green text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-waste-green-mid transition-all shadow-lg shadow-waste-green/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="p-6 bg-base-100/50 border-t border-base-100 text-center">
            <p className="text-[10px] text-base-content/30 font-medium">
              &copy; 2026 WasteBank ID. Teknologi untuk Lingkungan Lebih Bersih.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
