const m = require('mongoose'); const S = m.Schema;
const T = (d, s) => m.model(d, new S(s, { timestamps: true }));
exports.User = T('User', { email: { type: String, unique: true }, passwordHash: String, role: { type: String, enum: ['Admin', 'Analyst', 'Citizen'], default: 'Citizen' } });
exports.Source = T('Source', { name: String, type: String, reliability: String, weight: Number, enabled: { type: Boolean, default: true }, isDemo: { type: Boolean, default: true } });
const loc = { city: String, state: String, latitude: Number, longitude: Number };
exports.WeatherReport = T('WeatherReport', { sourceId: S.Types.ObjectId, sourceName: String, sourceType: String, reportText: String, eventType: { type: String, index: true }, location: loc, timestamp: { type: Date, index: true }, media: [String], hashtags: [String], severity: String, confidenceScore: Number, verificationStatus: { type: String, index: true, default: 'Under Review' }, duplicateGroupId: { type: String, index: true }, manual: Boolean, aiReason: String, relatedReports: [S.Types.ObjectId], isDemo: { type: Boolean, default: true }, isLive: { type: Boolean, default: false } });
exports.Verification = T('Verification', { reportId: S.Types.ObjectId, actor: String, action: String, status: String });
exports.WeatherEvent = T('WeatherEvent', { eventType: String, location: loc, status: String, confidence: Number, sources: [String], reportCount: Number });
exports.Alert = T('Alert', { level: String, eventType: String, city: String, state: String, message: String, confidence: Number });
exports.CitizenReport = T('CitizenReport', { name: String, city: String, state: String, eventType: String, description: String, mediaUrl: String, latitude: Number, longitude: Number, reportId: S.Types.ObjectId });
 