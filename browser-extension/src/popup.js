/**
 * Clausify Browser Extension - Popup Script
 */

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const errorView = document.getElementById('error-view');

const apiKeyInput = document.getElementById('api-key');
const connectBtn = document.getElementById('connect-btn');
const logoutBtn = document.getElementById('logout-btn');
const retryBtn = document.getElementById('retry-btn');
const errorMessage = document.getElementById('error-message');

// Show a specific view
function showView(viewName) {
  authView.classList.add('hidden');
  dashboardView.classList.add('hidden');
  errorView.classList.add('hidden');

  switch (viewName) {
    case 'auth':
      authView.classList.remove('hidden');
      break;
    case 'dashboard':
      dashboardView.classList.remove('hidden');
      break;
    case 'error':
      errorView.classList.remove('hidden');
      break;
  }
}

// Check authentication status
async function checkAuth() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

    if (response.authenticated) {
      showView('dashboard');
    } else {
      showView('auth');
    }
  } catch (error) {
    console.error('[Clausify] Auth check error:', error);
    showView('auth');
  }
}

// Connect with API key
async function connect() {
  const apiKey = apiKeyInput.value.trim();

  if (!apiKey) {
    alert('Please enter your API key');
    return;
  }

  if (!apiKey.startsWith('clsf_')) {
    alert('Invalid API key format. It should start with "clsf_"');
    return;
  }

  connectBtn.disabled = true;
  connectBtn.classList.add('loading');
  connectBtn.textContent = 'Connecting...';

  try {
    // Save API key
    await chrome.runtime.sendMessage({ type: 'SAVE_API_KEY', apiKey });

    // Verify it works
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });

    if (response.authenticated) {
      showView('dashboard');
    } else {
      errorMessage.textContent = 'Invalid API key';
      showView('error');
    }
  } catch (error) {
    console.error('[Clausify] Connect error:', error);
    errorMessage.textContent = error.message || 'Connection failed';
    showView('error');
  } finally {
    connectBtn.disabled = false;
    connectBtn.classList.remove('loading');
    connectBtn.textContent = 'Connect';
  }
}

// Disconnect / Logout
async function logout() {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  apiKeyInput.value = '';
  showView('auth');
}

// Event listeners
connectBtn.addEventListener('click', connect);
logoutBtn.addEventListener('click', logout);
retryBtn.addEventListener('click', () => showView('auth'));

// Handle Enter key in input
apiKeyInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    connect();
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);
