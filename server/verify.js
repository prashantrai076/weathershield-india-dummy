// Modular AI-assisted verification. Swap classify()/evaluate() for a real ML/LLM service later.
const RULES = { 'Flash Flood': /flash flood|cloudburst/, Flood: /flood|waterlog|inundat|water level/, 'Heavy Rainfall': /rain/, Thunderstorm: /thunder/, Lightning: /lightning/, Heatwave: /heat ?wave/, 'Cold Wave': /cold wave/, Fog: /fog|visibility/, 'Dust Storm': /dust ?storm/, 'Strong Winds': /strong wind|gale/, Cyclone: /cyclone/, Landslide: /landslide/, Drought: /drought/ };
exports.classify = t => Object.entries(RULES).find(([, r]) => r.test(t.toLowerCase()))?.[0] || 'Other';
exports.negates = t => /\b(no|not|normal|clear|dry|nil)\b/i.test(t);
const tok = t => new Set(t.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3));
exports.similarity = (a, b) => { const A = tok(a), B = tok(b); const i = [...A].filter(x => B.has(x)).length; return i / (A.size + B.size - i || 1); };
const W = { Official: 1, API: .9, News: .75, Citizen: .55, Social: .4 };
exports.evaluate = reports => {
  const w = r => W[r.sourceType] || .4, sum = a => a.reduce((s, r) => s + w(r), 0);
  const sup = reports.filter(r => !exports.negates(r.reportText)), deny = reports.filter(r => exports.negates(r.reportText));
  const types = new Set(sup.map(r => r.sourceType)), official = types.has('Official') || types.has('API');
  let conf = Math.round(100 * (sum(sup) - 1.2 * sum(deny)) / (sum(reports) + .8)) + (types.size >= 3 ? 8 : 0);
  conf = Math.max(5, Math.min(98, conf)); let status, reason;
  if (deny.length && sup.length) { status = 'Conflicting'; reason = deny.some(r => ['Official', 'API'].includes(r.sourceType)) ? 'Claim is not supported by available official and independent weather sources.' : 'Sources disagree; sent to Verification Center.'; }
  else if (conf >= 85 && types.size >= 3 && official) { status = 'Verified'; reason = 'Official source, multiple independent reports and location consistency.'; }
  else if (conf >= 55 && official) { status = 'Partially Verified'; reason = 'Some corroboration; more independent sources needed.'; }
  else { status = 'Unverified'; reason = 'No official or independent corroboration found.'; }
  return { conf, status, reason, evidence: [...types] };
};
