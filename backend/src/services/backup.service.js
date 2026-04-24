const cron = require('node-cron');
const prisma = require('../utils/prisma');
const fs = require('fs');
const path = require('path');

const backupDirectory = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDirectory)) {
  fs.mkdirSync(backupDirectory, { recursive: true });
}

const performBackup = async () => {
  console.log('Starting automated database backup...');
  try {
    const [users, submissions, stocks, prices] = await Promise.all([
      prisma.user.findMany(),
      prisma.wasteSubmission.findMany(),
      prisma.rTStock.findMany(),
      prisma.wastePrice.findMany()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        submissions,
        stocks,
        prices
      }
    };

    const fileName = `backup_${new Date().toISOString().replace(/:/g, '-')}.json`;
    const filePath = path.join(backupDirectory, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
    console.log(`Backup successful: ${filePath}`);

    // Optional: Keep only last 4 backups
    const files = fs.readdirSync(backupDirectory)
      .filter(f => f.startsWith('backup_'))
      .sort((a, b) => fs.statSync(path.join(backupDirectory, b)).mtime - fs.statSync(path.join(backupDirectory, a)).mtime);

    if (files.length > 4) {
      files.slice(4).forEach(f => fs.unlinkSync(path.join(backupDirectory, f)));
      console.log('Cleaned up old backups');
    }
  } catch (error) {
    console.error('Backup failed:', error);
  }
};

// Schedule: Every Sunday at 00:00
cron.schedule('0 0 * * 0', performBackup);

// Also run once on startup for verification (optional)
// performBackup();

module.exports = { performBackup };
