// Run once with: npm run clear-demo
// Deletes all seeded mock reports/events/alerts, leaving only real live data (if any) and users.
require('dotenv').config();
const mongoose = require('mongoose');
const { WeatherReport, WeatherEvent, Alert } = require('./models');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/weathershield').then(async () => {
  const r1 = await WeatherReport.deleteMany({ isDemo: true });
  const r2 = await WeatherEvent.deleteMany({}); // events are recreated on next ingest/live pull
  const r3 = await Alert.deleteMany({});
  console.log(`Removed ${r1.deletedCount} demo reports, ${r2.deletedCount} events, ${r3.deletedCount} alerts.`);
  console.log('Set SKIP_SEED=true in .env so this data is not recreated automatically on next start.');
  process.exit();
});