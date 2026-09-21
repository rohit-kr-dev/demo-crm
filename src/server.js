process.on('uncaughtException', (err) => {
  console.error('🚨 [Server Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [Server Unhandled Rejection]:', reason);
});

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRouter = require('./routes/auth');
const leadsRouter = require('./routes/leads');
const usersRouter = require('./routes/users');
const analyticsRouter = require('./routes/analytics');
const webhooksRouter = require('./routes/webhooks');
const { authenticateToken, requireRole } = require('./middleware/auth');
const { pullLeadsFrom99Acres } = require('./services/99acres-client');
const { execute99AcresPull, execute99AcresHistoricalSync, start99AcresScheduler } = require('./services/99acres-pull-engine');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Header Hardening
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// CORS Configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// Rate Limiter on Authentication to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please wait 15 minutes before trying again.' }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve Static Frontend UI
app.use(express.static(path.join(__dirname, '../public')));

// Mount Webhook Routers (Direct endpoints /webhook/website, etc.)
app.use(['/webhook', '/api/v1/webhooks', '/api/webhooks'], webhooksRouter);

// Mount API Endpoints with Rate Limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRouter);
app.use('/api/leads', authenticateToken, leadsRouter);
app.use('/api/users', authenticateToken, usersRouter);
app.use('/api/analytics', authenticateToken, analyticsRouter);

// Dedicated 99acres Diagnostic Test Endpoint (Protected: Super Admin & Admin only)
app.post('/api/99acres/test', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { username, password, startDate, endDate, url } = req.body || {};
  const result = await pullLeadsFrom99Acres({
    username: username || process.env.NNACRES_USERNAME,
    password: password || process.env.NNACRES_PASSWORD,
    startDate,
    endDate,
    url
  });
  res.status(result.httpStatus || 200).json(result);
});

// Manual On-Demand 99acres Sync Endpoint (Rolling 48h Window Pull - Manager & Admin only)
app.post('/api/99acres/pull-now', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res) => {
  const { startDate, endDate } = req.body || {};
  const result = await execute99AcresPull(true, startDate, endDate);
  res.json(result);
});

// Deep Historical Sync: Pulls multiple chunks back (Super Admin, Admin & Manager only)
app.post('/api/99acres/sync-history', authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res) => {
  const days = req.body?.days ? parseInt(req.body.days) : 6;
  const result = await execute99AcresHistoricalSync(days);
  res.json(result);
});

// Interactive Lead Simulator Endpoint for Business Demonstration
app.post('/api/demo/simulate-lead', authenticateToken, async (req, res) => {
  const { source, project, builderName, price, clientName } = req.body || {};
  const src = (source || 'demo').toLowerCase();
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const cleanPhone = `98765${randNum}`;
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10);
  const chosenBuilder = builderName || 'Demo Development Co.';
  const chosenProject = project || 'Skyline Residences';
  const chosenName = clientName || `Demo Prospect #${randNum}`;
  const inquiryId = `DEMO_SIM_${src.toUpperCase()}_${cleanPhone}_${dateStr}`;

  const sampleLead = {
    id: inquiryId,
    inquiryId,
    name: chosenName,
    phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
    email: `${chosenName.toLowerCase().replace(/\s+/g, '.')}@democlient.com`,
    property: chosenProject,
    projectName: chosenProject,
    builderName: chosenBuilder,
    price: price || '₹2.8 Cr',
    budget: price || '₹2.8 Cr',
    locationZone: 'Central District',
    subLocality: 'Civic Square',
    displayLocation: 'Central District • Civic Square',
    cityName: 'Demo City',
    source: src,
    status: 'new',
    assignedTo: 'Unassigned',
    notes: `Simulated inbound inquiry via ${src.toUpperCase()} for presentation demonstration.`,
    createdAt: now,
    updatedAt: now
  };

  const db = require('./config/firebase');
  await db.collection('leads').doc(inquiryId).set(sampleLead, { merge: true });
  await db.collection('leads').doc(inquiryId).collection('activities').add({
    type: 'SIMULATION_INGESTED',
    title: `⚡ Inbound Lead Ingested from ${src.toUpperCase()}`,
    details: `Simulated live lead capture for client presentation. Project: ${chosenProject}`,
    createdAt: now
  });

  res.json({
    success: true,
    message: `⚡ Live lead simulated from [${src.toUpperCase()}]: ${chosenName}`,
    lead: sampleLead
  });
});

// Health check & status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    mode: 'Presentation Demo Mode (Generic Roles & Synthetic Data)',
    app: 'Horizon Realty Master Realtime CRM (Demo)',
    port: PORT,
    database: 'Local Resilient Store (db_store.json)',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('===========================================================');
  console.log(`💎 Horizon Realty Real Estate CRM is LIVE!`);
  console.log(`🌐 Dashboard URL:         http://localhost:${PORT}`);
  console.log(`🔥 Database:              Connected to Cloud Firestore`);
  console.log(`⚡ Real-Time Live Sync:   Active via Server-Sent Events (SSE)`);
  console.log(`🔄 99acres Integration:   Method 1 — 15-Minute Scheduled Pull API`);
  console.log(`🔐 Demo Login:            admin@estate.com / admin123`);
  console.log('===========================================================\n');

  // Start the 15-minute background poller
  start99AcresScheduler(15);
});
