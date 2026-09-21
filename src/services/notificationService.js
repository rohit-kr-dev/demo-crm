const axios = require('axios');
const db = require('../config/firebase');
require('dotenv').config();

function buildTeamAlertMessage(lead) {
  const customerName = lead.name || 'Anonymous Lead';
  const phone = lead.phone || 'Not Provided';
  const email = lead.email && lead.email !== 'not mentioned' ? lead.email : 'N/A';
  const project = lead.projectName || lead.property || 'General Portfolio';
  const budget = lead.budget || 'Not specified';
  const city = lead.cityName || lead.city || 'Bangalore';
  const source = String(lead.source || 'General Ingestion').toUpperCase();
  const notes = lead.notes || lead.query || 'Direct Property Inquiry';
  const crmUrl = process.env.BASE_SERVER_URL || 'http://localhost:5000';

  const timeStr = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return {
    text: `🚨 *HORIZON REALTY — NEW LEAD REGISTERED*
━━━━━━━━━━━━━━━━━━━━
👤 *Customer:* ${customerName}
📞 *Phone:* ${phone}
📧 *Email:* ${email}
🏷️ *Source:* ${source}
🏢 *Project:* ${project}
💰 *Budget:* ${budget}
📍 *City:* ${city}
💬 *Notes:* ${notes}
⏰ *Time:* ${timeStr}
━━━━━━━━━━━━━━━━━━━━
🔗 *Open CRM:* ${crmUrl}`,

    plainText: `[NEW LEAD ALERT - ${source}] Customer: ${customerName}, Phone: ${phone}, Project: ${project}, Budget: ${budget}. View in CRM: ${crmUrl}`
  };
}

/**
 * Fetch all enrolled Admin and Sales Director phone numbers
 */
async function getAdminAndDirectorRecipients() {
  const recipients = new Map();

  // 1. Load from Environment Variables
  const envAdmin = process.env.ADMIN_PHONE || process.env.ADMIN_ALERT_PHONE;
  if (envAdmin) {
    recipients.set(envAdmin.trim(), { name: 'Super Admin', role: 'SUPER_ADMIN', phone: envAdmin.trim() });
  }

  const envDirector = process.env.SALES_DIRECTOR_PHONE || process.env.DIRECTOR_PHONE;
  if (envDirector) {
    recipients.set(envDirector.trim(), { name: 'Sales Director', role: 'SALES_DIRECTOR', phone: envDirector.trim() });
  }

  const envTeam = process.env.TEAM_NOTIFICATION_PHONE;
  if (envTeam && !recipients.has(envTeam.trim())) {
    recipients.set(envTeam.trim(), { name: 'Executive Team', role: 'ADMIN', phone: envTeam.trim() });
  }

  // 2. Fetch Active Admins and Sales Directors from Firestore
  try {
    const snapshot = await db.collection('users').where('status', '==', 'Active').get();
    snapshot.forEach(doc => {
      const user = doc.data() || {};
      const userRole = (user.role || '').toUpperCase();
      if ((userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'SALES_DIRECTOR') && user.phone) {
        const cleanPhone = String(user.phone).trim();
        if (cleanPhone && !recipients.has(cleanPhone)) {
          recipients.set(cleanPhone, {
            name: user.name || 'Executive',
            role: userRole,
            phone: cleanPhone
          });
        }
      }
    });
  } catch (err) {
    // If users collection query fails, fall back to environment recipients
  }

  // Fallback if none configured
  if (recipients.size === 0) {
    recipients.set('+919876543210', { name: 'Default Admin', role: 'SUPER_ADMIN', phone: '+919876543210' });
  }

  return Array.from(recipients.values());
}

/**
 * Dispatch notification simultaneously to Admin and Sales Director
 */
async function notifyTeamNewLead(lead) {
  if (!lead || !lead.phone) return;

  const alertContent = buildTeamAlertMessage(lead);
  const targets = await getAdminAndDirectorRecipients();

  console.log('\n===========================================================');
  console.log('📢 🚨 DISPATCHING NEW LEAD ALERT TO ADMIN & SALES DIRECTOR');
  console.log('===========================================================');
  console.log(alertContent.text);
  console.log('Recipients:');
  targets.forEach(t => console.log(`   👉 [${t.role}] ${t.name}: ${t.phone}`));
  console.log('-----------------------------------------------------------');

  const results = [];

  // Loop through both Admin and Sales Director numbers
  for (const target of targets) {
    const targetPhone = target.phone;

    // 1. Twilio (WhatsApp / SMS)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioAuth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const isWhatsApp = Boolean(process.env.TWILIO_WHATSAPP_NUMBER);
        
        const fromNumber = isWhatsApp ? `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}` : process.env.TWILIO_PHONE_NUMBER;
        const toNumber = isWhatsApp ? `whatsapp:${targetPhone}` : targetPhone;

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', fromNumber);
        params.append('To', toNumber);
        params.append('Body', alertContent.text);

        const twilioRes = await axios.post(twilioUrl, params.toString(), {
          headers: {
            'Authorization': `Basic ${twilioAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        console.log(`   ✅ [Twilio Alert to ${target.role} (${targetPhone})] SID:`, twilioRes.data?.sid);
      } catch (err) {
        console.error(`   ⚠️ [Twilio Error for ${target.role} (${targetPhone})]:`, err.response?.data?.message || err.message);
      }
    }

    // 2. Fast2SMS (Indian SMS Gateway)
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const cleanPhone = targetPhone.replace(/\D/g, '').slice(-10);
        const smsRes = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
          route: 'v3',
          sender_id: 'TXTIND',
          message: alertContent.plainText,
          language: 'english',
          flash: 0,
          numbers: cleanPhone
        }, {
          headers: { 'authorization': process.env.FAST2SMS_API_KEY }
        });
        console.log(`   ✅ [Fast2SMS to ${target.role} (${cleanPhone})] Result:`, smsRes.data?.message);
      } catch (err) {
        console.error(`   ⚠️ [Fast2SMS Error for ${target.role}]:`, err.response?.data || err.message);
      }
    }
  }

  // 3. Telegram Team Bot Alert (100% Free Instant Alerts)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(tgUrl, {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: alertContent.text,
        parse_mode: 'Markdown'
      });
      console.log('   ✅ [Telegram Group Alert Sent to Management]');
    } catch (err) {
      console.error('   ⚠️ [Telegram Alert Error]', err.response?.data?.description || err.message);
    }
  }

  // 4. Custom Management Webhook (Slack / Discord / Zapier)
  if (process.env.TEAM_ALERT_WEBHOOK_URL) {
    try {
      await axios.post(process.env.TEAM_ALERT_WEBHOOK_URL, {
        event: 'NEW_LEAD_REGISTERED',
        lead,
        recipients: targets,
        alertMessage: alertContent.text,
        timestamp: new Date().toISOString()
      });
      console.log('   ✅ [Management Webhook Alert Sent]');
    } catch (err) {
      console.error('   ⚠️ [Webhook Alert Error]', err.message);
    }
  }

  return { success: true, targetsCount: targets.length };
}

module.exports = {
  notifyTeamNewLead,
  buildTeamAlertMessage,
  getAdminAndDirectorRecipients
};
