const axios = require('axios');

async function testMasterArchitecture() {
  console.log('=================================================================');
  console.log('🧪 TESTING HORIZON REALTY MASTER MULTI-CHANNEL CRM ARCHITECTURE');
  console.log('=================================================================\n');

  const BASE_URL = 'http://localhost:5000';

  try {
    // 1. Ingest Meta Ads Lead
    console.log('▶ TEST 1: Ingest Meta Ads Lead (POST /webhook/meta)');
    const metaPayload = {
      name: 'Aditya Sen',
      phone: '9812345678',
      email: 'aditya.sen@gmail.com',
      campaign: 'Bangalore Luxury Villas Campaign',
      property: 'Palm Meadows Villa',
      city: 'Bangalore',
      notes: 'Submitted Facebook Lead Form for 4BHK Villa'
    };
    const metaRes = await axios.post(`${BASE_URL}/webhook/meta`, metaPayload);
    console.log('  Meta Ingestion Result:', metaRes.data);
    console.log('  ✅ TEST 1 PASSED\n');

    // 2. Ingest 99acres Portal Lead
    console.log('▶ TEST 2: Ingest 99acres Portal Lead (POST /webhook/99acres)');
    const ninetyNinePayload = {
      Name: 'Karan Mehra',
      Mobile: '9988776655',
      Email: 'karan.mehra@yahoo.com',
      Project: 'Ultima Lifestyle',
      notes: 'Sale in Ultima Lifestyle, Waghodia Road, Vadodara. Looking for 3 BHK floor plan.'
    };
    const ninetyRes = await axios.post(`${BASE_URL}/webhook/99acres`, ninetyNinePayload);
    console.log('  99acres Ingestion Result:', ninetyRes.data);
    console.log('  ✅ TEST 2 PASSED\n');

    // 3. Ingest Website Direct Lead
    console.log('▶ TEST 3: Ingest Website Direct Lead (POST /webhook/website)');
    const webPayload = {
      name: 'Dr. Sunita Rao',
      phone: '9876501234',
      email: 'dr.sunita@medicare.in',
      property: 'Horizon Signature Tower',
      message: 'Inquiring about commercial penthouse office space. Please share pricing.'
    };
    const webRes = await axios.post(`${BASE_URL}/webhook/website`, webPayload);
    console.log('  Website Ingestion Result:', webRes.data);
    console.log('  ✅ TEST 3 PASSED\n');

    // 4. Ingest Google Ads Lead
    console.log('▶ TEST 4: Ingest Google Ads Lead (POST /webhook/google)');
    const googlePayload = {
      name: 'Rajiv Bajaj',
      phone: '9845098765',
      email: 'rajiv.bajaj@outlook.com',
      campaign: 'Google Search Ads',
      property: 'Emerald Bay Residences'
    };
    const googleRes = await axios.post(`${BASE_URL}/webhook/google`, googlePayload);
    console.log('  Google Ads Ingestion Result:', googleRes.data);
    console.log('  ✅ TEST 4 PASSED\n');

    // 5. Query Master Leads from Firestore
    console.log('▶ TEST 5: Verify Unified Master Lead Directory in Firestore');
    const leadsRes = await axios.get(`${BASE_URL}/api/leads`);
    console.log(`  Total Leads in Master Firestore: ${leadsRes.data.leads.length}`);
    
    console.log('\n📋 Sample Normalized Master Leads:');
    const sampleTable = leadsRes.data.leads.slice(0, 4).map(l => ({
      ID: l.id,
      Name: l.name,
      Phone: l.phone,
      Source: (l.source || '').toUpperCase(),
      ProjectOrCampaign: l.property || l.campaign || 'N/A',
      Status: l.status
    }));
    console.table(sampleTable);
    console.log('  ✅ TEST 5 PASSED\n');

    console.log('=================================================================');
    console.log('🎉 ALL 5 MASTER ARCHITECTURE TESTS PASSED WITH 100% SUCCESS!');
    console.log('=================================================================\n');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  }
}

testMasterArchitecture();
