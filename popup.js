chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var urlList, activeTab = tabs[0];
    chrome.runtime.sendMessage({ r: 'getUrlList' }, function (r) {
        urlList = r;
        for (var i = 0; i < urlList.length; i++) {
            if (activeTab.url.toLowerCase().indexOf(urlList[i]) != -1) {
                document.getElementById('excChk').checked = true;
                return;
            }
        }
    });
    chrome.runtime.sendMessage({ r: 'isTabPaused', tab: activeTab }, function (r) {
        document.getElementById('pauseTab').checked = r;
    });
    chrome.runtime.sendMessage({ r: 'isPaused' }, function (isPaused) {
        if (isPaused) document.getElementById('pauseChk').checked = true;
    });
    document.getElementById('showImages').onclick = function () {
        chrome.tabs.sendMessage(activeTab.id, { r: 'showImages' });
    };
    document.getElementById('excChk').onclick = function () {
        if (document.getElementById('excChk').checked) {
            urlList.push(activeTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1].toLowerCase());
            chrome.tabs.sendMessage(activeTab.id, { r: 'showImages' });
            chrome.browserAction.setIcon({ path: 'icon-d.png', tabId: activeTab.id });
        } else {
            for (var i = 0; i < urlList.length; i++) {
                if (activeTab.url.toLowerCase().indexOf(urlList[i]) != -1)
                    urlList.splice(i, 1);
            }
        }
        chrome.runtime.sendMessage({ r: 'setUrlList', urlList: urlList });
    };
    document.getElementById('pauseChk').onclick = function () {
        chrome.runtime.sendMessage({ r: 'pause', pause: this.checked });
    };
    document.getElementById('pauseTab').onclick = function () {
        chrome.runtime.sendMessage({ r: 'pauseTab', tab: activeTab, pause: this.checked });
    };
});
