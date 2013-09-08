$(function() {
	var addName=$('#addName').focus();
	chrome.extension.sendMessage({r:'getUrlList'},function (urlList) {
		for (var i=0;i<urlList.length;i++) {
			AddItem(urlList[i]);
		}
	});
	$('form').submit(function() {
		n=$.trim(addName.val()).toLowerCase();
		if (n.length>0) {
			AddItem(n);
			Save();
		}
		addName.val('');
		return false;
	});
	$('.delete').live('click',function() {
		$(this).parent().remove();
		Save();
	});
	function Save() {
		var urlList=[];
		$('.url').each(function() {urlList.push($(this).html()); });
		chrome.extension.sendMessage({r:'setUrlList',urlList:urlList});
	};
	function AddItem(s) {
		$('#list').append("<div class='item'><span class='delete'>X</span> <span class='url'>" + s + '</span></div>');
	}
});