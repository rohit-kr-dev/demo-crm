// ============================================================
// HORIZON REALTY — MASTER REALTIME CRM ENGINE
// ============================================================

let currentUser = null;
let allLeads = [];
let allUsers = [];
let activeMainView = 'pipeline';
let activePipelineSection = 'all'; // '99acres' | 'meta' | 'other' | 'all'
let activeOtherSubSource = 'ALL'; // 'ALL' | 'broker' | 'referral' | 'walk-in' | 'website' | 'google' | 'direct'
let activeAdvisorFilter = 'ALL'; // 'ALL' | 'UNASSIGNED' | 'Priya' | 'Maya' | 'Arjun'
let myLeadsOnly = false;
let currentLeadId = null;
let eventSource = null;

let selectedAssigneeCardKey = 'arjun';
let selectedAssigneeName = 'Senior Sales Advisor';
let selectedAssigneeEmail = 'advisor1@demo.com';

let parsedExcelRows = [];

let funnelChart = null;
let sourcesChart = null;

// Channel styling & badge dictionary (Daylight Executive Light Theme)
const SOURCE_CONFIG = {
  '99acres': {
    label: 'DEMO PORTAL',
    icon: 'fa-solid fa-building',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
    cardBorder: 'border-l-4 border-l-amber-500',
    tagIcon: 'fa-solid fa-hotel text-amber-600',
    tagPrefix: 'Demo portal inquiry'
  },
  meta: {
    label: 'META ADS',
    icon: 'fa-brands fa-meta',
    badgeClass: 'bg-blue-100 text-blue-900 border border-blue-300 font-black',
    cardBorder: 'border-l-4 border-l-blue-600',
    tagIcon: 'fa-solid fa-bullseye text-blue-600',
    tagPrefix: 'Meta Campaign'
  },
  broker: {
    label: 'BROKER',
    icon: 'fa-solid fa-handshake-angle',
    badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300 font-black',
    cardBorder: 'border-l-4 border-l-purple-600',
    tagIcon: 'fa-solid fa-user-tie text-purple-600',
    tagPrefix: 'Broker Network'
  },
  referral: {
    label: 'REFERRAL',
    icon: 'fa-solid fa-handshake',
    badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black',
    cardBorder: 'border-l-4 border-l-emerald-600',
    tagIcon: 'fa-solid fa-user-tag text-emerald-600',
    tagPrefix: 'Client Referral'
  },
  'walk-in': {
    label: 'WALK-IN',
    icon: 'fa-solid fa-person-walking',
    badgeClass: 'bg-cyan-100 text-cyan-900 border border-cyan-300 font-black',
    cardBorder: 'border-l-4 border-l-cyan-600',
    tagIcon: 'fa-solid fa-door-open text-cyan-600',
    tagPrefix: 'Site Walk-in'
  },
  website: {
    label: 'WEBSITE',
    icon: 'fa-solid fa-globe',
    badgeClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300 font-black',
    cardBorder: 'border-l-4 border-l-indigo-600',
    tagIcon: 'fa-solid fa-globe text-indigo-600',
    tagPrefix: 'Website Form'
  },
  google: {
    label: 'GOOGLE ADS',
    icon: 'fa-brands fa-google',
    badgeClass: 'bg-orange-100 text-orange-900 border border-orange-300 font-black',
    cardBorder: 'border-l-4 border-l-orange-500',
    tagIcon: 'fa-brands fa-google text-orange-600',
    tagPrefix: 'Google Search'
  },
  direct: {
    label: 'DIRECT',
    icon: 'fa-solid fa-user-check',
    badgeClass: 'bg-slate-100 text-slate-900 border border-slate-300 font-black',
    cardBorder: 'border-l-4 border-l-slate-600',
    tagIcon: 'fa-solid fa-user text-slate-600',
    tagPrefix: 'Direct Inquiry'
  },
  other: {
    label: 'OTHER',
    icon: 'fa-solid fa-layer-group',
    badgeClass: 'bg-slate-100 text-slate-900 border border-slate-300 font-black',
    cardBorder: 'border-l-4 border-l-slate-600',
    tagIcon: 'fa-solid fa-tag text-slate-600',
    tagPrefix: 'General Lead'
  }
};

// Pipeline stage dictionary
const STAGE_CONFIG = {
  new: { label: 'New Inquiry', color: 'bg-blue-50 text-blue-800 border-blue-300 font-extrabold' },
  contacted: { label: 'Contacted', color: 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold' },
  site_visit: { label: 'Site Visit', color: 'bg-purple-50 text-purple-800 border-purple-300 font-extrabold' },
  negotiation: { label: 'Negotiation', color: 'bg-cyan-50 text-cyan-800 border-cyan-300 font-extrabold' },
  won: { label: 'Booked / Won', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold' },
  lost: { label: 'Closed / Lost', color: 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold' }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-white border-emerald-500 text-emerald-950 shadow-xl' : 'bg-white border-amber-500 text-slate-900 shadow-xl';
  toast.className = 'p-3.5 rounded-2xl border shadow-xl text-xs font-bold flex items-center justify-between pointer-events-auto transition duration-300 ' + bg;
  toast.innerHTML = '<div class="flex items-center gap-2"><i class="fa-solid fa-gem text-amber-600"></i><span>' + escapeHtml(message) + '</span></div><button onclick="this.parentElement.remove()" class="ml-3 text-slate-400 hover:text-slate-800">&times;</button>';
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

// Authenticated Fetch Wrapper
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('apex_crm_token');
  const headers = Object.assign({}, options.headers || {}, {
    'Authorization': `Bearer ${token}`
  });
  const res = await fetch(url, Object.assign({}, options, { headers }));
  if (res.status === 401) {
    handleLogout();
    throw new Error('Unauthorized');
  }
  return res;
}

// ============================================================
// 1. AUTHENTICATION & SUPER ADMIN AUTHORITY
// ============================================================

async function checkAuthSession() {
  const token = localStorage.getItem('apex_crm_token');
  if (!token) {
    showLoginView();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (data.success && data.user) {
      currentUser = data.user;
      showDashboardView();
    } else {
      showLoginView();
    }
  } catch (err) {
    showLoginView();
  }
}

// ============================================================
// ============================================================
// 1. AUTHENTICATION (PHONE-FIRST ROLE CHECK & PASSWORD CREATION)
// ============================================================
let currentVerifiedPhone = '';
let currentVerifiedUser = null;

function switchLoginMode(mode) {
  const tabPhone = document.getElementById('tab-auth-phone');
  const tabDirect = document.getElementById('tab-auth-direct');
  const boxPhone = document.getElementById('auth-box-phone');
  const boxDirect = document.getElementById('auth-box-direct');

  if (mode === 'phone') {
    if (tabPhone) {
      tabPhone.className = 'flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-amber-950 bg-white shadow-xs border border-slate-200 transition flex items-center justify-center gap-1.5';
    }
    if (tabDirect) {
      tabDirect.className = 'flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5';
    }
    if (boxPhone) boxPhone.classList.remove('hidden');
    if (boxDirect) boxDirect.classList.add('hidden');
    resetToPhoneStep();
  } else {
    if (tabDirect) {
      tabDirect.className = 'flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-amber-950 bg-white shadow-xs border border-slate-200 transition flex items-center justify-center gap-1.5';
    }
    if (tabPhone) {
      tabPhone.className = 'flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1.5';
    }
    if (boxPhone) boxPhone.classList.add('hidden');
    if (boxDirect) boxDirect.classList.remove('hidden');
    const loginIdent = document.getElementById('login-identifier');
    if (loginIdent) loginIdent.focus();
  }
}
window.switchLoginMode = switchLoginMode;

function resetToPhoneStep() {
  const formCheck = document.getElementById('form-check-phone');
  const formFirstTime = document.getElementById('form-first-time-password');
  const formReturning = document.getElementById('form-returning-password');
  const errPhone = document.getElementById('phone-check-error');
  const errFirst = document.getElementById('password-setup-error');
  const errRet = document.getElementById('returning-password-error');

  if (formCheck) formCheck.classList.remove('hidden');
  if (formFirstTime) formFirstTime.classList.add('hidden');
  if (formReturning) formReturning.classList.add('hidden');
  if (errPhone) errPhone.classList.add('hidden');
  if (errFirst) errFirst.classList.add('hidden');
  if (errRet) errRet.classList.add('hidden');

  const phoneInp = document.getElementById('login-phone');
  if (phoneInp) phoneInp.focus();
}
window.resetToPhoneStep = resetToPhoneStep;

async function handleCheckPhone(e) {
  if (e) e.preventDefault();
  const phoneInput = document.getElementById('login-phone');
  const errBox = document.getElementById('phone-check-error');
  const submitBtn = document.getElementById('btn-check-phone');
  const cleanPhone = phoneInput ? phoneInput.value.replace(/\D/g, '').slice(-10) : '';

  if (cleanPhone.length !== 10) {
    if (errBox) {
      errBox.innerText = 'Please enter a valid 10-digit mobile number';
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (errBox) errBox.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Checking Number...';
  }

  try {
    const res = await fetch('/api/auth/check-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone })
    });
    const data = await res.json();

    if (data.directAccess && data.token) {
      localStorage.setItem('apex_crm_token', data.token);
      currentUser = data.user;
      realAdminUser = Object.assign({}, currentUser);
      showToast(`👑 Welcome Riley! Super Admin IT Master Control Active.`, 'success');
      showDashboardView();
      fetchLeads();
      fetchTeamMembers();
      initRealtimeEventStream();
      return;
    }

    if (!data.success || !data.exists) {
      if (errBox) {
        errBox.innerText = `❌ Mobile +91 ${cleanPhone} is not registered in the CRM. Please ask IT Admin to add your role first.`;
        errBox.classList.remove('hidden');
      }
      return;
    }

    currentVerifiedPhone = cleanPhone;
    currentVerifiedUser = data;

    const formCheck = document.getElementById('form-check-phone');
    const formFirstTime = document.getElementById('form-first-time-password');
    const formReturning = document.getElementById('form-returning-password');

    if (formCheck) formCheck.classList.add('hidden');

    if (data.isFirstLogin) {
      // First-Time User Flow: Create Password
      if (formFirstTime) formFirstTime.classList.remove('hidden');
      if (formReturning) formReturning.classList.add('hidden');

      const badge = document.getElementById('first-time-user-badge');
      const desc = document.getElementById('first-time-user-desc');
      if (badge) badge.innerText = `Welcome, ${data.name || 'Team Member'} (${data.role || 'Sales'})`;
      if (desc) desc.innerText = `You are registered as ${data.role || 'Sales Executive'}. Since this is your first login, please create your security password.`;

      const newPassInp = document.getElementById('new-password-input');
      const confPassInp = document.getElementById('confirm-password-input');
      if (newPassInp) newPassInp.value = '';
      if (confPassInp) confPassInp.value = '';
      if (newPassInp) newPassInp.focus();

      showToast(`👋 Welcome, ${data.name}! Please create your password.`, 'info');
    } else {
      // Returning User Flow: Enter Existing Password
      if (formReturning) formReturning.classList.remove('hidden');
      if (formFirstTime) formFirstTime.classList.add('hidden');

      const nameEl = document.getElementById('returning-user-name');
      const phoneEl = document.getElementById('returning-user-phone');
      if (nameEl) nameEl.innerText = `${data.name || 'Team Member'} (${data.role || 'Sales'})`;
      if (phoneEl) phoneEl.innerText = `+91 ${cleanPhone}`;

      const retPassInp = document.getElementById('returning-password-input');
      if (retPassInp) {
        retPassInp.value = '';
        retPassInp.focus();
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.innerText = 'Server connection failed while checking phone number';
      errBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Continue</span> <i class="fa-solid fa-arrow-right ml-1"></i>';
    }
  }
}
window.handleCheckPhone = handleCheckPhone;

async function handleFirstTimeSetPassword(e) {
  if (e) e.preventDefault();
  const newPass = document.getElementById('new-password-input')?.value || '';
  const confirmPass = document.getElementById('confirm-password-input')?.value || '';
  const errBox = document.getElementById('password-setup-error');
  const submitBtn = document.getElementById('btn-save-first-password');

  if (!newPass || newPass.length < 4) {
    if (errBox) {
      errBox.innerText = 'Password must be at least 4 characters long.';
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (newPass !== confirmPass) {
    if (errBox) {
      errBox.innerText = 'Passwords do not match. Please re-enter carefully.';
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (errBox) errBox.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Creating Password...';
  }

  try {
    const res = await fetch('/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentVerifiedPhone,
        newPassword: newPass
      })
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem('apex_crm_token', data.token);
      currentUser = data.user;
      showToast(`🎉 Password created successfully! Welcome to Horizon CRM, ${currentUser.name}.`, 'success');
      showDashboardView();
    } else {
      if (errBox) {
        errBox.innerText = data.error || 'Failed to save password.';
        errBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.innerText = 'Server connection error saving password.';
      errBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-key mr-1.5"></i> Save Password &amp; Enter CRM';
    }
  }
}
window.handleFirstTimeSetPassword = handleFirstTimeSetPassword;

async function handleReturningPasswordLogin(e) {
  if (e) e.preventDefault();
  const password = document.getElementById('returning-password-input')?.value || '';
  const errBox = document.getElementById('returning-password-error');
  const submitBtn = document.getElementById('btn-returning-login');

  if (!password) {
    if (errBox) {
      errBox.innerText = 'Please enter your password.';
      errBox.classList.remove('hidden');
    }
    return;
  }

  if (errBox) errBox.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Authenticating...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: currentVerifiedPhone,
        password: password
      })
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem('apex_crm_token', data.token);
      currentUser = data.user;
      showToast(`Welcome back, ${currentUser.name} (${currentUser.role})`, 'success');
      showDashboardView();
    } else {
      if (errBox) {
        errBox.innerText = data.error || 'Invalid password entered. Please try again.';
        errBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.innerText = 'Server connection error during login.';
      errBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock-open mr-1.5"></i> Login to CRM';
    }
  }
}
window.handleReturningPasswordLogin = handleReturningPasswordLogin;

async function handleLogin(e) {
  e.preventDefault();
  const idElem = document.getElementById('login-identifier');
  const identifier = idElem ? idElem.value.trim() : '';
  const password = document.getElementById('login-password')?.value || '';
  const errBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('btn-login-submit');

  if (errBox) errBox.classList.add('hidden');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Authenticating...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem('apex_crm_token', data.token);
      currentUser = data.user;
      showToast(`Welcome back, ${currentUser.name} (${currentUser.role})`, 'success');
      showDashboardView();
    } else {
      if (errBox) {
        errBox.innerText = data.error || 'Authentication failed';
        errBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (errBox) {
      errBox.innerText = 'Server connection failed.';
      errBox.classList.remove('hidden');
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-lock-open mr-1.5"></i> Authenticate & Enter';
    }
  }
}

function handleLogout() {
  localStorage.removeItem('apex_crm_token');
  if (eventSource) eventSource.close();
  currentUser = null;
  resetToPhoneStep();
  showLoginView();
}

function showLoginView() {
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('view-dashboard').classList.add('hidden');
  resetToPhoneStep();
}

// ============================================================
// IT SUPER ADMIN "ACT AS" & PERSONA IMPERSONATION CONTROLLER
// ============================================================
let realAdminUser = null;
let currentImpersonatedUser = null;

const DEFAULT_TEAM_ROSTER = [
  { id: 'usr_manager', name: 'Sales Manager', role: 'MANAGER', phone: '9876500002', email: 'manager@demo.com', title: 'Sales & Operations Manager', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120' },
  { id: 'usr_advisor_1', name: 'Senior Sales Advisor', role: 'SALES', phone: '9876500003', email: 'advisor1@demo.com', title: 'Senior Sales Advisor (East Zone)', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120' },
  { id: 'usr_advisor_2', name: 'Relationship Manager', role: 'SALES', phone: '9876500004', email: 'advisor2@demo.com', title: 'Senior Relationship Manager (North Zone)', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' }
];

function actAsUser(targetKeyOrId) {
  if (!realAdminUser) {
    realAdminUser = Object.assign({}, currentUser);
  }

  // Find user in DEFAULT_TEAM_ROSTER or allUsers
  let target = DEFAULT_TEAM_ROSTER.find(u => 
    u.id === targetKeyOrId || 
    u.name.toLowerCase().includes(String(targetKeyOrId).toLowerCase()) ||
    u.phone === targetKeyOrId
  );

  if (!target && Array.isArray(allUsers)) {
    target = allUsers.find(u => 
      u.id === targetKeyOrId || 
      u.name.toLowerCase().includes(String(targetKeyOrId).toLowerCase()) ||
      u.phone === targetKeyOrId
    );
  }

  if (!target) {
    showToast(`Could not find team member: ${targetKeyOrId}`, 'error');
    return;
  }

  currentImpersonatedUser = target;
  currentUser = Object.assign({}, target, { _isImpersonated: true });

  // Update UI components
  updatePersonaBannerState();
  showDashboardView();
  showToast(`👁️ Active Testing Mode: Acting as ${target.name} (${target.role})`, 'info');
}
window.actAsUser = actAsUser;

function exitImpersonation() {
  if (!realAdminUser) return;
  currentUser = Object.assign({}, realAdminUser);
  currentImpersonatedUser = null;
  
  updatePersonaBannerState();
  showDashboardView();
  showToast(`👑 Returned to Super Admin mode`, 'success');
}
window.exitImpersonation = exitImpersonation;

function updatePersonaBannerState() {
  const bar = document.getElementById('it-control-bar');
  const badge = document.getElementById('it-active-mode-badge');
  const desc = document.getElementById('it-active-mode-desc');
  const actions = document.getElementById('it-impersonation-actions');

  const isAdminOrHasRealAdmin = realAdminUser || (currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN'));

  if (!isAdminOrHasRealAdmin) {
    if (bar) bar.classList.add('hidden');
    return;
  }

  if (bar) bar.classList.remove('hidden');

  // Reset persona pill styles
  const pillIds = ['btn-persona-master', 'btn-persona-priya', 'btn-persona-maya', 'btn-persona-arjun', 'btn-persona-test'];
  pillIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'btn-persona-master') {
      el.className = !currentImpersonatedUser 
        ? 'px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-amber-400 border border-amber-400/50 shadow-xs flex items-center gap-1.5 transition ring-2 ring-amber-400' 
        : 'px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition';
    } else {
      const match = id.replace('btn-persona-', '').toLowerCase();
      const isActive = currentImpersonatedUser && currentImpersonatedUser.name.toLowerCase().includes(match);
      if (isActive) {
        el.className = 'px-2.5 py-1 rounded-xl text-xs font-black bg-purple-700 text-white border border-purple-800 shadow-sm flex items-center gap-1.5 transition ring-2 ring-purple-400';
      } else {
        el.className = 'px-2.5 py-1 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition';
      }
    }
  });

  if (currentImpersonatedUser) {
    if (actions) actions.classList.remove('hidden');
    if (badge) {
      badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-sm flex items-center gap-1 animate-pulse';
      badge.innerHTML = `<i class="fa-solid fa-eye"></i> Acting as: ${escapeHtml(currentImpersonatedUser.name)}`;
    }
    if (desc) {
      desc.innerHTML = `Simulating <strong>${escapeHtml(currentImpersonatedUser.name)} (${escapeHtml(currentImpersonatedUser.role)})</strong>. Leads, tasks, and actions are filtered to this user's perspective so you can verify end-to-end functionality.`;
    }
  } else {
    if (actions) actions.classList.add('hidden');
    if (badge) {
      badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs';
      badge.innerText = 'Master Root Mode';
    }
    if (desc) {
      desc.innerText = 'You have full control. Click any team member below to "Act As" them and test their exact pipeline, task assignments, and permissions.';
    }
  }
}
window.updatePersonaBannerState = updatePersonaBannerState;

function showDashboardView() {
  if (!currentUser) {
    currentUser = { name: 'Executive User', role: 'SALES' };
  }

  // Preserve real admin user if root/admin
  if (!realAdminUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN')) {
    realAdminUser = Object.assign({}, currentUser);
  }

  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-dashboard').classList.remove('hidden');

  // Update User profile badge in sidebar
  document.getElementById('user-name').innerText = currentUser.name || 'Executive User';
  document.getElementById('user-role').innerText = currentUser._isImpersonated ? `ACTING: ${currentUser.role}` : (currentUser.role || 'SALES');
  if (currentUser.avatar) document.getElementById('user-avatar').src = currentUser.avatar;

  // Authority role banner in sidebar
  const roleBanner = document.getElementById('sidebar-role-banner');
  const roleTitle = document.getElementById('sidebar-role-title');
  const roleTag = document.getElementById('sidebar-role-tag');
  const roleIcon = document.getElementById('sidebar-role-icon');

  if (currentUser.role === 'SUPER_ADMIN') {
    roleBanner.className = 'px-3 py-2 rounded-xl badge-superadmin flex items-center justify-between text-[11px] shadow-sm';
    roleTitle.innerText = currentUser._isImpersonated ? `Testing: ${currentUser.name}` : 'CEO & Super Admin';
    roleTag.innerText = 'ROOT';
    roleIcon.className = 'fa-solid fa-crown text-amber-700 text-xs';
  } else if (currentUser.role === 'MANAGER' || currentUser.role === 'SALES_MANAGER') {
    roleBanner.className = 'px-3 py-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-300 flex items-center justify-between text-[11px] shadow-sm';
    roleTitle.innerText = currentUser._isImpersonated ? `Testing: Priya (Manager)` : 'Priya (Manager)';
    roleTag.innerText = 'DISPATCHER';
    roleIcon.className = 'fa-solid fa-user-shield text-purple-600 text-xs';
  } else {
    // Sales Executive (Arjun / Maya / Test)
    roleBanner.className = 'px-3 py-2 rounded-xl bg-blue-50 text-blue-900 border border-blue-300 flex items-center justify-between text-[11px] shadow-sm';
    roleTitle.innerText = currentUser._isImpersonated ? `Testing: ${(currentUser.name || 'Sales').split(' ')[0]}` : `${(currentUser.name || 'Sales').split(' ')[0]} (Sales)`;
    roleTag.innerText = 'MY PIPELINE';
    roleIcon.className = 'fa-solid fa-briefcase text-blue-600 text-xs';
  }

  const isSales = currentUser && currentUser.role === 'SALES';
  const isAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN');
  const isManagerOrAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'SALES_MANAGER');

  // Team & Roles (RBAC) navigation link visible ONLY to Admin
  const navTeam = document.getElementById('nav-team');
  if (navTeam) {
    if (isAdmin && !currentUser._isImpersonated) {
      navTeam.classList.remove('hidden');
    } else {
      navTeam.classList.add('hidden');
    }
  }

  // If non-admin is currently on team view, automatically redirect to pipeline
  if ((!isAdmin || currentUser._isImpersonated) && activeMainView === 'team') {
    activeMainView = 'pipeline';
  }

  // Advisor Filter Dropdown adjustment
  const advFilter = document.getElementById('advisor-filter');
  if (advFilter) {
    if (isSales) {
      advFilter.innerHTML = `<option value="ALL" selected>🎯 My Assigned Leads (${escapeHtml(currentUser.name.split(' ')[0])})</option>`;
      advFilter.disabled = true;
      advFilter.classList.add('opacity-90', 'cursor-not-allowed', 'bg-blue-50', 'text-blue-900', 'font-black');
    } else {
      advFilter.disabled = false;
      advFilter.classList.remove('opacity-90', 'cursor-not-allowed', 'bg-blue-50', 'text-blue-900', 'font-black');
      advFilter.innerHTML = `
        <option value="ALL">👤 All Advisors &amp; Queue</option>
        <option value="UNASSIGNED">⚡ Unassigned Leads</option>
        <option value="Priya">👔 Priya (Manager)</option>
        <option value="Maya">💼 Maya (Sales)</option>
        <option value="Arjun">💼 Arjun (Sales)</option>
        <option value="Test">💼 Test (Sales)</option>
      `;
    }
  }

  // Quick Switch "My Leads" toggle visibility
  const myLeadsToggle = document.getElementById('btn-my-leads-toggle');
  if (myLeadsToggle) {
    if (isSales) {
      myLeadsToggle.classList.add('hidden');
    } else {
      myLeadsToggle.classList.remove('hidden');
    }
  }

  // Lead dossier delete button visibility for Super Admin
  const delLeadBtn = document.getElementById('btn-delete-lead-dossier');
  if (delLeadBtn) {
    if (isAdmin && !currentUser._isImpersonated) {
      delLeadBtn.classList.remove('hidden');
    } else {
      delLeadBtn.classList.add('hidden');
    }
  }

  // Reassign button in dossier
  const reassignBtn = document.getElementById('md-task-box')?.querySelector('button');
  if (reassignBtn) {
    if (isSales) {
      reassignBtn.classList.add('hidden');
    } else {
      reassignBtn.classList.remove('hidden');
    }
  }

  updatePersonaBannerState();
  switchMainView(activeMainView || 'pipeline');
  fetchLeads();
  fetchTeamMembers();
  initRealtimeEventStream();
}

// ============================================================
// 2. SIDEBAR NAVIGATION ROUTER
// ============================================================
function switchMainView(viewKey) {
  const isAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN');
  if (viewKey === 'team' && !isAdmin) {
    viewKey = 'pipeline';
  }
  activeMainView = viewKey;

  ['pipeline', 'directory', 'analytics', 'team'].forEach(key => {
    const sec = document.getElementById('sec-view-' + key);
    const navBtn = document.getElementById('nav-' + key);
    if (!sec || !navBtn) return;

    if (key === viewKey) {
      sec.classList.remove('hidden');
      navBtn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-amber-900 bg-amber-50 border border-amber-300 transition shadow-sm';
    } else {
      sec.classList.add('hidden');
      navBtn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition';
    }
  });

  if (viewKey === 'analytics') {
    renderAnalytics();
  } else if (viewKey === 'team' && isAdmin) {
    fetchTeamMembers();
  }
}

// ============================================================
// 3. 4-TIER SUB-LIST PIPELINE & DIRECTORY SECTION SWITCHER
// 1. 99acres Leads | 2. Meta Leads | 3. Other Leads | 4. All Combined
// ============================================================
function switchPipelineSection(secKey) {
  activePipelineSection = secKey;

  // Reset main 4 sub-list tab styles
  const tab99 = document.getElementById('tab-source-99acres');
  const tabMeta = document.getElementById('tab-source-meta');
  const tabOther = document.getElementById('tab-source-other');
  const tabAll = document.getElementById('tab-source-all');
  const subBar = document.getElementById('sub-source-bar');

  const inactiveTabClass = 'bg-white hover:bg-slate-50 border border-slate-200 p-3.5 rounded-2xl transition text-left flex items-center justify-between shadow-sm group';
  if (tab99) tab99.className = inactiveTabClass;
  if (tabMeta) tabMeta.className = inactiveTabClass;
  if (tabOther) tabOther.className = inactiveTabClass;
  if (tabAll) tabAll.className = inactiveTabClass;

  if (secKey === '99acres') {
    if (tab99) tab99.className = 'tab-section-active-99 p-3.5 rounded-2xl border transition text-left flex items-center justify-between shadow-sm relative group';
    if (subBar) subBar.classList.add('hidden');
  } else if (secKey === 'meta') {
    if (tabMeta) tabMeta.className = 'tab-section-active-meta p-3.5 rounded-2xl border transition text-left flex items-center justify-between shadow-sm relative group';
    if (subBar) subBar.classList.add('hidden');
  } else if (secKey === 'other') {
    if (tabOther) tabOther.className = 'tab-section-active-other p-3.5 rounded-2xl border transition text-left flex items-center justify-between shadow-sm relative group';
    if (subBar) subBar.classList.remove('hidden');
  } else {
    // 'all'
    if (tabAll) tabAll.className = 'tab-section-active-all p-3.5 rounded-2xl border transition text-left flex items-center justify-between shadow-sm relative group';
    if (subBar) subBar.classList.add('hidden');
  }

  // Synchronize Directory Table Sub-List Pills
  ['all', '99acres', 'meta', 'other'].forEach(k => {
    const tblTab = document.getElementById(`tbl-tab-${k}`);
    if (tblTab) {
      if (k === secKey) {
        tblTab.className = 'px-3 py-1 rounded-lg text-white bg-slate-900 font-bold shadow-xs transition';
      } else {
        tblTab.className = 'px-3 py-1 rounded-lg text-slate-600 hover:text-slate-900 transition';
      }
    }
  });

  applyFilters();
}

function filterSubSource(subKey) {
  activeOtherSubSource = subKey;
  ['ALL', 'broker', 'referral', 'walkin', 'website', 'google', 'direct'].forEach(key => {
    const btn = document.getElementById(`sub-src-${key}`);
    if (!btn) return;
    const isSelected = (key === 'ALL' && subKey === 'ALL') || (key === 'walkin' && subKey === 'walk-in') || (key === subKey);
    if (isSelected) {
      btn.className = 'px-3 py-1 rounded-lg font-bold text-xs bg-purple-700 text-white shadow-sm transition';
    } else {
      btn.className = 'px-3 py-1 rounded-lg font-bold text-xs text-slate-700 hover:text-purple-900 bg-white border border-slate-200 transition';
    }
  });
  applyFilters();
}

// ============================================================
// 4. LIVE FIRESTORE REAL-TIME STREAM (SSE)
// ============================================================
function initRealtimeEventStream() {
  if (eventSource) eventSource.close();
  const token = localStorage.getItem('apex_crm_token');
  eventSource = new EventSource('/api/leads/realtime/stream?token=' + encodeURIComponent(token || ''));

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.type === 'added' || payload.type === 'modified') {
        const lead = payload.lead;
        if (payload.type === 'added') {
          playNotificationSound();
          const srcTag = (lead.source || 'DEMO').toUpperCase();
          showToast(`🔔 New ${srcTag} Inquiry: ${lead.name || 'Anonymous'} for ${lead.displayProperty || lead.property || 'Property'}`, 'success');
        }
        fetchLeads();
        if (activeMainView === 'analytics') renderAnalytics();
      } else if (payload.type === 'removed') {
        fetchLeads();
      }
    } catch (e) {
      console.error('Error in live stream:', e);
    }
  };

  eventSource.onerror = () => {
    setTimeout(initRealtimeEventStream, 5000);
  };
}

// ============================================================
// 5. MASTER LEADS DIRECTORY & SOURCE-WISE KANBAN
// ============================================================
async function fetchLeads() {
  try {
    const res = await authFetch('/api/leads');
    const data = await res.json();
    allLeads = data.leads || [];

    // Calculate section counts & general metrics
    let stats = { total: 0, new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 };
    let sectionCounts = { '99acres': 0, meta: 0, other: 0, all: 0 };
    const projectSet = new Set();

    allLeads.forEach(l => {
      stats.total++;
      sectionCounts.all++;
      const st = (l.status || 'new').toLowerCase();
      if (stats[st] !== undefined) stats[st]++;
      if (l.property) projectSet.add(l.property);

      const src = (l.source || 'other').toLowerCase();
      if (src === '99acres') {
        sectionCounts['99acres']++;
      } else if (src === 'meta' || src === 'facebook' || src === 'instagram') {
        sectionCounts.meta++;
      } else {
        sectionCounts.other++;
      }
    });

    document.getElementById('kpi-total').innerText = stats.total;
    document.getElementById('kpi-new').innerText = stats.new;
    document.getElementById('kpi-contacted').innerText = stats.contacted;
    document.getElementById('kpi-site_visit').innerText = stats.site_visit;
    document.getElementById('kpi-negotiation').innerText = stats.negotiation;
    document.getElementById('kpi-won').innerText = stats.won;
    if (document.getElementById('kpi-lost')) document.getElementById('kpi-lost').innerText = stats.lost;

    const navBadge = document.getElementById('nav-badge-pipeline');
    if (navBadge) navBadge.innerText = stats.total;

    // Update main 4 sub-list tabs counts
    if (document.getElementById('sec-count-99acres')) document.getElementById('sec-count-99acres').innerText = sectionCounts['99acres'];
    if (document.getElementById('sec-count-meta')) document.getElementById('sec-count-meta').innerText = sectionCounts.meta;
    if (document.getElementById('sec-count-other')) document.getElementById('sec-count-other').innerText = sectionCounts.other;
    if (document.getElementById('sec-count-all')) document.getElementById('sec-count-all').innerText = sectionCounts.all;

    // Update sidebar sub-list counts
    if (document.getElementById('sidebar-cnt-99')) document.getElementById('sidebar-cnt-99').innerText = sectionCounts['99acres'];
    if (document.getElementById('sidebar-cnt-meta')) document.getElementById('sidebar-cnt-meta').innerText = sectionCounts.meta;
    if (document.getElementById('sidebar-cnt-other')) document.getElementById('sidebar-cnt-other').innerText = sectionCounts.other;
    if (document.getElementById('sidebar-cnt-all')) document.getElementById('sidebar-cnt-all').innerText = sectionCounts.all;

function getBuilderName(lead) {
  if (!lead) return 'Independent Developer';
  if (lead.builderName) return lead.builderName;
  const pLower = (lead.projectName || lead.property || lead.project || '').toLowerCase();
  if (pLower.includes('sobha')) return 'Sobha Limited';
  if (pLower.includes('ds max') || pLower.includes('ds-max')) return 'DS-MAX Properties';
  if (pLower.includes('total environment')) return 'Total Environment';
  if (pLower.includes('century')) return 'Century Real Estate';
  if (pLower.includes('brigade')) return 'Brigade Group';
  if (pLower.includes('adarsh')) return 'Adarsh Developers';
  if (pLower.includes('lodha')) return 'Lodha Group';
  if (pLower.includes('nps') || pLower.includes('natures nest')) return 'NPS Group';
  if (pLower.includes('prestige')) return 'Prestige Group';
  if (pLower.includes('purva') || pLower.includes('puravankara')) return 'Puravankara Limited';
  if (pLower.includes('godrej')) return 'Godrej Properties';
  if (pLower.includes('sattva') || pLower.includes('salarpuria')) return 'Salarpuria Sattva';
  return 'Premium Developer';
}
window.getBuilderName = getBuilderName;

    // Populate project and location filter dropdowns
    const zoneSet = new Set();
    const builderMap = {};

    allLeads.forEach(l => {
      if (l.locationZone) zoneSet.add(l.locationZone);
      if (l.subLocality && !l.subLocality.includes('Sub-Market')) zoneSet.add(l.subLocality);
      const bName = getBuilderName(l);
      builderMap[bName] = (builderMap[bName] || 0) + 1;
    });

    // Populate Builder / Developer filter dropdown
    const builderSelect = document.getElementById('builder-filter');
    if (builderSelect) {
      const currentBuilderVal = builderSelect.value;
      builderSelect.innerHTML = `<option value="ALL">🏗️ All Builders / Developers (${allLeads.length})</option>`;
      Object.entries(builderMap).sort((a, b) => b[1] - a[1]).forEach(([bName, count]) => {
        const opt = document.createElement('option');
        opt.value = bName;
        opt.innerText = `🏗️ ${bName} (${count})`;
        if (bName === currentBuilderVal) opt.selected = true;
        builderSelect.appendChild(opt);
      });
    }

    const locSelect = document.getElementById('location-filter');
    if (locSelect) {
      const currentLocVal = locSelect.value;
      locSelect.innerHTML = '<option value="ALL">📍 All Locations &amp; Zones</option>';
      
      // Standard regional zone groupings
      const standardZones = ['East Bangalore', 'North Bangalore', 'South Bangalore', 'West Bangalore', 'Central Bangalore'];
      standardZones.forEach(z => {
        const count = allLeads.filter(l => l.locationZone === z).length;
        if (count > 0) {
          const opt = document.createElement('option');
          opt.value = z;
          opt.innerText = `📍 ${z} (${count})`;
          if (z === currentLocVal) opt.selected = true;
          locSelect.appendChild(opt);
        }
      });

      // Add any other specific micro-markets/cities
      Array.from(zoneSet).forEach(z => {
        if (!standardZones.includes(z)) {
          const count = allLeads.filter(l => l.locationZone === z || l.subLocality === z || l.cityName === z).length;
          const opt = document.createElement('option');
          opt.value = z;
          opt.innerText = `🏙️ ${z} (${count})`;
          if (z === currentLocVal) opt.selected = true;
          locSelect.appendChild(opt);
        }
      });
    }

    const projSelect = document.getElementById('project-filter');
    if (projSelect) {
      const currentVal = projSelect.value;
      projSelect.innerHTML = '<option value="ALL">All Properties &amp; Projects</option>';
      Array.from(projectSet).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.innerText = p;
        if (p === currentVal) opt.selected = true;
        projSelect.appendChild(opt);
      });
    }

    // Refresh live sidebar team status & regional distribution widget
    const liveTeamStatus = computeTeamWorkloadFromLeads(allLeads);
    updateSidebarTeamStatusWidget(liveTeamStatus);
    renderCallbackRemindersBanner(allLeads);

    applyFilters();
  } catch (err) {
    console.error('Error fetching leads:', err);
  }
}

function applyFilters() {
  const query = document.getElementById('search-bar')?.value.toLowerCase().trim() || '';
  const selectedProj = document.getElementById('project-filter')?.value || 'ALL';
  const selectedBuilder = document.getElementById('builder-filter')?.value || 'ALL';
  const selectedLoc = document.getElementById('location-filter')?.value || 'ALL';
  const selectedAdvisor = document.getElementById('advisor-filter')?.value || 'ALL';

  const filtered = allLeads.filter(l => {
    // 1. Source Sub-List Filter (Supports 'all', '99acres', 'meta', 'other')
    const src = (l.source || 'other').toLowerCase();
    let matchesSection = false;

    if (activePipelineSection === 'all') {
      matchesSection = true;
    } else if (activePipelineSection === '99acres') {
      matchesSection = (src === '99acres');
    } else if (activePipelineSection === 'meta') {
      matchesSection = (src === 'meta' || src === 'facebook' || src === 'instagram');
    } else {
      // 'other' section
      if (src === '99acres' || src === 'meta' || src === 'facebook' || src === 'instagram') {
        matchesSection = false;
      } else {
        if (activeOtherSubSource === 'ALL') {
          matchesSection = true;
        } else if (activeOtherSubSource === 'walk-in') {
          matchesSection = (src === 'walk-in' || src === 'walkin');
        } else {
          matchesSection = (src === activeOtherSubSource.toLowerCase());
        }
      }
    }

    // 2. Location / Regional Zone Filter
    let matchesLoc = true;
    if (selectedLoc !== 'ALL') {
      const lZone = (l.locationZone || '').toLowerCase();
      const lSub = (l.subLocality || '').toLowerCase();
      const lDisp = (l.displayLocation || '').toLowerCase();
      const lCity = (l.cityName || l.city || '').toLowerCase();
      const target = selectedLoc.toLowerCase();
      matchesLoc = (lZone === target || lSub === target || lDisp.includes(target) || lCity.includes(target));
    }

    // 3. Advisor / Assignee Filter
    let matchesAdvisor = true;
    const lAssigned = (l.assignedTo || 'Unassigned').toLowerCase();
    const lEmail = (l.assignedToEmail || '').toLowerCase();

    if (selectedAdvisor === 'UNASSIGNED') {
      matchesAdvisor = (!l.assignedTo || l.assignedTo === 'Unassigned');
    } else if (selectedAdvisor === 'Priya') {
      matchesAdvisor = lAssigned.includes('priya');
    } else if (selectedAdvisor === 'Maya') {
      matchesAdvisor = lAssigned.includes('maya');
    } else if (selectedAdvisor === 'Arjun') {
      matchesAdvisor = lAssigned.includes('arjun');
    } else if (selectedAdvisor === 'Test') {
      matchesAdvisor = lAssigned.includes('test');
    } else if (selectedAdvisor !== 'ALL') {
      matchesAdvisor = lAssigned.includes(selectedAdvisor.toLowerCase());
    }

    // Role-based pipeline restriction for SALES (or when impersonating a SALES executive)
    if (currentUser && currentUser.role === 'SALES') {
      const myFirstName = (currentUser.name || '').toLowerCase().split(' ')[0];
      const myEmail = (currentUser.email || '').toLowerCase();
      matchesAdvisor = lAssigned.includes(myFirstName) || (myEmail && lEmail === myEmail);
    }

    // 4. "My Leads" Only Toggle
    if (myLeadsOnly && currentUser) {
      const myFirstName = (currentUser.name || '').toLowerCase().split(' ')[0];
      if (myFirstName && myFirstName !== 'avery' && myFirstName !== 'ceo' && !myFirstName.includes('it')) {
        matchesAdvisor = matchesAdvisor && lAssigned.includes(myFirstName);
      }
    }

    // 5. Builder / Developer Filter
    const builderName = getBuilderName(l);
    const matchesBuilder = (selectedBuilder === 'ALL') || (builderName === selectedBuilder);

    // 6. Search & Project Filter
    const matchesSearch = !query ||
      (l.name && l.name.toLowerCase().includes(query)) ||
      (l.phone && l.phone.includes(query)) ||
      (l.email && l.email.toLowerCase().includes(query)) ||
      (l.property && l.property.toLowerCase().includes(query)) ||
      (l.projectName && l.projectName.toLowerCase().includes(query)) ||
      (builderName && builderName.toLowerCase().includes(query)) ||
      (l.locationZone && l.locationZone.toLowerCase().includes(query)) ||
      (l.subLocality && l.subLocality.toLowerCase().includes(query)) ||
      (l.displayLocation && l.displayLocation.toLowerCase().includes(query)) ||
      (l.cityName && l.cityName.toLowerCase().includes(query)) ||
      (l.notes && l.notes.toLowerCase().includes(query)) ||
      (l.lastRemark && l.lastRemark.toLowerCase().includes(query)) ||
      (l.assignedTask && l.assignedTask.toLowerCase().includes(query)) ||
      (l.assignedTo && l.assignedTo.toLowerCase().includes(query)) ||
      (l.nextCallReason && l.nextCallReason.toLowerCase().includes(query));

    const matchesProject = (selectedProj === 'ALL') || (l.property === selectedProj) || (l.projectName === selectedProj);

    return matchesSection && matchesLoc && matchesAdvisor && matchesSearch && matchesProject && matchesBuilder;
  });

  renderLeads(filtered);
}

function renderLeads(leads) {
  const canAssign = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'SALES_MANAGER');

  ['new', 'contacted', 'site_visit', 'negotiation', 'won', 'lost'].forEach(stage => {
    const col = document.getElementById(`col-${stage.toUpperCase()}`);
    if (col) col.innerHTML = '';
  });

  const countMap = { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 };
  const tableRows = document.getElementById('table-leads-rows');
  if (tableRows) tableRows.innerHTML = '';

  // Update Unassigned Alert Banner for Priya (Manager) & Super Admin
  const unassignedCount = allLeads.filter(l => !l.assignedTo || l.assignedTo === 'Unassigned').length;
  const dispatchBanner = document.getElementById('unassigned-dispatch-banner');
  const badgeCount = document.getElementById('unassigned-badge-count');
  const bulkCount = document.getElementById('bulk-unassigned-count');

  if (badgeCount) badgeCount.innerText = unassignedCount;
  if (bulkCount) bulkCount.innerText = unassignedCount;

  if (dispatchBanner) {
    if (unassignedCount > 0 && currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'SALES_MANAGER')) {
      dispatchBanner.classList.remove('hidden');
    } else {
      dispatchBanner.classList.add('hidden');
    }
  }

    leads.forEach(lead => {
    const rawStatus = (lead.status || 'new').toLowerCase();
    const stageKey = ['new', 'contacted', 'site_visit', 'negotiation', 'won', 'lost'].includes(rawStatus) ? rawStatus : 'new';
    countMap[stageKey] = (countMap[stageKey] || 0) + 1;

    const cleanPhone = String(lead.phone || '').replace(/\D/g, '');
    const waText = encodeURIComponent(`Hi ${lead.name || 'Sir/Madam'}, thank you for inquiring about ${lead.displayProperty || lead.property || 'our luxury residences'} with Horizon Realty.`);
    const waLink = `https://wa.me/91${cleanPhone}?text=${waText}`;

    const srcStyle = SOURCE_CONFIG[lead.source?.toLowerCase()] || SOURCE_CONFIG.other;
    const timeAgo = formatTimeAgo(lead.createdAt);
    const builderName = getBuilderName(lead);

    // Location tag
    const locTagText = lead.displayLocation || (lead.locationZone ? `${lead.locationZone} • ${lead.subLocality || 'Prime'}` : (lead.cityName || 'Bangalore'));

    // Assignee Badge Generation
    let assigneeBadgeHtml = '';
    const assignedName = lead.assignedTo || 'Unassigned';
    if (assignedName.toLowerCase().includes('senior') || assignedName.toLowerCase().includes('advisor 1') || assignedName.toLowerCase().includes('advisor1') || assignedName.toLowerCase().includes('arjun')) {
      assigneeBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-user text-[8px] text-blue-700"></i> Senior Advisor</span>`;
    } else if (assignedName.toLowerCase().includes('relationship') || assignedName.toLowerCase().includes('advisor 2') || assignedName.toLowerCase().includes('advisor2') || assignedName.toLowerCase().includes('maya')) {
      assigneeBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-user text-[8px] text-emerald-700"></i> Rel. Manager</span>`;
    } else if (assignedName.toLowerCase().includes('manager') || assignedName.toLowerCase().includes('priya')) {
      assigneeBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-user-shield text-[8px] text-purple-700"></i> Sales Mgr</span>`;
    } else {
      assigneeBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shadow-2xs animate-pulse"><i class="fa-solid fa-bolt text-[8px] text-amber-700"></i> Unassigned</span>`;
    }

    // Assigned Task Badge
    let assignedTaskHtml = '';
    if (lead.assignedTask) {
      assignedTaskHtml = `
        <div class="px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-[10px] font-extrabold text-purple-900 truncate flex items-center justify-between gap-1 shadow-2xs">
          <span class="truncate flex items-center gap-1.5"><i class="fa-solid fa-list-check text-purple-600 text-[9px]"></i>${escapeHtml(lead.assignedTask)}</span>
          ${lead.taskDueDate ? `<span class="text-[9px] font-mono text-purple-700 font-bold shrink-0">${escapeHtml(lead.taskDueDate.slice(5))}</span>` : ''}
        </div>
      `;
    }

    // Next Call Follow-up Badge
    let followupBadgeHtml = '';
    if (lead.nextCallDate && lead.followupStatus !== 'COMPLETED') {
      followupBadgeHtml = `
        <div class="px-2.5 py-1 rounded-xl badge-followup text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
          <i class="fa-solid fa-clock text-amber-700 text-[10px]"></i>
          <span class="truncate text-amber-900 font-extrabold">Next Call: ${escapeHtml(lead.nextCallDate)} ${lead.nextCallTime ? lead.nextCallTime : ''}</span>
        </div>
      `;
    }

    // Remark snippet preview
    let remarkSnippet = lead.lastRemark ? `💬 "${escapeHtml(lead.lastRemark)}"` : `"${escapeHtml(lead.notes || 'Inquiry logged')}"`;

    // RNR & Prospect Status Badges
    let rnrBadgeHtml = '';
    const rnrCount = Number(lead.rnrCount || 0);
    if (rnrCount === 1) {
      rnrBadgeHtml = '<div class="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-phone-slash text-[9px] text-amber-700"></i> RNR 1 (1/3)</div>';
    } else if (rnrCount === 2) {
      rnrBadgeHtml = '<div class="px-2.5 py-0.5 rounded-lg bg-orange-100 text-orange-950 border border-orange-300 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-phone-slash text-[9px] text-orange-700"></i> ⚠️ RNR 2 (2/3)</div>';
    } else if (rnrCount >= 3 || lead.autoLostReason) {
      rnrBadgeHtml = '<div class="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-950 border border-rose-300 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-ban text-[9px] text-rose-700"></i> 🚨 3x RNR Auto Lost</div>';
    } else if (lead.subStatus && lead.subStatus.includes('Prospect')) {
      rnrBadgeHtml = '<div class="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-star text-[9px] text-emerald-700"></i> 🌟 Prospect</div>';
    }

    // 1. Kanban Card (White Executive High Contrast)
    const col = document.getElementById(`col-${stageKey.toUpperCase()}`);
    if (col) {
      const card = document.createElement('div');
      card.className = `glass-card rounded-2xl p-3.5 space-y-2.5 transition duration-200 shadow-sm cursor-pointer group hover:-translate-y-0.5 border border-slate-200 bg-white ${srcStyle.cardBorder}`;
      card.onclick = () => openLeadModal(lead.id);

      card.innerHTML = `
        <div class="flex items-start justify-between gap-1">
          <div class="truncate">
            <div class="font-black text-slate-900 text-xs group-hover:text-amber-700 transition">${escapeHtml(lead.name || 'Anonymous')}</div>
            <div class="text-[11px] text-amber-800 font-mono font-bold tracking-tight"><i class="fa-solid fa-phone text-[9px] mr-1 text-slate-400"></i>${escapeHtml(lead.phone)}</div>
          </div>
          <span class="text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase ${srcStyle.badgeClass} flex items-center gap-1 shadow-2xs shrink-0">
            <i class="${srcStyle.icon} text-[10px]"></i> ${srcStyle.label}
          </span>
        </div>

        <div class="text-[11px] text-slate-800 font-bold truncate flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
          <i class="${srcStyle.tagIcon} text-[10px]"></i>
          <span class="text-slate-500 text-[10px] font-semibold">${srcStyle.tagPrefix}:</span>
          <span class="truncate">${escapeHtml(lead.displayProperty || lead.property || lead.projectName || 'General Asset')}</span>
        </div>

        <!-- Builder & Location Badges -->
        <div class="flex items-center justify-between gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-950 border border-purple-200 text-[9.5px] font-black inline-flex items-center gap-1 shadow-2xs truncate max-w-[150px]">
            <i class="fa-solid fa-city text-purple-600 text-[8px]"></i>
            <span class="truncate">${escapeHtml(builderName)}</span>
          </span>
          <span class="text-[9.5px] text-amber-900 font-bold truncate inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 shadow-2xs">
            <i class="fa-solid fa-location-dot text-amber-600 text-[8px]"></i>
            <span class="truncate">${escapeHtml(locTagText)}</span>
          </span>
        </div>

        <!-- Assignee & Status Badges -->
        <div class="flex items-center justify-between gap-2">
          ${assigneeBadgeHtml}
          ${rnrBadgeHtml ? `<div>${rnrBadgeHtml}</div>` : ''}
        </div>

        ${assignedTaskHtml}
        ${followupBadgeHtml}

        <div class="text-[11px] text-slate-600 line-clamp-2 italic px-1 leading-relaxed font-medium">
          ${remarkSnippet}
        </div>

        <div class="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
          <span class="text-slate-500 font-semibold font-mono">${timeAgo}</span>
          <div class="flex items-center space-x-1.5" onclick="event.stopPropagation()">
            ${canAssign ? `<button onclick="quickOpenAssign(event, '${lead.id}')" class="p-1.5 px-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition active:scale-95 shadow-2xs font-bold" title="Assign to Arjun / Maya / Priya"><i class="fa-solid fa-user-tag mr-0.5"></i></button>` : ''}
            <button onclick="quickCallLead('${lead.id}', '${cleanPhone}')" class="p-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition active:scale-95 shadow-2xs" title="Call &amp; Log Outcome"><i class="fa-solid fa-phone"></i></button>
            <a href="${waLink}" target="_blank" onclick="logQuickWhatsApp('${lead.id}')" class="p-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition active:scale-95 shadow-2xs" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
          </div>
        </div>
      `;
      col.appendChild(card);
    }

    // 2. Master Table Row (White Executive High Contrast)
    if (tableRows) {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition cursor-pointer bg-white';
      tr.onclick = () => openLeadModal(lead.id);
      
      const isSuperAdmin = currentUser && currentUser.role === 'SUPER_ADMIN';
      const deleteBtnHtml = isSuperAdmin ? `<button onclick="deleteLeadDirectly('${lead.id}')" class="p-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition ml-1 shadow-2xs" title="Super Admin Delete"><i class="fa-solid fa-trash"></i></button>` : '';
      const tableAssignBtnHtml = canAssign ? `<button onclick="quickOpenAssign(event, '${lead.id}')" class="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-xl text-xs font-bold transition shadow-2xs mr-1" title="Assign to Arjun / Maya / Priya"><i class="fa-solid fa-user-tag mr-1"></i>Assign</button>` : '';

      const nextCallCol = (lead.nextCallDate && lead.followupStatus !== 'COMPLETED')
        ? `<span class="px-2.5 py-1 rounded-xl badge-followup text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs"><i class="fa-solid fa-calendar-check text-[10px] text-amber-700"></i>${escapeHtml(lead.nextCallDate)} ${lead.nextCallTime || ''}</span>`
        : `<span class="text-slate-400 text-[11px]">—</span>`;

      tr.innerHTML = `
        <td class="p-3.5">
          <div class="font-black text-slate-900 text-xs">${escapeHtml(lead.name || 'Anonymous')}</div>
          <div class="text-amber-800 font-mono text-[11px] font-bold">${escapeHtml(lead.phone)}</div>
          <div class="flex items-center gap-1.5 flex-wrap mt-1">
            <span class="text-slate-800 text-[11px] font-bold">${escapeHtml(lead.displayProperty || lead.property || 'General')}</span>
            <span class="px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200 text-[9px] font-black"><i class="fa-solid fa-city text-[8px] text-purple-600 mr-0.5"></i>${escapeHtml(builderName)}</span>
          </div>
          ${rnrBadgeHtml ? `<div class="mt-1">${rnrBadgeHtml}</div>` : ''}
        </td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold inline-flex items-center gap-1.5 shadow-2xs">
            <i class="fa-solid fa-location-dot text-amber-600"></i>
            <span>${escapeHtml(locTagText)}</span>
          </span>
        </td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${srcStyle.badgeClass} inline-flex items-center gap-1.5 shadow-2xs font-bold">
            <i class="${srcStyle.icon}"></i> ${srcStyle.label}
          </span>
        </td>
        <td class="p-3.5">
          <div class="text-slate-700 text-[11px] max-w-xs font-medium line-clamp-2 leading-snug">${escapeHtml(lead.lastRemark || lead.notes || 'No remarks recorded yet')}</div>
          ${lead.assignedTask ? `<div class="text-[10px] text-purple-700 font-bold mt-0.5 flex items-center gap-1"><i class="fa-solid fa-list-check"></i> ${escapeHtml(lead.assignedTask)}</div>` : ''}
        </td>
        <td class="p-3.5">
          ${nextCallCol}
        </td>
        <td class="p-3.5">
          ${assigneeBadgeHtml}
        </td>
        <td class="p-3.5">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black border ${STAGE_CONFIG[stageKey]?.color || ''} uppercase">${STAGE_CONFIG[stageKey]?.label || stageKey}</span>
        </td>
        <td class="p-3.5 text-right" onclick="event.stopPropagation()">
          ${tableAssignBtnHtml}
          <button onclick="openLeadModal('${lead.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition shadow-2xs">Dossier</button>
          ${deleteBtnHtml}
        </td>
      `;
      tableRows.appendChild(tr);
    }
  });

  if (document.getElementById('count-NEW')) document.getElementById('count-NEW').innerText = countMap.new || 0;
  if (document.getElementById('count-CONTACTED')) document.getElementById('count-CONTACTED').innerText = countMap.contacted || 0;
  if (document.getElementById('count-SITE_VISIT')) document.getElementById('count-SITE_VISIT').innerText = countMap.site_visit || 0;
  if (document.getElementById('count-NEGOTIATION')) document.getElementById('count-NEGOTIATION').innerText = countMap.negotiation || 0;
  if (document.getElementById('count-WON')) document.getElementById('count-WON').innerText = countMap.won || 0;
  if (document.getElementById('count-LOST')) document.getElementById('count-LOST').innerText = countMap.lost || 0;
}

// 1-Click Export Filtered Leads to CSV File
function exportLeadsToCSV() {
  const query = document.getElementById('search-bar')?.value.toLowerCase().trim() || '';
  const selectedProj = document.getElementById('project-filter')?.value || 'ALL';
  const selectedBuilder = document.getElementById('builder-filter')?.value || 'ALL';
  const selectedLoc = document.getElementById('location-filter')?.value || 'ALL';
  const selectedAdvisor = document.getElementById('advisor-filter')?.value || 'ALL';

  const exportList = allLeads.filter(l => {
    // 1. Source Sub-List Filter
    const src = (l.source || 'other').toLowerCase();
    let matchesSection = false;

    if (activePipelineSection === 'all') {
      matchesSection = true;
    } else if (activePipelineSection === '99acres') {
      matchesSection = (src === '99acres');
    } else if (activePipelineSection === 'meta') {
      matchesSection = (src === 'meta' || src === 'facebook' || src === 'instagram');
    } else {
      if (src === '99acres' || src === 'meta' || src === 'facebook' || src === 'instagram') {
        matchesSection = false;
      } else {
        if (activeOtherSubSource === 'ALL') {
          matchesSection = true;
        } else if (activeOtherSubSource === 'walk-in') {
          matchesSection = (src === 'walk-in' || src === 'walkin');
        } else {
          matchesSection = (src === activeOtherSubSource.toLowerCase());
        }
      }
    }

    // 2. Location Zone Filter
    let matchesLoc = true;
    if (selectedLoc !== 'ALL') {
      const lZone = (l.locationZone || '').toLowerCase();
      const lSub = (l.subLocality || '').toLowerCase();
      const lDisp = (l.displayLocation || '').toLowerCase();
      const lCity = (l.cityName || l.city || '').toLowerCase();
      const target = selectedLoc.toLowerCase();
      matchesLoc = (lZone === target || lSub === target || lDisp.includes(target) || lCity.includes(target));
    }

    // 3. Advisor Filter
    let matchesAdvisor = true;
    const lAssigned = (l.assignedTo || 'Unassigned').toLowerCase();
    const lEmail = (l.assignedToEmail || '').toLowerCase();

    if (selectedAdvisor === 'UNASSIGNED') {
      matchesAdvisor = (!l.assignedTo || l.assignedTo === 'Unassigned');
    } else if (selectedAdvisor === 'Priya') {
      matchesAdvisor = lAssigned.includes('priya');
    } else if (selectedAdvisor === 'Maya') {
      matchesAdvisor = lAssigned.includes('maya');
    } else if (selectedAdvisor === 'Arjun') {
      matchesAdvisor = lAssigned.includes('arjun');
    } else if (selectedAdvisor === 'Test') {
      matchesAdvisor = lAssigned.includes('test');
    } else if (selectedAdvisor !== 'ALL') {
      matchesAdvisor = lAssigned.includes(selectedAdvisor.toLowerCase());
    }

    if (currentUser && currentUser.role === 'SALES') {
      const myFirstName = (currentUser.name || '').toLowerCase().split(' ')[0];
      const myEmail = (currentUser.email || '').toLowerCase();
      matchesAdvisor = lAssigned.includes(myFirstName) || (myEmail && lEmail === myEmail);
    }

    // 4. Builder Filter
    const builderName = getBuilderName(l);
    const matchesBuilder = (selectedBuilder === 'ALL') || (builderName === selectedBuilder);

    // 5. Search Filter
    const matchesSearch = !query || 
      (l.name && l.name.toLowerCase().includes(query)) ||
      (l.phone && l.phone.includes(query)) ||
      (l.email && l.email.toLowerCase().includes(query)) ||
      (l.property && l.property.toLowerCase().includes(query)) ||
      (l.projectName && l.projectName.toLowerCase().includes(query)) ||
      (builderName && builderName.toLowerCase().includes(query)) ||
      (l.lastRemark && l.lastRemark.toLowerCase().includes(query)) ||
      (l.notes && l.notes.toLowerCase().includes(query));

    const matchesProject = (selectedProj === 'ALL') || (l.property === selectedProj) || (l.projectName === selectedProj);

    return matchesSection && matchesLoc && matchesAdvisor && matchesBuilder && matchesSearch && matchesProject;
  });

  if (exportList.length === 0) {
    showToast('⚠️ No leads match the current filters to export', 'info');
    return;
  }

  const headers = [
    'Inquiry ID',
    'Customer Name',
    'Phone Number',
    'Email Address',
    'Lead Source',
    'Builder / Developer',
    'Project / Property',
    'Price / Budget',
    'Location Zone',
    'Micro-Market / Sub-Locality',
    'City',
    'Pipeline Stage',
    'Sub-Status / RNR Status',
    'RNR Strike Count',
    'Assigned Advisor',
    'Assigned Task',
    'Task Deadline',
    'Latest Remark / Call Feedback',
    'Next Scheduled Callback Date',
    'Next Scheduled Callback Time',
    'Followup Status',
    'Created At'
  ];

  const csvRows = [headers.join(',')];

  exportList.forEach(lead => {
    const bName = getBuilderName(lead);
    const row = [
      `"${lead.inquiryId || lead.id || ''}"`,
      `"${(lead.name || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(lead.phone || '').replace(/"/g, '""')}"`,
      `"${(lead.email || '').replace(/"/g, '""')}"`,
      `"${(lead.source || 'OTHER').toUpperCase()}"`,
      `"${bName.replace(/"/g, '""')}"`,
      `"${(lead.displayProperty || lead.projectName || lead.property || '').replace(/"/g, '""')}"`,
      `"${(lead.price || lead.budget || lead.rawPrice || '').replace(/"/g, '""')}"`,
      `"${(lead.locationZone || 'East Bangalore').replace(/"/g, '""')}"`,
      `"${(lead.subLocality || '').replace(/"/g, '""')}"`,
      `"${(lead.cityName || lead.city || 'Bangalore').replace(/"/g, '""')}"`,
      `"${(lead.status || 'new').toUpperCase()}"`,
      `"${(lead.subStatus || lead.rnrStatus || '').replace(/"/g, '""')}"`,
      `"${lead.rnrCount !== undefined ? lead.rnrCount : 0}"`,
      `"${(lead.assignedTo || 'Unassigned').replace(/"/g, '""')}"`,
      `"${(lead.assignedTask || '').replace(/"/g, '""')}"`,
      `"${(lead.taskDueDate ? lead.taskDueDate + ' ' + (lead.taskDueTime || '') : '').replace(/"/g, '""')}"`,
      `"${(lead.lastRemark || lead.notes || '').replace(/"/g, '""')}"`,
      `"${lead.nextCallDate || ''}"`,
      `"${lead.nextCallTime || ''}"`,
      `"${lead.followupStatus || ''}"`,
      `"${lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.href = url;
  downloadAnchor.download = `horizon_${activePipelineSection}_leads_${dateStr}.csv`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);

  showToast(`📥 Successfully downloaded ${exportList.length} leads as CSV!`, 'success');
}
window.exportLeadsToCSV = exportLeadsToCSV;

// ============================================================
// 6. EXCEL / CSV SPREADSHEET INGESTION ENGINE
// ============================================================
function openUploadExcelModal() {
  document.getElementById('modal-upload-excel').classList.remove('hidden');
}

function closeUploadExcelModal() {
  document.getElementById('modal-upload-excel').classList.add('hidden');
  document.getElementById('excel-file-input').value = '';
  document.getElementById('excel-file-label').innerText = 'Click to browse or drop .xlsx / .csv spreadsheet';
  document.getElementById('excel-preview-container').classList.add('hidden');
  document.getElementById('btn-submit-excel-import').disabled = true;
  document.getElementById('btn-excel-text').innerText = 'Select a Spreadsheet to Import';
  parsedExcelRows = [];
}

function handleExcelFileSelected(e) {
  const file = e.target.files[0];
  if (!file) return;

  document.getElementById('excel-file-label').innerText = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  const reader = new FileReader();

  reader.onload = function(evt) {
    try {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!json || json.length === 0) {
        showToast('⚠️ No records found in the uploaded spreadsheet', 'error');
        return;
      }

      parsedExcelRows = json;

      // Populate preview table
      document.getElementById('excel-preview-count').innerText = json.length;
      const tbody = document.getElementById('excel-preview-tbody');
      tbody.innerHTML = '';

      json.slice(0, 5).forEach(row => {
        const tr = document.createElement('tr');
        const name = row.name || row.Name || row['Customer Name'] || row['Full Name'] || 'Anonymous';
        const phone = row.phone || row.mobile || row.Phone || row.Mobile || row['Phone Number'] || '—';
        const proj = row.project || row.Project || row.property || row.Property || 'Default';
        const notes = row.notes || row.Notes || row.remark || row.Remarks || '—';

        tr.innerHTML = `
          <td class="p-1.5 font-bold text-white truncate max-w-[100px]">${escapeHtml(name)}</td>
          <td class="p-1.5 text-brand-400 font-mono">${escapeHtml(phone)}</td>
          <td class="p-1.5 truncate max-w-[120px]">${escapeHtml(proj)}</td>
          <td class="p-1.5 text-slate-400 truncate max-w-[140px]">${escapeHtml(notes)}</td>
        `;
        tbody.appendChild(tr);
      });

      document.getElementById('excel-preview-container').classList.remove('hidden');
      const submitBtn = document.getElementById('btn-submit-excel-import');
      submitBtn.disabled = false;
      const src = document.getElementById('excel-import-source').value.toUpperCase();
      document.getElementById('btn-excel-text').innerText = `Import ${json.length} Leads into [${src}]`;
    } catch (err) {
      console.error('Error reading Excel:', err);
      showToast('Error reading spreadsheet file', 'error');
    }
  };

  reader.readAsBinaryString(file);
}

// Update submit button text when source dropdown changes
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'excel-import-source' && parsedExcelRows.length > 0) {
    const src = e.target.value.toUpperCase();
    document.getElementById('btn-excel-text').innerText = `Import ${parsedExcelRows.length} Leads into [${src}]`;
  }
});

async function executeExcelImport() {
  if (!parsedExcelRows || parsedExcelRows.length === 0) return;

  const targetSource = document.getElementById('excel-import-source').value;
  const defaultProject = document.getElementById('excel-default-project').value;
  const submitBtn = document.getElementById('btn-submit-excel-import');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Ingesting Spreadsheet Leads into Firestore...';

  try {
    const res = await authFetch('/api/leads/import-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leads: parsedExcelRows,
        source: targetSource,
        defaultProject,
        advisorName: currentUser?.name || 'Admin'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`🎉 Success! Imported ${data.importedCount} leads into [${targetSource.toUpperCase()}]`, 'success');
      closeUploadExcelModal();
      
      // Auto-switch to the section where leads were imported
      if (targetSource === '99acres') {
        switchPipelineSection('99acres');
      } else if (targetSource === 'meta') {
        switchPipelineSection('meta');
      } else {
        switchPipelineSection('other');
        filterSubSource(targetSource);
      }

      fetchLeads();
    } else {
      showToast(data.error || 'Failed to import spreadsheet', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error importing spreadsheet', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-database mr-1.5"></i> Select a Spreadsheet to Import';
  }
}

// ============================================================
// 7. INTERACTION LOGGING, REMARK HISTORY & FIRESTORE
// ============================================================
async function openLeadModal(id) {
  currentLeadId = id;
  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(id));
    const data = await res.json();
    if (!data.success) return;

    const lead = data.lead;
    const activities = data.activities || [];
    const srcStyle = SOURCE_CONFIG[lead.source?.toLowerCase()] || SOURCE_CONFIG.other;

    document.getElementById('md-name').innerText = lead.name || 'Anonymous Lead';
    document.getElementById('md-phone').innerText = lead.phone;
    document.getElementById('md-email').innerText = lead.email || 'No email provided';
    document.getElementById('md-property').innerText = lead.displayProperty || lead.property || lead.projectName || 'General Listing';
    document.getElementById('md-location').innerText = lead.displayLocation || (lead.locationZone ? `${lead.locationZone} • ${lead.subLocality || 'Prime'}` : (lead.cityName || 'Bangalore'));
    
    // Assigned Advisor display
    const mdAssigned = document.getElementById('md-assigned');
    const assignedName = lead.assignedTo || 'Unassigned';
    mdAssigned.innerText = assignedName;
    if (assignedName.toLowerCase().includes('arjun')) {
      mdAssigned.className = 'text-xs font-black text-blue-700';
    } else if (assignedName.toLowerCase().includes('maya')) {
      mdAssigned.className = 'text-xs font-black text-emerald-700';
    } else if (assignedName.toLowerCase().includes('priya')) {
      mdAssigned.className = 'text-xs font-black text-purple-700';
    } else {
      mdAssigned.className = 'text-xs font-bold text-amber-700';
    }

    // Assigned Task Box
    const taskBox = document.getElementById('md-task-box');
    if (taskBox) {
      if (lead.assignedTask) {
        taskBox.classList.remove('hidden');
        document.getElementById('md-task-title').innerText = `Task: ${lead.assignedTask}`;
        document.getElementById('md-task-priority').innerText = `${lead.taskPriority || 'HIGH'} PRIORITY`;
        document.getElementById('md-task-instructions').innerText = lead.taskInstructions ? `"${lead.taskInstructions}"` : 'No special manager instructions provided.';
        document.getElementById('md-task-due').innerText = `⏰ Deadline: ${lead.taskDueDate || 'Today'} ${lead.taskDueTime || ''} (Assigned by ${lead.assignedBy || 'Manager'})`;
      } else {
        taskBox.classList.add('hidden');
      }
    }

    // Big prominent source tag
    const srcBadge = document.getElementById('md-source');
    srcBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase ' + srcStyle.badgeClass;
    srcBadge.innerHTML = '<i class="' + srcStyle.icon + ' mr-1.5"></i> SOURCE: ' + srcStyle.label;

    document.getElementById('md-stage-select').value = (lead.status || 'new').toLowerCase();

    const score = document.getElementById('md-lead-score');
    const nextAction = document.getElementById('md-next-action');
    const matches = document.getElementById('md-property-matches');
    if (score) score.textContent = lead.leadScore ? `${lead.leadScore}/100` : 'Profile pending';
    if (nextAction) nextAction.textContent = lead.nextBestAction || 'Capture budget and timeline to unlock the recommended next action.';
    if (matches) {
      const recommended = Array.isArray(lead.recommendedProperties) ? lead.recommendedProperties : [];
      matches.innerHTML = recommended.length ? recommended.map(item => `<span class="px-2.5 py-1 rounded-full bg-white border border-emerald-200 text-[10px] font-black text-emerald-800"><i class="fa-solid fa-house mr-1"></i>${escapeHtml(item)}</span>`).join('') : '<span class="text-[10px] font-semibold text-slate-500">Recommended properties will appear here.</span>';
    }

    // 4 Call Outcomes Strike Status in Dossier
    const rnrBadge = document.getElementById('md-rnr-strike-status');
    if (rnrBadge) {
      const currentRnr = Number(lead.rnrCount || 0);
      const isLost = (lead.status || '').toLowerCase() === 'lost';
      const isProspect = (lead.subStatus || '').includes('Prospect');

      if (isLost) {
        rnrBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-300';
        rnrBadge.innerText = lead.autoLostReason ? '🚨 3 Strikes (Auto Lost)' : '❌ Closed / Not Interested';
      } else if (isProspect) {
        rnrBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300';
        rnrBadge.innerText = '🌟 Active Prospect (0 Strikes)';
      } else if (currentRnr === 1) {
        rnrBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300';
        rnrBadge.innerText = '⚠️ Attempt 1/3 (RNR 1)';
      } else if (currentRnr === 2) {
        rnrBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-950 border border-orange-300 animate-pulse';
        rnrBadge.innerText = '⚠️ Attempt 2/3 (RNR 2)';
      } else {
        rnrBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-200 text-slate-800 border border-slate-300';
        rnrBadge.innerText = '0/3 Strikes (Clean)';
      }
    }

    // Next Follow-up Alert Banner
    const followupBanner = document.getElementById('md-followup-banner');
    const followupDetails = document.getElementById('md-followup-details');
    if (lead.nextCallDate && lead.followupStatus !== 'COMPLETED') {
      followupBanner.classList.remove('hidden');
      followupDetails.innerText = `Call scheduled on ${lead.nextCallDate} at ${lead.nextCallTime || '10:00 AM'}${lead.nextCallReason ? ' (' + lead.nextCallReason + ')' : ''}`;
    } else {
      followupBanner.classList.add('hidden');
    }

    // Render activity & remark timeline
    const timeline = document.getElementById('md-activity-timeline');
    timeline.innerHTML = '';

    if (activities.length === 0) {
      timeline.innerHTML = '<div class="text-slate-500 italic p-3 text-center bg-surface-950 rounded-xl">No recorded remarks or activities yet. Add a remark above.</div>';
    } else {
      activities.forEach(act => {
        const item = document.createElement('div');
        item.className = 'p-3 rounded-2xl bg-surface-950 border border-slate-800 space-y-1.5 relative';

        let iconTag = '<i class="fa-solid fa-comment-dots text-brand-400 mr-1.5"></i>';
        if (act.type === 'CALL_LOG') iconTag = '<i class="fa-solid fa-phone text-blue-400 mr-1.5"></i>';
        if (act.type === 'WHATSAPP') iconTag = '<i class="fa-brands fa-whatsapp text-emerald-400 mr-1.5"></i>';
        if (act.type === 'SITE_VISIT') iconTag = '<i class="fa-solid fa-building text-purple-400 mr-1.5"></i>';
        if (act.type === 'STATUS_CHANGE') iconTag = '<i class="fa-solid fa-arrow-progress text-cyan-400 mr-1.5"></i>';
        if (act.type === 'EXCEL_IMPORT') iconTag = '<i class="fa-solid fa-file-excel text-emerald-400 mr-1.5"></i>';

        let nextCallBadge = '';
        if (act.nextCallDate) {
          nextCallBadge = `
            <div class="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg badge-followup text-[10px] font-bold">
              <i class="fa-solid fa-bell text-[9px]"></i> Callback: ${escapeHtml(act.nextCallDate)} ${act.nextCallTime ? act.nextCallTime : ''} ${act.nextCallReason ? '(' + escapeHtml(act.nextCallReason) + ')' : ''}
            </div>
          `;
        }

        item.innerHTML = `
          <div class="flex items-center justify-between text-[11px]">
            <div class="flex items-center gap-1.5">
              ${iconTag}
              <span class="font-black text-slate-100">${escapeHtml(act.title || act.type)}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-brand-400 font-bold"><i class="fa-solid fa-user-tie text-[9px] mr-1"></i>${escapeHtml(act.advisor || 'Advisor')}</span>
              <span class="text-[10px] text-slate-500 font-mono">${act.createdAt ? new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
            </div>
          </div>
          <div class="text-[11px] text-slate-300 leading-relaxed font-normal pl-4">
            ${escapeHtml(act.details || '')}
          </div>
          ${nextCallBadge}
        `;
        timeline.appendChild(item);
      });
    }

    document.getElementById('modal-lead').classList.remove('hidden');
  } catch (err) {
    console.error('Error opening lead modal:', err);
  }
}

function closeLeadModal() {
  document.getElementById('modal-lead').classList.add('hidden');
  currentLeadId = null;
}

// Preset Followup Date & Time Helper
function setPresetFollowup(daysAhead, timeStr) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const dateStr = targetDate.toISOString().split('T')[0];
  
  const dateInput = document.getElementById('remark-next-date');
  const timeInput = document.getElementById('remark-next-time');
  if (dateInput) dateInput.value = dateStr;
  if (timeInput) timeInput.value = timeStr;
}

// Save Remark & Next Call Schedule
async function handleSaveRemark(e) {
  e.preventDefault();
  if (!currentLeadId) return;

  const remarkCategory = document.getElementById('remark-category').value;
  const remarkText = document.getElementById('remark-text').value;
  const nextCallDate = document.getElementById('remark-next-date').value;
  const nextCallTime = document.getElementById('remark-next-time').value;

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/remark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remark: remarkText,
        remarkType: remarkCategory,
        nextCallDate,
        nextCallTime,
        nextCallReason: remarkCategory,
        advisorName: currentUser?.name || 'Advisor'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast('📝 Remark & callback schedule saved to Firestore!', 'success');
      document.getElementById('remark-text').value = '';
      document.getElementById('remark-next-date').value = '';
      document.getElementById('remark-next-time').value = '';
      openLeadModal(currentLeadId);
      fetchLeads();
    } else {
      showToast(data.error || 'Failed to save remark', 'error');
    }
  } catch (err) {
    console.error(err);
  }
}

// Mark Scheduled Follow-up Completed
async function markFollowupDone() {
  if (!currentLeadId) return;
  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/complete-followup', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advisorName: currentUser?.name || 'Advisor' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Follow-up marked as completed!', 'success');
      openLeadModal(currentLeadId);
      fetchLeads();
    }
  } catch (err) {
    console.error(err);
  }
}

// Stage Update
async function updateLeadStage() {
  if (!currentLeadId) return;
  const newStage = document.getElementById('md-stage-select').value;
  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: newStage, 
        note: `Pipeline stage changed to ${newStage.toUpperCase()}`,
        advisorName: currentUser?.name || 'Advisor'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Pipeline stage updated to ' + newStage.toUpperCase(), 'success');
      openLeadModal(currentLeadId);
      fetchLeads();
    }
  } catch (e) {
    console.error(e);
  }
}

// ============================================================
// 4-CATEGORY CALL OUTCOME & RNR 3-STRIKE CONTROLLER
// ============================================================
let activeCallOutcomeCategory = 'rnr';

function selectCallOutcomeCard(category) {
  activeCallOutcomeCategory = category;
  const input = document.getElementById('call-outcome');
  const boxCallback = document.getElementById('callback-schedule-box');
  const btnLabel = document.getElementById('btn-save-call-label');

  const cardRnr = document.getElementById('card-outcome-rnr');
  const cardCallback = document.getElementById('card-outcome-callback');
  const cardProspect = document.getElementById('card-outcome-prospect');
  const cardLost = document.getElementById('card-outcome-lost');

  // Reset styles
  if (cardRnr) cardRnr.className = 'p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 cursor-pointer transition space-y-1';
  if (cardCallback) cardCallback.className = 'p-3 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition space-y-1';
  if (cardProspect) cardProspect.className = 'p-3 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 cursor-pointer transition space-y-1';
  if (cardLost) cardLost.className = 'p-3 rounded-2xl border-2 border-slate-200 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/50 cursor-pointer transition space-y-1';

  if (category === 'rnr') {
    if (input) input.value = 'RNR';
    if (boxCallback) boxCallback.classList.add('hidden');
    if (cardRnr) cardRnr.className = 'p-3 rounded-2xl border-2 border-amber-500 bg-amber-50 cursor-pointer transition space-y-1 shadow-sm ring-2 ring-amber-400';
    if (btnLabel) btnLabel.innerText = 'Log RNR Outcome (Auto 3-Strike Check)';
  } else if (category === 'callback') {
    if (input) input.value = 'Call Back Requested';
    if (boxCallback) boxCallback.classList.remove('hidden');
    if (cardCallback) cardCallback.className = 'p-3 rounded-2xl border-2 border-blue-600 bg-blue-50 cursor-pointer transition space-y-1 shadow-sm ring-2 ring-blue-400';
    if (btnLabel) btnLabel.innerText = 'Schedule Callback & Set Reminder';
    
    const dateInp = document.getElementById('call-next-date');
    if (dateInp && !dateInp.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInp.value = tomorrow.toISOString().split('T')[0];
    }
  } else if (category === 'prospect') {
    if (input) input.value = 'Prospect (Client Interested)';
    if (boxCallback) boxCallback.classList.add('hidden');
    if (cardProspect) cardProspect.className = 'p-3 rounded-2xl border-2 border-emerald-600 bg-emerald-50 cursor-pointer transition space-y-1 shadow-sm ring-2 ring-emerald-400';
    if (btnLabel) btnLabel.innerText = 'Mark Lead as Active Prospect';
  } else if (category === 'not_interested') {
    if (input) input.value = 'Not Interested / Lost';
    if (boxCallback) boxCallback.classList.add('hidden');
    if (cardLost) cardLost.className = 'p-3 rounded-2xl border-2 border-rose-600 bg-rose-50 cursor-pointer transition space-y-1 shadow-sm ring-2 ring-rose-400';
    if (btnLabel) btnLabel.innerText = 'Mark Lead as Not Interested / Lost';
  }
}
window.selectCallOutcomeCard = selectCallOutcomeCard;

function setPresetCallback(daysAhead, timeStr) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysAhead);
  const dateStr = targetDate.toISOString().split('T')[0];

  const dateInp = document.getElementById('call-next-date');
  const timeInp = document.getElementById('call-next-time');
  if (dateInp) dateInp.value = dateStr;
  if (timeInp) timeInp.value = timeStr;
}
window.setPresetCallback = setPresetCallback;

// Log Call Modal
function openLogCallModal(leadId = null) {
  if (leadId) currentLeadId = leadId;
  const lead = allLeads.find(l => l.id === currentLeadId);
  const currentRnr = lead ? Number(lead.rnrCount || 0) : 0;

  const rnrBadge = document.getElementById('badge-rnr-strike-preview');
  if (rnrBadge) {
    if (currentRnr === 0) {
      rnrBadge.className = 'text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300';
      rnrBadge.innerText = 'Attempt 1/3';
    } else if (currentRnr === 1) {
      rnrBadge.className = 'text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-950 border border-orange-300 animate-pulse';
      rnrBadge.innerText = 'Attempt 2/3';
    } else {
      rnrBadge.className = 'text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-bold';
      rnrBadge.innerText = '🚨 Strike 3 (Auto Lost!)';
    }
  }

  selectCallOutcomeCard('rnr');
  document.getElementById('modal-log-call').classList.remove('hidden');
}
window.openLogCallModal = openLogCallModal;

function openLogCallModalWithCategory(category) {
  openLogCallModal(currentLeadId);
  selectCallOutcomeCard(category);
}
window.openLogCallModalWithCategory = openLogCallModalWithCategory;

let pendingRnrLeadId = null;
let pendingRnrNotes = '';

function openConfirmRnrModal(leadId = null, notes = '') {
  pendingRnrLeadId = leadId || currentLeadId;
  pendingRnrNotes = notes || 'Unanswered call attempt (RNR)';

  const lead = allLeads.find(l => l.id === pendingRnrLeadId);
  if (!lead) return;

  const currentRnr = Number(lead.rnrCount || 0);
  const nextStrike = currentRnr + 1;

  document.getElementById('rnr-confirm-lead-name').innerText = lead.name || 'Anonymous Buyer';
  document.getElementById('rnr-confirm-lead-phone').innerText = lead.phone || 'N/A';
  document.getElementById('rnr-confirm-lead-property').innerText = lead.displayProperty || lead.property || 'Listing';

  const warningBox = document.getElementById('rnr-confirm-warning-box');
  const titleEl = document.getElementById('rnr-confirm-strike-title');
  const badgeEl = document.getElementById('rnr-confirm-strike-badge');
  const descEl = document.getElementById('rnr-confirm-strike-desc');
  const btnLabel = document.getElementById('btn-execute-rnr-label');
  const btnExecute = document.getElementById('btn-execute-confirm-rnr');

  if (nextStrike === 1) {
    if (warningBox) warningBox.className = 'p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2';
    if (titleEl) titleEl.innerText = 'Strike Level: Attempt 1 of 3';
    if (badgeEl) {
      badgeEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-950 border border-amber-300';
      badgeEl.innerText = 'RNR 1';
    }
    if (descEl) descEl.innerHTML = `Are you sure you called <strong>${escapeHtml(lead.name || 'this client')}</strong> and received <strong>No Answer / Ringing</strong>?<br><span class="text-[10px] text-amber-800 font-bold mt-1 inline-block">This will record Strike 1 of 3 in the CRM.</span>`;
    if (btnLabel) btnLabel.innerText = 'Yes, Log RNR 1';
    if (btnExecute) btnExecute.className = 'py-2.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md text-center flex items-center justify-center gap-1.5';
  } else if (nextStrike === 2) {
    if (warningBox) warningBox.className = 'p-4 rounded-2xl bg-orange-50 border border-orange-400 space-y-2';
    if (titleEl) titleEl.innerText = '⚠️ Strike Level: Attempt 2 of 3';
    if (badgeEl) {
      badgeEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-200 text-orange-950 border border-orange-400 animate-pulse';
      badgeEl.innerText = '⚠️ RNR 2 (2/3)';
    }
    if (descEl) descEl.innerHTML = `Are you sure this is a <strong>2nd unanswered call</strong> to <strong>${escapeHtml(lead.name || 'this client')}</strong>?<br><span class="text-[10px] text-orange-900 font-bold mt-1 inline-block">⚠️ Warning: If a 3rd RNR occurs, the system will automatically drop this lead to Not Interested.</span>`;
    if (btnLabel) btnLabel.innerText = 'Yes, Log RNR 2';
    if (btnExecute) btnExecute.className = 'py-2.5 px-4 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md text-center flex items-center justify-center gap-1.5';
  } else {
    // 3rd strike -> auto drop
    if (warningBox) warningBox.className = 'p-4 rounded-2xl bg-rose-50 border-2 border-rose-400 space-y-2 ring-2 ring-rose-200';
    if (titleEl) titleEl.innerText = '🚨 FINAL STRIKE: Attempt 3 of 3 (AUTO DROP!)';
    if (badgeEl) {
      badgeEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white border border-rose-700 animate-bounce';
      badgeEl.innerText = '🚨 RNR 3 -> LOST';
    }
    if (descEl) descEl.innerHTML = `🚨 <strong>AUTO 3-STRIKE MODE:</strong><br>Logging this 3rd consecutive RNR call will <strong>AUTOMATICALLY MOVE THIS LEAD TO NOT INTERESTED / CLOSED LOST</strong>.<br><span class="text-[10px] text-rose-900 font-bold mt-1 inline-block">Are you sure you called and client did not respond 3 times?</span>`;
    if (btnLabel) btnLabel.innerText = '🚨 Confirm Strike 3 (Auto Lost)';
    if (btnExecute) btnExecute.className = 'py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md text-center flex items-center justify-center gap-1.5';
  }

  document.getElementById('modal-confirm-rnr').classList.remove('hidden');
}
window.openConfirmRnrModal = openConfirmRnrModal;

function closeConfirmRnrModal() {
  document.getElementById('modal-confirm-rnr').classList.add('hidden');
  pendingRnrLeadId = null;
  pendingRnrNotes = '';
}
window.closeConfirmRnrModal = closeConfirmRnrModal;

async function executeConfirmedRnr() {
  if (!pendingRnrLeadId) return;
  const targetId = pendingRnrLeadId;
  const targetNotes = pendingRnrNotes || 'Unanswered call attempt (RNR)';

  closeConfirmRnrModal();
  closeLogCallModal();

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(targetId) + '/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome: 'RNR',
        notes: targetNotes,
        advisorName: currentUser?.name || 'Advisor'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || '📵 RNR strike logged in Firestore!', 'success');
      const mdModal = document.getElementById('modal-lead');
      if (mdModal && !mdModal.classList.contains('hidden')) {
        openLeadModal(targetId);
      }
      fetchLeads();
    } else {
      showToast(data.error || 'Failed to record RNR', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error recording RNR', 'error');
  }
}
window.executeConfirmedRnr = executeConfirmedRnr;

async function quickLogLeadOutcome(category) {
  if (!currentLeadId) return;

  if (category === 'rnr') {
    return openConfirmRnrModal(currentLeadId, 'Quick RNR logged from dossier');
  }

  let outcome = 'Prospect (Client Interested)';
  let notes = 'Client marked as active high-intent prospect';
  if (category === 'not_interested') {
    outcome = 'Not Interested / Lost';
    notes = 'Marked Not Interested from lead dossier';
    if (!confirm('⚠️ Are you sure you want to mark this lead as Not Interested / Closed Lost?')) return;
  }

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome,
        notes,
        advisorName: currentUser?.name || 'Advisor'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || '📞 Outcome and status updated in Firestore!', 'success');
      openLeadModal(currentLeadId);
      fetchLeads();
    } else {
      showToast(data.error || 'Failed to update outcome', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error logging outcome', 'error');
  }
}
window.quickLogLeadOutcome = quickLogLeadOutcome;

function closeLogCallModal() {
  document.getElementById('modal-log-call').classList.add('hidden');
}
window.closeLogCallModal = closeLogCallModal;

async function handleSaveCall(e) {
  e.preventDefault();
  if (!currentLeadId) return;

  const outcome = document.getElementById('call-outcome').value;
  const notes = document.getElementById('call-notes').value;
  const nextCallDate = activeCallOutcomeCategory === 'callback' ? (document.getElementById('call-next-date')?.value || null) : null;
  const nextCallTime = activeCallOutcomeCategory === 'callback' ? (document.getElementById('call-next-time')?.value || null) : null;
  const nextCallReason = outcome;

  if (outcome === 'RNR') {
    closeLogCallModal();
    return openConfirmRnrModal(currentLeadId, notes || 'Unanswered call (RNR)');
  }

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome,
        notes,
        nextCallDate,
        nextCallTime,
        nextCallReason,
        advisorName: currentUser?.name || 'Advisor'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || '📞 Call & status updated in Firestore!', 'success');
      closeLogCallModal();
      document.getElementById('form-log-call').reset();
      
      const mdModal = document.getElementById('modal-lead');
      if (mdModal && !mdModal.classList.contains('hidden')) {
        openLeadModal(currentLeadId);
      }
      fetchLeads();
    } else {
      showToast(data.error || 'Failed to save call log', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Network error saving call outcome', 'error');
  }
}
window.handleSaveCall = handleSaveCall;

// Quick Call Trigger
function quickCallLead(id, phone) {
  currentLeadId = id;
  if (phone) window.open('tel:' + phone, '_self');
  openLogCallModal(id);
}
window.quickCallLead = quickCallLead;

async function quickCompleteFollowup(id) {
  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(id) + '/complete-followup', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advisorName: currentUser?.name || 'Advisor' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✅ Callback marked completed!', 'success');
      fetchLeads();
    }
  } catch (e) {
    console.error(e);
  }
}
window.quickCompleteFollowup = quickCompleteFollowup;

// Callback Reminders Notification Banner
function renderCallbackRemindersBanner(leads) {
  const banner = document.getElementById('callback-reminders-banner');
  const countBadge = document.getElementById('callback-due-count');
  const itemsContainer = document.getElementById('callback-due-items');
  if (!banner || !itemsContainer) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCallbacks = (leads || []).filter(l => {
    return l.nextCallDate && l.followupStatus !== 'COMPLETED' && (l.status || 'new').toLowerCase() !== 'lost';
  });

  if (pendingCallbacks.length === 0) {
    banner.classList.add('hidden');
    return;
  }

  banner.classList.remove('hidden');
  if (countBadge) countBadge.innerText = `${pendingCallbacks.length} Reminders`;

  itemsContainer.innerHTML = '';
  pendingCallbacks.slice(0, 4).forEach(l => {
    const isTodayOrPast = l.nextCallDate <= todayStr;
    const cleanPhone = String(l.phone || '').replace(/\D/g, '');
    const chip = document.createElement('div');
    chip.className = `p-2 rounded-xl border ${isTodayOrPast ? 'bg-amber-100 border-amber-400 text-amber-950 font-black' : 'bg-white border-slate-300 text-slate-800'} text-xs flex items-center gap-2 shadow-2xs`;
    chip.innerHTML = `
      <div class="truncate">
        <span class="font-black text-slate-900">${escapeHtml(l.name || 'Lead')}</span>
        <span class="text-[10px] text-amber-800 font-mono font-bold">(${escapeHtml(l.nextCallDate)} ${l.nextCallTime || ''})</span>
      </div>
      <button onclick="quickCallLead('${l.id}', '${cleanPhone}')" class="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black transition flex items-center gap-1 shadow-2xs">
        <i class="fa-solid fa-phone text-[9px]"></i> Call
      </button>
      <button onclick="quickCompleteFollowup('${l.id}')" class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black transition shadow-2xs" title="Mark Callback Done">
        <i class="fa-solid fa-check"></i>
      </button>
    `;
    itemsContainer.appendChild(chip);
  });
}
window.renderCallbackRemindersBanner = renderCallbackRemindersBanner;

// Site Visit Modal
function openSiteVisitModal() {
  document.getElementById('modal-site-visit').classList.remove('hidden');
}
function closeSiteVisitModal() {
  document.getElementById('modal-site-visit').classList.add('hidden');
}

async function handleSaveSiteVisit(e) {
  e.preventDefault();
  if (!currentLeadId) return;
  const visitDate = document.getElementById('sv-date').value;
  const visitTime = document.getElementById('sv-time').value;
  const property = document.getElementById('sv-property').value;
  const notes = document.getElementById('sv-notes')?.value || '';

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/site-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitDate,
        visitTime,
        property,
        notes,
        advisorName: currentUser?.name || 'Advisor'
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🏢 Site Visit scheduled & logged in Firestore!', 'success');
      closeSiteVisitModal();
      openLeadModal(currentLeadId);
      fetchLeads();
    }
  } catch (err) {
    console.error(err);
  }
}

// ============================================================
// SMART LEAD & TASK DISPATCHING (PRIYA & ADMIN)
// ============================================================

function selectAssigneeCard(name, email, key) {
  selectedAssigneeName = name;
  selectedAssigneeEmail = email;
  selectedAssigneeCardKey = key;

  // Visual card highlighting
  ['arjun', 'maya', 'priya', 'test'].forEach(k => {
    const card = document.getElementById(`card-assign-${k}`);
    if (!card) return;
    if (k === key) {
      if (k === 'arjun') card.className = 'p-2.5 rounded-2xl border-2 border-blue-600 bg-blue-50 cursor-pointer transition text-center space-y-1 shadow-sm';
      else if (k === 'maya') card.className = 'p-2.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50 cursor-pointer transition text-center space-y-1 shadow-sm';
      else if (k === 'priya') card.className = 'p-2.5 rounded-2xl border-2 border-purple-600 bg-purple-50 cursor-pointer transition text-center space-y-1 shadow-sm';
      else if (k === 'test') card.className = 'p-2.5 rounded-2xl border-2 border-amber-600 bg-amber-50 cursor-pointer transition text-center space-y-1 shadow-sm';
    } else {
      card.className = 'p-2.5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/50 cursor-pointer transition text-center space-y-1';
    }
  });

  const sel = document.getElementById('assign-advisor-select');
  if (sel) sel.value = name;
}

function handleDropdownAssigneeChange() {
  const sel = document.getElementById('assign-advisor-select');
  if (!sel) return;
  const val = sel.value;
  selectedAssigneeName = val;

  if (val.toLowerCase().includes('arjun')) selectAssigneeCard('Arjun (Sales Executive)', 'arjun@estate.com', 'arjun');
  else if (val.toLowerCase().includes('maya')) selectAssigneeCard('Maya (Sales Executive)', 'maya@estate.com', 'maya');
  else if (val.toLowerCase().includes('test')) selectAssigneeCard('Test (Sales Executive)', 'test@estate.com', 'test');
  else if (val.toLowerCase().includes('priya')) selectAssigneeCard('Priya (Sales Manager)', 'priya@estate.com', 'priya');
}

function quickOpenAssign(e, leadId) {
  if (e) e.stopPropagation();
  openAssignModal(leadId);
}

function openAssignModal(leadId = null) {
  if (leadId) currentLeadId = leadId;

  // Populate fallback select
  const sel = document.getElementById('assign-advisor-select');
  if (sel) {
    sel.innerHTML = `
      <option value="Arjun (Sales Executive)">👤 Arjun (Sales Executive)</option>
      <option value="Maya (Sales Executive)">👤 Maya (Sales Executive)</option>
      <option value="Test (Sales Executive)">👤 Test (Sales Executive)</option>
      <option value="Priya (Sales Manager)">👤 Priya (Sales Manager - Self)</option>
      <option value="Avery Morgan (CEO &amp; Admin)">👑 Avery Morgan (CEO &amp; Admin)</option>
      <option value="Unassigned">⚠️ Unassigned</option>
    `;
  }

  // Pre-set default date to today
  const dateInput = document.getElementById('assign-task-date');
  if (dateInput && !dateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Default selection: Arjun or Maya
  selectAssigneeCard('Arjun (Sales Executive)', 'arjun@estate.com', 'arjun');

  document.getElementById('modal-assign').classList.remove('hidden');
}

function closeAssignModal() {
  document.getElementById('modal-assign').classList.add('hidden');
}

async function handleSaveAssign(e) {
  e.preventDefault();
  if (!currentLeadId) return;

  const assignedTo = selectedAssigneeName || document.getElementById('assign-advisor-select').value;
  const assignedTask = document.getElementById('assign-task-type').value;
  const taskDueDate = document.getElementById('assign-task-date').value;
  const taskPriority = document.getElementById('assign-task-priority').value;
  const taskInstructions = document.getElementById('assign-task-instructions').value;

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId) + '/assign', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignedTo,
        assignedToEmail: selectedAssigneeEmail,
        assignedTask,
        taskDueDate,
        taskDueTime: '11:00 AM',
        taskPriority,
        taskInstructions,
        advisorName: currentUser?.name || 'Priya (Sales Manager)'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`🎯 Lead & Task dispatched to ${assignedTo}!`, 'success');
      closeAssignModal();
      
      const mdModal = document.getElementById('modal-lead');
      if (mdModal && !mdModal.classList.contains('hidden')) {
        openLeadModal(currentLeadId);
      }
      fetchLeads();
    } else {
      showToast(data.error || 'Failed to assign lead', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error communicating with server', 'error');
  }
}

// Bulk Dispatch Modal (Priya & Admin)
function openBulkAssignModal() {
  const unassignedCount = allLeads.filter(l => !l.assignedTo || l.assignedTo === 'Unassigned').length;
  const cntBadge = document.getElementById('bulk-unassigned-count');
  if (cntBadge) cntBadge.innerText = unassignedCount;

  if (unassignedCount === 0) {
    showToast('All leads are currently assigned! 0 unassigned leads in queue.', 'info');
    return;
  }

  document.getElementById('modal-bulk-assign').classList.remove('hidden');
}

function closeBulkAssignModal() {
  document.getElementById('modal-bulk-assign').classList.add('hidden');
}

async function executeBulkAssignment() {
  const unassignedLeads = allLeads.filter(l => !l.assignedTo || l.assignedTo === 'Unassigned');
  if (unassignedLeads.length === 0) {
    showToast('No unassigned leads found', 'info');
    closeBulkAssignModal();
    return;
  }

  const targetAdvisor = document.getElementById('bulk-target-advisor').value;
  const taskType = document.getElementById('bulk-task-type').value;
  const instructions = document.getElementById('bulk-instructions').value;
  const leadIds = unassignedLeads.map(l => l.id);

  try {
    const res = await authFetch('/api/leads/assign-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadIds,
        assignedTo: targetAdvisor,
        assignedTask: taskType,
        taskDueDate: new Date().toISOString().split('T')[0],
        taskDueTime: '11:00 AM',
        taskPriority: 'HIGH',
        taskInstructions: instructions,
        advisorName: currentUser?.name || 'Priya (Sales Manager)'
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`⚡ Bulk Allocation: ${data.assignedCount} leads assigned to ${targetAdvisor}!`, 'success');
      closeBulkAssignModal();
      fetchLeads();
    } else {
      showToast(data.error || 'Bulk dispatch failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error during bulk dispatch', 'error');
  }
}

// Quick Filter Toggles
function filterUnassignedOnly() {
  const advSelect = document.getElementById('advisor-filter');
  if (advSelect) advSelect.value = 'UNASSIGNED';
  myLeadsOnly = false;
  updateMyLeadsBtnStyle();
  applyFilters();
  showToast('Filtered: Showing only Unassigned leads waiting for task allocation', 'info');
}

function toggleMyLeadsFilter() {
  myLeadsOnly = !myLeadsOnly;
  const advSelect = document.getElementById('advisor-filter');
  if (myLeadsOnly && advSelect) advSelect.value = 'ALL';
  updateMyLeadsBtnStyle();
  applyFilters();

  if (myLeadsOnly) {
    showToast(`⭐ Filtered: Showing leads assigned to you (${currentUser?.name})`, 'success');
  } else {
    showToast('Showing all pipeline leads', 'info');
  }
}

function updateMyLeadsBtnStyle() {
  const btn = document.getElementById('btn-my-leads-toggle');
  if (!btn) return;
  if (myLeadsOnly) {
    btn.className = 'px-3 py-1.5 rounded-xl border border-amber-400 bg-amber-100 text-amber-900 text-xs font-black transition flex items-center gap-1.5 shadow-sm';
  } else {
    btn.className = 'px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs';
  }
}

// Delete Lead (Super Admin Action)
async function deleteCurrentLead() {
  if (!currentLeadId) return;
  if (!confirm('👑 SUPER ADMIN CONFIRMATION: Are you sure you want to permanently delete this lead from Firestore?')) return;

  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(currentLeadId), { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Lead permanently deleted from Firestore', 'info');
      closeLeadModal();
      fetchLeads();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteLeadDirectly(id) {
  if (!confirm('👑 SUPER ADMIN: Delete this lead from Firestore?')) return;
  try {
    const res = await authFetch('/api/leads/' + encodeURIComponent(id), { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Lead removed from Firestore', 'info');
      fetchLeads();
    }
  } catch (err) {
    console.error(err);
  }
}

// Create Inbound Lead Modal
function openCreateLeadModal() {
  document.getElementById('modal-create-lead').classList.remove('hidden');
}
function closeCreateLeadModal() {
  document.getElementById('modal-create-lead').classList.add('hidden');
}

async function handleCreateLead(e) {
  e.preventDefault();
  const name = document.getElementById('cr-name')?.value;
  const phone = document.getElementById('cr-phone')?.value;
  const email = document.getElementById('cr-email')?.value || '';
  const project = document.getElementById('cr-project')?.value || '';
  const source = document.getElementById('cr-source')?.value || 'direct';
  const city = document.getElementById('cr-city')?.value || '';
  const notes = document.getElementById('cr-notes')?.value || '';
  const budget = document.getElementById('cr-budget')?.value || '';
  const intent = document.getElementById('cr-intent')?.value || '';
  const timeline = document.getElementById('cr-timeline')?.value || '';

  try {
    const res = await authFetch('/api/leads/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, project, source, city, notes, budget, intent, timeline })
    });
    const data = await res.json();
    if (data.success) {
      showToast('✨ Demo lead captured. Opening the buyer dossier…', 'success');
      closeCreateLeadModal();
      document.getElementById('form-create-lead')?.reset();
      
      // Auto-switch to appropriate section
      if (source === '99acres') switchPipelineSection('99acres');
      else if (source === 'meta') switchPipelineSection('meta');
      else switchPipelineSection('other');

      fetchLeads();
      setTimeout(() => openLeadModal(data.lead.id), 250);
    }
  } catch (err) {
    console.error(err);
    showToast('Could not create the demo lead. Please try again.', 'error');
  }
}

// ============================================================
// 8. EXECUTIVE ANALYTICS & TEAM WORKLOAD STATUS
// ============================================================
function computeTeamWorkloadFromLeads(leads) {
  const ts = {
    priya: { totalLeads: 0, activeTasks: 0, siteVisits: 0, wonDeals: 0, zones: { east: 0, north: 0, south: 0, west: 0, central: 0 }, stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 } },
    arjun: { totalLeads: 0, activeTasks: 0, siteVisits: 0, wonDeals: 0, zones: { east: 0, north: 0, south: 0, west: 0, central: 0 }, stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 } },
    maya: { totalLeads: 0, activeTasks: 0, siteVisits: 0, wonDeals: 0, zones: { east: 0, north: 0, south: 0, west: 0, central: 0 }, stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 } },
    test: { totalLeads: 0, activeTasks: 0, siteVisits: 0, wonDeals: 0, zones: { east: 0, north: 0, south: 0, west: 0, central: 0 }, stages: { new: 0, contacted: 0, site_visit: 0, negotiation: 0, won: 0, lost: 0 } },
    unassigned: { totalLeads: 0, activeTasks: 0, siteVisits: 0, wonDeals: 0, zones: { east: 0, north: 0, south: 0, west: 0, central: 0 } }
  };

  if (!Array.isArray(leads)) return ts;

  leads.forEach(l => {
    const assignedStr = String(l.assignedTo || l.advisorName || '').toLowerCase();
    let target = ts.unassigned;
    if (assignedStr.includes('priya')) target = ts.priya;
    else if (assignedStr.includes('arjun')) target = ts.arjun;
    else if (assignedStr.includes('maya')) target = ts.maya;
    else if (assignedStr.includes('test')) target = ts.test;

    target.totalLeads++;

    const zLower = String(l.locationZone || l.cityName || l.city || '').toLowerCase();
    if (zLower.includes('east')) target.zones.east++;
    else if (zLower.includes('north')) target.zones.north++;
    else if (zLower.includes('south')) target.zones.south++;
    else if (zLower.includes('west')) target.zones.west++;
    else target.zones.central++;

    const rawStage = String(l.status || 'new').toLowerCase();
    if (target.stages && target.stages[rawStage] !== undefined) {
      target.stages[rawStage]++;
    }
    if (rawStage === 'site_visit') target.siteVisits++;
    if (rawStage === 'won') target.wonDeals++;
    if (l.assignedTask && l.taskStatus !== 'COMPLETED') target.activeTasks++;
  });

  return ts;
}

function filterAdvisorByShortName(advisorName) {
  const advSelect = document.getElementById('advisor-filter');
  if (advSelect) {
    advSelect.value = advisorName;
    applyFilters();
  }
  switchMainView('pipeline');
}

function updateSidebarTeamStatusWidget(teamStatus) {
  const sidebarList = document.getElementById('sidebar-team-status-list');
  if (!sidebarList || !teamStatus) return;
  sidebarList.innerHTML = '';

  const members = [
    { key: 'priya', shortName: 'Priya', roleLabel: 'Mgr', color: 'purple', initial: 'D' },
    { key: 'arjun', shortName: 'Arjun', roleLabel: 'Sales', color: 'blue', initial: 'O' },
    { key: 'maya', shortName: 'Maya', roleLabel: 'Sales', color: 'emerald', initial: 'P' },
    { key: 'test', shortName: 'Test', roleLabel: 'Sales', color: 'amber', initial: 'T' }
  ];

  members.forEach(m => {
    const data = teamStatus[m.key] || { totalLeads: 0, zones: { east: 0, north: 0, south: 0, west: 0 } };
    const z = data.zones || { east: 0, north: 0, south: 0, west: 0 };
    
    const item = document.createElement('div');
    item.onclick = () => filterAdvisorByShortName(m.shortName);
    item.className = 'p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-amber-400 cursor-pointer transition space-y-1 shadow-2xs group';
    
    item.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <div class="flex items-center gap-1.5">
          <span class="w-5 h-5 rounded-md bg-${m.color}-100 text-${m.color}-900 border border-${m.color}-300 font-black text-[10px] flex items-center justify-center">${m.initial}</span>
          <span class="font-black text-slate-900 group-hover:text-amber-700 transition">${escapeHtml(m.shortName)}</span>
          <span class="text-[9px] text-slate-500 font-bold uppercase">(${m.roleLabel})</span>
        </div>
        <span class="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-black text-[10px]">${data.totalLeads} Leads</span>
      </div>
      <div class="grid grid-cols-4 gap-1 text-[8px] font-mono font-bold text-center pt-0.5">
        <span class="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded py-0.5" title="East Bangalore">E:${z.east || 0}</span>
        <span class="bg-blue-50 text-blue-900 border border-blue-200 rounded py-0.5" title="North Bangalore">N:${z.north || 0}</span>
        <span class="bg-purple-50 text-purple-900 border border-purple-200 rounded py-0.5" title="South Bangalore">S:${z.south || 0}</span>
        <span class="bg-amber-50 text-amber-900 border border-amber-200 rounded py-0.5" title="West Bangalore">W:${z.west || 0}</span>
      </div>
    `;
    sidebarList.appendChild(item);
  });
}

function renderTeamWorkloadStatus(teamStatus, totalLeads) {
  const analyticsGrid = document.getElementById('analytics-team-workload-grid');
  if (!analyticsGrid || !teamStatus) return;
  analyticsGrid.innerHTML = '';

  const cardsData = [
    {
      key: 'priya',
      name: 'Priya',
      title: 'Sales Manager (Self-Assign)',
      email: 'priya@estate.com',
      avatarBg: 'bg-purple-100 text-purple-900 border-purple-300',
      borderColor: 'border-t-4 border-t-purple-600',
      accentColor: 'purple'
    },
    {
      key: 'arjun',
      name: 'Arjun',
      title: 'Sales Executive',
      email: 'arjun@estate.com',
      avatarBg: 'bg-blue-100 text-blue-900 border-blue-300',
      borderColor: 'border-t-4 border-t-blue-600',
      accentColor: 'blue'
    },
    {
      key: 'maya',
      name: 'Maya',
      title: 'Sales Executive',
      email: 'maya@estate.com',
      avatarBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      borderColor: 'border-t-4 border-t-emerald-600',
      accentColor: 'emerald'
    },
    {
      key: 'test',
      name: 'Test',
      title: 'Sales Executive (Test)',
      email: 'test@estate.com',
      avatarBg: 'bg-amber-100 text-amber-900 border-amber-300',
      borderColor: 'border-t-4 border-t-amber-600',
      accentColor: 'amber'
    }
  ];

  const safeTotal = totalLeads > 0 ? totalLeads : 1;

  cardsData.forEach(c => {
    const data = teamStatus[c.key] || { totalLeads: 0, activeTasks: 0, siteVisits: 0, wonDeals: 0, zones: {}, stages: {} };
    const z = data.zones || { east: 0, north: 0, south: 0, west: 0, central: 0 };
    const pct = Math.round((data.totalLeads / safeTotal) * 100);

    let workloadTag = '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">🟢 Optimal Load</span>';
    if (data.totalLeads >= 25) {
      workloadTag = '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-100 text-rose-900 border border-rose-300">🔥 High Volume</span>';
    } else if (data.totalLeads === 0) {
      workloadTag = '<span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">⚡ Available</span>';
    }

    const card = document.createElement('div');
    card.className = `glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-3.5 shadow-sm ${c.borderColor}`;

    card.innerHTML = `
      <!-- Card Header -->
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-2xl ${c.avatarBg} font-black flex items-center justify-center text-sm shadow-2xs border">
            ${c.name.charAt(0)}
          </div>
          <div>
            <div class="font-black text-slate-900 text-xs">${escapeHtml(c.name)}</div>
            <div class="text-[10px] text-slate-500 font-bold">${escapeHtml(c.title)}</div>
            <div class="text-[9px] text-slate-400 font-mono">${escapeHtml(c.email)}</div>
          </div>
        </div>
        ${workloadTag}
      </div>

      <!-- 4 Key Workload Stats -->
      <div class="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
        <div>
          <div class="text-[9px] font-bold text-slate-500 uppercase">Assigned</div>
          <div class="text-sm font-black text-slate-900 font-mono">${data.totalLeads}</div>
        </div>
        <div>
          <div class="text-[9px] font-bold text-slate-500 uppercase">Tasks</div>
          <div class="text-sm font-black text-purple-700 font-mono">${data.activeTasks || 0}</div>
        </div>
        <div>
          <div class="text-[9px] font-bold text-slate-500 uppercase">Visits</div>
          <div class="text-sm font-black text-blue-700 font-mono">${data.siteVisits || 0}</div>
        </div>
        <div>
          <div class="text-[9px] font-bold text-slate-500 uppercase">Won</div>
          <div class="text-sm font-black text-emerald-700 font-mono">${data.wonDeals || 0}</div>
        </div>
      </div>

      <!-- Regional Zone Distribution (East, North, South, West) -->
      <div class="space-y-1.5">
        <div class="text-[10px] font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
          <span>📍 Regional Zone Allocation:</span>
          <span class="text-[9px] font-mono text-slate-400 font-bold">Bangalore Micro-Markets</span>
        </div>

        <div class="grid grid-cols-2 gap-1.5">
          <!-- East Bangalore -->
          <div class="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-emerald-900">
              <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>East Bangalore</span>
            </div>
            <span class="font-mono font-black text-xs text-emerald-950">${z.east || 0}</span>
          </div>

          <!-- North Bangalore -->
          <div class="p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-900">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>North Bangalore</span>
            </div>
            <span class="font-mono font-black text-xs text-blue-950">${z.north || 0}</span>
          </div>

          <!-- South Bangalore -->
          <div class="p-2 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-purple-900">
              <span class="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>South Bangalore</span>
            </div>
            <span class="font-mono font-black text-xs text-purple-950">${z.south || 0}</span>
          </div>

          <!-- West Bangalore -->
          <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-900">
              <span class="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>West Bangalore</span>
            </div>
            <span class="font-mono font-black text-xs text-amber-950">${z.west || 0}</span>
          </div>
        </div>
      </div>

      <!-- Workload Proportion Bar & Direct Filter -->
      <div class="space-y-1.5 pt-2 border-t border-slate-200">
        <div class="flex items-center justify-between text-[10px] font-bold text-slate-600">
          <span>Overall Workload Share:</span>
          <span class="font-mono font-black text-slate-900">${pct}% (${data.totalLeads} / ${safeTotal})</span>
        </div>
        <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div class="h-full bg-${c.accentColor}-600 rounded-full transition-all duration-500" style="width: ${Math.min(pct, 100)}%"></div>
        </div>
        <button onclick="filterAdvisorByShortName('${c.name}')" class="w-full mt-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-900 hover:text-amber-900 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs">
          <i class="fa-solid fa-arrow-right-to-bracket text-[10px]"></i> View ${c.name}'s Pipeline (${data.totalLeads})
        </button>
      </div>
    `;
    analyticsGrid.appendChild(card);
  });
}

async function renderAnalytics() {
  try {
    const res = await authFetch('/api/analytics/overview');
    const data = await res.json();
    if (!data.success) return;

    if (document.getElementById('an-contact-rate')) document.getElementById('an-contact-rate').innerText = data.conversionFunnel.contactRate;
    if (document.getElementById('an-visit-rate')) document.getElementById('an-visit-rate').innerText = data.conversionFunnel.siteVisitRate;
    if (document.getElementById('an-win-rate')) document.getElementById('an-win-rate').innerText = data.conversionFunnel.winRate;
    if (document.getElementById('an-team-count')) document.getElementById('an-team-count').innerText = data.teamMembersCount;

    const properties = data.propertyPerformance || [];
    const topProperty = data.topProperty;
    const topName = document.getElementById('an-top-property');
    const topDetail = document.getElementById('an-top-property-detail');
    const unassigned = document.getElementById('an-unassigned-count');
    const propertyList = document.getElementById('an-property-performance');
    if (topName) topName.textContent = topProperty ? topProperty.property : 'No portfolio data yet';
    if (topDetail) topDetail.textContent = topProperty ? topProperty.leads + ' enquiries · ' + topProperty.visits + ' high-intent · ' + topProperty.won + ' booked · ' + topProperty.conversionRate + '% conversion' : 'Capture a demo lead to start analysing demand.';
    if (unassigned) unassigned.textContent = (data.unassignedCount || 0) + ' unassigned';
    if (propertyList) {
      propertyList.innerHTML = properties.length ? properties.slice(0, 5).map((item, index) => '<div class="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-center rounded-xl border border-slate-100 px-3 py-2.5 bg-slate-50"><div class="min-w-0"><div class="text-xs font-black text-slate-900 truncate"><span class="text-indigo-600 mr-1">#' + (index + 1) + '</span>' + escapeHtml(item.property) + '</div><div class="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div class="h-full rounded-full bg-indigo-500" style="width:' + Math.min(100, item.leads * 25) + '%"></div></div></div><div class="text-right"><div class="text-[9px] uppercase font-black text-slate-400">Enquiries</div><div class="text-xs font-black text-slate-800">' + item.leads + '</div></div><div class="text-right"><div class="text-[9px] uppercase font-black text-slate-400">Visits</div><div class="text-xs font-black text-purple-700">' + item.visits + '</div></div><div class="text-right"><div class="text-[9px] uppercase font-black text-slate-400">Booked</div><div class="text-xs font-black text-emerald-700">' + item.won + '</div></div></div>').join('') : '<div class="text-xs text-slate-500 p-3">No property data yet.</div>';
    }

    // Render Team Workload & Regional Status Cards
    renderTeamWorkloadStatus(data.teamStatus || computeTeamWorkloadFromLeads(allLeads), data.totalLeads);

    // 1. Funnel Chart
    const ctxFunnel = document.getElementById('chart-funnel')?.getContext('2d');
    if (ctxFunnel) {
      if (funnelChart) funnelChart.destroy();
      funnelChart = new Chart(ctxFunnel, {
        type: 'bar',
        data: {
          labels: ['New Inquiries', 'Contacted', 'Site Visit', 'Negotiation', 'Won Deals'],
          datasets: [{
            label: 'Leads in Stage',
            data: [
              data.stageBreakdown.NEW || 0,
              data.stageBreakdown.CONTACTED || 0,
              data.stageBreakdown.SITE_VISIT || 0,
              data.stageBreakdown.NEGOTIATION || 0,
              data.stageBreakdown.WON || 0
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.85)',
              'rgba(245, 158, 11, 0.85)',
              'rgba(168, 85, 247, 0.85)',
              'rgba(6, 182, 212, 0.85)',
              'rgba(16, 185, 129, 0.85)'
            ],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } } }
          }
        }
      });
    }

    // 2. Sources Doughnut Chart
    const ctxSources = document.getElementById('chart-sources')?.getContext('2d');
    if (ctxSources) {
      if (sourcesChart) sourcesChart.destroy();
      sourcesChart = new Chart(ctxSources, {
        type: 'doughnut',
        data: {
          labels: Object.keys(data.sourceBreakdown || {}),
          datasets: [{
            data: Object.values(data.sourceBreakdown || {}),
            backgroundColor: [
              '#e5b330',
              '#3b82f6',
              '#a855f7',
              '#10b981',
              '#06b6d4',
              '#6366f1',
              '#f97316',
              '#64748b'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11, weight: 'bold' } } }
          }
        }
      });
    }
  } catch (err) {
    console.error('Analytics load error:', err);
  }
}

// ============================================================
// 9. SUPER ADMIN TEAM & RBAC MANAGEMENT
// ============================================================
async function fetchTeamMembers() {
  try {
    const res = await authFetch('/api/users');
    const data = await res.json();
    if (data.success) {
      allUsers = data.users || [];
      if (activeMainView === 'team') renderTeamGrid();
    }
  } catch (err) {
    console.error('Error loading team:', err);
  }
}

function renderTeamGrid() {
  const grid = document.getElementById('team-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const isSuperAdmin = currentUser && (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN');

  allUsers.forEach(u => {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl p-4 border border-slate-200 bg-white space-y-3 relative shadow-sm';

    let roleBadgeColor = 'bg-blue-100 text-blue-900 border border-blue-300 font-black';
    if (u.role === 'SUPER_ADMIN') {
      roleBadgeColor = 'badge-superadmin font-black';
    } else if (u.role === 'MANAGER' || u.role === 'SALES_MANAGER') {
      roleBadgeColor = 'bg-purple-100 text-purple-900 border border-purple-300 font-black';
    } else if (u.role === 'SALES') {
      roleBadgeColor = 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black';
    }

    const superAdminActions = isSuperAdmin ? `
      <div class="flex items-center gap-1.5 pt-2 border-t border-slate-200">
        <button onclick="actAsUser('${u.id}')" class="py-1 px-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-[10px] font-black transition flex items-center gap-1 shadow-2xs" title="Act as ${escapeHtml(u.name)}">
          <i class="fa-solid fa-masks-theater text-purple-600"></i> Act As
        </button>
        <button onclick="openResetPwdModal('${u.id}', '${escapeHtml(u.name)}')" class="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs">
          <i class="fa-solid fa-key text-amber-700"></i> Reset Pwd
        </button>
        <button onclick="toggleUserStatus('${u.id}', '${u.status}')" class="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold transition shadow-2xs">
          ${u.status === 'Active' ? '⏸️ Suspend' : '▶️ Activate'}
        </button>
        ${(u.id !== 'usr_admin' && u.id !== 'usr_superadmin') ? `
          <button onclick="deleteUser('${u.id}')" class="ml-auto py-1 px-2.5 text-rose-700 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition" title="Delete Advisor">
            <i class="fa-solid fa-trash"></i>
          </button>
        ` : ''}
      </div>
    ` : '';

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-black text-white text-sm shadow-md">
            ${(u.name || 'U').charAt(0)}
          </div>
          <div class="truncate">
            <div class="font-black text-slate-900 text-xs truncate flex items-center gap-1.5">
              <span>${escapeHtml(u.name)}</span>
              ${u.role === 'SUPER_ADMIN' ? '<i class="fa-solid fa-crown text-amber-600 text-[10px]"></i>' : ''}
              ${(u.role === 'MANAGER' || u.role === 'SALES_MANAGER') ? '<i class="fa-solid fa-user-shield text-purple-600 text-[10px]"></i>' : ''}
            </div>
            <div class="text-[11px] text-amber-800 font-mono font-bold">+91 ${escapeHtml(u.phone)}</div>
          </div>
        </div>
        <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${u.status === 'Active' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900'}">${u.status || 'Active'}</span>
      </div>

      <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] space-y-1.5">
        <div class="text-slate-600 font-bold uppercase flex items-center justify-between">
          <span>Authority Role:</span>
          <span class="px-2 py-0.5 rounded-md text-[9px] font-extrabold ${roleBadgeColor}">${u.role}</span>
        </div>
        <div class="text-slate-600 font-bold uppercase flex items-center justify-between">
          <span>Territory / Projects:</span>
          <span class="text-slate-900 truncate max-w-[140px] font-extrabold">${Array.isArray(u.projects) ? u.projects.join(', ') : (u.projects || 'All Projects')}</span>
        </div>
      </div>

      ${superAdminActions}
    `;
    grid.appendChild(card);
  });
}

function openEnrollUserModal() {
  document.getElementById('modal-enroll-user').classList.remove('hidden');
}
function closeEnrollUserModal() {
  document.getElementById('modal-enroll-user').classList.add('hidden');
}

async function handleEnrollUser(e) {
  e.preventDefault();
  const name = document.getElementById('en-name')?.value || '';
  const phone = document.getElementById('en-phone')?.value || '';
  const role = document.getElementById('en-role')?.value || 'SALES';
  const projects = document.getElementById('en-projects')?.value || '';

  try {
    const res = await authFetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, role, projects })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`👑 ${name} enrolled as ${role}! They can now log in with +91 ${phone} and set their password.`, 'success');
      closeEnrollUserModal();
      document.getElementById('form-enroll-user').reset();
      fetchTeamMembers();
    } else {
      showToast(data.error || 'Failed to enroll advisor', 'error');
    }
  } catch (err) {
    console.error(err);
  }
}

// Reset Password Modal
function openResetPwdModal(id, name) {
  document.getElementById('reset-user-id').value = id;
  document.getElementById('reset-user-name').innerText = name;
  document.getElementById('reset-new-password').value = '';
  document.getElementById('modal-reset-pwd').classList.remove('hidden');
}
function closeResetPwdModal() {
  document.getElementById('modal-reset-pwd').classList.add('hidden');
}

async function handleSaveResetPassword(e) {
  e.preventDefault();
  const id = document.getElementById('reset-user-id').value;
  const newPassword = document.getElementById('reset-new-password').value;

  try {
    const res = await authFetch('/api/users/' + encodeURIComponent(id) + '/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    const data = await res.json();
    if (data.success) {
      showToast('🔑 Password updated in Firestore!', 'success');
      closeResetPwdModal();
    } else {
      showToast(data.error || 'Failed to reset password', 'error');
    }
  } catch (err) {
    console.error(err);
  }
}

// Toggle Active / Suspended Status
async function toggleUserStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
  try {
    const res = await authFetch('/api/users/' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`User status set to ${newStatus}`, 'info');
      fetchTeamMembers();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteUser(id) {
  if (!confirm('👑 SUPER ADMIN: Remove this team member from the directory?')) return;
  try {
    const res = await authFetch('/api/users/' + encodeURIComponent(id), { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Team member removed from Firestore', 'info');
      fetchTeamMembers();
    } else {
      showToast(data.error || 'Failed to remove member', 'error');
    }
  } catch (e) {
    console.error(e);
  }
}

// ============================================================
// 10. ON-DEMAND 99ACRES SYNC (ROLLING 48-HOUR & DEEP 30-DAY)
// ============================================================
async function trigger99AcresSync() {
  const btn = document.getElementById('btn-sync-99acres');
  const spinner = document.getElementById('sync-icon-spinner');
  if (btn) btn.disabled = true;
  if (spinner) spinner.classList.add('fa-spin');

  showToast('🔍 Fetching 99acres leads (Last 48 Hours) into Cloud Firestore...', 'info');

  try {
    const res = await authFetch('/api/99acres/pull-now', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const newSaved = data.count || 0;
      const totalInWindow = data.totalInWindow || 0;
      const duplicates = data.duplicates || 0;

      if (newSaved > 0) {
        showToast(`⚡ 99acres Sync: ${newSaved} NEW lead(s) stored! (${totalInWindow} found in 48h window)`, 'success');
      } else {
        showToast(`🟢 99acres Up-to-Date: ${totalInWindow} lead(s) verified in 48h window (0 new duplicates).`, 'info');
      }
      
      switchPipelineSection('99acres');
      fetchLeads();
    } else {
      showToast(`⚠️ 99acres Notice: ${data.error || 'No response'}`, 'info');
    }
  } catch (err) {
    showToast(`Network error communicating with 99acres API`, 'error');
  } finally {
    if (btn) btn.disabled = false;
    if (spinner) spinner.classList.remove('fa-spin');
  }
}

async function trigger99AcresDeepSync() {
  if (!confirm('🚀 99ACRES DEEP SYNC: Pull all historical leads from 99acres across the last 30 days?')) return;

  showToast('📦 Starting 30-Day Historical Sync... Querying 99acres chunks...', 'info');

  try {
    const res = await authFetch('/api/99acres/sync-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 30 })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`🎉 Deep Sync Complete! Processed ${data.totalReceived} leads across 30 days (${data.totalNewSaved} new added)`, 'success');
      switchPipelineSection('99acres');
      fetchLeads();
    } else {
      showToast(`⚠️ Deep Sync Notice: ${data.error || 'Completed'}`, 'info');
    }
  } catch (err) {
    showToast(`Error during deep sync`, 'error');
  }
}

// Initial Boot Session Check
checkAuthSession();
