const { pullLeadsFrom99Acres } = require('../src/services/99acres-client');
const db = require('../src/config/firebase');
require('dotenv').config();

async function testAndSync() {
  const username = process.env.NNACRES_USERNAME;
  const password = process.env.NNACRES_PASSWORD;

  if (!username || !password) throw new Error('Set NNACRES_USERNAME and NNACRES_PASSWORD in .env before running this diagnostic.');

  console.log('===========================================================');
  console.log(`🧪 TESTING & SYNCING 99ACRES LEADS: "${username}"`);
  console.log('===========================================================\n');

  const result = await pullLeadsFrom99Acres({
    username,
    password
  });

  console.log('\n===========================================================');
  console.log('📊 TEST RESULT SUMMARY');
  console.log('===========================================================');
  console.log(`HTTP Status:        ${result.httpStatus}`);
  console.log(`ActionStatus:       ${result.actionStatus ? 'SUCCESS (true)' : 'FAILED (false)'}`);

  if (result.error) {
    console.log(`\n❌ 99acres Error Returned:`);
    console.log(`   Code:    ${result.error.code}`);
    console.log(`   Message: ${result.error.message}`);
    return;
  }

  console.log(`\n🎉 99ACRES AUTHENTICATION PASSED!`);
  console.log(`📥 Total Leads Received:   ${result.leadsCount}`);

  if (result.leads && result.leads.length > 0) {
    console.log('\n📋 Syncing Real 99acres Leads to Cloud Firestore:');
    let saved = 0;
    const now = new Date();

    for (const lead of result.leads) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      const leadId = lead.inquiryId || `99A_${cleanPhone}_${now.toISOString().slice(0, 10)}`;

      const leadDoc = {
        id: leadId,
        queryId: lead.queryId || null,
        resType: lead.resType || 'S2M',
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: '99acres',
        projectName: lead.projectName || lead.property,
        cityName: lead.cityName || 'Bangalore',
        price: lead.price || null,
        property: lead.property,
        notes: lead.notes,
        status: 'new',
        phoneVerification: lead.phoneVerification || 'Verified',
        assignedTo: 'Unassigned',
        receivedOn99Acres: lead.receivedOn,
        createdAt: lead.receivedOn ? new Date(lead.receivedOn).toISOString() : now.toISOString(),
        updatedAt: now.toISOString()
      };

      const docRef = db.collection('leads').doc(leadId);
      const existing = await docRef.get();

      if (!existing.exists) {
        await docRef.set(leadDoc);
        await docRef.collection('activities').add({
          type: '99ACRES_SYNC',
          title: 'Lead Captured via 99acres Pull API',
          details: `Project: ${leadDoc.projectName} (${leadDoc.cityName}). Query: ${leadDoc.notes}`,
          createdAt: now.toISOString()
        });
        saved++;
        console.log(`   ✅ Saved: ${lead.name} (${lead.phone}) | ${leadDoc.projectName} (${leadDoc.price || 'N/A'})`);
      } else {
        console.log(`   ℹ️ Already exists: ${lead.name} (${leadId})`);
      }
    }
    console.log(`\n🔥 ${saved} new lead(s) successfully written to Firestore.`);
  }

  console.log('===========================================================\n');
}

testAndSync().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

