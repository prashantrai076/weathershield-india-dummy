// Real external data connectors. Kept modular so a new source is just one more fetch function.
// X/Twitter and Meta are NOT connected here: their public-post APIs now require paid enterprise
// access, so this prototype does not claim access to them (per the brief's honesty requirement).
const CITIES = { Raipur: ['Chhattisgarh', 21.25, 81.63], Delhi: ['Delhi', 28.61, 77.21], Mumbai: ['Maharashtra', 19.07, 72.88], Chennai: ['Tamil Nadu', 13.08, 80.27], Hyderabad: ['Telangana', 17.38, 78.48], Bengaluru: ['Karnataka', 12.97, 77.59], Kolkata: ['West Bengal', 22.57, 88.36], Guwahati: ['Assam', 26.14, 91.74], Bhubaneswar: ['Odisha', 20.3, 85.82], Visakhapatnam: ['Andhra Pradesh', 17.69, 83.21], Srinagar: ['J&K', 34.08, 74.8], Jaipur: ['Rajasthan', 26.91, 75.79] };
const NEWS_CITIES = ['Raipur', 'Delhi', 'Mumbai', 'Chennai', 'Guwahati', 'Kolkata']; // subset, to conserve free-tier quota

async function fetchWeather(city) {
  const key = process.env.OPENWEATHER_KEY; if (!key) return null;
  const [state, lat, lon] = CITIES[city];
  const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`);
  if (!r.ok) throw new Error(`OpenWeatherMap ${r.status}`);
  const d = await r.json();
  const cond = d.weather?.[0]?.main || 'Clear', desc = d.weather?.[0]?.description || cond.toLowerCase();
  const temp = Math.round(d.main?.temp ?? 0), wind = d.wind?.speed || 0, rain = (d.rain && (d.rain['1h'] || d.rain['3h'])) || 0;
  let text;
  if (rain > 7) text = `Heavy rainfall recorded in ${city}: ${desc}, ~${rain}mm/h.`;
  else if (rain > 0) text = `Light rain reported in ${city}: ${desc}.`;
  else if (cond === 'Thunderstorm') text = `Thunderstorm activity over ${city}: ${desc}.`;
  else if (wind > 10) text = `Strong winds in ${city}, gusts near ${Math.round(wind * 3.6)} kmph.`;
  else if (temp >= 40) text = `Heatwave conditions in ${city}, temperature ${temp}C.`;
  else if (['Fog', 'Mist', 'Haze'].includes(cond)) text = `Fog / low visibility reported in ${city}.`;
  else text = `Normal conditions in ${city}: ${desc}, ${temp}C, no rainfall.`;
  return { sourceName: 'OpenWeatherMap', sourceType: 'API', reportText: text, location: { city, state, latitude: lat, longitude: lon }, timestamp: new Date((d.dt || Date.now() / 1000) * 1000), isLive: true };
}

async function fetchNews(city) {
  const key = process.env.NEWS_API_KEY; if (!key) return [];
  const [state, lat, lon] = CITIES[city];
  const q = encodeURIComponent(`${city} (weather OR rain OR flood OR heatwave OR cyclone)`);
  const r = await fetch(`https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${key}`);
  if (!r.ok) throw new Error(`NewsAPI ${r.status}`);
  const d = await r.json();
  return (d.articles || []).map(a => ({
    sourceName: `News: ${a.source?.name || 'Unknown'}`, sourceType: 'News',
    reportText: `${a.title}${a.description ? '. ' + a.description : ''}`.slice(0, 300),
    location: { city, state, latitude: lat, longitude: lon }, timestamp: new Date(a.publishedAt || Date.now()),
    media: a.url ? [a.url] : [], isLive: true,
  }));
}

let lastRun = 0;
async function refreshLive(ingest) {
  if (!process.env.OPENWEATHER_KEY && !process.env.NEWS_API_KEY) return { error: 'No API keys configured on the server (.env is missing OPENWEATHER_KEY / NEWS_API_KEY).' };
  if (Date.now() - lastRun < 45000) return { skipped: true, message: 'Please wait a little before refreshing again (protects free API quota).' };
  lastRun = Date.now();
  let created = 0, errors = [];
  for (const city of Object.keys(CITIES)) {
    try { const w = await fetchWeather(city); if (w) { await ingest(w); created++; } }
    catch (e) { errors.push(`${city} weather: ${e.message}`); }
  }
  for (const city of NEWS_CITIES) {
    try { const arts = await fetchNews(city); for (const a of arts) { await ingest(a); created++; } }
    catch (e) { errors.push(`${city} news: ${e.message}`); }
  }
  return { created, errors };
}

module.exports = { fetchWeather, fetchNews, refreshLive, CITIES };
