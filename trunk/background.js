var ul = localStorage.urlList, urlList = ul ? JSON.parse(ul) : [],
    paused = localStorage.isPaused == 1, isNoPattern = localStorage.isNoPattern == 1,
    pausedTabs = [];
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
	    if (request.r == 'isExceptionOrPaused') {
	        var r = false;
	        if (sender.tab) {
	            if (paused || pausedTabs.indexOf(sender.tab.id) != -1)
	                r = true;
	            else
	                for (var i = 0; i < urlList.length; i++) {
	                    if (request.url.toLowerCase().indexOf(urlList[i]) != -1) { r = true; break; }
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
	    else if (request.r == 'pause') {
	        paused = request.pause;
	        localStorage.isPaused = paused ? 1 : 0;
	    } else if (request.r == 'isPaused')
	        sendResponse(paused);
	    else if (request.r == 'setNoPattern') {
	        isNoPattern = request.isNoPattern;
	        localStorage.isNoPattern = isNoPattern ? 1 : 0;
	    } else if (request.r == 'isNoPattern')
	        sendResponse(isNoPattern);
	    else if (request.r == 'pauseTab') {
	        if (request.pause)
	            pausedTabs.push(request.tab.id);
	        else
	            pausedTabs = pausedTabs.filter(function (v) { return v != request.tab.id; });
	    } else if (request.r == 'isTabPaused')
	        sendResponse(pausedTabs.indexOf(request.tab.id) != -1);
	}
);