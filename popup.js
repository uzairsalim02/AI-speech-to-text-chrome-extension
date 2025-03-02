document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('showOverlay').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject content script to create the overlay
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  });
});