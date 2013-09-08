var ul=localStorage.urlList,urlList=ul?JSON.parse(ul):[], paused=localStorage.isPaused==1;
chrome.extension.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.r=='isExceptionOrPaused') {
			var r=false;
			if (paused) r=true;
			else
				for (var i=0;i<urlList.length;i++) {
					if (request.url.toLowerCase().indexOf(urlList[i])!=-1) {r=true; break;}
				}
			if (!r)
				chrome.browserAction.setIcon({path:'icon.png',tabId:sender.tab.id});
			sendResponse(r);
		} else if (request.r=='setUrlList') {
			urlList=request.urlList;
			localStorage.urlList=JSON.stringify(urlList);
		} else if (request.r=='getUrlList')
			sendResponse(urlList);
		else if (request.r=='pause') {
			paused=request.pause;
			localStorage.isPaused=paused?1:0;
		} else if (request.r='isPaused')
			sendResponse(paused);
	}
);