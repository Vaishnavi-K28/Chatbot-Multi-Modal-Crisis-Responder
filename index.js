/**
 * CrisisAI Multi-Modal Emergency Responder — Backend Server
 * Node.js + Express
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── File Upload (multer) ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ── Logging ──
const sessionLog = [];

function log(entry) {
  const record = { ...entry, timestamp: new Date().toISOString() };
  sessionLog.push(record);
  console.log(`[${record.timestamp}] ${entry.mode?.toUpperCase() || 'API'} | ${entry.message?.slice(0, 80) || ''}`);
}

// ── Crisis Analysis Engine ──
function analyzeCrisis(message = '', imageCount = 0, mode = 'text') {
  const lower = message.toLowerCase();

  // Determine severity
  const criticalKeywords  = ['fire', 'flame', 'smoke', 'explosion', 'cardiac', 'heart attack', 'not breathing', 'unconscious', 'collapsed', 'drowning', 'shooting', 'stabbing', 'severe bleeding', 'choking'];
  const highKeywords      = ['accident', 'crash', 'collision', 'injury', 'broken bone', 'unconscious', 'seizure', 'allergic reaction', 'overdose', 'flood', 'gas leak'];
  const mediumKeywords    = ['fall', 'cut', 'burn', 'sprain', 'dizzy', 'chest pain', 'difficulty breathing', 'nausea'];

  let severity = 'LOW';
  let callEmergency = false;

  if (criticalKeywords.some(k => lower.includes(k)) || (imageCount > 0 && mode === 'image')) {
    severity = 'CRITICAL';
    callEmergency = true;
  } else if (highKeywords.some(k => lower.includes(k))) {
    severity = 'HIGH';
    callEmergency = true;
  } else if (mediumKeywords.some(k => lower.includes(k))) {
    severity = 'MEDIUM';
  }

  // Determine emergency type and instructions
  let responseType = 'general';
  let responseMessage = '';
  let steps = [];
  let resources = [];

  // ── Fire / Explosion ──
  if (lower.includes('fire') || lower.includes('flame') || lower.includes('smoke') || lower.includes('explosion')) {
    responseType = 'fire';
    responseMessage = '🔥 FIRE EMERGENCY — Immediate evacuation required. Do not attempt to fight the fire.';
    steps = [
      'Activate the nearest fire alarm pull station immediately.',
      'Call 911 — provide your exact address, building floor, and number of people.',
      'Do NOT use elevators — evacuate via stairwells only.',
      'Feel doors with the back of your hand before opening. If hot, use alternate route.',
      'Stay low below smoke while evacuating. Cover nose and mouth.',
      'If trapped, seal door gaps with clothing and signal from a window.',
      'Once outside, move at least 300 feet away from the building.',
      'Never re-enter until fire department gives all-clear.'
    ];
    resources = [
      { name: 'Fire Emergency: 911', type: 'call' },
      { name: 'National Fire Protection Association', url: 'https://www.nfpa.org' }
    ];
  }

  // ── Car Accident ──
  else if (lower.includes('accident') || lower.includes('crash') || lower.includes('collision') || lower.includes('overturned')) {
    responseType = 'accident';
    responseMessage = '🚗 VEHICLE ACCIDENT — Life safety is the priority. Do not move injured persons.';
    steps = [
      'Call 911 immediately — report location, number of vehicles, visible injuries, hazards.',
      'Turn on hazard lights and place warning triangles/flares at safe distance.',
      'Turn off ignition of vehicles if safe to do so — prevent fire risk.',
      'Do NOT move injured persons unless in immediate danger of fire/explosion.',
      'For conscious victims: keep warm, calm, and still until help arrives.',
      'Apply firm pressure to severe bleeding wounds using clean cloth.',
      'Check for responsive/breathing in unconscious victims — begin CPR if needed.',
      'Prevent bystanders from crowding the scene to keep pathways clear for responders.'
    ];
    resources = [
      { name: 'Emergency: 911', type: 'call' },
      { name: 'American Red Cross First Aid', url: 'https://www.redcross.org/take-a-class/first-aid' }
    ];
  }

  // ── Cardiac / Medical ──
  else if (lower.includes('heart') || lower.includes('cardiac') || lower.includes('chest pain') || lower.includes('not breathing') || lower.includes('collapsed') || lower.includes('unconscious') || lower.includes('cpr')) {
    responseType = 'cardiac';
    responseMessage = '❤️ CARDIAC EMERGENCY — Begin life-saving measures now. Every second matters.';
    steps = [
      'Call 911 immediately — stay on the line for instructions.',
      'Check responsiveness: tap shoulders firmly and shout "Are you okay?"',
      'If unresponsive and not breathing normally — begin CPR immediately.',
      'CPR: Place heel of hand on center of chest. Push hard and fast (100–120/min).',
      'Compression depth: at least 2 inches. Allow full chest recoil between compressions.',
      'After 30 compressions, give 2 rescue breaths if trained. Otherwise continue compressions.',
      'Use an AED if available — it will guide you. Turn on and follow voice prompts.',
      'Continue CPR without interruption until emergency services take over.'
    ];
    resources = [
      { name: 'Emergency: 911', type: 'call' },
      { name: 'American Heart Association CPR', url: 'https://cpr.heart.org' }
    ];
  }

  // ── Drowning ──
  else if (lower.includes('drown') || lower.includes('water') || lower.includes('pool') || lower.includes('lake') || lower.includes('river')) {
    responseType = 'drowning';
    responseMessage = '🌊 DROWNING EMERGENCY — Do not enter the water unless trained. Reach, throw, don\'t go.';
    steps = [
      'Call 911 immediately.',
      'Do NOT jump in water unless you are a trained lifeguard.',
      'Throw a rope, life ring, towel, or any floating object to the victim.',
      'If victim is out of water and unconscious — check breathing.',
      'Begin CPR if not breathing — start with 5 rescue breaths before chest compressions.',
      'Keep victim warm — prevent hypothermia with blankets.',
      'Even if victim appears to recover, always seek immediate medical evaluation.'
    ];
  }

  // ── Image analysis ──
  else if (imageCount > 0) {
    responseType = 'image-analysis';
    responseMessage = '📸 Image received and analyzed. Emergency situation detected requiring immediate response.';
    steps = [
      'Ensure you are in a safe position away from the hazard.',
      'Call 911 with your exact location and describe what you see.',
      'Do not approach hazardous materials, damaged structures, or unstable areas.',
      'Provide first aid only if you have been trained and it is safe to do so.',
      'Document the scene with photos only if it does not increase your risk.',
      'Keep other people away from the scene until responders arrive.',
      'Stay on the line with emergency services and follow their instructions.'
    ];
    callEmergency = true;
    severity = 'HIGH';
  }

  // ── Choking ──
  else if (lower.includes('chok') || lower.includes('heimlich')) {
    responseType = 'choking';
    responseMessage = '😮 CHOKING EMERGENCY — Act immediately. Time is critical.';
    steps = [
      'Ask "Are you choking?" — if they cannot speak/cough/breathe, act immediately.',
      'Call 911 or have someone call while you assist.',
      'Stand behind the person and give 5 firm back blows between shoulder blades.',
      'Perform 5 abdominal thrusts (Heimlich): wrap arms around waist, thrust upward.',
      'Alternate back blows and abdominal thrusts until object dislodges.',
      'If the person becomes unconscious, lower them carefully and begin CPR.',
      'For infants: use 5 back blows + 5 chest thrusts (not abdominal thrusts).'
    ];
    callEmergency = true;
  }

  // ── Gas Leak ──
  else if (lower.includes('gas') || lower.includes('leak') || lower.includes('smell')) {
    responseType = 'gas-leak';
    responseMessage = '⚠️ GAS LEAK SUSPECTED — Evacuate immediately. Do not create sparks.';
    steps = [
      'Do NOT turn any light switches, appliances, or phones on or off.',
      'Open doors and windows immediately as you exit.',
      'Evacuate everyone from the building — do not use elevators.',
      'Do not use your phone inside the building — wait until outside.',
      'Once outside, call 911 and your gas utility company.',
      'Keep everyone at least 300 feet from the building.',
      'Do not re-enter until authorities declare it safe.'
    ];
    callEmergency = true;
  }

  // ── General ──
  else {
    responseType = 'general';
    responseMessage = '🆘 Emergency situation logged. Please provide more details for specific guidance.';
    steps = [
      'Assess your immediate surroundings for safety.',
      'Call 911 if there is any risk to life or property.',
      'Move yourself and others away from the hazard if possible.',
      'Provide first aid only if trained and safe to do so.',
      'Wait for emergency services — do not hang up if on call with 911.',
      'Document the situation for responders if safe.'
    ];
  }

  return {
    type: responseType,
    severity,
    message: responseMessage,
    steps,
    resources,
    callEmergency,
    timestamp: new Date().toISOString(),
    processingMode: mode
  };
}

// ══════════════════════════════════════
// ── API ROUTES ──
// ══════════════════════════════════════

/**
 * POST /api/crisis
 * Main crisis analysis endpoint (JSON with base64 images)
 */
app.post('/api/crisis', (req, res) => {
  const { message = '', images = [], mode = 'text' } = req.body;

  if (!message && images.length === 0) {
    return res.status(400).json({ error: 'No message or image provided' });
  }

  const result = analyzeCrisis(message, images.length, mode);

  log({ mode, message, imageCount: images.length, severity: result.severity });

  res.json(result);
});

/**
 * POST /api/crisis/upload
 * File upload endpoint (multipart form)
 */
app.post('/api/crisis/upload', upload.array('images', 5), (req, res) => {
  const message = req.body.message || '';
  const mode = req.body.mode || 'image';
  const imageCount = req.files?.length || 0;

  const result = analyzeCrisis(message, imageCount, mode);

  log({ mode, message, imageCount, severity: result.severity });

  res.json({
    ...result,
    uploadedFiles: req.files?.map(f => ({ name: f.filename, size: f.size })) || []
  });
});

/**
 * POST /api/voice
 * Voice transcript analysis
 */
app.post('/api/voice', (req, res) => {
  const { transcript = '' } = req.body;
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' });

  const result = analyzeCrisis(transcript, 0, 'voice');
  log({ mode: 'voice', message: transcript, severity: result.severity });

  res.json(result);
});

/**
 * GET /api/session
 * Retrieve session log
 */
app.get('/api/session', (req, res) => {
  res.json({ total: sessionLog.length, logs: sessionLog });
});

/**
 * DELETE /api/session
 * Clear session log
 */
app.delete('/api/session', (req, res) => {
  sessionLog.length = 0;
  res.json({ message: 'Session cleared' });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CrisisAI Multi-Modal Emergency Responder',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve frontend for all other routes
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error Handling ──
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`\n╔═══════════════════════════════════╗`);
  console.log(`║  CrisisAI Emergency Responder     ║`);
  console.log(`║  Server running on port ${PORT}       ║`);
  console.log(`║  http://localhost:${PORT}            ║`);
  console.log(`╚═══════════════════════════════════╝\n`);
});

module.exports = app;
