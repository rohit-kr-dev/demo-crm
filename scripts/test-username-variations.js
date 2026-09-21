const { pullLeadsFrom99Acres } = require('../src/services/99acres-client');
require('dotenv').config();

async function testUsernameVariations() {
  const variations = [
    'avery prasad',
    'averyprasad',
    'avery.prasad',
    'avery_prasad',
    'Avery Morgan'
  ];
  const password = process.env.NNACRES_PASSWORD;

  if (!password) throw new Error('Set NNACRES_PASSWORD in .env before running this diagnostic.');

  console.log('===========================================================');
  console.log('🧪 TESTING 99ACRES USERNAME VARIATIONS (AVERY MORGAN)');
  console.log('===========================================================\n');

  for (const user of variations) {
    console.log(`▶ Testing Username: "${user}"`);
    const result = await pullLeadsFrom99Acres({
      username: user,
      password: password
    });

    if (result.actionStatus) {
      console.log(`\n🎉 SUCCESS! Authentication PASSED for username: "${user}"`);
      console.log(`📥 Total Leads in window: ${result.leadsCount}`);
      console.log('Raw XML:\n', result.rawXml);
      return;
    } else {
      console.log(`❌ Result: ${result.error?.code} - ${result.error?.message}\n`);
    }
  }

  console.log('===========================================================');
  console.log('Done testing variations.');
  console.log('===========================================================');
}

testUsernameVariations();
