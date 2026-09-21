const axios = require('axios');
require('dotenv').config();

async function testUsernameRequirement() {
  const url = process.env.NNACRES_PULL_API_URL;
  const password = process.env.NNACRES_PASSWORD;

  if (!url || !password) throw new Error('Set NNACRES_PULL_API_URL and NNACRES_PASSWORD in .env before running this diagnostic.');
  const startDate = '2026-09-03 13:00:00';
  const endDate = '2026-09-04 13:00:00';

  console.log('===========================================================');
  console.log('🧪 DIAGNOSTIC: IS USERNAME REQUIRED BY 99ACRES API?');
  console.log('===========================================================\n');

  // Case 1: Missing <user_name> tag entirely
  console.log('▶ TEST 1: Request WITHOUT any <user_name> tag');
  try {
    const xml1 = `<?xml version='1.0'?><query><pswd>${password}</pswd><start_date>${startDate}</start_date><end_date>${endDate}</end_date></query>`;
    const params1 = new URLSearchParams();
    params1.append('xml', xml1);
    const res1 = await axios.post(url, params1.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('99acres Response:');
    console.log(res1.data);
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
  console.log('-----------------------------------------------------------\n');

  // Case 2: Empty <user_name></user_name>
  console.log('▶ TEST 2: Request with EMPTY <user_name></user_name>');
  try {
    const xml2 = `<?xml version='1.0'?><query><user_name></user_name><pswd>${password}</pswd><start_date>${startDate}</start_date><end_date>${endDate}</end_date></query>`;
    const params2 = new URLSearchParams();
    params2.append('xml', xml2);
    const res2 = await axios.post(url, params2.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('99acres Response:');
    console.log(res2.data);
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
  console.log('-----------------------------------------------------------\n');

  // Case 3: With <user_name>info@horizoncapital.com</user_name>
  console.log('▶ TEST 3: Request with <user_name>info@horizoncapital.com</user_name>');
  try {
    const xml3 = `<?xml version='1.0'?><query><user_name>info@horizoncapital.com</user_name><pswd>${password}</pswd><start_date>${startDate}</start_date><end_date>${endDate}</end_date></query>`;
    const params3 = new URLSearchParams();
    params3.append('xml', xml3);
    const res3 = await axios.post(url, params3.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('99acres Response:');
    console.log(res3.data);
  } catch (e) {
    console.log('Error:', e.response?.data || e.message);
  }
  console.log('===========================================================');
}

testUsernameRequirement();
