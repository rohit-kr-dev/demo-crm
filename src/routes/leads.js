const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const { notifyTeamNewLead } = require('../services/notificationService');
const { normalizeLocation } = require('../utils/locationHelper');
const { requireRole } = require('../middleware/auth');

// Active SSE client connections for real-time live streaming
let sseClients = [];

/**
 * Role-Based Lead Assignment Access Check
 * If user is SUPER_ADMIN, ADMIN, or MANAGER (Priya), they have full access.
 * If user is SALES (e.g. Arjun, Maya), they can ONLY see leads specifically assigned to them.
 */
function isLeadAssignedToUser(lead, user) {
  if (!lead || !user) return false;
  
  // Super Admin, Admin, and Sales Manager have full company-wide visibility
  const role = String(user.role || '').toUpperCase();
  if (['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'].includes(role)) {
    return true;
  }

  const uEmail = String(user.email || '').toLowerCase().trim();
  const uName = String(user.name || '').toLowerCase().trim();
  const uId = String(user.id || '').trim();
  const uFirstName = uName.split(' ')[0];

  const leadAssignedTo = String(lead.assignedTo || '').toLowerCase().trim();
  const leadEmail = String(lead.assignedToEmail || '').toLowerCase().trim();
  const leadAdvisor = String(lead.advisorName || '').toLowerCase().trim();
  const leadAssignedId = String(lead.assignedToId || '').trim();

  // 1. Direct Email match
  if (uEmail && leadEmail && (leadEmail === uEmail || leadEmail.includes(uEmail) || uEmail.includes(leadEmail))) {
    return true;
  }

  // 2. Direct User ID match
  if (uId && leadAssignedId && uId === leadAssignedId) {
    return true;
  }

  // 3. Name match in assignedTo (e.g. "Arjun (Sales Executive)", "Arjun", "Maya")
  if (leadAssignedTo) {
    if (uName && leadAssignedTo.includes(uName)) return true;
    if (uFirstName && uFirstName.length >= 3 && leadAssignedTo.includes(uFirstName)) return true;
  }

  // 4. Name match in advisorName
  if (leadAdvisor) {
    if (uName && leadAdvisor.includes(uName)) return true;
    if (uFirstName && uFirstName.length >= 3 && leadAdvisor.includes(uFirstName)) return true;
  }

  return false;
}

// Listen to Cloud Firestore 'leads' collection in real time
db.collection('leads').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    const leadData = { id: change.doc.id, ...change.doc.data() };

    // Broadcast to active browser sessions respecting role restrictions
    sseClients.forEach(client => {
      try {
        // If client is SALES role, ONLY broadcast if lead is assigned to them
        if (client.user && client.user.role === 'SALES') {
          if (!isLeadAssignedToUser(leadData, client.user)) {
            return; // Never leak unassigned or other advisors' leads to sales executives
          }
        }

        const eventPayload = {
          type: change.type, // 'added', 'modified', 'removed'
          lead: leadData,
          timestamp: new Date().toISOString()
        };

        client.res.write(`data: ${JSON.stringify(eventPayload)}\n\n`);
      } catch (e) {}
    });
  });
}, error => {
  console.error('[Firestore Realtime Listener Error]', error);
});

// SSE Live Stream Endpoint: /api/leads/realtime/stream
router.get('/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res, user: req.user };
  sseClients.push(newClient);

  // Send initial keepalive
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// GET /api/leads - Fetch leads from Firestore (Role-Restricted for Sales)
router.get('/', async (req, res) => {
  try {
    const isSalesExecutive = req.user && req.user.role === 'SALES';
    const snapshot = await db.collection('leads').get();
    const leads = [];
    const metrics = {
      total: 0,
      new: 0,
      contacted: 0,
      site_visit: 0,
      negotiation: 0,
      won: 0,
      lost: 0
    };
    const projectSet = new Set();
    const zoneSet = new Set();
    const locationSet = new Set();

    snapshot.forEach(doc => {
      const data = doc.data() || {};
      const lead = { id: doc.id, ...data };

      // CRITICAL RBAC FILTER: Sales Executives (Arjun, Maya) ONLY see their assigned leads
      if (isSalesExecutive && !isLeadAssignedToUser(lead, req.user)) {
        return; // Exclude non-assigned leads
      }
      
      // Standardize property & status mapping for UI
      lead.property = lead.projectName || lead.property || lead.project || 'Horizon Listing';
      lead.status = String(lead.status || 'new').toLowerCase();
      if (lead.price && !lead.property.includes(lead.price)) {
        lead.displayProperty = `${lead.property} (${lead.price})`;
      } else {
        lead.displayProperty = lead.property;
      }

      // Enrich Location & Zone intelligence
      const loc = normalizeLocation(lead.cityName || lead.city, lead.property, lead.projectName, lead.notes);
      lead.locationZone = lead.locationZone || loc.locationZone;
      lead.subLocality = lead.subLocality || loc.subLocality;
      lead.displayLocation = lead.displayLocation || loc.displayLocation;
      lead.cityName = lead.cityName || loc.cityName;

      leads.push(lead);

      metrics.total++;
      const st = lead.status;
      if (metrics[st] !== undefined) {
        metrics[st]++;
      }

      if (lead.property) {
        projectSet.add(String(lead.property));
      }
      if (lead.locationZone) {
        zoneSet.add(String(lead.locationZone));
      }
      if (lead.displayLocation) {
        locationSet.add(String(lead.displayLocation));
      }
    });

    // Sort by createdAt descending
    leads.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json({
      success: true,
      leads,
      metrics,
      isSalesExecutive,
      assignedUser: isSalesExecutive ? req.user.name : null,
      projects: Array.from(projectSet),
      zones: Array.from(zoneSet),
      locations: Array.from(locationSet)
    });
  } catch (error) {
    console.error('Error fetching leads from Firestore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/leads/:id - Fetch single lead + full remark & activity history subcollection
router.get('/:id', async (req, res) => {
  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = { id: doc.id, ...doc.data() };

    // Strict Sales Isolation: Cannot view dossier of leads not assigned to them
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(lead, req.user)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access Restricted: You are only authorized to access leads assigned to you.' 
      });
    }

    // Get activities & remarks subcollection
    const actSnap = await docRef.collection('activities').get();
    const activities = [];
    actSnap.forEach(a => activities.push({ id: a.id, ...a.data() }));

    // Chronological sort: newest first
    activities.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json({ success: true, lead, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/leads/:id/status - Update stage in Firestore
router.patch('/:id/status', async (req, res) => {
  const { status, note, advisorName } = req.body;
  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    // SALES security check
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(doc.data(), req.user)) {
      return res.status(403).json({ success: false, error: 'Access restricted: You can only update leads assigned to you.' });
    }

    const prevStatus = (doc.data().status || 'new').toUpperCase();
    const newStatus = String(status).toLowerCase();
    const now = new Date().toISOString();

    await docRef.update({
      status: newStatus,
      updatedAt: now
    });

    // Add activity in subcollection
    await docRef.collection('activities').add({
      type: 'STATUS_CHANGE',
      title: `Pipeline Stage: ${prevStatus} ➔ ${newStatus.toUpperCase()}`,
      details: note || `Stage updated by ${advisorName || 'Advisor'}`,
      advisor: advisorName || 'Advisor',
      createdAt: now
    });

    res.json({ success: true, message: `Status updated to ${newStatus}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/:id/remark - Add Remark with Next Call Schedule & History
router.post('/:id/remark', async (req, res) => {
  const { remark, remarkType, nextCallDate, nextCallTime, nextCallReason, advisorName } = req.body;
  
  if (!remark && !nextCallDate) {
    return res.status(400).json({ success: false, error: 'Remark text or next callback date is required' });
  }

  const now = new Date().toISOString();

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    // SALES security check
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(doc.data(), req.user)) {
      return res.status(403).json({ success: false, error: 'Access restricted: You can only update leads assigned to you.' });
    }

    const typeLabel = remarkType || 'Remark / Update';
    let title = `📝 Remark: ${typeLabel}`;
    let details = remark || '';

    if (nextCallDate) {
      const scheduleInfo = `⏰ Next Call Scheduled: ${nextCallDate} ${nextCallTime ? 'at ' + nextCallTime : ''}`;
      if (nextCallReason) {
        details = details ? `${details} | ${scheduleInfo} (Reason: ${nextCallReason})` : `${scheduleInfo} (Reason: ${nextCallReason})`;
      } else {
        details = details ? `${details} | ${scheduleInfo}` : scheduleInfo;
      }
    }

    const activityRecord = {
      type: 'REMARK',
      remarkType: typeLabel,
      title,
      details,
      rawRemark: remark || '',
      nextCallDate: nextCallDate || null,
      nextCallTime: nextCallTime || null,
      nextCallReason: nextCallReason || null,
      advisor: advisorName || 'Advisor',
      createdAt: now
    };

    // Save into activities subcollection
    await docRef.collection('activities').add(activityRecord);

    // Update parent lead with latest remark & next call schedule for instant UI display
    const updatePayload = {
      lastRemark: remark || details,
      lastRemarkAt: now,
      updatedAt: now
    };

    if (nextCallDate) {
      updatePayload.nextCallDate = nextCallDate;
      updatePayload.nextCallTime = nextCallTime || '10:00 AM';
      updatePayload.nextCallReason = nextCallReason || 'Scheduled Follow-up';
      updatePayload.followupStatus = 'PENDING';
    }

    await docRef.update(updatePayload);

    res.json({ success: true, message: 'Remark and follow-up saved to Firestore', activity: activityRecord });
  } catch (error) {
    console.error('Error saving remark:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/:id/call - Phone Call Logger with 4 Categories & Smart RNR 3-Strike Automation
router.post('/:id/call', async (req, res) => {
  const { outcome, duration, notes, nextCallDate, nextCallTime, nextCallReason, advisorName } = req.body;
  const now = new Date().toISOString();

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    const leadData = doc.data() || {};

    // SALES security check
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(leadData, req.user)) {
      return res.status(403).json({ success: false, error: 'Access restricted: You can only update leads assigned to you.' });
    }

    const normOutcome = String(outcome || '').toLowerCase();
    const currentRnr = Number(leadData.rnrCount || 0);
    let newRnrCount = currentRnr;
    let autoStageChanged = false;
    let callTitle = `📞 Call: ${outcome || 'Connected'}`;
    let callDetails = notes ? `Feedback: ${notes}` : 'Call placed to customer';

    const updateData = {
      lastContactedAt: now,
      lastRemark: notes || `Call: ${outcome}`,
      lastRemarkAt: now,
      updatedAt: now
    };

    // ============================================================
    // 4 OUTCOME CATEGORIES PROCESSING
    // ============================================================
    if (normOutcome.includes('rnr') || normOutcome.includes('ringing') || normOutcome.includes('no answer') || normOutcome.includes('not reachable')) {
      // Category 1: RNR (Ringing No Response / Not Reachable)
      newRnrCount = currentRnr + 1;
      updateData.rnrCount = newRnrCount;

      if (newRnrCount >= 3) {
        // 3-STRIKE AUTO MODE: Automatically move to Lost / Not Interested
        updateData.rnrStatus = 'RNR_3';
        updateData.status = 'lost';
        updateData.subStatus = 'Not Interested (Auto RNR 3-Strike Rule)';
        updateData.autoLostReason = 'Auto-moved to Not Interested after 3 consecutive unanswered calls (RNR 1, RNR 2, RNR 3)';
        updateData.lastRemark = notes ? `${notes} [Auto-Marked Not Interested: 3x RNR reached]` : 'Auto-marked Not Interested after 3 consecutive RNR calls';
        callTitle = '🚨 Call: RNR 3 (Third Strike -> Auto Not Interested)';
        autoStageChanged = true;
      } else if (newRnrCount === 2) {
        updateData.rnrStatus = 'RNR_2';
        updateData.subStatus = 'RNR 2 (Second Attempt)';
        updateData.status = 'contacted';
        callTitle = '⚠️ Call: RNR 2 (Second Attempt)';
      } else {
        updateData.rnrStatus = 'RNR_1';
        updateData.subStatus = 'RNR 1 (First Attempt)';
        updateData.status = 'contacted';
        callTitle = '⚠️ Call: RNR 1 (First Attempt)';
      }
    } else if (normOutcome.includes('not interested') || normOutcome.includes('not_interested') || normOutcome.includes('mismatch') || normOutcome.includes('lost') || normOutcome.includes('not needed')) {
      // Category 4: Not Interested (Direct / Immediate)
      updateData.status = 'lost';
      updateData.subStatus = 'Not Interested (Direct)';
      updateData.rnrStatus = null;
      callTitle = '❌ Call: Not Interested (Closed Lost)';
    } else if (normOutcome.includes('prospect') || (normOutcome.includes('interested') && !normOutcome.includes('not')) || normOutcome.includes('brochure') || normOutcome.includes('consultation')) {
      // Category 2: Prospect (Interested Client / Request Received)
      updateData.rnrCount = 0;
      updateData.rnrStatus = null;
      updateData.subStatus = 'Prospect (Client Interested)';
      updateData.status = (leadData.status === 'new' || !leadData.status) ? 'contacted' : leadData.status;
      callTitle = '🌟 Call: Prospect (Client Interested)';
    } else if (normOutcome.includes('callback') || normOutcome.includes('call back') || nextCallDate) {
      // Category 3: Call Back (Scheduled Callback)
      updateData.subStatus = `Callback Scheduled (${nextCallDate || 'Upcoming'})`;
      updateData.status = (leadData.status === 'new' || !leadData.status) ? 'contacted' : leadData.status;
      callTitle = `⏰ Call: Callback Scheduled for ${nextCallDate || 'Later'}`;
    } else {
      // General Connected
      if ((leadData.status || 'new').toLowerCase() === 'new') {
        updateData.status = 'contacted';
      }
    }

    if (nextCallDate) {
      callDetails += ` | ⏰ Next Call: ${nextCallDate} ${nextCallTime ? 'at ' + nextCallTime : ''} (${nextCallReason || outcome || 'Follow-up'})`;
      updateData.nextCallDate = nextCallDate;
      updateData.nextCallTime = nextCallTime || '10:00 AM';
      updateData.nextCallReason = nextCallReason || outcome || 'Follow-up';
      updateData.followupStatus = 'PENDING';
    }

    // Save Call Activity
    await docRef.collection('activities').add({
      type: 'CALL_LOG',
      title: callTitle,
      details: callDetails,
      outcome: outcome || 'Connected',
      rnrAttempt: (normOutcome.includes('rnr') || normOutcome.includes('ringing')) ? newRnrCount : null,
      duration: duration || '1-3 mins',
      notes: notes || '',
      nextCallDate: nextCallDate || null,
      nextCallTime: nextCallTime || null,
      nextCallReason: nextCallReason || null,
      advisor: advisorName || req.user?.name || 'Advisor',
      createdAt: now
    });

    // If Auto 3-strike triggered, log automated rule entry in timeline
    if (autoStageChanged) {
      await docRef.collection('activities').add({
        type: 'AUTO_STAGE_CHANGE',
        title: '🤖 Auto Mode: Moved to Not Interested',
        details: '3 consecutive unanswered calls (RNR 1, RNR 2, RNR 3) logged. Lead automatically moved to Closed / Lost.',
        advisor: 'System Automation',
        createdAt: now
      });
    }

    await docRef.update(updateData);

    res.json({
      success: true,
      message: autoStageChanged 
        ? '⚠️ 3rd RNR logged! Lead automatically moved to Not Interested / Closed.' 
        : 'Call log and status saved successfully.',
      rnrCount: updateData.rnrCount || 0,
      status: updateData.status,
      subStatus: updateData.subStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/leads/:id/complete-followup - Mark scheduled call as done
router.patch('/:id/complete-followup', async (req, res) => {
  const { advisorName, note } = req.body;
  const now = new Date().toISOString();

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    // SALES security check
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(doc.data(), req.user)) {
      return res.status(403).json({ success: false, error: 'Access restricted: You can only update leads assigned to you.' });
    }

    const prevCallDate = doc.data().nextCallDate;

    await docRef.update({
      followupStatus: 'COMPLETED',
      lastFollowupCompletedAt: now,
      updatedAt: now
    });

    await docRef.collection('activities').add({
      type: 'FOLLOWUP_DONE',
      title: '✅ Follow-up Call Completed',
      details: note || `Scheduled call for ${prevCallDate || 'today'} was completed by ${advisorName || 'Advisor'}`,
      advisor: advisorName || 'Advisor',
      createdAt: now
    });

    res.json({ success: true, message: 'Follow-up marked as completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/:id/whatsapp-log - WhatsApp Outreach Interaction Logger
router.post('/:id/whatsapp-log', async (req, res) => {
  const { advisorName, notes } = req.body;
  const now = new Date().toISOString();

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    // SALES security check
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(doc.data(), req.user)) {
      return res.status(403).json({ success: false, error: 'Access restricted: You can only update leads assigned to you.' });
    }

    await docRef.collection('activities').add({
      type: 'WHATSAPP',
      title: '💬 WhatsApp Message Sent',
      details: notes || '1-Click WhatsApp outreach initiated by advisor',
      advisor: advisorName || 'Advisor',
      createdAt: now
    });

    await docRef.update({
      lastContactedAt: now,
      lastRemark: 'WhatsApp message sent',
      lastRemarkAt: now,
      updatedAt: now
    });
    res.json({ success: true, message: 'WhatsApp interaction recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/:id/site-visit - Schedule Site Visit in Firestore
router.post('/:id/site-visit', async (req, res) => {
  const { visitDate, visitTime, property, notes, advisorName } = req.body;
  const now = new Date().toISOString();

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    // SALES security check
    if (req.user && req.user.role === 'SALES' && !isLeadAssignedToUser(doc.data(), req.user)) {
      return res.status(403).json({ success: false, error: 'Access restricted: You can only update leads assigned to you.' });
    }

    await docRef.collection('activities').add({
      type: 'SITE_VISIT',
      title: `🏢 Site Visit Scheduled: ${property || 'Property'}`,
      details: `Scheduled for ${visitDate} at ${visitTime}. Notes: ${notes || 'No special instructions'}`,
      visitDate,
      visitTime,
      property,
      advisor: advisorName || 'Advisor',
      createdAt: now
    });

    await docRef.update({
      status: 'site_visit',
      nextCallDate: visitDate,
      nextCallTime: visitTime,
      nextCallReason: `Site Visit at ${property || 'Site'}`,
      followupStatus: 'PENDING',
      updatedAt: now
    });
    res.json({ success: true, message: 'Site visit scheduled and logged in Firestore' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/leads/:id/assign - Assign lead & task (Super Admin & Manager only)
router.patch('/:id/assign', requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'), async (req, res) => {
  const { 
    assignedTo, 
    assignedToEmail,
    assignedTask, 
    taskDueDate, 
    taskDueTime, 
    taskPriority, 
    taskInstructions, 
    advisorName 
  } = req.body;
  
  const now = new Date().toISOString();

  try {
    const docRef = db.collection('leads').doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ success: false, error: 'Lead not found' });

    const cleanAssignee = String(assignedTo || 'Unassigned').trim();
    const isSelfAssign = (advisorName && cleanAssignee.toLowerCase().includes(advisorName.toLowerCase()));
    const assignerLabel = advisorName || 'Manager (Priya)';

    const updatePayload = {
      assignedTo: cleanAssignee,
      assignedToEmail: assignedToEmail || null,
      assignedBy: assignerLabel,
      assignedAt: now,
      updatedAt: now
    };

    let activityTitle = `👤 Lead Assigned to ${cleanAssignee}`;
    let activityDetails = `Assigned by ${assignerLabel}`;

    if (assignedTask) {
      updatePayload.assignedTask = assignedTask;
      updatePayload.taskDueDate = taskDueDate || null;
      updatePayload.taskDueTime = taskDueTime || null;
      updatePayload.taskPriority = taskPriority || 'HIGH';
      updatePayload.taskInstructions = taskInstructions || '';
      updatePayload.taskStatus = 'PENDING';
      updatePayload.taskAssignedAt = now;

      activityTitle = `📋 Task Assigned to ${cleanAssignee}: ${assignedTask}`;
      activityDetails = `Assigned by: ${assignerLabel} | Due: ${taskDueDate || 'Today'} ${taskDueTime || ''} | Priority: ${taskPriority || 'HIGH'}${taskInstructions ? ` | Instructions: "${taskInstructions}"` : ''}`;

      // If scheduled, set follow-up schedule as well
      if (taskDueDate) {
        updatePayload.nextCallDate = taskDueDate;
        updatePayload.nextCallTime = taskDueTime || '11:00 AM';
        updatePayload.nextCallReason = `Task: ${assignedTask}`;
        updatePayload.followupStatus = 'PENDING';
      }
    }

    await docRef.update(updatePayload);

    await docRef.collection('activities').add({
      type: assignedTask ? 'TASK_ASSIGNMENT' : 'ASSIGNMENT',
      title: activityTitle,
      details: activityDetails,
      assignedTo: cleanAssignee,
      assignedTask: assignedTask || null,
      taskDueDate: taskDueDate || null,
      taskInstructions: taskInstructions || null,
      advisor: assignerLabel,
      createdAt: now
    });

    res.json({ 
      success: true, 
      message: `Lead ${assignedTask ? 'and task ' : ''}assigned to ${cleanAssignee}`,
      lead: { id: req.params.id, ...updatePayload }
    });
  } catch (error) {
    console.error('Error assigning lead:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/assign-bulk - Bulk assign leads (Super Admin & Manager only)
router.post('/assign-bulk', requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SALES_MANAGER'), async (req, res) => {
  const { 
    leadIds, 
    assignedTo, 
    assignedToEmail,
    assignedTask, 
    taskDueDate, 
    taskDueTime, 
    taskPriority, 
    taskInstructions, 
    advisorName 
  } = req.body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return res.status(400).json({ success: false, error: 'No lead IDs provided for bulk assignment' });
  }

  const cleanAssignee = String(assignedTo || 'Unassigned').trim();
  const assignerLabel = advisorName || 'Manager (Priya)';
  const now = new Date().toISOString();
  let updatedCount = 0;

  try {
    for (const id of leadIds) {
      const docRef = db.collection('leads').doc(id);
      const updatePayload = {
        assignedTo: cleanAssignee,
        assignedToEmail: assignedToEmail || null,
        assignedBy: assignerLabel,
        assignedAt: now,
        updatedAt: now
      };

      if (assignedTask) {
        updatePayload.assignedTask = assignedTask;
        updatePayload.taskDueDate = taskDueDate || null;
        updatePayload.taskDueTime = taskDueTime || null;
        updatePayload.taskPriority = taskPriority || 'HIGH';
        updatePayload.taskInstructions = taskInstructions || '';
        updatePayload.taskStatus = 'PENDING';
        updatePayload.taskAssignedAt = now;

        if (taskDueDate) {
          updatePayload.nextCallDate = taskDueDate;
          updatePayload.nextCallTime = taskDueTime || '11:00 AM';
          updatePayload.nextCallReason = `Bulk Task: ${assignedTask}`;
          updatePayload.followupStatus = 'PENDING';
        }
      }

      await docRef.update(updatePayload);

      await docRef.collection('activities').add({
        type: assignedTask ? 'TASK_ASSIGNMENT' : 'ASSIGNMENT',
        title: `📋 Bulk Dispatch: Lead assigned to ${cleanAssignee}`,
        details: `Dispatched by ${assignerLabel}${assignedTask ? ` | Task: ${assignedTask} (Due: ${taskDueDate || 'Today'})` : ''}`,
        assignedTo: cleanAssignee,
        advisor: assignerLabel,
        createdAt: now
      });

      updatedCount++;
    }

    res.json({
      success: true,
      message: `Successfully dispatched ${updatedCount} leads to ${cleanAssignee}`,
      assignedCount: updatedCount,
      assignedTo: cleanAssignee
    });
  } catch (error) {
    console.error('Error during bulk assignment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/create - Create a lead manually in Firestore
router.post('/create', async (req, res) => {
  const { name, phone, email, project, notes, budget, city, source, assignedTo, assignedToEmail, buyerType, intent, timeline } = req.body;

  if (!phone) {
    return res.status(400).json({ success: false, error: 'Phone number is required' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '');
  const cleanProj = String(project || 'lead').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 15);
  const dateStr = new Date().toISOString().slice(0, 10);
  const inquiryId = `MAN_${cleanPhone}_${cleanProj}_${dateStr}`;
  const now = new Date().toISOString();

  const locData = normalizeLocation(city, project, project, notes);

  // If a Sales Executive creates the lead, automatically assign it to them so it remains visible
  const isSales = req.user && req.user.role === 'SALES';
  const finalAssignedTo = assignedTo || (isSales ? req.user.name : 'Unassigned');
  const finalAssignedEmail = assignedToEmail || (isSales ? req.user.email : null);

  const leadScore = Math.min(100, 35 + (email ? 10 : 0) + (project ? 15 : 0) + (budget ? 15 : 0) + (intent === 'Purchase' ? 15 : 0) + (timeline === '0–30 days' ? 10 : 0));
  const recommendedProperties = ['Skyline Residences', 'Harbor View Homes', 'Garden Court'];
  const nextBestAction = timeline === '0–30 days' ? 'Arrange a priority discovery call within 15 minutes.' : 'Send the curated property shortlist and schedule a needs-analysis call.';

  const newLead = {
    inquiryId,
    id: inquiryId,
    name: name || 'Anonymous Lead',
    phone: String(phone).trim(),
    email: email || '',
    project: project || 'General Inquiry',
    property: project || 'General Inquiry',
    notes: notes || '',
    budget: budget || '',
    city: city || locData.cityName,
    locationZone: locData.locationZone,
    subLocality: locData.subLocality,
    displayLocation: locData.displayLocation,
    source: source || 'direct',
    status: 'new',
    buyerType: buyerType || 'Buyer',
    intent: intent || 'Explore options',
    timeline: timeline || '30–90 days',
    leadScore,
    recommendedProperties,
    nextBestAction,
    assignedTo: finalAssignedTo,
    assignedToEmail: finalAssignedEmail,
    createdBy: req.user ? req.user.name : 'System',
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.collection('leads').doc(inquiryId).set(newLead, { merge: true });
    await db.collection('leads').doc(inquiryId).collection('activities').add({
      type: 'NOTE',
      title: 'Live demo lead captured',
      details: `Lead profile created by ${req.user ? req.user.name : 'Advisor'}. Score: ${leadScore}/100. Next action: ${nextBestAction}`,
      advisor: req.user ? req.user.name : 'Advisor',
      createdAt: now
    });

    notifyTeamNewLead(newLead).catch(err => console.error('Notification Error:', err.message));

    res.json({ success: true, lead: { id: inquiryId, ...newLead } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/leads/import-bulk - Bulk Ingestion from Excel / CSV spreadsheet
router.post('/import-bulk', async (req, res) => {
  const { leads, source, defaultProject, advisorName } = req.body;

  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ success: false, error: 'No leads provided in spreadsheet import' });
  }

  const cleanSource = (source || 'other').toLowerCase();
  const now = new Date().toISOString();
  const dateStr = now.slice(0, 10);
  let importedCount = 0;
  let skippedCount = 0;

  const isSales = req.user && req.user.role === 'SALES';

  try {
    for (const item of leads) {
      const rawPhone = String(item.phone || item.mobile || item.Phone || item.Mobile || item['Phone Number'] || item['Contact'] || '').trim();
      const cleanPhone = rawPhone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length < 8) {
        skippedCount++;
        continue;
      }

      const name = String(item.name || item.Name || item['Customer Name'] || item['Full Name'] || item['Buyer Name'] || 'Anonymous Lead').trim();
      const email = String(item.email || item.Email || item['Email Address'] || '').trim();
      const project = String(item.project || item.Project || item.property || item.Property || item['Project Name'] || defaultProject || 'General Portfolio').trim();
      const notes = String(item.notes || item.Notes || item.remark || item.Remark || item.Remarks || item['Remarks'] || item['Query'] || `Imported via spreadsheet`).trim();
      const budget = String(item.budget || item.Budget || item['Budget'] || item.price || item.Price || '').trim();
      const city = String(item.city || item.City || '').trim();
      const stage = String(item.status || item.stage || item.Status || item.Stage || 'new').toLowerCase();

      const cleanIdentifier = project.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 12);
      const inquiryId = `IMP_${cleanSource.toUpperCase()}_${cleanPhone}_${cleanIdentifier}_${dateStr}`;
      const locData = normalizeLocation(city, project, project, notes);

      const leadDoc = {
        inquiryId,
        id: inquiryId,
        name,
        phone: rawPhone,
        email,
        project,
        property: project,
        notes,
        lastRemark: notes,
        lastRemarkAt: now,
        budget,
        city: city || locData.cityName,
        locationZone: locData.locationZone,
        subLocality: locData.subLocality,
        displayLocation: locData.displayLocation,
        source: cleanSource, // '99acres', 'meta', 'broker', 'referral', 'walk-in', 'google', 'website', 'other'
        status: ['new', 'contacted', 'site_visit', 'negotiation', 'won', 'lost'].includes(stage) ? stage : 'new',
        assignedTo: isSales ? req.user.name : (item.assignedTo || 'Unassigned'),
        assignedToEmail: isSales ? req.user.email : (item.assignedToEmail || null),
        importedAt: now,
        createdAt: now,
        updatedAt: now
      };

      const docRef = db.collection('leads').doc(inquiryId);
      await docRef.set(leadDoc, { merge: true });

      await docRef.collection('activities').add({
        type: 'EXCEL_IMPORT',
        title: `📥 Lead Imported via Excel (${cleanSource.toUpperCase()})`,
        details: `Imported by ${advisorName || req.user?.name || 'Admin'}. Project: ${project}. Notes: ${notes}`,
        advisor: advisorName || req.user?.name || 'Admin',
        createdAt: now
      });

      importedCount++;
    }

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} leads into [${cleanSource.toUpperCase()}]`,
      importedCount,
      skippedCount,
      source: cleanSource
    });
  } catch (error) {
    console.error('Error during bulk Excel import:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/leads/:id - Delete lead from Firestore (Super Admin & Admin only)
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    await db.collection('leads').doc(req.params.id).delete();
    res.json({ success: true, message: 'Lead deleted from Firestore' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

