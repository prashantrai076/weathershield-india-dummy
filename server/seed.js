const { Source, WeatherReport, Alert, User, WeatherEvent } = require('./models'); const V = require('./verify'); const bcrypt = require('bcryptjs');
const C = { Raipur: ['Chhattisgarh', 21.25, 81.63], Delhi: ['Delhi', 28.61, 77.21], Mumbai: ['Maharashtra', 19.07, 72.88], Chennai: ['Tamil Nadu', 13.08, 80.27], Hyderabad: ['Telangana', 17.38, 78.48], Bengaluru: ['Karnataka', 12.97, 77.59], Kolkata: ['West Bengal', 22.57, 88.36], Guwahati: ['Assam', 26.14, 91.74], Bhubaneswar: ['Odisha', 20.3, 85.82], Visakhapatnam: ['Andhra Pradesh', 17.69, 83.21], Srinagar: ['J&K', 34.08, 74.8], Jaipur: ['Rajasthan', 26.91, 75.79] };
const SRC = [['IMD', 'Official', 'Very High', 1], ['Weather API', 'API', 'High', .9], ['Verified News', 'News', 'Medium/High', .75], ['Citizen Report', 'Citizen', 'Variable', .55], ['Social Media', 'Social', 'Variable', .4]];
const SC = [['Raipur', 'Heavy Rainfall', [[0, 'Heavy rainfall warning issued for Raipur district.'], [1, 'Rain probability 87% with heavy rainfall in Raipur.'], [2, 'Heavy rainfall causes waterlogging in Raipur.'], [3, 'Water has entered roads near Shankar Nagar, heavy rain.'], [3, 'Raipur roads waterlogged due to heavy rainfall.'], [4, 'Very heavy rain happening in Raipur right now']]],
  ['Guwahati', 'Flood', [[0, 'Flood alert: rivers above danger mark near Guwahati.'], [1, 'Flood risk high in Guwahati, river level rising.'], [2, 'Flood water enters low-lying Guwahati localities.'], [3, 'Flood water rising fast near Bharalu, Guwahati.']]],
  ['Mumbai', 'Thunderstorm', [[0, 'Thunderstorm likely over Mumbai.'], [1, 'Thunderstorm probability 70% in Mumbai.'], [4, 'Big thunderstorm coming in Mumbai!']]],
  ['Delhi', 'Heatwave', [[0, 'Heatwave conditions likely in Delhi, 44C.'], [1, 'Heatwave temperature 43C Delhi.'], [3, 'Extreme heatwave in Delhi today.']]],
  ['Chennai', 'Cyclone', [[0, 'Depression over Bay of Bengal, cyclone watch for Tamil Nadu coast.'], [1, 'Cyclone wind speeds rising near Chennai.']]],
  ['Srinagar', 'Fog', [[3, 'Dense fog, visibility very low in Srinagar.'], [4, 'Fog in Srinagar airport area.']]],
  ['Jaipur', 'Dust Storm', [[1, 'Dust storm likely Jaipur, gusts 60 kmph.'], [3, 'Dust storm hit Jaipur outskirts.']]],
  ['Raipur', 'Cyclone', [[4, 'Massive cyclone hitting Raipur today.'], [0, 'No cyclone warning for Chhattisgarh.'], [1, 'Normal rainfall in Raipur, no cyclone.']]],
  ['Bhubaneswar', 'Heavy Rainfall', [[0, 'Heavy rainfall warning for Odisha coast.'], [1, 'Heavy rainfall probability 90% Bhubaneswar.'], [2, 'Heavy rainfall drenches Bhubaneswar.']]],
  ['Visakhapatnam', 'Strong Winds', [[3, 'Strong winds uprooting trees in Visakhapatnam.']]],
  ['Hyderabad', 'Flash Flood', [[2, 'Flash flood in parts of Hyderabad after cloudburst.'], [3, 'Flash flood on roads near Hitech City.']]],
  ['Kolkata', 'Heavy Rainfall', [[1, 'Heavy rainfall forecast Kolkata.'], [4, 'Heavy rain in Kolkata traffic jam']]]];
module.exports = async () => {
  await Promise.all([Source.deleteMany(), WeatherReport.deleteMany(), Alert.deleteMany(), WeatherEvent.deleteMany()]);
  const s = await Source.insertMany(SRC.map(([name, type, reliability, weight]) => ({ name, type, reliability, weight })));
  for (const [e, r] of [['admin@weathershield.in', 'Admin'], ['analyst@weathershield.in', 'Analyst'], ['citizen@weathershield.in', 'Citizen']]) await User.updateOne({ email: e }, { email: e, role: r, passwordHash: bcrypt.hashSync('demo1234', 8) }, { upsert: true });
  let n = 0;
  for (const [city, ev, items] of SC) {
    const [state, lat, lon] = C[city];
    const docs = items.map(([i, text], k) => ({ sourceId: s[i]._id, sourceName: SRC[i][0], sourceType: SRC[i][1], reportText: text, eventType: ev, location: { city, state, latitude: lat + k * .01, longitude: lon }, timestamp: new Date(Date.now() - (n++ % 9) * 36e5), severity: 'High', duplicateGroupId: `${city}-${ev}` }));
    const o = V.evaluate(docs); docs.forEach(d => Object.assign(d, { confidenceScore: o.conf, verificationStatus: o.status, aiReason: o.reason }));
    await WeatherReport.insertMany(docs);
    await WeatherEvent.create({ eventType: ev, location: docs[0].location, status: o.status, confidence: o.conf, sources: o.evidence, reportCount: docs.length });
    if (o.status === 'Verified' || o.status === 'Partially Verified') await Alert.create({ level: o.status === 'Verified' ? (o.conf > 92 ? 'RED' : 'ORANGE') : 'YELLOW', eventType: ev, city, state, message: `${ev} ${o.status === 'Verified' ? 'reported across multiple sources' : 'reports under verification'}`, confidence: o.conf });
  }
};
