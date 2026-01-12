# Clausify Browser Extension

A Chrome/Edge browser extension that lets you analyze contracts directly from any webpage.

## Features

- **Right-click Analysis**: Right-click any PDF or DOCX link to send it to Clausify for AI analysis
- **Visual Indicators**: Document links are marked with a clipboard icon for easy identification
- **Quick Dashboard Access**: Access your Clausify dashboard directly from the extension popup

## Installation

### Development Mode

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `browser-extension` folder

### From Chrome Web Store

Coming soon!

## Setup

1. Click the Clausify extension icon
2. Enter your API key (get it from [clausify.app/settings/api](https://clausify.app/settings/api))
3. Click "Connect"

## Usage

1. Browse to any webpage with PDF or DOCX links
2. Right-click a document link
3. Select "Analyze with Clausify"
4. View your analysis results in a new tab

## Development

### Structure

```
browser-extension/
├── manifest.json      # Extension manifest (MV3)
├── src/
│   ├── background.js  # Service worker for API calls
│   ├── popup.html     # Extension popup UI
│   ├── popup.css      # Popup styles
│   ├── popup.js       # Popup logic
│   ├── content.js     # Content script for page enhancement
│   └── content.css    # Content script styles
└── icons/             # Extension icons
```

### Building for Production

1. Update version in `manifest.json`
2. Zip the extension folder
3. Upload to Chrome Web Store

## API Integration

The extension uses the Clausify public API:

- `POST /api/analyze/url` - Analyze a document by URL
- `GET /api/auth/verify` - Verify API key validity

## Permissions

- `contextMenus`: For right-click menu
- `storage`: To save API key locally
- `activeTab`: To read current tab URL
- Host permission for `*.clausify.app`: API communication

## Privacy

- Your API key is stored locally in Chrome's sync storage
- Document URLs are sent to Clausify servers for analysis
- No browsing data is collected or transmitted
