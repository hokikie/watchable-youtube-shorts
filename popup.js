let watchOptions = {
  isHide: false,
  isAside: false,
};

function updateWatchOptions(key, value) {
  watchOptions[key] = value;
  chrome.storage.sync.set({ watchOptions });
}

document.addEventListener('DOMContentLoaded', () => {
  const hideOverlay = document.getElementById('hideOverlay');
  const asideOverlay = document.getElementById('asideOverlay');

  chrome.storage.sync.get('watchOptions', ({ watchOptions = {} }) => {
    hideOverlay.checked = watchOptions.isHide || false;
    asideOverlay.checked = watchOptions.isAside || false;
  });

  hideOverlay.addEventListener('change', () => {
    updateWatchOptions('isHide', hideOverlay.checked);
  });
  asideOverlay.addEventListener('change', () => {
    updateWatchOptions('isAside', asideOverlay.checked);
  });
});
