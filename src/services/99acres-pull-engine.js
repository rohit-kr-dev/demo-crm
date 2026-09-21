const { pullLeadsFrom99Acres, formatTo99AcresDate } = require('./99acres-client');
const { notifyTeamNewLead } = require('./notificationService');
const db = require('../config/firebase');
require('dotenv').config();

/**
 * Execute Rolling 99acres Pull and Persist to Cloud Firestore
 * Defaults to a rolling 48-hour window (2 days) to guarantee zero missed leads.
 */
async function execute99AcresPull(isManualTrigger = false, customStartDate = null, customEndDate = null) {
  const username = process.env.NNACRES_USERNAME;
  const password = process.env.NNACRES_PASSWORD;

  const now = new Date();
  // 48-Hour Rolling Lookback (Max single window permitted by 99acres)
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const startDateStr = customStartDate || formatTo99AcresDate(fortyEightHoursAgo);
  const endDateStr = customEndDate || formatTo99AcresDate(now);

  console.log(`\n[${new Date().toISOString()}] 🔍 99acres Pull Triggered (${isManualTrigger ? 'Manual' : 'Scheduled'})`);
  console.log(`   User:        ${username}`);
  console.log(`   Time Window: ${startDateStr} ➔ ${endDateStr}`);

  try {
    const pullResult = await pullLeadsFrom99Acres({
      username,
      password,
      startDate: startDateStr,
      endDate: endDateStr
    });

    if (!pullResult.success) {
      console.error(`❌ [99acres Pull Error] ${pullResult.error?.code}: ${pullResult.error?.message}`);
      return { success: false, error: pullResult.error?.message, leads: [] };
    }

    const leads = pullResult.leads || [];
    console.log(`   📥 Received ${leads.length} lead(s) from 99acres API in this window.`);

    let savedCount = 0;
    let duplicateCount = 0;

    for (const lead of leads) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const leadId = lead.inquiryId || `99A_${lead.queryId || cleanPhone}`;

      // Convert 99acres received timestamp to ISO string if valid
      let leadCreatedAt = now.toISOString();
      if (lead.receivedOn) {
        const parsedDate = new Date(lead.receivedOn.replace(/-/g, '/'));
        if (!isNaN(parsedDate.getTime())) {
          leadCreatedAt = parsedDate.toISOString();
        }
      }

      const leadDoc = {
        id: leadId,
        inquiryId: leadId,
        queryId: lead.queryId || null,
        resType: lead.resType || 'S2M',
        name: lead.name || 'Anonymous Lead',
        phone: lead.phone,
        email: lead.email || '',
        source: '99acres',
        projectName: lead.projectName || lead.property || '99acres Listing',
        cityName: lead.cityName || 'Bangalore',
        locationZone: lead.locationZone || 'East Bangalore',
        subLocality: lead.subLocality || 'East Zone',
        displayLocation: lead.displayLocation || `${lead.locationZone || 'East Bangalore'} • ${lead.subLocality || 'East Zone'}`,
        price: lead.price || null,
        rawPrice: lead.rawPrice || null,
        budget: lead.price || lead.rawPrice || '₹1.5 - 3.0 Cr',
        property: lead.property || lead.projectName || '99acres Property',
        notes: lead.notes || `Inquiry for ${lead.projectName} (${lead.cityName})`,
        status: 'new',
        phoneVerification: lead.phoneVerification || 'VERIFIED',
        emailVerification: lead.emailVerification || 'UNVALIDATED',
        identity: lead.identity || 'Individual',
        projId: lead.projId || null,
        prodId: lead.prodId || null,
        assignedTo: 'Unassigned',
        receivedOn99Acres: lead.receivedOn,
        createdAt: leadCreatedAt,
        updatedAt: now.toISOString()
      };

      const docRef = db.collection('leads').doc(leadId);
      const existing = await docRef.get();

      if (!existing.exists) {
        await docRef.set(leadDoc);
        await docRef.collection('activities').add({
          type: '99ACRES_PULL',
          title: `99acres Inquiry: ${leadDoc.projectName}`,
          details: `Inquiry from ${leadDoc.name} (${leadDoc.phone}). Project: ${leadDoc.projectName} (${leadDoc.cityName}). Budget: ${leadDoc.price || 'N/A'}. Received on 99acres: ${lead.receivedOn}`,
          createdAt: leadDoc.createdAt
        });
        savedCount++;
        console.log(`   🔥 [Firestore Saved] ${leadDoc.name} (${leadDoc.phone}) | ${leadDoc.projectName} | ${leadDoc.price || 'No Price'}`);
        
        // Dispatch instant alert to Sales Team / Admin (only for truly fresh leads)
        notifyTeamNewLead(leadDoc).catch(err => console.error('Notification Error:', err.message));
      } else {
        duplicateCount++;
      }
    }

    console.log(`[${new Date().toISOString()}] 🏁 99acres Pull Complete: ${savedCount} new lead(s) stored, ${duplicateCount} duplicate(s) verified.\n`);
    return { success: true, count: savedCount, totalInWindow: leads.length, duplicates: duplicateCount, leads };
  } catch (err) {
    console.error(`❌ [99acres Pull Exception]`, err.message);
    return { success: false, error: err.message, leads: [] };
  }
}

/**
 * Historical Sync: Queries 99acres in 2-day sequential chunks up to 30 days back
 */
async function execute99AcresHistoricalSync(daysBack = 30) {
  const chunks = Math.min(Math.ceil(daysBack / 2), 15);
  const now = new Date();
  let totalNewSaved = 0;
  let totalReceived = 0;

  console.log(`\n===========================================================`);
  console.log(`🚀 STARTING 99ACRES HISTORICAL SYNC (${daysBack} Days, ${chunks} Chunks)`);
  console.log(`===========================================================`);

  for (let i = 0; i < chunks; i++) {
    const endDays = i * 2;
    const startDays = Math.min((i + 1) * 2, daysBack);

    const chunkEnd = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
    const chunkStart = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);

    const startStr = formatTo99AcresDate(chunkStart);
    const endStr = formatTo99AcresDate(chunkEnd);

    console.log(`\n📦 [Chunk ${i + 1}/${chunks}] Fetching ${startStr} ➔ ${endStr}...`);
    const res = await execute99AcresPull(true, startStr, endStr);

    if (res.success) {
      totalNewSaved += (res.count || 0);
      totalReceived += (res.totalInWindow || 0);
    } else {
      console.warn(`   ⚠️ Chunk ${i + 1} stopped: ${res.error}`);
      if (String(res.error).includes('Exceeded') || String(res.error).includes('Limit')) {
        console.warn(`   ⏳ Rate limit reached. Historical sync paused.`);
        break;
      }
    }

    // Delay between chunks to prevent burst rate limit
    await new Promise(r => setTimeout(r, 1200));
  }

  console.log(`\n🏁 99acres Historical Sync Finished! Total Processed: ${totalReceived}, Total New Stored: ${totalNewSaved}\n`);
  return { success: true, totalReceived, totalNewSaved };
}

// 15-Minute Cron Scheduler (4 reqs/hour, strictly within 99acres 6/hr limit)
let schedulerInterval = null;

function start99AcresScheduler(intervalMinutes = 15) {
  if (schedulerInterval) clearInterval(schedulerInterval);
  console.log(`⏰ [99acres 15-Min Scheduler] Active: Rolling 48-Hour Pull every ${intervalMinutes} minutes...`);
  
  // Run an immediate initial pull on startup so the CRM is immediately loaded with all recent leads
  execute99AcresPull(false).catch(e => console.error('Initial 99acres startup pull error:', e.message));

  schedulerInterval = setInterval(() => {
    execute99AcresPull(false);
  }, intervalMinutes * 60 * 1000);
}

module.exports = {
  execute99AcresPull,
  execute99AcresHistoricalSync,
  start99AcresScheduler,
  formatTo99AcresDate
};

