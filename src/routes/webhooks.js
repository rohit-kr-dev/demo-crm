const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const { notifyTeamNewLead } = require('../services/notificationService');
const { normalizeLocation } = require('../utils/locationHelper');
require('dotenv').config();

// ============================================================
// 1. LEAD NORMALIZER & DEDUPLICATION PROCESSOR
// ============================================================
function processAndNormalizeLead(rawBody, source) {
  if (!rawBody || typeof rawBody !== 'object') return null;

  let name = 'Anonymous Lead';
  let phone = '';
  let email = '';
  let property = null;
  let notes = '';
  let budget = null;
  let city = null;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // A. 99acres Property Portal
  if (source.toLowerCase() === '99acres') {
    name = rawBody.Name || rawBody.name || rawBody.customer_name || rawBody.customer?.name || name;
    phone = rawBody.Mobile || rawBody.mobile || rawBody.Phone || rawBody.phone || rawBody.customer_phone || '';
    email = rawBody.Email || rawBody.email || rawBody.customer_email || '';
    property = rawBody.Project || rawBody.project || rawBody.property_title || rawBody.property_description || '99acres Listing';
    notes = rawBody.notes || rawBody.Notes || rawBody.query_message || rawBody.queryInfo || 'Inquiry received via 99acres portal';
    budget = rawBody.budget || rawBody.Budget || null;
    city = rawBody.city || rawBody.City || null;
  }

  // B. Meta Ads (Facebook & Instagram Lead Generation)
  else if (source.toLowerCase() === 'meta' || source.toLowerCase() === 'facebook' || source.toLowerCase() === 'instagram') {
    source = 'meta';
    name = rawBody.full_name || rawBody.name || rawBody.Name || name;
    phone = rawBody.phone_number || rawBody.phone || rawBody.mobile || rawBody.Mobile || '';
    email = rawBody.email || rawBody.Email || '';
    property = rawBody.ad_name || rawBody.campaign_name || rawBody.project || rawBody.property || 'Meta Campaign Lead';
    notes = rawBody.notes || rawBody.form_name || `Meta Lead Ad: ${property}`;
    budget = rawBody.budget || null;
    city = rawBody.city || null;
  }

  // C. Official Website Inquiry Forms
  else if (source.toLowerCase() === 'website') {
    name = rawBody.name || rawBody.fullName || rawBody.Name || name;
    phone = rawBody.phone || rawBody.mobile || rawBody.Mobile || '';
    email = rawBody.email || rawBody.Email || '';
    property = rawBody.property || rawBody.project || rawBody.interested_in || 'Horizon Realty Website';
    notes = rawBody.message || rawBody.notes || rawBody.comments || 'Direct website inquiry';
    budget = rawBody.budget || null;
    city = rawBody.city || null;
  }

  // D. Direct, Broker, Referral, Walk-ins & Others
  else {
    name = rawBody.name || rawBody.Name || name;
    phone = rawBody.phone || rawBody.mobile || rawBody.Mobile || '';
    email = rawBody.email || rawBody.Email || '';
    property = rawBody.property || rawBody.project || 'General Portfolio';
    notes = rawBody.notes || rawBody.message || `Lead from ${source}`;
    budget = rawBody.budget || null;
    city = rawBody.city || null;
  }

  // Clean phone
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (!cleanPhone) return null;

  // Generate Deterministic Inquiry ID
  const cleanSource = source.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanIdentifier = String(property || 'lead').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 12);
  const inquiryId = rawBody.lead_id || rawBody.inquiry_id || rawBody.id || `${cleanSource.toUpperCase()}_${cleanPhone}_${cleanIdentifier}_${dateStr}`;
  const locData = normalizeLocation(city, property, property, notes);

  return {
    id: String(inquiryId),
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    source: source.toLowerCase(), // '99acres', 'meta', 'broker', 'referral', 'walk-in', 'website', 'google', 'other'
    property: property ? String(property).trim() : null,
    projectName: property ? String(property).trim() : null,
    budget: budget ? String(budget).trim() : null,
    city: city || locData.cityName,
    locationZone: locData.locationZone,
    subLocality: locData.subLocality,
    displayLocation: locData.displayLocation,
    notes: String(notes).trim(),
    status: 'new', // new, contacted, site_visit, negotiation, won, lost
    assignedTo: 'Unassigned',
    rawPayload: rawBody,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

// Master Lead Saver Helper
async function saveMasterLead(lead, req, res) {
  if (!lead || !lead.phone) {
    return res.status(400).json({ success: false, error: 'Valid phone number is required' });
  }

  try {
    const docRef = db.collection('leads').doc(lead.id);
    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.update({
        notes: lead.notes || existing.data().notes,
        email: lead.email || existing.data().email,
        updatedAt: lead.updatedAt,
        rawPayload: lead.rawPayload
      });
      console.log(`[Lead Ingestion] 🔄 Updated existing lead '${lead.id}' from [${lead.source.toUpperCase()}]`);
    } else {
      await docRef.set(lead);
      await docRef.collection('activities').add({
        type: 'LEAD_INGESTED',
        title: `Lead Received from ${lead.source.toUpperCase()}`,
        details: `Captured via ${lead.property || 'Ingestion API'}. Notes: ${lead.notes}`,
        createdAt: lead.createdAt
      });
      console.log(`[Lead Ingestion] 🔥 New Lead Created: ${lead.name} (${lead.phone}) from [${lead.source.toUpperCase()}]`);
      // Dispatch instant alert to Sales Team / Admin
      notifyTeamNewLead(lead).catch(err => console.error('Notification Error:', err.message));
    }

    return res.status(200).json({
      success: true,
      message: `Lead successfully processed from ${lead.source}`,
      leadId: lead.id
    });
  } catch (err) {
    console.error(`[Lead Ingestion Error - ${lead.source}]`, err);
    return res.status(500).json({ success: false, error: 'Firestore persistence failed' });
  }
}

// ============================================================
// 2. ROUTE: /webhook/99acres (99acres Property Inquiries)
// ============================================================
router.post(['/99acres', '/99acres/:token'], async (req, res) => {
  console.log('[99acres Inbound Payload Received]', JSON.stringify(req.body));
  const lead = processAndNormalizeLead(req.body, '99acres');
  return saveMasterLead(lead, req, res);
});

// ============================================================
// 3. ROUTE: /webhook/meta & /webhook/facebook (Meta Lead Ads)
// ============================================================
router.post(['/meta', '/facebook', '/instagram'], async (req, res) => {
  console.log('[Meta Inbound Payload Received]', JSON.stringify(req.body));
  const lead = processAndNormalizeLead(req.body, 'meta');
  return saveMasterLead(lead, req, res);
});

// Meta Webhook Verification Challenge (GET /webhook/meta)
router.get(['/meta', '/facebook'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'horizon_meta_verify_2026')) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ============================================================
// 4. ROUTE: /webhook/website (Official Website Forms)
// ============================================================
router.post('/website', async (req, res) => {
  console.log('[Website Inbound Payload Received]', JSON.stringify(req.body));
  const lead = processAndNormalizeLead(req.body, 'website');
  return saveMasterLead(lead, req, res);
});

// ============================================================
// 5. ROUTE: /webhook/broker, /webhook/referral, /webhook/direct
// ============================================================
router.post(['/broker', '/direct', '/referral', '/walkin', '/google'], async (req, res) => {
  let source = 'other';
  if (req.path.includes('broker')) source = 'broker';
  else if (req.path.includes('referral')) source = 'referral';
  else if (req.path.includes('walkin')) source = 'walk-in';
  else if (req.path.includes('google')) source = 'google';
  else if (req.path.includes('direct')) source = 'direct';

  const lead = processAndNormalizeLead(req.body, source);
  return saveMasterLead(lead, req, res);
});

module.exports = router;
