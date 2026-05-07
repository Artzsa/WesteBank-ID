const hostname = window.location.hostname;
const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

const API_URL = import.meta.env.VITE_API_URL || 
  (isLocal 
    ? `http://${hostname}:5000/api` 
    : `https://backend-nine-khaki-42.vercel.app/api`);

export default API_URL;


