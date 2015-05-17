if (chrome.storage.sync.syncInit) {
    localStorage.urlList = chrome.storage.sync.urlList;
    localStorage.isPaused = chrome.storage.sync.isPaused;
    localStorage.isNoPattern = chrome.storage.sync.isNoPattern;
    localStorage.isNoEye = chrome.storage.sync.isNoEye;
    localStorage.isBlackList = chrome.storage.sync.isBlackList;
    chrome.storage.sync.syncInit = false;
}
var ul = localStorage.urlList, urlList = ul ? JSON.parse(ul) : [],
    paused = localStorage.isPaused == 1,
    isNoPattern = localStorage.isNoPattern == 1,
    isNoEye = localStorage.isNoEye == 1,
    isBlackList = localStorage.isBlackList == 1,
    excludeForTabList = [],
    pauseForTabList = [],
    domainRegex = /^\w+:\/\/([\w\.:-]+)/;
function getDomain(url) {
    var regex = domainRegex.exec(url);
    return regex ? regex[1].toLowerCase() : null;
}
function saveUrlList() {
    localStorage.urlList = JSON.stringify(urlList);
}
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        switch (request.r) {
            case 'getSettings':
                var settings = {
                    isPaused: paused,
                    isNoPattern: isNoPattern,
                    isNoEye: isNoEye,
                    isBlackList: isBlackList
                };
                var tab = request.tab || sender.tab;
                if (tab) {
                    if (pauseForTabList.indexOf(tab.id) != -1)
                        settings.isPausedForTab = true;
                    if (tab.url) {
                        var domain = getDomain(tab.url);
                        if (domain) {
                            for (var i = 0; i < excludeForTabList.length; i++) {
                                if (excludeForTabList[i].tabId == tab.id && excludeForTabList[i].domain == domain)
                                { settings.isExcludedForTab = true; break; }
                            }
                        }
                        var lowerUrl = tab.url.toLowerCase();
                        for (var i = 0; i < urlList.length; i++) {
                            if (lowerUrl.indexOf(urlList[i]) != -1)
                            { settings.isExcluded = true; break; }
                        }
                        if (isBlackList)
                            settings.isExcluded = !settings.isExcluded;
                    }
                }
                sendResponse(settings);
                break;
            case 'setColorIcon':
                chrome.browserAction.setIcon({ path: request.toggle ? 'icon.png' : 'icon-d.png', tabId: sender.tab.id });
                break;
            case 'urlListAdd':
                var url = request.domainOnly ? getDomain(request.url) : request.url.toLowerCase();
                if (url) {
                    urlList.push(url);
                    saveUrlList();
                    chrome.runtime.sendMessage({ r: 'urlListModified' });
                }
                break;
            case 'urlListRemove':
                if (request.url) {
                    var lowerUrl = request.url.toLowerCase();
                    for (var i = 0; i < urlList.length; i++) {
                        if (lowerUrl.indexOf(urlList[i]) != -1)
                        { urlList.splice(i, 1); i--; }
                    }
                } else
                    urlList.splice(request.index, 1);
                saveUrlList();
                chrome.runtime.sendMessage({ r: 'urlListModified' });
                break;
            case 'getUrlList':
                sendResponse(urlList);
                break;
            case 'excludeForTab':
                var domain = getDomain(request.tab.url);
                if (!domain) return;
                if (request.toggle) {
                    excludeForTabList.push({ tabId: request.tab.id, domain: domain });
                }
                else {
                    for (var i = 0; i < excludeForTabList.length; i++)
                        if (excludeForTabList[i].tabId == request.tab.id && excludeForTabList[i].domain == domain)
                        { excludeForTabList.splice(i, 1); break; }
                }
                break;
            case 'pause':
                paused = request.toggle;
                localStorage.isPaused = paused ? 1 : 0;
                break;
            case 'pauseForTab':
                if (request.toggle)
                    pauseForTabList.push(request.tabId);
                else
                    for (var i = 0; i < pauseForTabList.length; i++)
                        if (pauseForTabList[i] == request.tabId)
                        { pauseForTabList.splice(i, 1); break; }
                break;
            case 'setNoPattern':
                isNoPattern = request.toggle;
                localStorage.isNoPattern = isNoPattern ? 1 : 0;
                break;
            case 'setNoEye':
                isNoEye = request.toggle;
                localStorage.isNoEye = isNoEye ? 1 : 0;
                break;
            case 'setBlackList':
                isBlackList = request.toggle;
                localStorage.isBlackList = isBlackList ? 1 : 0;
                break;
        }
    }
);
