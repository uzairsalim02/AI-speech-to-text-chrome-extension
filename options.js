//options.js
document.addEventListener('DOMContentLoaded', () => {
    const blockList = document.getElementById('blockList');
    const siteInput = document.getElementById('siteInput');
    const addButton = document.getElementById('addButton');
  
    // Load blocked sites
    chrome.storage.sync.get(['blocked'], (result) => {
      if (result.blocked) {
        result.blocked.forEach(site => addToList(site));
      }
    });
  
    addButton.addEventListener('click', () => {
      const site = siteInput.value.trim();
      if (site) {
        chrome.storage.sync.get(['blocked'], (result) => {
          const blocked = result.blocked || [];
          blocked.push(site);
          chrome.storage.sync.set({ blocked }, () => {
            addToList(site);
            siteInput.value = '';
          });
        });
      }
    });
  
    function addToList(site) {
      const li = document.createElement('li');
      li.textContent = site;
      blockList.appendChild(li);
    }
  });