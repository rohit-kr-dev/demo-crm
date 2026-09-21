const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { normalizeLocation } = require('../utils/locationHelper');
require('dotenv').config();

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata'
});

// Helper: Clean CDATA or text values
function cleanValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && val.__cdata !== undefined) return String(val.__cdata).trim();
  if (typeof val === 'object' && val['#text'] !== undefined) return String(val['#text']).trim();
  return String(val).trim();
}

// Format date strictly to "YYYY-MM-DD HH:mm:ss"
function formatTo99AcresDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// Helper: Format raw numeric prices into Indian luxury denomination (Cr / Lacs)
function formatLuxuryPrice(priceVal, cmpctLabl = '') {
  if (priceVal && !isNaN(priceVal) && Number(priceVal) > 0) {
    const num = Number(priceVal);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lacs`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  }

  // Regex fallback: Search for "for rs. 5 crore", "₹2.5 Cr", etc. in label
  if (cmpctLabl) {
    const crMatch = cmpctLabl.match(/(?:rs\.?|₹|inr)\s*([0-9.]+)\s*(crore|cr)/i);
    if (crMatch) return `₹${parseFloat(crMatch[1]).toFixed(2)} Cr`;

    const lacMatch = cmpctLabl.match(/(?:rs\.?|₹|inr)\s*([0-9.]+)\s*(lakh|lacs|lac)/i);
    if (lacMatch) return `₹${parseFloat(lacMatch[1]).toFixed(2)} Lacs`;
  }

  return null;
}

/**
 * Pure 99acres Pull API Client
 */
async function pullLeadsFrom99Acres({
  url = process.env.NNACRES_PULL_API_URL,
  username = process.env.NNACRES_USERNAME,
  password = process.env.NNACRES_PASSWORD,
  startDate,
  endDate
}) {
  if (!url || !username || !password) {
    return { success: false, httpStatus: 400, actionStatus: false, error: { code: 'MISSING_99ACRES_CONFIG', message: '99acres credentials are not configured.' }, leads: [] };
  }

  const now = new Date();
  const defaultStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours (max single query allowed by 99acres)

  const finalStartDate = startDate || formatTo99AcresDate(defaultStart);
  const finalEndDate = endDate || formatTo99AcresDate(now);

  const requestXml = `<?xml version='1.0'?><query><user_name>${username}</user_name><pswd>${password}</pswd><start_date>${finalStartDate}</start_date><end_date>${finalEndDate}</end_date></query>`;
  const maskedXml = `<?xml version='1.0'?><query><user_name>${username}</user_name><pswd>********</pswd><start_date>${finalStartDate}</start_date><end_date>${finalEndDate}</end_date></query>`;

  console.log('===========================================================');
  console.log('📡 99ACRES LIVE PULL REQUEST');
  console.log('===========================================================');
  console.log('URL:        ', url);
  console.log('User Name:  ', username);
  console.log('Start Date: ', finalStartDate);
  console.log('End Date:   ', finalEndDate);
  console.log('Request XML:', maskedXml);
  console.log('-----------------------------------------------------------');

  const params = new URLSearchParams();
  params.append('xml', requestXml);

  try {
    const response = await axios.post(url, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'cache-control': 'no-cache'
      },
      timeout: 30000
    });

    const rawXml = response.data;
    console.log('HTTP Status:', response.status);

    // 99acres returns "[]" or empty array when there are 0 leads in the requested window
    if (!rawXml || rawXml === '[]' || (Array.isArray(rawXml) && rawXml.length === 0) || String(rawXml).trim() === '[]' || String(rawXml).trim() === '') {
      return {
        success: true,
        httpStatus: response.status,
        actionStatus: true,
        rawXml: typeof rawXml === 'string' ? rawXml : JSON.stringify(rawXml),
        leadsCount: 0,
        leads: [],
        error: null
      };
    }

    // Parse XML
    const parsed = parser.parse(rawXml);
    const xmlRoot = parsed?.Xml || parsed?.xml || parsed?.XML;

    if (!xmlRoot) {
      return {
        success: false,
        httpStatus: response.status,
        rawXml: typeof rawXml === 'string' ? rawXml : JSON.stringify(rawXml),
        error: { code: 'INVALID_XML', message: `Could not parse root <Xml> element. Response was: ${typeof rawXml === 'string' ? rawXml.slice(0, 100) : JSON.stringify(rawXml)}` },
        leads: []
      };
    }

    const actionStatus = String(xmlRoot['@_ActionStatus'] || xmlRoot.ActionStatus || '').toLowerCase() === 'true';

    // Handle 99acres Error XML
    if (!actionStatus) {
      const errCode = xmlRoot.ErrorDetail?.Code || xmlRoot.errorDetail?.code || 'ERROR_UNKNOWN';
      const errMsg = xmlRoot.ErrorDetail?.Message || xmlRoot.errorDetail?.message || 'Unknown 99acres error';

      return {
        success: false,
        httpStatus: response.status,
        actionStatus: false,
        rawXml,
        error: {
          code: cleanValue(errCode),
          message: cleanValue(errMsg)
        },
        leads: []
      };
    }

    // Handle Success XML (<Resp> tags - single object or array of multiple leads)
    let rawResponses = xmlRoot.Resp || xmlRoot.resp || xmlRoot.RESP || [];
    const leads = [];

    if (rawResponses) {
      if (!Array.isArray(rawResponses)) {
        rawResponses = [rawResponses];
      }

      for (const resp of rawResponses) {
        const qry = resp.QryDtl || resp.qryDtl || resp.Qrydtl || {};
        const cntct = resp.CntctDtl || resp.cntctDtl || resp.Cntctdtl || {};

        // Actual 99acres unique QueryId / TblId
        const queryId = qry['@_QueryId'] || qry['@_TblId'] || qry.QueryId || qry.TblId || null;
        const resType = qry['@_ResType'] || qry.ResType || 'S2M';
        const propertyLabel = cleanValue(qry.CmpctLabl || qry.cmpctLabl);
        const projectName = cleanValue(qry.ProjName || qry.projName) || propertyLabel || '99acres Listing';
        const cityName = cleanValue(qry.CityName || qry.cityName) || 'Bangalore';
        const rawPrice = cleanValue(qry.Price || qry.price);
        const formattedPrice = formatLuxuryPrice(rawPrice, propertyLabel);
        const queryInfo = cleanValue(qry.QryInfo || qry.qryInfo);
        const receivedOn = cleanValue(qry.RcvdOn || qry.rcvdOn);
        const phoneVerification = cleanValue(qry.PhoneVerificationStatus || qry.phoneVerificationStatus) || 'VERIFIED';
        const emailVerification = cleanValue(qry.EmailVerificationStatus || qry.emailVerificationStatus);
        const identity = cleanValue(qry.IDENTITY || qry.identity) || 'Individual';
        const projId = cleanValue(qry.ProjId || qry.projId);
        const prodId = cleanValue(qry.ProdId || qry.prodId);

        const name = cleanValue(cntct.Name || cntct.name) || 'Anonymous Lead';
        let email = cleanValue(cntct.Email || cntct.email);
        if (email.toLowerCase() === 'not mentioned') email = '';
        const phone = cleanValue(cntct.Phone || cntct.phone || cntct.Mobile || cntct.mobile);

        if (!phone) continue; // Skip if no contact phone exists

        const cleanPhone = phone.replace(/\D/g, '');
        const inquiryId = queryId ? `99A_${queryId}` : `99A_${cleanPhone}_${receivedOn.slice(0, 10).replace(/[^0-9]/g, '')}`;

        const locData = normalizeLocation(cityName, propertyLabel, projectName, queryInfo);

        leads.push({
          inquiryId,
          queryId: queryId || inquiryId,
          resType,
          projectName,
          cityName: locData.cityName,
          locationZone: locData.locationZone,
          subLocality: locData.subLocality,
          displayLocation: locData.displayLocation,
          price: formattedPrice,
          rawPrice: rawPrice || null,
          property: propertyLabel || projectName,
          notes: queryInfo || `Inquiry for ${projectName} (${cityName})`,
          receivedOn: receivedOn || formatTo99AcresDate(new Date()),
          phoneVerification,
          emailVerification,
          identity,
          projId,
          prodId,
          name,
          email,
          phone,
          source: '99acres',
          status: 'new'
        });
      }
    }

    return {
      success: true,
      httpStatus: response.status,
      actionStatus: true,
      rawXml,
      leadsCount: leads.length,
      leads,
      error: null
    };
  } catch (err) {
    console.error('HTTP Request Failed:', err.message);
    return {
      success: false,
      httpStatus: err.response?.status || 500,
      rawXml: err.response?.data || err.message,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message
      },
      leads: []
    };
  }
}

module.exports = {
  pullLeadsFrom99Acres,
  formatTo99AcresDate,
  formatLuxuryPrice
};
