/**
 * Clausify Browser Extension - Content Script
 * Adds visual indicators for analyzable documents on webpages
 */

// Document extensions we can analyze
const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

// Find all links to supported documents
function findDocumentLinks() {
  const links = document.querySelectorAll('a[href]');
  const documentLinks = [];

  links.forEach((link) => {
    const href = link.href.toLowerCase();
    if (SUPPORTED_EXTENSIONS.some((ext) => href.endsWith(ext))) {
      documentLinks.push(link);
    }
  });

  return documentLinks;
}

// Add visual indicator to document links
function addIndicators() {
  const links = findDocumentLinks();

  links.forEach((link) => {
    // Skip if already processed
    if (link.dataset.clausifyProcessed) return;
    link.dataset.clausifyProcessed = 'true';

    // Create indicator
    const indicator = document.createElement('span');
    indicator.className = 'clausify-indicator';
    indicator.title = 'Right-click to analyze with Clausify';
    indicator.textContent = '📋';

    // Add to link
    link.style.position = 'relative';
    link.appendChild(indicator);
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addIndicators);
} else {
  addIndicators();
}

// Re-run on dynamic content changes
const observer = new MutationObserver((mutations) => {
  let shouldCheck = false;

  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      shouldCheck = true;
    }
  });

  if (shouldCheck) {
    addIndicators();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
