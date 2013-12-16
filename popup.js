chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var urlList, activeTab = tabs[0], showImagesEl = document.getElementById('showImages');
    function disableShowImagesEl() {
        showImagesEl.checked = true;
        showImagesEl.disabled = true;
        showImagesEl.parentElement.className += ' disabled';
    }
    function showImages() {
        chrome.tabs.sendMessage(activeTab.id, { r: 'showImages' });
        chrome.browserAction.setIcon({ path: 'icon-d.png', tabId: activeTab.id });
        disableShowImagesEl();
    }
    chrome.runtime.sendMessage({ r: 'getUrlList' }, function (r) {
        urlList = r;
        for (var i = 0; i < urlList.length; i++) {
            if (activeTab.url.toLowerCase().indexOf(urlList[i]) != -1) {
                document.getElementById('excChk').checked = true;
                return;
            }
        }
    });
    chrome.runtime.sendMessage({r: 'isExcTab', tabId: activeTab.id, domain: activeTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1]}, function (isExcluded) {
        if (isExcluded) document.getElementById('excTab').checked = true;
    });
    chrome.tabs.sendMessage(activeTab.id, { r: 'isShowImages' }, function (isShowImages) {
        if (isShowImages)
            disableShowImagesEl();
    });
    chrome.runtime.sendMessage({ r: 'isPaused' }, function (isPaused) {
        if (isPaused) document.getElementById('pauseChk').checked = true;
    });
    chrome.runtime.sendMessage({ r: 'isTabPaused', tab: activeTab }, function (r) {
        document.getElementById('pauseTab').checked = r;
    });
    document.getElementById('showImages').onclick = function () {
        showImages();
    };
    document.getElementById('excChk').onclick = function () {
        if (document.getElementById('excChk').checked) {
            urlList.push(activeTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1].toLowerCase());
            showImages();
        } else {
            for (var i = 0; i < urlList.length; i++) {
                if (activeTab.url.toLowerCase().indexOf(urlList[i]) != -1)
                    urlList.splice(i, 1);
            }
        }
        chrome.runtime.sendMessage({ r: 'setUrlList', urlList: urlList });
    };
    document.getElementById('excTab').onclick = function () {
        var isChecked = document.getElementById('excTab').checked;
        chrome.runtime.sendMessage({
            r: 'excTab',
            exclude: isChecked,
            tabId: activeTab.id,
            domain: activeTab.url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1]
        });
        if (isChecked)
            showImages();
    };
    document.getElementById('pauseChk').onclick = function () {
        chrome.runtime.sendMessage({ r: 'pause', pause: this.checked });
        showImages();
    };
    document.getElementById('pauseTab').onclick = function () {
        chrome.runtime.sendMessage({ r: 'pauseTab', tab: activeTab, pause: this.checked });
        showImages();
    };
});
