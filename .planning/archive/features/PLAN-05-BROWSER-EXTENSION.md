# Browser Extension Plan

> Feature: Chrome/Firefox extension for quick contract analysis
> Priority: LOW
> Effort: Large (1-2 weeks)
> Status: Planning
> Depends On: PLAN-01-PRODUCTION-DEPLOY.md, PLAN-06-API-ACCESS.md

---

## Executive Summary

Build a browser extension that allows users to analyze contracts directly from their browser without visiting the Clausify website. Users can right-click on PDF links, upload from any webpage, or analyze documents in Google Drive/Dropbox.

---

## Business Value

| Metric | Impact |
|--------|--------|
| User Acquisition | New discovery channel |
| Engagement | Lower friction = more usage |
| Stickiness | Browser integration creates habit |
| Competitive Edge | Few competitors have extensions |
| Viral Potential | Shareable, visible to colleagues |

---

## Feature Scope

### MVP Features (v1.0)
- [ ] Analyze PDF links (right-click context menu)
- [ ] Upload from extension popup
- [ ] View recent analyses
- [ ] Quick access to dashboard

### Future Features (v2.0)
- [ ] Google Drive integration
- [ ] Dropbox integration
- [ ] DocuSign integration
- [ ] Inline page analysis (detect contracts on webpage)
- [ ] PDF annotation overlay
- [ ] Team sharing

---

## Technical Architecture

### Extension Structure

```
clausify-extension/
├── manifest.json           # Extension manifest (v3)
├── src/
│   ├── background/
│   │   └── service-worker.ts   # Background service worker
│   ├── popup/
│   │   ├── Popup.tsx          # Main popup UI
│   │   ├── popup.html
│   │   └── popup.css
│   ├── content/
│   │   └── content-script.ts  # Injected into pages
│   ├── options/
│   │   └── Options.tsx        # Settings page
│   └── shared/
│       ├── api.ts             # API client
│       ├── auth.ts            # Authentication
│       └── storage.ts         # Chrome storage helpers
├── public/
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   └── icon-128.png
│   └── _locales/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Extension                         │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────────┐ │
│  │   Popup     │     │  Background │     │   Content     │ │
│  │   (React)   │◄───▶│   Worker    │◄───▶│   Script      │ │
│  └─────────────┘     └──────┬──────┘     └───────────────┘ │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Clausify API  │
                    │  /api/contracts │
                    │  /api/analyze   │
                    └─────────────────┘
```

---

## Implementation Plan

### Phase 1: Project Setup (4 hours)

#### Step 1.1: Initialize Extension Project
```bash
# Create new directory
mkdir clausify-extension
cd clausify-extension

# Initialize with Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Install extension-specific dependencies
npm install @anthropic-ai/sdk webextension-polyfill
npm install -D @types/webextension-polyfill vite-plugin-web-extension
```

#### Step 1.2: Configure Manifest v3
```json
// manifest.json
{
  "manifest_version": 3,
  "name": "Clausify - AI Contract Analyzer",
  "version": "1.0.0",
  "description": "Instantly analyze legal contracts with AI. Understand what you're signing.",

  "permissions": [
    "storage",
    "activeTab",
    "contextMenus"
  ],

  "host_permissions": [
    "https://clausify.app/*",
    "https://*.googleapis.com/*"
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "css": ["content-styles.css"]
    }
  ],

  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },

  "options_page": "options.html"
}
```

#### Step 1.3: Configure Vite for Extension
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: 'manifest.json',
      additionalInputs: ['popup.html', 'options.html'],
    }),
  ],
});
```

### Phase 2: Authentication Flow (4 hours)

#### Step 2.1: Auth Storage
```typescript
// src/shared/auth.ts
import browser from 'webextension-polyfill';

interface AuthState {
  accessToken: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    plan: string;
  } | null;
}

export async function getAuthState(): Promise<AuthState> {
  const result = await browser.storage.local.get(['accessToken', 'user']);
  return {
    accessToken: result.accessToken || null,
    user: result.user || null,
  };
}

export async function setAuthState(state: Partial<AuthState>): Promise<void> {
  await browser.storage.local.set(state);
}

export async function clearAuth(): Promise<void> {
  await browser.storage.local.remove(['accessToken', 'user']);
}

export async function isAuthenticated(): Promise<boolean> {
  const { accessToken } = await getAuthState();
  return !!accessToken;
}
```

#### Step 2.2: OAuth Flow for Extension
```typescript
// src/shared/oauth.ts
import browser from 'webextension-polyfill';

const CLAUSIFY_URL = 'https://clausify.app';

export async function initiateLogin(): Promise<void> {
  // Open Clausify login page with extension callback
  const redirectUrl = browser.identity.getRedirectURL();
  const authUrl = `${CLAUSIFY_URL}/auth/extension?redirect=${encodeURIComponent(redirectUrl)}`;

  try {
    const responseUrl = await browser.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true,
    });

    // Parse token from response URL
    const url = new URL(responseUrl);
    const token = url.searchParams.get('token');

    if (token) {
      // Fetch user info and store
      const user = await fetchUserInfo(token);
      await setAuthState({ accessToken: token, user });
    }
  } catch (error) {
    console.error('Auth failed:', error);
    throw error;
  }
}
```

### Phase 3: Popup UI (6 hours)

#### Step 3.1: Main Popup Component
```typescript
// src/popup/Popup.tsx
import { useState, useEffect } from 'react';
import { isAuthenticated, getAuthState, initiateLogin } from '../shared/auth';
import { getRecentAnalyses } from '../shared/api';

export function Popup() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const authenticated = await isAuthenticated();
    setAuthed(authenticated);

    if (authenticated) {
      const { user } = await getAuthState();
      setUser(user);
      const recent = await getRecentAnalyses();
      setAnalyses(recent);
    }
  }

  if (!authed) {
    return <LoginPrompt onLogin={initiateLogin} />;
  }

  return (
    <div className="popup-container">
      <Header user={user} />

      <UploadSection
        onUpload={handleUpload}
        uploading={uploading}
      />

      <RecentAnalyses analyses={analyses} />

      <Footer />
    </div>
  );
}
```

#### Step 3.2: Upload Component
```typescript
// src/popup/components/UploadSection.tsx
export function UploadSection({ onUpload, uploading }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="upload-section">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => onUpload(e.target.files?.[0])}
        hidden
      />

      <button
        className="upload-button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Spinner /> Analyzing...
          </>
        ) : (
          <>
            <UploadIcon /> Upload Contract
          </>
        )}
      </button>

      <p className="hint">PDF or DOCX, max 10MB</p>
    </div>
  );
}
```

#### Step 3.3: Recent Analyses List
```typescript
// src/popup/components/RecentAnalyses.tsx
export function RecentAnalyses({ analyses }) {
  if (analyses.length === 0) {
    return (
      <div className="empty-state">
        <p>No analyses yet</p>
        <p>Upload your first contract to get started</p>
      </div>
    );
  }

  return (
    <div className="recent-analyses">
      <h3>Recent Analyses</h3>
      <ul>
        {analyses.map((analysis) => (
          <li key={analysis.id}>
            <a
              href={`https://clausify.app/contracts/${analysis.id}`}
              target="_blank"
              rel="noopener"
            >
              <FileIcon />
              <span className="filename">{analysis.fileName}</span>
              <RiskBadge level={analysis.riskLevel} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Phase 4: Context Menu Integration (4 hours)

#### Step 4.1: Background Service Worker
```typescript
// src/background/service-worker.ts
import browser from 'webextension-polyfill';
import { analyzeFromUrl } from '../shared/api';

// Create context menu on install
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'analyze-pdf-link',
    title: 'Analyze with Clausify',
    contexts: ['link'],
    targetUrlPatterns: ['*://*/*.pdf', '*://*/*.PDF'],
  });
});

// Handle context menu click
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'analyze-pdf-link' && info.linkUrl) {
    try {
      // Show notification
      await browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Clausify',
        message: 'Downloading and analyzing contract...',
      });

      // Download and analyze
      const result = await analyzeFromUrl(info.linkUrl);

      // Open results in new tab
      await browser.tabs.create({
        url: `https://clausify.app/contracts/${result.contractId}`,
      });
    } catch (error) {
      await browser.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Clausify - Error',
        message: error.message || 'Failed to analyze contract',
      });
    }
  }
});
```

#### Step 4.2: API Client
```typescript
// src/shared/api.ts
import { getAuthState } from './auth';

const API_BASE = 'https://clausify.app/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const { accessToken } = await getAuthState();

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function analyzeFromUrl(url: string) {
  // Download the PDF
  const response = await fetch(url);
  const blob = await response.blob();

  // Upload to Clausify
  const formData = new FormData();
  formData.append('file', blob, 'contract.pdf');

  const uploadResult = await fetch(`${API_BASE}/contracts/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${(await getAuthState()).accessToken}`,
    },
    body: formData,
  });

  const { contractId } = await uploadResult.json();

  // Trigger analysis
  await apiRequest(`/analyze/${contractId}`, { method: 'POST' });

  return { contractId };
}

export async function getRecentAnalyses(limit = 5) {
  return apiRequest(`/contracts?limit=${limit}`);
}
```

### Phase 5: Content Script for Page Detection (4 hours)

#### Step 5.1: PDF Link Detection
```typescript
// src/content/content-script.ts
import browser from 'webextension-polyfill';

// Detect PDF links on page
function findPdfLinks(): HTMLAnchorElement[] {
  const links = document.querySelectorAll('a[href]');
  return Array.from(links).filter((link) => {
    const href = link.getAttribute('href') || '';
    return href.toLowerCase().endsWith('.pdf');
  }) as HTMLAnchorElement[];
}

// Add Clausify button next to PDF links
function injectAnalyzeButtons() {
  const pdfLinks = findPdfLinks();

  pdfLinks.forEach((link) => {
    if (link.dataset.clausifyInjected) return;

    const button = document.createElement('button');
    button.className = 'clausify-analyze-btn';
    button.innerHTML = '📄 Analyze';
    button.title = 'Analyze with Clausify';

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const url = link.href;
      browser.runtime.sendMessage({ type: 'ANALYZE_URL', url });
    });

    link.parentElement?.insertBefore(button, link.nextSibling);
    link.dataset.clausifyInjected = 'true';
  });
}

// Run on page load
injectAnalyzeButtons();

// Watch for dynamic content
const observer = new MutationObserver(() => {
  injectAnalyzeButtons();
});

observer.observe(document.body, { childList: true, subtree: true });
```

### Phase 6: Build & Publishing (4 hours)

#### Step 6.1: Build for Chrome
```bash
npm run build
# Output in dist/ directory
```

#### Step 6.2: Chrome Web Store Submission
1. Create developer account ($5 one-time fee)
2. Create ZIP of dist/ directory
3. Upload to Chrome Web Store Developer Dashboard
4. Fill in store listing:
   - Screenshots (1280x800)
   - Description
   - Privacy policy
5. Submit for review

#### Step 6.3: Firefox Add-ons Submission
```json
// manifest.json additions for Firefox
{
  "browser_specific_settings": {
    "gecko": {
      "id": "extension@clausify.app",
      "strict_min_version": "109.0"
    }
  }
}
```

1. Create Firefox developer account
2. Upload to addons.mozilla.org
3. Submit for review

---

## Testing Strategy

### Unit Tests
```typescript
// tests/auth.test.ts
describe('Extension Auth', () => {
  it('should store and retrieve auth state', async () => {
    await setAuthState({ accessToken: 'test-token' });
    const { accessToken } = await getAuthState();
    expect(accessToken).toBe('test-token');
  });
});
```

### Integration Tests
- Test popup renders correctly
- Test context menu appears on PDF links
- Test upload flow works
- Test authentication flow

### Manual Testing
- [ ] Install extension in Chrome
- [ ] Login flow works
- [ ] Upload from popup works
- [ ] Right-click analyze works
- [ ] Recent analyses show correctly
- [ ] Logout works
- [ ] Error states display properly

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (Chromium)
- [ ] Brave

---

## Security Considerations

### Permissions
- Request minimal permissions
- Explain why each permission is needed
- Use optional permissions where possible

### Data Handling
- Never store sensitive document content locally
- Clear auth on logout
- Use secure storage API

### Content Security
- Sanitize any injected HTML
- Validate all API responses
- Use Content Security Policy

---

## Cost Estimate

| Item | One-time | Annual |
|------|----------|--------|
| Chrome Web Store | $5 | $0 |
| Firefox Add-ons | $0 | $0 |
| Apple Developer (Safari) | $99 | $99 |
| **Total** | **$104** | **$99** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Install Rate | 1,000 installs in 3 months |
| Daily Active Users | 20% of installs |
| Rating | 4.5+ stars |
| Retention (30-day) | 40% |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Store rejection | Medium | High | Follow guidelines strictly |
| Auth flow issues | Medium | High | Test thoroughly |
| Browser updates break extension | Low | Medium | Monitor browser changelogs |
| Low adoption | Medium | Medium | Marketing, integrate with main app |

---

## Deliverables Checklist

### Development
- [ ] Project setup with Vite
- [ ] Manifest v3 configuration
- [ ] Authentication flow
- [ ] Popup UI (React)
- [ ] Context menu integration
- [ ] Content script for page detection
- [ ] Background service worker
- [ ] Options page

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Cross-browser testing
- [ ] Security review

### Publishing
- [ ] Chrome Web Store listing
- [ ] Firefox Add-ons listing
- [ ] Marketing screenshots
- [ ] Privacy policy
- [ ] Documentation
