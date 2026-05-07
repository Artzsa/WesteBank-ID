const hostname = window.location.hostname;
const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

const API_URL = import.meta.env.VITE_API_URL || 
  (isLocal 
    ? `http://${hostname}:5000/api` 
    : `https://wastebank-api.vercel.app/api`); // Ganti dengan URL backend Vercel Anda nanti

export default API_URL;

