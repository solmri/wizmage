var urlList;
chrome.tabs.query({active:true,currentWindow:true},function (tabs) {
	chrome.extension.sendMessage({r:'getUrlList'},function (r) {
		urlList=r;
		for (var i=0;i<urlList.length;i++) {
			if (tabs[0].url.toLowerCase().indexOf(urlList[i])!=-1) {
				document.getElementById('excChk').checked=true;
				return;
			}				
		}
	});
});
chrome.extension.sendMessage({r:'isPaused'},function(isPaused) {
	if (isPaused) document.getElementById('pauseChk').checked=true;
});
document.getElementById('showImages').onclick=function() {
	chrome.tabs.query({active:true,currentWindow:true},function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id,{r:'showImages'});
	});
};
document.getElementById('excChk').onclick=function () {
	chrome.tabs.query({active:true,currentWindow:true},function (tabs) {
		if (document.getElementById('excChk').checked) {
			urlList.push(tabs[0].url.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1].toLowerCase());
			chrome.tabs.sendMessage(tabs[0].id,{r:'showImages'});
			chrome.browserAction.setIcon({path:'icon-d.png',tabId:tabs[0].id});
		} else {
			for (var i=0;i<urlList.length;i++) {
				if (tabs[0].url.toLowerCase().indexOf(urlList[i])!=-1)
					urlList.splice(i,1);
			}
		}
		chrome.extension.sendMessage({r:'setUrlList',urlList:urlList});
	});
};
document.getElementById('pauseChk').onclick=function () {
	chrome.extension.sendMessage({r:'pause',pause:this.checked});
};