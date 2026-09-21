const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'db_store.json');

if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

const DEFAULT_STORE = {
  users: {
    usr_admin: {
      id: 'usr_admin',
      name: 'Avery Morgan (CEO & Admin)',
      email: 'admin@estate.com',
      phone: '9988776650',
      password: 'admin123',
      role: 'SUPER_ADMIN',
      title: 'Chief Executive Officer',
      status: 'Active',
      projects: ['All Projects', 'Sobha Windsor', 'Sobha Neopolis', 'DS Max Sky Samurai'],
      permissions: ['*'],
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-07T08:00:00.000Z'
    },
    usr_priya: {
      id: 'usr_priya',
      name: 'Priya (Sales Manager)',
      email: 'priya@estate.com',
      phone: '9845044556',
      password: 'priya123',
      role: 'MANAGER',
      title: 'Sales & Operations Manager',
      status: 'Active',
      projects: ['All Projects', 'Sobha Windsor', 'Sobha Neopolis', 'East Bangalore'],
      permissions: ['assign_leads', 'assign_tasks', 'read_leads', 'edit_leads', 'log_calls', 'log_whatsapp', 'schedule_visits'],
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-07T08:00:00.000Z'
    },
    usr_maya: {
      id: 'usr_maya',
      name: 'Maya (Sales Executive)',
      email: 'maya@estate.com',
      phone: '9845077889',
      password: 'maya123',
      role: 'SALES',
      title: 'Senior Sales Advisor',
      status: 'Active',
      projects: ['Sobha Windsor', 'East Bangalore', 'Whitefield'],
      permissions: ['read_assigned_leads', 'log_calls', 'log_whatsapp', 'schedule_visits', 'update_stage', 'add_remarks'],
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-07T08:00:00.000Z'
    },
    usr_arjun: {
      id: 'usr_arjun',
      name: 'Arjun (Sales Executive)',
      email: 'arjun@estate.com',
      phone: '9845022334',
      password: 'arjun123',
      role: 'SALES',
      title: 'Senior Sales Advisor',
      status: 'Active',
      projects: ['Sobha Neopolis', 'North Bangalore', 'Yelahanka'],
      permissions: ['read_assigned_leads', 'log_calls', 'log_whatsapp', 'schedule_visits', 'update_stage', 'add_remarks'],
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-07T08:00:00.000Z'
    },
    usr_test_sales: {
      id: 'usr_test_sales',
      name: 'Test (Sales Executive)',
      email: 'test@estate.com',
      phone: '9876543210',
      password: 'test123',
      role: 'SALES',
      title: 'Sales Advisor (Test Account)',
      status: 'Active',
      projects: ['Sobha Windsor', 'East Bangalore'],
      permissions: ['read_assigned_leads', 'log_calls', 'log_whatsapp', 'schedule_visits', 'update_stage', 'add_remarks'],
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-07T08:00:00.000Z'
    }
  },
  leads: {
    'NN_9845112233_sobha_neopolis': {
      id: 'NN_9845112233_sobha_neopolis',
      inquiryId: 'NN_9845112233_sobha_neopolis',
      name: 'Rahul Verma',
      phone: '9845112233',
      email: 'rahul.verma@gmail.com',
      source: '99acres',
      property: 'Sobha Neopolis',
      projectName: 'Sobha Neopolis',
      budget: '₹2.40 Cr',
      price: '₹2.40 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'East Bangalore',
      subLocality: 'Panathur Road',
      displayLocation: 'Panathur Road, East Bangalore',
      status: 'new',
      assignedTo: 'Arjun (Sales Executive)',
      assignedToEmail: 'arjun@estate.com',
      assignedToId: 'usr_arjun',
      advisorName: 'Arjun (Sales Executive)',
      notes: 'Interested in 3 BHK high floor unit with east-facing balcony.',
      leadScore: 92,
      rnrCount: 0,
      createdAt: '2026-09-07T09:15:00.000Z',
      updatedAt: '2026-09-07T09:15:00.000Z'
    },
    'NN_9845223344_sobha_windsor': {
      id: 'NN_9845223344_sobha_windsor',
      inquiryId: 'NN_9845223344_sobha_windsor',
      name: 'Priya Sharma',
      phone: '9845223344',
      email: 'priya.sharma@outlook.com',
      source: '99acres',
      property: 'Sobha Windsor',
      projectName: 'Sobha Windsor',
      budget: '₹3.10 Cr',
      price: '₹3.10 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'East Bangalore',
      subLocality: 'Whitefield',
      displayLocation: 'Whitefield, East Bangalore',
      status: 'contacted',
      assignedTo: 'Maya (Sales Executive)',
      assignedToEmail: 'maya@estate.com',
      assignedToId: 'usr_maya',
      advisorName: 'Maya (Sales Executive)',
      notes: 'Spoke with client. Looking for 4 BHK English architecture apartment.',
      lastRemark: 'Client requested brochure and floor plans on WhatsApp.',
      lastRemarkAt: '2026-09-07T10:00:00.000Z',
      nextCallDate: '2026-09-08',
      nextCallTime: '11:00 AM',
      nextCallReason: 'Follow-up regarding floor plan preferences',
      followupStatus: 'PENDING',
      leadScore: 88,
      rnrCount: 0,
      createdAt: '2026-09-06T14:20:00.000Z',
      updatedAt: '2026-09-07T10:00:00.000Z'
    },
    'NN_9845334455_ds_max_samurai': {
      id: 'NN_9845334455_ds_max_samurai',
      inquiryId: 'NN_9845334455_ds_max_samurai',
      name: 'Karthik Reddy',
      phone: '9845334455',
      email: 'karthik.r@techcorp.com',
      source: '99acres',
      property: 'DS Max Sky Samurai',
      projectName: 'DS Max Sky Samurai',
      budget: '₹95 Lakhs',
      price: '₹95 Lakhs',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'South Bangalore',
      subLocality: 'Electronic City',
      displayLocation: 'Electronic City, South Bangalore',
      status: 'site_visit',
      assignedTo: 'Arjun (Sales Executive)',
      assignedToEmail: 'arjun@estate.com',
      assignedToId: 'usr_arjun',
      advisorName: 'Arjun (Sales Executive)',
      notes: 'Site visit scheduled for upcoming Saturday.',
      lastRemark: 'Confirmed site visit with client and sales desk.',
      lastRemarkAt: '2026-09-07T11:30:00.000Z',
      nextCallDate: '2026-09-09',
      nextCallTime: '03:00 PM',
      nextCallReason: 'Site Visit at DS Max Sky Samurai',
      followupStatus: 'PENDING',
      leadScore: 95,
      rnrCount: 0,
      createdAt: '2026-09-05T11:00:00.000Z',
      updatedAt: '2026-09-07T11:30:00.000Z'
    },
    'NN_9845445566_brigade_sanctuary': {
      id: 'NN_9845445566_brigade_sanctuary',
      inquiryId: 'NN_9845445566_brigade_sanctuary',
      name: 'Ananya Sengupta',
      phone: '9845445566',
      email: 'ananya.s@gmail.com',
      source: '99acres',
      property: 'Brigade Sanctuary',
      projectName: 'Brigade Sanctuary',
      budget: '₹1.85 Cr',
      price: '₹1.85 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'East Bangalore',
      subLocality: 'Sarjapur Road',
      displayLocation: 'Sarjapur Road, East Bangalore',
      status: 'negotiation',
      assignedTo: 'Priya (Sales Manager)',
      assignedToEmail: 'priya@estate.com',
      assignedToId: 'usr_priya',
      advisorName: 'Priya (Sales Manager)',
      notes: 'Negotiating final floor rise charges and car parking slots.',
      lastRemark: 'Client agreed on unit #1402, reviewing payment milestones.',
      lastRemarkAt: '2026-09-07T12:00:00.000Z',
      leadScore: 96,
      rnrCount: 0,
      createdAt: '2026-09-04T09:30:00.000Z',
      updatedAt: '2026-09-07T12:00:00.000Z'
    },
    'NN_9845556677_prestige_elm_park': {
      id: 'NN_9845556677_prestige_elm_park',
      inquiryId: 'NN_9845556677_prestige_elm_park',
      name: 'Suresh Hegde',
      phone: '9845556677',
      email: 'suresh.hegde@infosys.com',
      source: '99acres',
      property: 'Prestige Elm Park',
      projectName: 'Prestige Elm Park',
      budget: '₹2.75 Cr',
      price: '₹2.75 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'East Bangalore',
      subLocality: 'Whitefield',
      displayLocation: 'Whitefield, East Bangalore',
      status: 'won',
      assignedTo: 'Maya (Sales Executive)',
      assignedToEmail: 'maya@estate.com',
      assignedToId: 'usr_maya',
      advisorName: 'Maya (Sales Executive)',
      notes: 'Booking amount received. Agreement signed.',
      lastRemark: 'Deal closed successfully! Advance token payment verified.',
      lastRemarkAt: '2026-09-06T16:00:00.000Z',
      leadScore: 100,
      rnrCount: 0,
      createdAt: '2026-09-03T10:15:00.000Z',
      updatedAt: '2026-09-06T16:00:00.000Z'
    },
    'META_9845667788_whitefield_luxury': {
      id: 'META_9845667788_whitefield_luxury',
      inquiryId: 'META_9845667788_whitefield_luxury',
      name: 'Amit Saxena',
      phone: '9845667788',
      email: 'amit.saxena@gmail.com',
      source: 'meta',
      property: 'Sobha Windsor',
      projectName: 'Sobha Windsor',
      budget: '₹2.10 Cr',
      price: '₹2.10 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'East Bangalore',
      subLocality: 'Whitefield',
      displayLocation: 'Whitefield, East Bangalore',
      status: 'new',
      assignedTo: 'Maya (Sales Executive)',
      assignedToEmail: 'maya@estate.com',
      assignedToId: 'usr_maya',
      advisorName: 'Maya (Sales Executive)',
      notes: 'Inquiry via Instagram Video Ad for luxury 3 BHK homes.',
      leadScore: 84,
      rnrCount: 0,
      createdAt: '2026-09-07T08:30:00.000Z',
      updatedAt: '2026-09-07T08:30:00.000Z'
    },
    'META_9845778899_hebbal_modern': {
      id: 'META_9845778899_hebbal_modern',
      inquiryId: 'META_9845778899_hebbal_modern',
      name: 'Neha Gupta',
      phone: '9845778899',
      email: 'neha.gupta@wipro.com',
      source: 'meta',
      property: 'Sobha Neopolis',
      projectName: 'Sobha Neopolis',
      budget: '₹1.60 Cr',
      price: '₹1.60 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'North Bangalore',
      subLocality: 'Hebbal',
      displayLocation: 'Hebbal, North Bangalore',
      status: 'contacted',
      assignedTo: 'Arjun (Sales Executive)',
      assignedToEmail: 'arjun@estate.com',
      assignedToId: 'usr_arjun',
      advisorName: 'Arjun (Sales Executive)',
      notes: 'Lead from Facebook Lead Generation campaign.',
      lastRemark: 'Connected on phone. Client wants site visit next week.',
      lastRemarkAt: '2026-09-07T11:00:00.000Z',
      leadScore: 82,
      rnrCount: 0,
      createdAt: '2026-09-06T15:45:00.000Z',
      updatedAt: '2026-09-07T11:00:00.000Z'
    },
    'BRK_9845889900_golfshire_villa': {
      id: 'BRK_9845889900_golfshire_villa',
      inquiryId: 'BRK_9845889900_golfshire_villa',
      name: 'Vikram Malhotra',
      phone: '9845889900',
      email: 'vikram.malhotra@malhotragroup.com',
      source: 'broker',
      property: 'Prestige Golfshire',
      projectName: 'Prestige Golfshire',
      budget: '₹7.50 Cr',
      price: '₹7.50 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'North Bangalore',
      subLocality: 'Nandi Hills',
      displayLocation: 'Nandi Hills, North Bangalore',
      status: 'new',
      assignedTo: 'Unassigned',
      assignedToEmail: null,
      advisorName: null,
      notes: 'Broker referral for 4 BHK golf-facing luxury villa.',
      leadScore: 98,
      rnrCount: 0,
      createdAt: '2026-09-07T13:00:00.000Z',
      updatedAt: '2026-09-07T13:00:00.000Z'
    },
    'DIR_9845990011_purva_atmosphere': {
      id: 'DIR_9845990011_purva_atmosphere',
      inquiryId: 'DIR_9845990011_purva_atmosphere',
      name: 'Priya Krishnan',
      phone: '9845990011',
      email: 'priya.k@gmail.com',
      source: 'direct',
      property: 'Purva Atmosphere',
      projectName: 'Purva Atmosphere',
      budget: '₹2.10 Cr',
      price: '₹2.10 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'North Bangalore',
      subLocality: 'Thanisandra',
      displayLocation: 'Thanisandra, North Bangalore',
      status: 'contacted',
      assignedTo: 'Test (Sales Executive)',
      assignedToEmail: 'test@estate.com',
      assignedToId: 'usr_test_sales',
      advisorName: 'Test (Sales Executive)',
      notes: 'Direct website inquiry for modern air-cleaning tower apartments.',
      leadScore: 89,
      rnrCount: 0,
      createdAt: '2026-09-06T18:00:00.000Z',
      updatedAt: '2026-09-07T09:00:00.000Z'
    },
    'NN_9845001122_lost_rnr_sample': {
      id: 'NN_9845001122_lost_rnr_sample',
      inquiryId: 'NN_9845001122_lost_rnr_sample',
      name: 'Rajesh Kannan',
      phone: '9845001122',
      email: 'rajesh.k@gmail.com',
      source: '99acres',
      property: 'Sobha Windsor',
      projectName: 'Sobha Windsor',
      budget: '₹1.90 Cr',
      price: '₹1.90 Cr',
      cityName: 'Bangalore',
      city: 'Bangalore',
      locationZone: 'East Bangalore',
      subLocality: 'Whitefield',
      displayLocation: 'Whitefield, East Bangalore',
      status: 'lost',
      subStatus: 'Not Interested (Auto RNR 3-Strike Rule)',
      assignedTo: 'Maya (Sales Executive)',
      assignedToEmail: 'maya@estate.com',
      assignedToId: 'usr_maya',
      advisorName: 'Maya (Sales Executive)',
      notes: 'Attempted 3 calls on different days, no response.',
      lastRemark: 'Auto-marked Not Interested after 3 consecutive RNR calls',
      rnrCount: 3,
      rnrStatus: 'RNR_3',
      autoLostReason: 'Auto-moved to Not Interested after 3 consecutive unanswered calls (RNR 1, RNR 2, RNR 3)',
      leadScore: 20,
      createdAt: '2026-09-02T10:00:00.000Z',
      updatedAt: '2026-09-07T08:00:00.000Z'
    }
  },
  activities: {
    'NN_9845112233_sobha_neopolis': [
      {
        id: 'act_1',
        type: 'INQUIRY_RECEIVED',
        title: '🌟 99acres Inquiry Ingested',
        details: 'Received from 99acres API for Sobha Neopolis',
        createdAt: '2026-09-07T09:15:00.000Z'
      }
    ],
    'NN_9845223344_sobha_windsor': [
      {
        id: 'act_2',
        type: 'CALL_LOG',
        title: '📞 Call: Connected',
        details: 'Spoke with Priya. Interested in 4 BHK. Requested floor plan brochure on WhatsApp.',
        advisor: 'Maya (Sales Executive)',
        createdAt: '2026-09-07T10:00:00.000Z'
      }
    ],
    'NN_9845334455_ds_max_samurai': [
      {
        id: 'act_3',
        type: 'SITE_VISIT',
        title: '🏢 Site Visit Scheduled: DS Max Sky Samurai',
        details: 'Scheduled for 2026-09-09 at 03:00 PM',
        advisor: 'Arjun (Sales Executive)',
        createdAt: '2026-09-07T11:30:00.000Z'
      }
    ]
  }
};

class ResilientLocalStore {
  constructor() {
    this.store = DEFAULT_STORE;
    this.listeners = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const raw = fs.readFileSync(STORE_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        this.store = Object.assign({}, DEFAULT_STORE, parsed);
        if (!this.store.users || Object.keys(this.store.users).length === 0) this.store.users = DEFAULT_STORE.users;
        if (!this.store.leads || Object.keys(this.store.leads).length === 0) this.store.leads = DEFAULT_STORE.leads;
        if (!this.store.activities) this.store.activities = DEFAULT_STORE.activities;
      } else {
        this.save();
      }
    } catch (e) {
      this.store = DEFAULT_STORE;
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(STORE_PATH, JSON.stringify(this.store, null, 2), 'utf8');
    } catch (e) {}
  }

  notify(collectionName, type, docData) {
    const list = this.listeners.get(collectionName) || [];
    list.forEach(cb => {
      try { cb({ type, doc: docData }); } catch (e) {}
    });
  }

  on(collectionName, cb) {
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, []);
    }
    this.listeners.get(collectionName).push(cb);
  }

  getCollectionDocs(name) {
    this.load();
    const coll = this.store[name] || {};
    return Object.keys(coll).map(id => ({
      id,
      exists: true,
      data: () => Object.assign({}, coll[id])
    }));
  }

  getDoc(collName, docId) {
    this.load();
    const coll = this.store[collName] || {};
    const data = coll[docId];
    return {
      id: docId,
      exists: !!data,
      data: () => (data ? Object.assign({}, data) : undefined)
    };
  }

  setDoc(collName, docId, data, options = {}) {
    if (!this.store[collName]) this.store[collName] = {};
    if (options.merge && this.store[collName][docId]) {
      this.store[collName][docId] = Object.assign({}, this.store[collName][docId], data, { id: docId });
    } else {
      this.store[collName][docId] = Object.assign({}, data, { id: docId });
    }
    this.save();
    this.notify(collName, 'modified', this.store[collName][docId]);
    return Promise.resolve();
  }

  updateDoc(collName, docId, data) {
    if (!this.store[collName]) this.store[collName] = {};
    if (!this.store[collName][docId]) {
      this.store[collName][docId] = { id: docId, ...data };
    } else {
      this.store[collName][docId] = Object.assign({}, this.store[collName][docId], data);
    }
    this.save();
    this.notify(collName, 'modified', this.store[collName][docId]);
    return Promise.resolve();
  }

  deleteDoc(collName, docId) {
    if (this.store[collName] && this.store[collName][docId]) {
      const old = this.store[collName][docId];
      delete this.store[collName][docId];
      this.save();
      this.notify(collName, 'removed', old);
    }
    return Promise.resolve();
  }

  getSubCollectionDocs(parentColl, docId, subColl) {
    if (subColl === 'activities') {
      const acts = (this.store.activities && this.store.activities[docId]) || [];
      return acts.map((a, idx) => ({
        id: a.id || `act_${idx}`,
        exists: true,
        data: () => Object.assign({}, a)
      }));
    }
    return [];
  }

  addSubDoc(parentColl, docId, subColl, data) {
    if (!this.store[subColl]) this.store[subColl] = {};
    if (!this.store[subColl][docId]) this.store[subColl][docId] = [];
    const autoId = `act_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const newRecord = Object.assign({ id: autoId }, data);
    this.store[subColl][docId].push(newRecord);
    this.save();
    return Promise.resolve({ id: autoId });
  }
}

const localStore = new ResilientLocalStore();

// Initialize native Firestore if available
let rawFirestore = null;
let serviceAccount = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try { serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON); } catch (e) {}
}

if (!serviceAccount) {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    ? path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    : path.resolve(__dirname, '../../service-account.json');

  if (fs.existsSync(saPath)) {
    try { serviceAccount = require(saPath); } catch (e) {}
  }
}

if (!getApps().length && serviceAccount) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
    });
    rawFirestore = getFirestore();
  } catch (e) {
    console.error('Firebase initialize warning:', e.message);
  }
} else if (getApps().length) {
  try { rawFirestore = getFirestore(); } catch (e) {}
}

let isFirestoreQuotaExhausted = false;
let lastQuotaCheckTime = 0;

function canUseFirestore() {
  if (!rawFirestore) return false;
  if (isFirestoreQuotaExhausted) {
    if (Date.now() - lastQuotaCheckTime > 30 * 60 * 1000) {
      isFirestoreQuotaExhausted = false;
      return true;
    }
    return false;
  }
  return true;
}

function handleFirestoreError(err, context = '') {
  if (err && (String(err.message).includes('RESOURCE_EXHAUSTED') || String(err.message).includes('Quota exceeded'))) {
    if (!isFirestoreQuotaExhausted) {
      console.warn(`🚨 [Resilient DB] Cloud Firestore daily quota reached. Switching to ultra-fast local persistent store.`);
    }
    isFirestoreQuotaExhausted = true;
    lastQuotaCheckTime = Date.now();
  } else {
    console.warn(`[Resilient DB] Firestore ${context} fallback: ${err.message}`);
  }
}

// Resilient Proxy Factory for Collections
function createResilientCollection(collName) {
  return {
    where: function(field, op, val) {
      return {
        get: async function() {
          const docs = localStore.getCollectionDocs(collName);
          const filtered = docs.filter(d => {
            const data = d.data();
            if (op === '==') return data[field] === val;
            if (op === '!=') return data[field] !== val;
            if (op === 'in') return Array.isArray(val) && val.includes(data[field]);
            return true;
          });
          return {
            size: filtered.length,
            empty: filtered.length === 0,
            docs: filtered,
            forEach: function(fn) { filtered.forEach(fn); }
          };
        }
      };
    },

    get: async function() {
      if (canUseFirestore()) {
        try {
          const snap = await rawFirestore.collection(collName).get();
          snap.forEach(d => {
            localStore.setDoc(collName, d.id, d.data(), { merge: true });
          });
          return snap;
        } catch (err) {
          handleFirestoreError(err, 'collection read');
        }
      }
      const docs = localStore.getCollectionDocs(collName);
      return {
        size: docs.length,
        empty: docs.length === 0,
        docs: docs,
        forEach: function(fn) {
          docs.forEach(fn);
        }
      };
    },

    doc: function(docId) {
      return {
        id: docId,
        get: async function() {
          // Check local first for instant cache
          const localDoc = localStore.getDoc(collName, docId);
          if (localDoc.exists) {
            return localDoc;
          }
          if (canUseFirestore()) {
            try {
              const snap = await rawFirestore.collection(collName).doc(docId).get();
              if (snap.exists) {
                localStore.setDoc(collName, docId, snap.data(), { merge: true });
              }
              return snap;
            } catch (err) {
              handleFirestoreError(err, 'doc read');
            }
          }
          return localDoc;
        },

        set: async function(data, options = {}) {
          await localStore.setDoc(collName, docId, data, options);
          if (rawFirestore) {
            rawFirestore.collection(collName).doc(docId).set(data, options).catch(err => {
              console.warn(`[Resilient DB] Firestore background sync warning: ${err.message}`);
            });
          }
          return Promise.resolve();
        },

        update: async function(data) {
          await localStore.updateDoc(collName, docId, data);
          if (rawFirestore) {
            rawFirestore.collection(collName).doc(docId).update(data).catch(err => {
              console.warn(`[Resilient DB] Firestore background update warning: ${err.message}`);
            });
          }
          return Promise.resolve();
        },

        delete: async function() {
          await localStore.deleteDoc(collName, docId);
          if (rawFirestore) {
            rawFirestore.collection(collName).doc(docId).delete().catch(err => {
              console.warn(`[Resilient DB] Firestore background delete warning: ${err.message}`);
            });
          }
          return Promise.resolve();
        },

        collection: function(subCollName) {
          return {
            get: async function() {
              if (rawFirestore) {
                try {
                  const snap = await rawFirestore.collection(collName).doc(docId).collection(subCollName).get();
                  return snap;
                } catch (err) {}
              }
              const docs = localStore.getSubCollectionDocs(collName, docId, subCollName);
              return {
                size: docs.length,
                empty: docs.length === 0,
                docs: docs,
                forEach: function(fn) {
                  docs.forEach(fn);
                }
              };
            },
            add: async function(data) {
              const res = await localStore.addSubDoc(collName, docId, subCollName, data);
              if (rawFirestore) {
                rawFirestore.collection(collName).doc(docId).collection(subCollName).add(data).catch(() => {});
              }
              return res;
            }
          };
        }
      };
    },

    add: async function(data) {
      const autoId = `doc_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      await localStore.setDoc(collName, autoId, data);
      if (rawFirestore) {
        rawFirestore.collection(collName).doc(autoId).set(data).catch(() => {});
      }
      return { id: autoId };
    },

    onSnapshot: function(onNext, onError) {
      // Connect to native Firestore snapshot if operational
      if (rawFirestore) {
        try {
          return rawFirestore.collection(collName).onSnapshot(onNext, (err) => {
            console.warn(`[Resilient DB] onSnapshot fallback: ${err.message}`);
            if (onError) onError(err);
          });
        } catch (e) {}
      }
      // Local realtime changes listener
      localStore.on(collName, (event) => {
        const dummySnap = {
          docChanges: () => [{
            type: event.type,
            doc: {
              id: event.doc.id,
              data: () => event.doc
            }
          }]
        };
        onNext(dummySnap);
      });
      return () => {};
    }
  };
}

const db = {
  collection: function(name) {
    return createResilientCollection(name);
  }
};

module.exports = db;

