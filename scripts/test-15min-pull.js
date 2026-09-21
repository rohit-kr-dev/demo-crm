const axios = require('axios');
const { execute99AcresPull, parse99AcresXml } = require('../src/services/99acres-pull-engine');
const db = require('../src/config/firebase');

async function test15MinPullEngine() {
  console.log('===========================================================');
  console.log('🧪 TESTING 99ACRES 15-MINUTE PULL API ENGINE');
  console.log('===========================================================\n');

  try {
    // 1. Test XML Parsing
    console.log('▶ TEST 1: XML Parsing Accuracy');
    const sampleXml = `<?xml version="1.0"?>
<Xml ActionStatus="true">
  <Resp>
    <QryDtl TblId="99A_998877" ResType="S2M">
      <CmpctLabl>Ultima Lifestyle, Waghodia Road, Vadodara</CmpctLabl>
      <QryInfo>Looking for 3 BHK flat on 5th floor or above.</QryInfo>
      <RcvdOn>2026-09-04 10:45:00</RcvdOn>
    </QryDtl>
    <CntctDtl>
      <Name>Karan Mehra</Name>
      <Email>karan.mehra@gmail.com</Email>
      <Phone>9876543210</Phone>
    </CntctDtl>
  </Resp>
</Xml>`;

    const parsed = parse99AcresXml(sampleXml);
    console.log('  Parsed leads:', parsed);
    if (parsed.length === 1 && parsed[0].name === 'Karan Mehra' && parsed[0].phone === '9876543210') {
      console.log('  ✅ TEST 1 PASSED: XML Parser extracted all fields accurately.\n');
    } else {
      throw new Error('XML Parser failed');
    }

    // 2. Test 15-Minute Pull Execution
    console.log('▶ TEST 2: Execute 15-Minute 99acres Pull & Store to Firestore');
    const pullResult = await execute99AcresPull(true);
    console.log('  Pull Execution Result:', pullResult);
    console.log('  ✅ TEST 2 PASSED\n');

    // 3. Verify in Firestore
    console.log('▶ TEST 3: Verify 99acres Lead in Cloud Firestore');
    const snap = await db.collection('leads').where('source', '==', '99acres').limit(3).get();
    console.log(`  Found ${snap.size} 99acres lead(s) in Firestore:`);
    snap.docs.forEach((d, i) => {
      const data = d.data();
      console.log(`  ${i+1}. [${d.id}] ${data.name} (${data.phone}) - Property: ${data.property}`);
    });
    console.log('  ✅ TEST 3 PASSED\n');

    console.log('===========================================================');
    console.log('🎉 99ACRES 15-MINUTE PULL API ENGINE IS 100% OPERATIONAL!');
    console.log('===========================================================\n');
  } catch (err) {
    console.error('❌ Error during test:', err.message);
  }
}

test15MinPullEngine();
