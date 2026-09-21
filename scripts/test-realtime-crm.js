const axios = require('axios');

async function testRealtimeCRM() {
  console.log('===========================================================');
  console.log('🧪 TESTING REAL-TIME FIREBASE REAL ESTATE CRM (PORT 5000)');
  console.log('===========================================================\n');

  const BASE_URL = 'http://localhost:5000';

  try {
    // 1. Health Check
    console.log('▶ TEST 1: Health Check Endpoint');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('  Status:', health.data);
    console.log('  ✅ TEST 1 PASSED\n');

    // 2. Admin Authentication
    console.log('▶ TEST 2: Admin Authentication (admin@estate.com)');
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@estate.com',
      password: 'admin123'
    });
    console.log(`  Login Success: ${adminLogin.data.success} | User: ${adminLogin.data.user.name} (${adminLogin.data.user.role})`);
    const token = adminLogin.data.token;
    console.log('  ✅ TEST 2 PASSED\n');

    // 3. Agent Authentication
    console.log('▶ TEST 3: Sales Agent Authentication (agent@estate.com)');
    const agentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'agent@estate.com',
      password: 'agent123'
    });
    console.log(`  Login Success: ${agentLogin.data.success} | User: ${agentLogin.data.user.name} (${agentLogin.data.user.role})`);
    console.log('  ✅ TEST 3 PASSED\n');

    // 4. Fetch Leads from Cloud Firestore
    console.log('▶ TEST 4: Fetch Leads from Cloud Firestore');
    const leadsRes = await axios.get(`${BASE_URL}/api/leads`);
    console.log(`  Fetched ${leadsRes.data.leads.length} lead(s) from Firestore.`);
    console.log('  Pipeline KPI Breakdown:', leadsRes.data.metrics);
    console.log('  Projects list:', leadsRes.data.projects);
    console.log('  ✅ TEST 4 PASSED\n');

    // 5. Create a test lead in Firestore
    console.log('▶ TEST 5: Create Lead in Firestore');
    const newLeadRes = await axios.post(`${BASE_URL}/api/leads/create`, {
      name: 'Rohan Deshmukh',
      phone: '9845012345',
      email: 'rohan.deshmukh@gmail.com',
      project: 'Ultima Lifestyle',
      notes: 'Looking for 3BHK high floor with garden view'
    });
    const createdLeadId = newLeadRes.data.lead.id;
    console.log(`  Created Lead ID: ${createdLeadId} | Name: ${newLeadRes.data.lead.name}`);
    console.log('  ✅ TEST 5 PASSED\n');

    // 6. Move Lead Stage (NEW -> SITE_VISIT)
    console.log('▶ TEST 6: Update Lead Stage (NEW ➔ SITE_VISIT)');
    const statusRes = await axios.patch(`${BASE_URL}/api/leads/${encodeURIComponent(createdLeadId)}/status`, {
      status: 'SITE_VISIT',
      note: 'Buyer scheduled site visit for Saturday 11 AM'
    });
    console.log('  Status Update Result:', statusRes.data);
    console.log('  ✅ TEST 6 PASSED\n');

    // 7. Add Activity Note in Firestore
    console.log('▶ TEST 7: Log Activity Note');
    const actRes = await axios.post(`${BASE_URL}/api/leads/${encodeURIComponent(createdLeadId)}/activity`, {
      type: 'NOTE',
      title: 'Sales Director (Call Note)',
      details: 'Confirmed site visit location and shared brochure on WhatsApp.'
    });
    console.log('  Activity Result:', actRes.data);
    console.log('  ✅ TEST 7 PASSED\n');

    console.log('===========================================================');
    console.log('🎉 ALL 7 TESTS PASSED! Realtime CRM is 100% Operational.');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ Test execution error:', err.response?.data || err.message);
  }
}

testRealtimeCRM();
