/**
 * Clausify Browser Extension - Background Service Worker
 * Handles context menus and API communication
 */

const CLAUSIFY_API_URL = 'https://clausify.app/api';

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'clausify-analyze',
    title: 'Analyze with Clausify',
    contexts: ['link'],
    targetUrlPatterns: ['*.pdf', '*.docx', '*.doc']
  });

  console.log('[Clausify] Extension installed');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'clausify-analyze') {
    const url = info.linkUrl;

    if (!url) {
      showNotification('Error', 'No link URL found');
      return;
    }

    // Check if it's a PDF or DOCX
    const isPDF = url.toLowerCase().endsWith('.pdf');
    const isDOCX = url.toLowerCase().endsWith('.docx') || url.toLowerCase().endsWith('.doc');

    if (!isPDF && !isDOCX) {
      showNotification('Unsupported Format', 'Please select a PDF or DOCX link');
      return;
    }

    // Get API key from storage
    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (!apiKey) {
      // Open popup to configure API key
      chrome.action.openPopup();
      return;
    }

    // Notify user that analysis is starting
    showNotification('Analyzing...', 'Sending document to Clausify');

    try {
      // Send to Clausify API
      const response = await fetch(`${CLAUSIFY_API_URL}/analyze/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const error = await response.json();
        showNotification('Error', error.message || 'Analysis failed');
        return;
      }

      const data = await response.json();

      // Open results in Clausify
      chrome.tabs.create({
        url: `https://clausify.app/contracts/${data.contractId}`
      });

      showNotification('Success', 'Analysis complete! Opening results...');
    } catch (error) {
      console.error('[Clausify] Analysis error:', error);
      showNotification('Error', 'Failed to connect to Clausify');
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_AUTH') {
    checkAuthentication().then(sendResponse);
    return true;
  }

  if (message.type === 'SAVE_API_KEY') {
    chrome.storage.sync.set({ apiKey: message.apiKey }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_API_KEY') {
    chrome.storage.sync.get('apiKey', (result) => {
      sendResponse({ apiKey: result.apiKey });
    });
    return true;
  }

  if (message.type === 'LOGOUT') {
    chrome.storage.sync.remove('apiKey', () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Check if API key is valid
async function checkAuthentication() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');

  if (!apiKey) {
    return { authenticated: false };
  }

  try {
    const response = await fetch(`${CLAUSIFY_API_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return { authenticated: response.ok };
  } catch (error) {
    return { authenticated: false, error: error.message };
  }
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `Clausify: ${title}`,
    message: message
  });
}
