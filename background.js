var ul = localStorage.urlList, urlList = ul ? JSON.parse(ul) : [], excDomains = [],
    paused = localStorage.isPaused == 1, isNoPattern = localStorage.isNoPattern == 1, isNoEye = localStorage.isNoEye == 1,
    pausedTabs = [];
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.r == 'isExceptionOrPaused') {
            var r = false;
            if (sender.tab) {
                if (paused || pausedTabs.indexOf(sender.tab.id) != -1)
                    r = true;
                else {
                    var relevantExcDomains = [];
                    for (var i = 0; i < excDomains.length; i++) {
                        if (excDomains[i].tabId == sender.tab.id)
                            relevantExcDomains.push(excDomains[i].domain);
                    }
                    if (relevantExcDomains.length && relevantExcDomains.indexOf(request.location.hostname) != -1)
                        r = true;
                    else {
                        var lowerHref = request.location.href.toLowerCase();
                        for (var i = 0; i < urlList.length; i++) {
                            if (lowerHref.indexOf(urlList[i]) != -1) { r = true; break; }
                        }
                    }
                }
                if (!r)
                    chrome.browserAction.setIcon({ path: 'icon.png', tabId: sender.tab.id });
            }
            sendResponse(r);
        } else if (request.r == 'setUrlList') {
            urlList = request.urlList;
            localStorage.urlList = JSON.stringify(urlList);
        } else if (request.r == 'getUrlList')
            sendResponse(urlList);
        else if (request.r == 'excTab') {
            if (request.exclude)
                excDomains.push({ tabId: request.tabId, domain: request.domain });
            else
                excDomains = excDomains.filter(function (v) { return v.tabId != request.tabId || v.domain != request.domain; });
        } else if (request.r == 'isExcTab') {
            for (var i = 0; i < excDomains.length; i++)
                if (excDomains[i].tabId == request.tabId && excDomains[i].domain == request.domain)
                    sendResponse(true);
            sendResponse(false);
        } else if (request.r == 'pause') {
            paused = request.pause;
            localStorage.isPaused = paused ? 1 : 0;
        } else if (request.r == 'isPaused')
            sendResponse(paused);
        else if (request.r == 'setNoPattern') {
            isNoPattern = request.isNoPattern;
            localStorage.isNoPattern = isNoPattern ? 1 : 0;
        } else if (request.r == 'isNoPattern')
            sendResponse(isNoPattern);
        else if (request.r == 'setNoEye') {
            isNoEye = request.isNoEye;
            localStorage.isNoEye = isNoEye ? 1 : 0;
        } else if (request.r == 'isNoEye')
            sendResponse(isNoEye);
        else if (request.r == 'pauseTab') {
            if (request.pause)
                pausedTabs.push(request.tab.id);
            else
                pausedTabs = pausedTabs.filter(function (v) { return v != request.tab.id; });
        } else if (request.r == 'isTabPaused')
            sendResponse(pausedTabs.indexOf(request.tab.id) != -1);
    }
);
