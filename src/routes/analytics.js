const express = require('express');
const router = express.Router();
const db = require('../config/firebase');

function normalizeStage(raw) {
  const s = String(raw || 'new').toLowerCase().replace(/[\s-]+/g, '_');
  const map = {
    new: 'NEW',
    contacted: 'CONTACTED',
    site_visit: 'SITE_VISIT',
    sitevisit: 'SITE_VISIT',
    negotiation: 'NEGOTIATION',
    won: 'WON',
    lost: 'LOST'
  };
  return map[s] || 'NEW';
}

function isLeadAssignedToUser(lead, user) {
  if (!lead || !user) return false;
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

  if (uEmail && leadEmail && (leadEmail === uEmail || leadEmail.includes(uEmail) || uEmail.includes(leadEmail))) return true;
  if (uId && leadAssignedId && uId === leadAssignedId) return true;
  if (leadAssignedTo) {
    if (uName && leadAssignedTo.includes(uName)) return true;
    if (uFirstName && uFirstName.length >= 3 && leadAssignedTo.includes(uFirstName)) return true;
  }
  if (leadAdvisor) {
    if (uName && leadAdvisor.includes(uName)) return true;
    if (uFirstName && uFirstName.length >= 3 && leadAdvisor.includes(uFirstName)) return true;
  }
  return false;
}

const { normalizeLocation } = require('../utils/locationHelper');

// GET /api/analytics/overview - Generate executive CRM analytics
router.get('/overview', async (req, res) => {
  try {
    const isSalesExecutive = req.user && req.user.role === 'SALES';
    const leadsSnap = await db.collection('leads').get();
    const usersSnap = await db.collection('users').get();

    let totalLeads = 0;
    const stageBreakdown = {
      NEW: 0,
      CONTACTED: 0,
      SITE_VISIT: 0,
      NEGOTIATION: 0,
      WON: 0,
      LOST: 0
    };

    const sourceBreakdown = {};
    const advisorBreakdown = {};
    const propertyBreakdown = {};
    let unassignedCount = 0;

    // Dedicated Team Workload & Regional Distribution Tracker
    const teamStatus = {
      priya: {
        id: 'priya',
        name: 'Priya',
        role: 'Sales Manager',
        email: 'priya@estate.com',
        avatarBg: 'bg-purple-100 text-purple-800 border-purple-300',
        totalLeads: 0,
        activeTasks: 0,
        siteVisits: 0,
        wonDeals: 0,
        zones: { east: 0, north: 0, south: 0, west: 0, central: 0 },
        stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 }
      },
      arjun: {
        id: 'arjun',
        name: 'Arjun',
        role: 'Sales Executive',
        email: 'arjun@estate.com',
        avatarBg: 'bg-blue-100 text-blue-800 border-blue-300',
        totalLeads: 0,
        activeTasks: 0,
        siteVisits: 0,
        wonDeals: 0,
        zones: { east: 0, north: 0, south: 0, west: 0, central: 0 },
        stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 }
      },
      maya: {
        id: 'maya',
        name: 'Maya',
        role: 'Sales Executive',
        email: 'maya@estate.com',
        avatarBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        totalLeads: 0,
        activeTasks: 0,
        siteVisits: 0,
        wonDeals: 0,
        zones: { east: 0, north: 0, south: 0, west: 0, central: 0 },
        stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 }
      },
      test: {
        id: 'test',
        name: 'Test',
        role: 'Sales Executive',
        email: 'test@estate.com',
        avatarBg: 'bg-amber-100 text-amber-800 border-amber-300',
        totalLeads: 0,
        activeTasks: 0,
        siteVisits: 0,
        wonDeals: 0,
        zones: { east: 0, north: 0, south: 0, west: 0, central: 0 },
        stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 }
      },
      unassigned: {
        id: 'unassigned',
        name: 'Unassigned Queue',
        role: 'Awaiting Manager Dispatch',
        avatarBg: 'bg-amber-100 text-amber-900 border-amber-300',
        totalLeads: 0,
        zones: { east: 0, north: 0, south: 0, west: 0, central: 0 }
      }
    };

    let contactedCount = 0;
    let siteVisitCount = 0;
    let wonCount = 0;

    leadsSnap.forEach(doc => {
      const data = doc.data() || {};
      const lead = { id: doc.id, ...data };

      // Enrich Location & Zone
      const loc = normalizeLocation(lead.cityName || lead.city, lead.property || lead.projectName, lead.projectName, lead.notes);
      const zoneName = lead.locationZone || loc.locationZone || 'East Bangalore';

      // Map to Team Member
      const assignedStr = String(lead.assignedTo || lead.advisorName || '').toLowerCase();
      let targetAdvisor = teamStatus.unassigned;

      if (assignedStr.includes('priya')) {
        targetAdvisor = teamStatus.priya;
      } else if (assignedStr.includes('arjun')) {
        targetAdvisor = teamStatus.arjun;
      } else if (assignedStr.includes('maya')) {
        targetAdvisor = teamStatus.maya;
      } else if (assignedStr.includes('test')) {
        targetAdvisor = teamStatus.test;
      }

      targetAdvisor.totalLeads++;

      // Zone tally
      const zLower = zoneName.toLowerCase();
      if (zLower.includes('east')) targetAdvisor.zones.east++;
      else if (zLower.includes('north')) targetAdvisor.zones.north++;
      else if (zLower.includes('south')) targetAdvisor.zones.south++;
      else if (zLower.includes('west')) targetAdvisor.zones.west++;
      else targetAdvisor.zones.central++;

      // Task & Stage tally
      const rawStage = normalizeStage(data.status || data.stage);
      const stageLower = rawStage.toLowerCase();
      if (targetAdvisor.stages && targetAdvisor.stages[stageLower] !== undefined) {
        targetAdvisor.stages[stageLower]++;
      }
      if (lead.assignedTask && lead.taskStatus !== 'COMPLETED' && targetAdvisor.activeTasks !== undefined) {
        targetAdvisor.activeTasks++;
      }
      if (['SITE_VISIT', 'site_visit'].includes(rawStage) && targetAdvisor.siteVisits !== undefined) {
        targetAdvisor.siteVisits++;
      }
      if (rawStage === 'WON' && targetAdvisor.wonDeals !== undefined) {
        targetAdvisor.wonDeals++;
      }

      // Sales Executive only gets global metrics for their assigned portfolio
      if (isSalesExecutive && !isLeadAssignedToUser(lead, req.user)) {
        return;
      }

      totalLeads++;
      const stage = normalizeStage(data.status || data.stage);
      if (stageBreakdown[stage] !== undefined) {
        stageBreakdown[stage]++;
      } else {
        stageBreakdown.NEW++;
      }

      if (['CONTACTED', 'SITE_VISIT', 'NEGOTIATION', 'WON'].includes(stage)) contactedCount++;
      if (['SITE_VISIT', 'NEGOTIATION', 'WON'].includes(stage)) siteVisitCount++;
      if (stage === 'WON') wonCount++;

      const propertyName = String(data.projectName || data.property || data.project || 'General Portfolio').trim();
      if (!propertyBreakdown[propertyName]) propertyBreakdown[propertyName] = { property: propertyName, leads: 0, active: 0, visits: 0, won: 0 };
      propertyBreakdown[propertyName].leads++;
      if (['NEW', 'CONTACTED', 'SITE_VISIT', 'NEGOTIATION'].includes(stage)) propertyBreakdown[propertyName].active++;
      if (['SITE_VISIT', 'NEGOTIATION', 'WON'].includes(stage)) propertyBreakdown[propertyName].visits++;
      if (stage === 'WON') propertyBreakdown[propertyName].won++;
      if (!data.assignedTo || data.assignedTo === 'Unassigned') unassignedCount++;

      const src = data.source || 'Direct';
      sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;

      const adv = typeof data.assignedTo === 'object'
        ? (data.assignedTo.name || 'Unassigned')
        : (data.assignedTo || 'Unassigned');
      advisorBreakdown[adv] = (advisorBreakdown[adv] || 0) + 1;
    });

    const propertyPerformance = Object.values(propertyBreakdown)
      .map(item => ({ ...item, conversionRate: item.leads ? Math.round((item.won / item.leads) * 100) : 0 }))
      .sort((a, b) => b.won - a.won || b.leads - a.leads || b.visits - a.visits);

    const contactRate = totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0;
    const siteVisitRate = totalLeads > 0 ? Math.round((siteVisitCount / totalLeads) * 100) : 0;
    const winRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

    res.json({
      success: true,
      totalLeads,
      isSalesExecutive,
      teamMembersCount: isSalesExecutive ? 1 : usersSnap.size,
      stageBreakdown,
      sourceBreakdown,
      advisorBreakdown,
      propertyPerformance,
      topProperty: propertyPerformance[0] || null,
      unassignedCount,
      teamStatus,
      conversionFunnel: {
        contactRate: `${contactRate}%`,
        siteVisitRate: `${siteVisitRate}%`,
        winRate: `${winRate}%`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
