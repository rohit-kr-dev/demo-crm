const express = require('express');
const router = express.Router();
const db = require('../config/firebase');
const { requireRole } = require('../middleware/auth');

// GET /api/users - List all enrolled team members & advisors
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data() || {};
      const { password, ...safeUser } = data;
      users.push({ id: doc.id, ...safeUser });
    });

    // Sort: SUPER_ADMIN first, then MANAGER, then SALES
    const roleRank = { SUPER_ADMIN: 1, ADMIN: 2, MANAGER: 3, SALES_MANAGER: 3, SALES: 4, SENIOR_ADVISOR: 4, SALES_EXECUTIVE: 4, AGENT: 5 };
    users.sort((a, b) => (roleRank[a.role] || 99) - (roleRank[b.role] || 99));

    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users - Super Admin / Admin enrolls a new team member
router.post('/', requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER'), async (req, res) => {
  const { name, phone, email, password, role, projects, status, title } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Name and Phone number are required' });
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
  }

  const userId = 'usr_' + Date.now();
  const cleanRole = (role || 'SALES').toUpperCase();
  const now = new Date().toISOString();

  const permissions = cleanRole === 'SUPER_ADMIN' 
    ? ['*'] 
    : (cleanRole === 'MANAGER' 
        ? ['assign_leads', 'assign_tasks', 'read_leads', 'edit_leads', 'log_calls', 'log_whatsapp', 'schedule_visits'] 
        : ['read_assigned_leads', 'log_calls', 'log_whatsapp', 'schedule_visits', 'update_stage', 'add_remarks']);

  const newUser = {
    id: userId,
    name: String(name).trim(),
    phone: cleanPhone,
    email: email ? String(email).trim().toLowerCase() : `${cleanPhone}@estate.com`,
    password: password || '',
    passwordSet: !!password, // If no password provided, user will create it on Day 1 OTP login
    isFirstLogin: !password,
    role: cleanRole,
    title: title || (cleanRole === 'MANAGER' ? 'Sales Manager' : 'Sales Executive'),
    status: status || 'Active',
    projects: Array.isArray(projects) ? projects : (projects ? [projects] : ['All Projects']),
    permissions,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D1117&color=D4AF37&bold=true`,
    createdAt: now,
    updatedAt: now
  };

  try {
    await db.collection('users').doc(userId).set(newUser);
    const { password: _, ...safeUser } = newUser;
    res.json({
      success: true,
      message: `Team member enrolled: ${newUser.name} (+91 ${cleanPhone}). On first login, they will receive an OTP and set their permanent security password.`,
      user: safeUser
    });
  } catch (error) {
    console.error('Error enrolling user in Firestore:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/users/:id - Update member role, status, projects or details
router.patch('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { name, phone, email, role, status, projects, password } = req.body;
  const updateData = { updatedAt: new Date().toISOString() };

  if (name) updateData.name = String(name).trim();
  if (phone) updateData.phone = String(phone).trim();
  if (email) updateData.email = String(email).trim().toLowerCase();
  if (role) {
    updateData.role = role.toUpperCase();
    if (role.toUpperCase() === 'SUPER_ADMIN') {
      updateData.permissions = ['*'];
    }
  }
  if (status) updateData.status = status;
  if (projects) updateData.projects = Array.isArray(projects) ? projects : [projects];
  if (password) updateData.password = password;

  try {
    const userRef = db.collection('users').doc(req.params.id);
    await userRef.set(updateData, { merge: true });
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users/:id/reset-password - Super Admin password reset
router.post('/:id/reset-password', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
  }

  try {
    const userRef = db.collection('users').doc(req.params.id);
    await userRef.update({
      password: newPassword,
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/:id - Remove team member
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
  try {
    // Prevent deletion of master Super Admin
    if (req.params.id === 'usr_superadmin') {
      return res.status(403).json({ success: false, error: 'Cannot delete the Root Super Admin account' });
    }

    await db.collection('users').doc(req.params.id).delete();
    res.json({ success: true, message: 'Team member removed from directory' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;