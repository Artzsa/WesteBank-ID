const axios = require('axios');

const sendMessage = async (req, res) => {
  const { phoneNumber, message } = req.body;
  const BOT_URL = process.env.BOT_API_URL || 'http://127.0.0.1:5001';

  try {
    const response = await axios.post(`${BOT_URL}/send-message`, {
      phoneNumber,
      message
    });
    res.json(response.data);
  } catch (error) {
    console.error('Bot Proxy Error:', error.message);
    res.status(error.response?.status || 500).json({ 
      success: false, 
      error: 'Gagal menghubungi Bot WhatsApp. Pastikan Bot sudah aktif.',
      details: error.message 
    });
  }
};

module.exports = {
  sendMessage
};
