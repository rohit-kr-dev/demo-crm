const { pullLeadsFrom99Acres } = require('../src/services/99acres-client');
require('dotenv').config();

async function runLiveTest() {
  const args = process.argv.slice(2);
  let customUser = null;
  let customPass = null;
  let customStart = null;
  let customEnd = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--user' || args[i] === '-u') customUser = args[i + 1];
    if (args[i] === '--pass' || args[i] === '-p') customPass = args[i + 1];
    if (args[i] === '--start') customStart = args[i + 1];
    if (args[i] === '--end') customEnd = args[i + 1];
  }

  const username = customUser || process.env.NNACRES_USERNAME;
  const password = customPass || process.env.NNACRES_PASSWORD;

  if (!username || !password) throw new Error('Provide --user and --pass, or set NNACRES_USERNAME and NNACRES_PASSWORD in .env.');

  console.log('\n===========================================================');
  console.log('🧪 99ACRES LIVE PULL API DIAGNOSTIC TEST');
  console.log('===========================================================');
  console.log(`👤 Username: ${username}`);
  console.log(`🔑 Password: ${password.replace(/./g, '*')}`);

  const result = await pullLeadsFrom99Acres({
    username,
    password,
    startDate: customStart,
    endDate: customEnd
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
  } else {
    console.log(`\n✅ 99acres Authentication: SUCCESS`);
    console.log(`📥 Total Leads Received:   ${result.leadsCount}`);

    if (result.leads.length > 0) {
      console.log('\n📋 Leads Retrieved:');
      result.leads.forEach((l, i) => {
        console.log(`   ${i + 1}. [TblId: ${l.tblId || 'N/A'}] ${l.name} | Phone: ${l.phone} | Property: ${l.property}`);
      });
    } else {
      console.log('   (No new buyer inquiries submitted in this time window)');
    }
  }

  console.log('===========================================================\n');
}

runLiveTest();
