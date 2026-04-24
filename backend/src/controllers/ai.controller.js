const axios = require('axios');

exports.generateTip = async (req, res) => {
  const { topic } = req.body;
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ 
      success: false, 
      message: 'API Key DeepSeek belum dipasang di .env boy!' 
    });
  }

  try {
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [
        { 
          role: 'system', 
          content: 'Anda adalah pakar lingkungan dari WasteBank ID. Tugas Anda adalah membuat tips edukasi singkat, inspiratif, dan praktis tentang pengelolaan sampah untuk dikirim via WhatsApp. Gunakan bahasa Indonesia yang ramah, gunakan emoji yang relevan, gunakan bold untuk poin penting. Jangan terlalu panjang, maksimal 3-4 kalimat.' 
        },
        { 
          role: 'user', 
          content: `Buatkan tips edukasi tentang: ${topic || 'Pengelolaan sampah rumah tangga'}` 
        }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const tip = response.data.choices[0].message.content;
    res.json({ success: true, tip });
  } catch (error) {
    console.error('DeepSeek Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal generate tip dari AI. Cek kuota atau API Key Anda.' 
    });
  }
};
