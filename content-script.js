async function getWatchOptions() {
  const defaultOptions = {
    isHide: false,
    isAside: false,
  };
  const { watchOptions } = await chrome.storage.sync.get('watchOptions');
  return watchOptions ?? defaultOptions;
}

function getCurrentId() {
  const video = document.querySelector('#shorts-player > div.html5-video-container > video');
  if (!video) return null;
  const closest = video.closest('ytd-reel-video-renderer');
  if (!closest) return null;
  return +closest.id;
}

function getOverlay() {
  return document.querySelector(`[id="${getCurrentId()}"] .overlay.ytd-reel-video-renderer`);
}

async function hideOverlayContent(overlay) {
  const { isHide } = await getWatchOptions();
  overlay = overlay || getOverlay();
  if (overlay) {
    const overlayContainer = overlay.querySelector('.metadata-container.ytd-reel-player-overlay-renderer');
    if (overlayContainer) {
      overlayContainer.classList.toggle('content-hidden', isHide);
    }
  }
}

async function setAsideOverlayContent(overlay) {
  const { isAside } = await getWatchOptions();
  overlay = overlay || getOverlay();

  if (overlay) {
    overlay.classList.toggle('overflow-visible', isAside);
    const overlayContainer = overlay.querySelector('.metadata-container.ytd-reel-player-overlay-renderer');
    const overlayWrapper = overlay.querySelector('div#overlay');

    if (overlayContainer) {
      overlayContainer.classList.toggle('overflow-visible', isAside);
    }
    if (overlayWrapper) {
      changeContentColors(overlayWrapper, isAside);
      changeContentWidth(overlayWrapper, isAside);
      overlayWrapper.classList.toggle('content-aside', isAside);
    }
  }
}

function changeContentWidth(element, isAside) {
  const title = element.querySelector('.title.reel-player-header-renderer');

  if (isAside) {
    element.style.width = 'min-content';
    element.style.setProperty('--overlay-width', `${element.offsetWidth}px`);
    title.style.overflowY = 'auto';
  } else {
    element.style.width = '100%';
    element.style.removeProperty('--overlay-width');
    title.style.overflowY = 'hidden';
  }
}

function changeContentColors(element, isAside) {
  const html = document.querySelector('html');
  const isDarkMode = html.hasAttribute('dark');
  if (isDarkMode) return;

  const contentArea = element.querySelector('reel-player-header-renderer');
  if (contentArea) {
    const colorValue = isAside
      ? 'var(--yt-spec-static-overlay-text-primary-inverse)'
      : 'var(--yt-spec-static-overlay-text-primary)';
    contentArea.style.color = colorValue;
    contentArea.style.setProperty('--yt-endpoint-color', colorValue);
    contentArea.style.setProperty('--yt-endpoint-hover-color', colorValue);
    contentArea.style.setProperty('--yt-endpoint-visited-color', colorValue);
  }

  const subscribeButton = element.querySelector(
    '.yt-spec-button-shape-next--overlay.yt-spec-button-shape-next--filled'
  );
  if (subscribeButton) {
    subscribeButton.classList.toggle('content-subscribe-button', isAside);
  }
}

function waitForElement(selector) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
    } else {
      const observer = new MutationObserver((_, observer) => {
        const targetElement = document.querySelector(selector);
        if (targetElement) {
          resolve(targetElement);
          observer.disconnect();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  });
}

async function initOverlay() {
  const overlaySelector = 'ytd-reel-video-renderer .overlay.ytd-reel-video-renderer';
  const overlay = await waitForElement(overlaySelector);
  hideOverlayContent(overlay);
  setAsideOverlayContent(overlay);
}

function shortsChangeHandler() {
  const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.matches && (node.matches('div[id="overlay"]') || node.closest('ytd-reel-video-renderer'))) {
            hideOverlayContent();
            setAsideOverlayContent();
          }
        });
      }
    }
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

function storageChangeHandler() {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    hideOverlayContent();
    setAsideOverlayContent();
  });
}

initOverlay();
shortsChangeHandler();
storageChangeHandler();
