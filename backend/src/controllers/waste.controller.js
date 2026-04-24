const prisma = require('../utils/prisma');
const aiService = require('../services/ai.service');
const axios = require('axios');

const submitWaste = async (req, res) => {
  const { userId, imageUrl } = req.body;
  
  try {
    // Call AI Service for classification
    const aiResult = await aiService.classifyWaste(imageUrl);

    const submission = await prisma.wasteSubmission.create({
      data: {
        userId,
        imageUrl,
        predictedType: aiResult.type.toUpperCase(), // Normalize to uppercase
        estimatedWeightKg: aiResult.estimatedWeight,
        status: 'PENDING',
      },
    });
    res.status(201).json(submission);
  } catch (error) {
    console.error('Submission Error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getPendingSubmissions = async (req, res) => {
  try {
    const submissions = await prisma.wasteSubmission.findMany({
      where: { 
        status: { in: ['PENDING', 'VERIFIED'] } 
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifySubmission = async (req, res) => {
  const { id } = req.params;
  const { status, pointsAwarded, verifiedById, weightKg, actualType, isSorted } = req.body;

  try {
    const submission = await prisma.$transaction(async (tx) => {
      const grossValue = Math.round(pointsAwarded / (1 - 0.2)); // Reconstruct gross from net points
      const operationalCut = grossValue - pointsAwarded;

      // 1. Update submission status
      const updatedSubmission = await tx.wasteSubmission.update({
        where: { id },
        data: {
          status,
          pointsAwarded: status === 'APPROVED' ? pointsAwarded : 0,
          grossValue: status === 'APPROVED' ? (Math.round(pointsAwarded / (1 - 0.2))) : 0,
          operationalCut: status === 'APPROVED' ? ((Math.round(pointsAwarded / (1 - 0.2))) - pointsAwarded) : 0,
          verifiedById,
          actualType: actualType || undefined,
          estimatedWeightKg: weightKg || undefined,
          isSorted: isSorted !== undefined ? isSorted : undefined
        },
        include: { user: true },
      });

      // 2. If approved, update user points and RT stock
      if (status === 'APPROVED') {
        await tx.user.update({
          where: { id: updatedSubmission.userId },
          data: {
            totalPoints: {
              increment: pointsAwarded,
            },
          },
        });

        // Update RT stock
        if (updatedSubmission.user.rt) {
          const type = (actualType || updatedSubmission.predictedType).toUpperCase();
          const typeMap = {
            'PLASTIK': 'totalPlasticKg',
            'KERTAS': 'totalPaperKg',
            'LOGAM': 'totalMetalKg',
            'KACA': 'totalGlassKg',
            'MINYAK': 'totalOilKg'
          };
          const typeField = typeMap[type];
          
          if (typeField) {
            await tx.rTStock.upsert({
              where: { rt: updatedSubmission.user.rt },
              update: {
                [typeField]: {
                  increment: weightKg || 0,
                },
              },
              create: {
                rt: updatedSubmission.user.rt,
                [typeField]: weightKg || 0,
              },
            });
          }
        }
      }

      return updatedSubmission;
    });

    const BOT_URL = process.env.BOT_API_URL || 'http://127.0.0.1:5001';

    // --- NOTIFIKASI BERANTAI ---
    if (status === 'VERIFIED') {
      try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
        const adminMsg = `💼 *PERSETUJUAN DIBUTUHKAN* 💼\n\nData timbangan baru masuk dari Pengepul!\n\n👤 Warga: ${submission.user.name}\n⚖️ Berat: ${weightKg} Kg\n📦 Jenis: ${actualType}\n\nSilakan tinjau dan cairkan poinnya di sini:\n🔗 http://localhost:5173/verification`;
        
        for (const admin of admins) {
          axios.post(`${BOT_URL}/send-message`, {
            phoneNumber: admin.phoneNumber,
            message: adminMsg
          }).catch(err => console.error('Bot Error Notify Admin:', err.message));
        }
      } catch (err) {
        console.error('Failed to query admins for notification:', err.message);
      }
    }

    // KIRIM NOTIFIKASI WA KE WARGA (Async)
    if (status === 'APPROVED') {
      try {
        let waMsg = `✨ *KABAR GEMBIRA!* ✨\n\nHalo *${submission.user.name}*, setoran sampah Anda telah diverifikasi.\n\n✅ Status: *Disetujui*\n💰 Poin: *${pointsAwarded.toLocaleString()}*`;
        
        if (isSorted) {
          waMsg += `\n🌟 *BONUS:* Wah, sampah Anda terpilah sangat rapi! Anda mendapatkan *Bonus 2x Poin* sebagai apresiasi.`;
        }

        waMsg += `\n\n🚚 Info: Petugas akan menjemput sampah Anda hari ini. Mohon siapkan sampah di depan rumah.\n\nTerima kasih telah menjadi pahlawan lingkungan! 🌿`;
        
        axios.post(`${BOT_URL}/send-message`, {
          phoneNumber: submission.user.phoneNumber,
          message: waMsg
        }).catch(err => console.error('Gagal kirim WA Konfirmasi:', err.message));
      } catch (waErr) {
        console.error('Error WA Notif:', waErr);
      }
    }

    res.json(submission);
  } catch (error) {
    console.error('Verification Error:', error);
    res.status(400).json({ error: error.message });
  }
};

const getFinancialStats = async (req, res) => {
  try {
    const stats = await prisma.wasteSubmission.aggregate({
      where: { status: 'APPROVED' },
      _sum: {
        pointsAwarded: true,
        grossValue: true,
        operationalCut: true,
      }
    });

    const recentTransactions = await prisma.wasteSubmission.findMany({
      where: { status: 'APPROVED' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      totalNetPoints: stats._sum.pointsAwarded || 0,
      totalGrossValue: stats._sum.grossValue || 0,
      totalOperationalCut: stats._sum.operationalCut || 0,
      recentTransactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  submitWaste,
  getPendingSubmissions,
  verifySubmission,
  getFinancialStats,
};
