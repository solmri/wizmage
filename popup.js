chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    function showImages() {
        chrome.tabs.sendMessage(activeTab.id, { r: 'showImages' });
    }
    chrome.runtime.sendMessage({ r: 'getSettings', tab: activeTab }, function (settings) {
        if (settings.isPaused) document.getElementById('pauseChk').checked = true;
        if (settings.isPausedForTab) document.getElementById('pauseTab').checked = true;
        if (settings.isExcluded) document.getElementById('excludeDomain').checked = true;
        if (settings.isExcludedForTab) document.getElementById('excludeForTab').checked = true;
    });
    document.getElementById('showImages').onclick = function () {
        showImages();
    };
    document.getElementById('excludeDomain').onclick = function () {
        if (document.getElementById('excludeDomain').checked) {
            chrome.runtime.sendMessage({ r: 'urlListAdd', url: activeTab.url, domainOnly: true });
            showImages();
        } else {
            chrome.runtime.sendMessage({ r: 'urlListRemove', url: activeTab.url });
        }
    };
    document.getElementById('excludeForTab').onclick = function () {
        var isChecked = document.getElementById('excludeForTab').checked;
        chrome.runtime.sendMessage({ r: 'excludeForTab', toggle: isChecked, tab: activeTab });
        if (isChecked)
            showImages();
    };
    document.getElementById('pauseChk').onclick = function () {
        chrome.runtime.sendMessage({ r: 'pause', toggle: this.checked });
        showImages();
    };
    document.getElementById('pauseTab').onclick = function () {
        chrome.runtime.sendMessage({ r: 'pauseForTab', tabId: activeTab.id, toggle: this.checked });
        showImages();
    };
    document.getElementById('still-seeing-images').onclick = function () {
        var advice = document.getElementById('advice');
        advice.style.display = advice.style.display == 'block' ? 'none' : 'block';
    };
    document.getElementById('block-flash').onclick = function () {
        alert("In order to avoid automatically showing Flash animations, in the 'Plug-ins' section of Chrome's settings (which you will see when you press OK), click either 'Click to play' (recommended), or 'Block all'.");
        chrome.tabs.create({ url: "chrome://settings/content#handlers-section" });
    };
    document.getElementById('report').onclick = function () {
        chrome.tabs.create({ url: "https://chrome.google.com/webstore/support/ifoggbfaoakkojipahnplnbfnhhhnmlp?hl=en&gl=IL#bug" });
    };
});
document.getElementById('close').onclick = function () { close(); };
