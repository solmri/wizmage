var contentLoaded = false;
window.addEventListener('DOMContentLoaded', function () { contentLoaded = true; });

chrome.runtime.sendMessage({ r: 'getSettings' }, function (settings) {
    if (settings && !settings.isExcluded && !settings.isExcludedForTab && !settings.isPaused && !settings.isPausedForTab) {
        chrome.runtime.sendMessage({ r: 'setColorIcon', toggle: true });
        wzmMain(chrome.extension.getURL(''), settings, contentLoaded);
    }
});
